import axios from "axios";

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

export const analyzeTextWithGemini = async (inputText: string) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      throw new Error("API key do Gemini não configurada" );
    }

    const payload = {
      contents: [
        {
          parts: [
            { text: inputText }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.2,  // Valor menor para resultados mais determinísticos
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 4096,  // Aumentado para lidar com respostas maiores
      },
      safetySettings: [
        {
          category: "HARM_CATEGORY_HARASSMENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_HATE_SPEECH",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_DANGEROUS_CONTENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        }
      ]
    };

    const { data } = await axios.post(
      `${GEMINI_API_URL}?key=${apiKey}`,
      payload,
      {
        headers: { "Content-Type": "application/json" }
      }
    );

    if (data?.candidates?.[0]?.content?.parts?.[0]?.text) {
      return data.candidates[0].content.parts[0].text;
    } else if (data?.promptFeedback?.blockReason) {
      return `Conteúdo bloqueado: ${data.promptFeedback.blockReason}`;
    } else {
      return "Não foi possível analisar o documento.";
    }
  } catch (error) {
    console.error("Erro na API do Gemini:", error);
    if (axios.isAxiosError(error) && error.response?.data?.error) {
      return `Erro: ${error.response.data.error.message}`;
    }
    return "Ocorreu um erro ao conectar com a API do Gemini.";
  }
};