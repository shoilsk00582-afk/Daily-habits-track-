import { GoogleGenAI, Type } from "@google/genai";
import { DailyContent } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const getDailyMotivation = async (): Promise<DailyContent> => {
  try {
    const model = 'gemini-2.5-flash';
    const prompt = "Generate a warm, encouraging, short daily welcome message for a habit tracking app called 'Fabulous Clone'. Include a greeting, a short inspiring quote (with author), and one brief actionable focus tip for the day. The tone should be magical, behavioral-science based, and uplifting.";

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            greeting: { type: Type.STRING },
            quote: { type: Type.STRING },
            focusTip: { type: Type.STRING }
          },
          required: ["greeting", "quote", "focusTip"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    return JSON.parse(text) as DailyContent;
  } catch (error) {
    console.error("AI Error:", error);
    return {
      greeting: "Hello, Wonderful Human!",
      quote: "Small steps lead to big changes.",
      focusTip: "Take 5 minutes to breathe deeply today."
    };
  }
};

export const getPersonalizedAdvice = async (goal: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Provide a short, 2-sentence specific motivational advice for a user who wants to: ${goal}. Tone: Behavioral Scientist meets Empathetic Coach.`,
    });
    return response.text || "Keep pushing forward, you are doing great.";
  } catch (e) {
    return "Consistency is key. Keep going!";
  }
};
