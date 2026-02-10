import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase();

    const [existingUser] = await db.select().from(users).where(eq(users.email, normalizedEmail)).limit(1);

    if (existingUser) {
      return NextResponse.json({ error: "User already exists" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [user] = await db.insert(users).values({
      name,
      email: normalizedEmail,
      password: hashedPassword,
      status: "PENDING",
      role: normalizedEmail === process.env.ADMIN_EMAIL?.toLowerCase() ? "ADMIN" : "USER",
    }).returning();

    return NextResponse.json({ user: { email: user.email, name: user.name } });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
