import Groq from "groq-sdk";
import { IAIService, AISuggestion, AIBudgetEstimate, AIPackingList } from "../../domain/services/IAIService";

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

  async estimateBudget(destinationName: string, days: number, activities: any[], currency: string): Promise<AIBudgetEstimate> {
    // Criamos uma lista rica com título e tipo para a IA analisar custos específicos
    const activitiesDescription = activities.map(a => `- ${a.title} (Categoria: ${a.type})`).join('\n');

    const prompt = `Atue como um especialista financeiro de viagens. Estime um orçamento para ${days} dias em ${destinationName} usando a moeda ${currency}.
  
  Analise RIGOROSAMENTE estas atividades planejadas para calcular os custos de lazer e transporte:
  ${activitiesDescription || 'Nenhuma atividade específica, forneça uma média para o destino.'}
  
  Considere o custo médio de alimentação e hospedagem para este destino.
  Retorne APENAS um JSON com esta estrutura:
  {
    "currency": "${currency}",
    "total": number,
    "breakdown": { "food": number, "transport": number, "leisure": number, "accommodation": number },
    "tips": "Uma dica financeira em português específica para ${destinationName}."
  }`;

    try {
      const chatCompletion = await this.client.chat.completions.create({
        messages: [
          { role: "system", content: "You are a precise financial travel expert. Respond ONLY in JSON." },
          { role: "user", content: prompt },
        ],
        model: "llama-3.3-70b-versatile",
        response_format: { type: "json_object" },
      });

      const content = chatCompletion.choices[0]?.message?.content;
      if (!content) throw new Error("Sem resposta da IA");

      return JSON.parse(content) as AIBudgetEstimate;
    } catch (error) {
      console.error("Erro ao gerar orçamento:", error);
      throw new Error("Falha ao estimar orçamento");
    }
  }

  async generatePackingList(destinationName: string, month: string, activities: string[]): Promise<AIPackingList> {
    const activitiesList = activities.length > 0 
      ? activities.join(', ') 
      : 'Atividades gerais de turismo';

    const prompt = `Você é um especialista em viagens. O usuário vai viajar para ${destinationName} no mês de ${month}.
    Ele planeja fazer estas atividades: ${activitiesList}.
    
    Baseado no clima histórico desse destino nesse mês específico, e nas atividades planejadas, gere um checklist de bagagem inteligente.
    
    Retorne APENAS um objeto JSON estrito com esta estrutura:
    {
      "weatherCondition": "Resumo curto do clima esperado (ex: Frio e chuvoso)",
      "temperature": "Estimativa de temperatura (ex: 5°C a 12°C)",
      "checklist": {
        "clothing": ["Item 1 com quantidade", "Item 2"],
        "essentials": ["Item 1", "Item 2"],
        "gadgets": ["Item 1", "Item 2"]
      },
      "tip": "Uma dica crucial sobre o clima ou costumes locais."
    }`;

    try {
      const chatCompletion = await this.client.chat.completions.create({
        messages: [
          { role: "system", content: "Você é um assistente de viagens focado em clima e bagagem. Responda APENAS em JSON válido." },
          { role: "user", content: prompt },
        ],
        model: "llama-3.3-70b-versatile",
        response_format: { type: "json_object" },
      });

      const content = chatCompletion.choices[0]?.message?.content;
      if (!content) throw new Error("Sem resposta da IA");

      return JSON.parse(content) as AIPackingList;
    } catch (error) {
      console.error("Erro ao gerar checklist de bagagem:", error);
      throw new Error("Falha ao gerar checklist");
    }
  }
}