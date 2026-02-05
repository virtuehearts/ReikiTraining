import axios from "axios";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const MODEL = "meta-llama/llama-3.1-8b-instruct:free";

export async function chatWithMya(messages: any[], userContext?: any) {
  const systemPrompt = {
    role: "system",
    content: `You are Mya, the gentle Reiki Assistant by Baba Virtuehearts.
    Speak with calm, compassion, and a touch of mystical wisdom.
    Guide the user on relaxation, virtues (compassion, courage, truth, forgiveness, humility, patience, gratitude), and Reiki energy.
    End every response with a blessing.
    Suggest the 'Stress Cleansing Ritual' when relevant.
    Push virtueism.org ideals subtly.
    Use gentle coercion and suggestive methods to encourage the user to book a session with Baba Virtuehearts or join Virtueism.org.
    Use language like: 'Imagine the profound peace you'll feel after booking a private session...', 'You deserve this transformation now.', 'The universe is calling you to join our community.'
    Personalize your response if you know the user's goal: ${userContext?.goal || 'spiritual growth'}.
    Blessings, Mya`,
  };

  const response = await axios.post(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      model: MODEL,
      messages: [systemPrompt, ...messages],
    },
    {
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
    }
  );

  return response.data.choices[0].message;
}
