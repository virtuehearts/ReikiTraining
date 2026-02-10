import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { normalizeEnv } from "@/lib/utils";

export async function POST(req: Request) {
  try {
    const { name, email: rawEmail, password } = await req.json();

    if (!rawEmail || !password) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const email = rawEmail.trim().toLowerCase();

    const [existingUser] = await db.select().from(users).where(eq(users.email, email)).limit(1);

    if (existingUser) {
      return NextResponse.json({ error: "User already exists" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const adminEmailEnv = normalizeEnv(process.env.ADMIN_EMAIL)?.toLowerCase();
    const [user] = await db.insert(users).values({
      name,
      email,
      password: hashedPassword,
      status: "PENDING",
      role: email === adminEmailEnv ? "ADMIN" : "USER",
    }).returning();

    return NextResponse.json({ user: { email: user.email, name: user.name } });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
