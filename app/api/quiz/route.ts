import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import axios from "axios";
import { eq } from "drizzle-orm";
import { OPENROUTER_MODEL } from "@/lib/ai-model";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { virtue, day } = await req.json();

    const user = await db.query.users.findFirst({
      where: eq(users.id, session.user.id),
      with: { intake: true },
    });

    const prompt = `Generate 4 multiple choice questions on the virtue of [${virtue}] in the context of Reiki.
    Personalize for the user's goal: [${user?.intake?.goal || 'spiritual growth'}].
    Format as JSON: [{"question": "...", "options": ["...", "...", "...", "..."], "correct": 0}] where correct is the index of the right option.`;

    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: OPENROUTER_MODEL,
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" }
      },
      {
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const rawContent = response.data?.choices?.[0]?.message?.content;
    if (typeof rawContent !== "string") {
      throw new Error("Invalid AI response payload");
    }

    const sanitizedContent = rawContent
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();

    const content = JSON.parse(sanitizedContent);

    const quiz = Array.isArray(content)
      ? content
      : Array.isArray(content?.quiz)
      ? content.quiz
      : Array.isArray(content?.questions)
      ? content.questions
      : Array.isArray(content?.items)
      ? content.items
      : [];

    if (!quiz.length) {
      throw new Error("AI response did not include quiz questions");
    }

    return NextResponse.json(quiz);
  } catch (error) {
    console.error("Quiz generation error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
