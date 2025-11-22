import { GoogleGenAI, Type } from "@google/genai";
import { AIInsight } from '../types';

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const generateGrowthInsight = async (
  days: number,
  improvementRate: number,
  finalValue: number
): Promise<AIInsight> => {
  if (!apiKey) {
    return {
      title: "Configuration Required",
      message: "Please set your API_KEY to receive personalized AI insights about your growth simulation.",
      analogy: "Missing Key"
    };
  }

  try {
    const prompt = `
      I have run a simulation of "The compound effect" or "The 1% rule".
      Here are the stats:
      - Duration: ${days} days
      - Daily Improvement Rate: ${(improvementRate * 100).toFixed(1)}%
      - Starting Value: 1.0
      - Ending Value: ${finalValue.toFixed(2)}

      Please provide a short, powerful motivational insight about this specific result.
      Explain the math simply and give a real-world analogy (like learning a language, gym, saving money).
      
      Return the response in JSON format with the following schema:
      {
        "title": "Short catchy title",
        "message": "The explanation of the growth",
        "analogy": "The real-world metaphor"
      }
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            message: { type: Type.STRING },
            analogy: { type: Type.STRING },
          },
          required: ["title", "message", "analogy"],
        },
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    return JSON.parse(text) as AIInsight;

  } catch (error) {
    console.error("Gemini API Error:", error);
    return {
      title: "Insight Unavailable",
      message: "We couldn't generate a custom insight right now, but look at that chart! The growth speaks for itself.",
      analogy: "N/A"
    };
  }
};