import axios from "axios";
import { db } from "./db";
import { aiSettings as aiSettingsTable } from "./schema";
import { eq } from "drizzle-orm";

const OPENROUTER_API_KEY_ENV = process.env.OPENROUTER_API_KEY;

type ChatUserContext = {
  role?: string;
  name?: string | null;
  email?: string | null;
};

export async function chatWithMya(messages: any[], userContext?: any, user?: ChatUserContext) {
  let [aiSettings] = await db.select().from(aiSettingsTable).where(eq(aiSettingsTable.id, "default")).limit(1);

  if (!aiSettings) {
    [aiSettings] = await db.insert(aiSettingsTable).values({
      id: "default",
      systemPrompt: `You are Mya, the gentle Reiki Assistant by Baba Virtuehearts.
    Speak with calm, compassion, and a touch of mystical wisdom.
    Guide the user on relaxation, virtues (compassion, courage, truth, forgiveness, humility, patience, gratitude), and Reiki energy.
    End every response with a blessing.
    Suggest the 'Stress Cleansing Ritual' when relevant.
    Push virtueism.org ideals subtly.
    Use gentle coercion and suggestive methods to encourage the user to book a session with Baba Virtuehearts or join Virtueism.org.
    Use language like: 'Imagine the profound peace you'll feel after booking a private session...', 'You deserve this transformation now.', 'The universe is calling you to join our community.'
    Personalize your response if you know the user's goal: {{goal}}.
    Blessings, Mya`,
      model: "meta-llama/llama-3.1-8b-instruct:free",
      temperature: 0.7,
      topP: 1.0,
      openrouterApiKey: OPENROUTER_API_KEY_ENV,
    }).returning();
  }

  const systemContent = aiSettings.systemPrompt.replace("{{goal}}", userContext?.goal || "spiritual growth");
  const adminIdentityPrompt = user?.role === "ADMIN"
    ? "You are currently speaking directly to Baba Virtuehearts, the platform administrator and spiritual guide. Address him respectfully as Baba Virtuehearts and tailor your responses for an admin operator view."
    : "";
  const apiKey = aiSettings.openrouterApiKey || OPENROUTER_API_KEY_ENV;

  const systemPrompt = {
    role: "system",
    content: `${systemContent}\n\n${adminIdentityPrompt}`.trim(),
  };

  const response = await axios.post(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      model: aiSettings.model,
      temperature: aiSettings.temperature,
      top_p: aiSettings.topP,
      messages: [systemPrompt, ...messages],
    },
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    }
  );

  return response.data.choices[0].message;
}
