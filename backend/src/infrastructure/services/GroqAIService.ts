import Groq from "groq-sdk";
import { IAIService, AISuggestion } from "../../domain/services/IAIService";

export class GroqAIService implements IAIService {
  private client: Groq;

  constructor() {
    this.client = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });
  }

  async generateActivities(destination: string, days: number): Promise<AISuggestion[]> {
    const prompt = `Create a travel itinerary for ${destination} for ${days} days.
    For each activity, provide:
    - title: A short name
    - category: Choose exactly one from: LEISURE, FOOD, TRANSPORT, CULTURE
    - description: A brief explanation (max 100 characters)

    Return ONLY a JSON object with a key "activities" containing the array.`;

    try {
      const chatCompletion = await this.client.chat.completions.create({
        messages: [
          {
            role: "system",
            content: "You are a travel expert that only responds in JSON format.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        model: "llama-3.3-70b-versatile",
        // Habilita o modo JSON para garantir que a resposta seja parseável
        response_format: { type: "json_object" },
      });

      const content = chatCompletion.choices[0]?.message?.content;
      if (!content) throw new Error("No content received from Groq");

      const parsed = JSON.parse(content);
      return parsed.activities as AISuggestion[];
    } catch (error) {
      console.error("Error calling Groq API:", error);
      throw new Error("Failed to generate itinerary");
    }
  }
}