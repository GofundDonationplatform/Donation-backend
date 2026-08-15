import express from "express";

const router = express.Router();

const SYSTEM_PROMPT = `
You are the official GoFundSS Assistant for GFSSGA IMPACT NETWORK's
digital fundraising and impact-support platform.

Your job is to help visitors and users understand and navigate the platform.

You can help with:
- finding and understanding campaigns
- explaining how donations work
- explaining how to create a campaign
- explaining account registration and login
- explaining the platform's general features
- helping users navigate the website
- answering general questions about crowdfunding and digital fundraising

IMPORTANT RULES:
1. Be friendly, concise, professional and helpful.
2. Never invent campaign information, donation totals, payment methods,
   policies, approval decisions, account information, or platform features.
3. If you do not have reliable information, clearly say that you don't know
   rather than guessing.
4. Do not claim that a campaign is verified, approved, rejected, completed,
   or funded unless that information is actually provided to you.
5. Never request passwords, OTPs, PINs, card numbers, CVVs, private keys,
   API keys, or other sensitive credentials.
6. Never expose server configuration, environment variables, API keys,
   database credentials, JWT secrets, or internal implementation details.
7. For payment questions, explain the general process without inventing
   unavailable payment options.
8. For campaign questions, encourage users to use the campaign pages and
   official platform controls.
9. If a user asks something outside the platform's scope, politely explain
   that you are the GoFundSS Assistant and redirect them to relevant
   platform functionality.
10. Do not pretend to be GoFundMe or claim that GoFundSS is affiliated with
    GoFundMe.
11. The platform is operated by GFSSGA IMPACT NETWORK.
12. Keep answers suitable for a public-facing fundraising platform.
`;

router.post("/chat", async (req, res) => {
  try {
    const { messages } = req.body;

    if (!Array.isArray(messages)) {
      return res.status(400).json({
        success: false,
        message: "messages must be an array",
      });
    }

    const apiKey = process.env.OPENROUTER;

    if (!apiKey) {
      console.error("OPENROUTER environment variable is missing.");

      return res.status(500).json({
        success: false,
        message: "AI service is not configured.",
      });
    }

    const cleanedMessages = messages
      .filter(
        (message) =>
          message &&
          ["user", "assistant"].includes(message.role) &&
          typeof message.content === "string"
      )
      .slice(-20);

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer":
            process.env.FRONTEND_URL ||
            "https://gfssga-impact-global-network.netlify.app",
          "X-Title": "GoFundSS Impact Network",
        },
        body: JSON.stringify({
          model:
            process.env.OPENROUTER_MODEL ||
            "openai/gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: SYSTEM_PROMPT,
            },
            ...cleanedMessages,
          ],
          temperature: 0.2,
          max_tokens: 500,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("OpenRouter error:", {
        status: response.status,
        error: data?.error?.message || "Unknown provider error",
      });

      return res.status(502).json({
        success: false,
        message: "AI service is temporarily unavailable.",
      });
    }

    const reply = data?.choices?.[0]?.message?.content;

    if (!reply) {
      return res.status(502).json({
        success: false,
        message: "The AI service returned an empty response.",
      });
    }

    return res.json({
      success: true,
      reply,
    });
  } catch (error) {
    console.error("AI chat error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to process your request right now.",
    });
  }
});

export default router;
