import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  providers: [
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials");
        }

        const isAdmin = credentials.email === process.env.ADMIN_EMAIL;
        const adminPasswordEnv = process.env.ADMIN_PASSWORD;

        const [existingUser] = await db.select().from(users).where(eq(users.email, credentials.email)).limit(1);
        let user = existingUser;

        // 1. Try DB password first (important if changed via UI)
        if (user && user.password) {
          const isValidInDb = await bcrypt.compare(credentials.password, user.password);
          if (isValidInDb) {
            // If it's the admin email, ensure role is correct
            if (isAdmin && (user.role !== "ADMIN" || user.status !== "APPROVED")) {
              const [updatedUser] = await db.update(users)
                .set({ role: "ADMIN", status: "APPROVED" })
                .where(eq(users.id, user.id))
                .returning();
              user = updatedUser;
            }
            return user as any;
          }
        }

        // 2. Fallback to .env password for initial setup or override
        if (isAdmin && adminPasswordEnv && credentials.password === adminPasswordEnv) {
          if (!user) {
            const [newUser] = await db.insert(users).values({
              email: credentials.email,
              password: await bcrypt.hash(adminPasswordEnv, 10),
              role: "ADMIN",
              status: "APPROVED",
            }).returning();
            user = newUser;
          } else {
            const [updatedUser] = await db.update(users)
              .set({
                password: await bcrypt.hash(adminPasswordEnv, 10),
                role: "ADMIN",
                status: "APPROVED",
              })
              .where(eq(users.id, user.id))
              .returning();
            user = updatedUser;
          }
          return user as any;
        }

        if (!user) {
          throw new Error("User not found");
        }

        // 3. Final check for non-admin or failed admin fallback
        if (!user.password) {
          throw new Error("Invalid credentials");
        }

        const isValid = await bcrypt.compare(credentials.password, user.password);

        if (!isValid) {
          throw new Error("Invalid password");
        }

        return user as any;
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        if (!user.email) {
          return false;
        }
        const [existingUser] = await db.select().from(users).where(eq(users.email, user.email)).limit(1);

        if (!existingUser) {
          const isAdmin = user.email === process.env.ADMIN_EMAIL;
          await db.insert(users).values({
            email: user.email,
            name: user.name,
            image: user.image,
            status: isAdmin ? "APPROVED" : "PENDING",
            role: isAdmin ? "ADMIN" : "USER",
          });
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        const [dbUser] = await db.select().from(users).where(eq(users.email, user.email!)).limit(1);
        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role;
          token.status = dbUser.status;
        }
      }
      return token;
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
