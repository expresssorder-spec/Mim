import { GoogleGenAI } from "@google/genai";
import { Rule, StoreSettings } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateSmartReply = async (
  userMessage: string,
  settings: StoreSettings,
  rules: Rule[]
): Promise<string> => {
  if (!process.env.API_KEY) {
    return "Error: API Key is missing. I cannot generate an AI response.";
  }

  try {
    // We provide the existing rules as context so the AI knows what has already been defined manually,
    // although this function is typically called when no manual rule matched.
    const ruleContext = rules
      .map(r => `If user asks about [${r.keywords.join(', ')}], the policy is: "${r.response}"`)
      .join('\n');

    const systemPrompt = `
      You are a customer support agent for an e-commerce store named "${settings.storeName}".
      
      Your Role:
      ${settings.aiPersona}

      Context & Policies:
      ${ruleContext}

      Instructions:
      - Answer the user's message politely and concisely.
      - If the user asks for something outside your knowledge, ask them to contact human support.
      - Keep responses short, similar to a WhatsApp message.
      - You can reply in the language the user uses (English, French, Arabic, Darija, etc.).
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: userMessage,
      config: {
        systemInstruction: systemPrompt,
        maxOutputTokens: 150, // Keep it brief for chat
        thinkingConfig: { thinkingBudget: 0 }, // Fast response
      },
    });

    return response.text || "I'm having trouble thinking of a response right now.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Sorry, I am currently offline (AI Error).";
  }
};