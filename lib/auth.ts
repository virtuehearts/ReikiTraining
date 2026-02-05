import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

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
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials");
        }

        const isAdmin = credentials.email === process.env.ADMIN_EMAIL;
        const adminPassword = process.env.ADMIN_PASSWORD;

        const [existingUser] = await db.select().from(users).where(eq(users.email, credentials.email)).limit(1);
        let user = existingUser;

        // Handle Admin special case from .env
        if (isAdmin && adminPassword) {
          if (credentials.password === adminPassword) {
            if (!user) {
              const [newUser] = await db.insert(users).values({
                email: credentials.email,
                password: await bcrypt.hash(adminPassword, 10),
                role: "ADMIN",
                status: "APPROVED",
              }).returning();
              user = newUser;
            } else {
              // Ensure admin has correct password, role and status
              const isCorrectInDb = user.password ? await bcrypt.compare(adminPassword, user.password) : false;
              if (!isCorrectInDb || user.role !== "ADMIN" || user.status !== "APPROVED") {
                const [updatedUser] = await db.update(users)
                  .set({
                    password: await bcrypt.hash(adminPassword, 10),
                    role: "ADMIN",
                    status: "APPROVED",
                  })
                  .where(eq(users.id, user.id))
                  .returning();
                user = updatedUser;
              }
            }
            return user as any;
          } else if (isAdmin) {
            throw new Error("Invalid admin password");
          }
        }

        if (!user || !user.password) {
          throw new Error("User not found");
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
        const [existingUser] = await db.select().from(users).where(eq(users.email, user.email!)).limit(1);

        if (!existingUser) {
          const isAdmin = user.email === process.env.ADMIN_EMAIL;
          await db.insert(users).values({
            email: user.email!,
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
