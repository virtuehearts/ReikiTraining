import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { normalizeEnv } from "./utils";

export const authorize = async (credentials: Record<"email" | "password", string> | undefined) => {
  if (!credentials?.email || !credentials?.password) {
    throw new Error("Invalid credentials");
  }

  const email = credentials.email.trim().toLowerCase();
  const adminEmailEnv = normalizeEnv(process.env.ADMIN_EMAIL)?.toLowerCase();
  const adminPasswordEnv = normalizeEnv(process.env.ADMIN_PASSWORD);
  const isAdmin = !!adminEmailEnv && email === adminEmailEnv;

  console.log(`[Auth] Authorize attempt for: ${email}`);
  console.log(`[Auth] Admin check: target=${adminEmailEnv || 'MISSING'} | isAdmin=${isAdmin}`);
  console.log(`[Auth] Password check: provided_len=${credentials.password.length} | env_pass_set=${!!adminPasswordEnv} | env_pass_len=${adminPasswordEnv?.length || 0}`);

  if (isAdmin && !adminPasswordEnv) {
    console.warn(`[Auth] ADMIN_EMAIL matched but ADMIN_PASSWORD is NOT set in environment!`);
  }

  const [existingUser] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  let user = existingUser;

  const touchLastLogin = async (userId: string) => {
    await db.update(users)
      .set({ updatedAt: new Date() })
      .where(eq(users.id, userId));
  };

  // Track if we've already checked the DB password to avoid redundant bcrypt.compare calls
  let dbPasswordChecked = false;
  let dbPasswordValid = false;

  // 1. Try DB password first (important if changed via UI)
  if (user && user.password) {
    dbPasswordValid = await bcrypt.compare(credentials.password, user.password);
    dbPasswordChecked = true;

    if (dbPasswordValid) {
      console.log(`[Auth] DB password valid for ${email}`);
      // If it's the admin email, ensure role is correct
      if (isAdmin && (user.role !== "ADMIN" || user.status !== "APPROVED")) {
        const [updatedUser] = await db.update(users)
          .set({ role: "ADMIN", status: "APPROVED", updatedAt: new Date() })
          .where(eq(users.id, user.id))
          .returning();
        user = updatedUser;
      } else {
        await touchLastLogin(user.id);
      }
      return user as any;
    }
  }

  // 2. Fallback to .env password for initial setup or override
  if (isAdmin && adminPasswordEnv && credentials.password === adminPasswordEnv) {
    console.log(`[Auth] Fallback to .env password success for admin: ${email}`);
    if (!user) {
      console.log(`[Auth] Creating new admin user in DB`);
      const [newUser] = await db.insert(users).values({
        email: email,
        password: await bcrypt.hash(adminPasswordEnv, 10),
        role: "ADMIN",
        status: "APPROVED",
      }).returning();
      user = newUser;
    } else {
      console.log(`[Auth] Updating existing user to admin with .env credentials`);
      const [updatedUser] = await db.update(users)
        .set({
          password: await bcrypt.hash(adminPasswordEnv, 10),
          role: "ADMIN",
          status: "APPROVED",
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.id))
        .returning();
      user = updatedUser;
    }
    return user as any;
  }

  // 3. Final failure checks
  if (isAdmin) {
    console.log(`[Auth] Admin email matched but neither DB nor .env password valid: ${email}`);
    throw new Error("Invalid password");
  }

  if (!user) {
    console.log(`[Auth] User not found: ${email}`);
    throw new Error("User not found");
  }

  if (!user.password) {
    console.log(`[Auth] No password set for user: ${email}`);
    throw new Error("Invalid credentials");
  }

  // If we already checked and it was invalid, or if we haven't checked yet (which shouldn't happen due to logic above)
  if (dbPasswordChecked && !dbPasswordValid) {
    console.log(`[Auth] Invalid password for: ${email}`);
    throw new Error("Invalid password");
  }

  // This part is mostly for completeness, normally we'd have returned or thrown by now
  const isValid = await bcrypt.compare(credentials.password, user.password);
  if (!isValid) {
    console.log(`[Auth] Invalid password for: ${email}`);
    throw new Error("Invalid password");
  }

  await touchLastLogin(user.id);

  return user as any;
};

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize,
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google" && user.email) {
        const email = user.email.trim().toLowerCase();
        const [existingUser] = await db.select().from(users).where(eq(users.email, email)).limit(1);

        if (!existingUser) {
          const adminEmailEnv = normalizeEnv(process.env.ADMIN_EMAIL)?.toLowerCase();
          const isAdmin = email === adminEmailEnv;
          await db.insert(users).values({
            email: email,
            name: user.name,
            image: user.image,
            status: isAdmin ? "APPROVED" : "PENDING",
            role: isAdmin ? "ADMIN" : "USER",
            updatedAt: new Date(),
          });
        } else {
          await db.update(users)
            .set({
              name: user.name,
              image: user.image,
              updatedAt: new Date(),
            })
            .where(eq(users.id, existingUser.id));
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      const emailSource = user?.email || token.email;
      if (emailSource) {
        const email = emailSource.trim().toLowerCase();
        if (user?.email) {
          console.log(`[Auth] JWT callback: first-time population for ${email}`);
        }

        try {
          const [dbUser] = await db.select().from(users).where(eq(users.email, email)).limit(1);
          if (dbUser) {
            token.id = dbUser.id;
            token.role = dbUser.role;
            token.status = dbUser.status;
          } else {
            console.warn(`[Auth] JWT callback: User ${email} not found in DB!`);
          }
        } catch (error) {
          console.error(`[Auth] JWT callback error for ${email}:`, error);
        }
      }
      return token;
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`;

      try {
        const parsed = new URL(url);
        if (parsed.origin === baseUrl) {
          return url;
        }
      } catch {
        // ignore invalid URL and fall through to baseUrl
      }

      return baseUrl;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.status = token.status as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
