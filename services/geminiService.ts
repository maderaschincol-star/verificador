import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { VerificationResult, GroundingChunk } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const fileToGenerativePart = (base64Data: string, mimeType: string) => {
  return {
    inlineData: {
      data: base64Data,
      mimeType
    },
  };
};

const MAX_RETRIES = 3;
const INITIAL_DELAY_MS = 1000;

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const formatErrorMessage = (error: unknown): string => {
    if (error instanceof Error) {
        // Check for specific, user-friendly messages based on error content
        if (error.message.includes('SAFETY')) {
            return "La solicitud fue bloqueada por motivos de seguridad. Por favor, ajusta tu consulta o la imagen.";
        }
        if (error.message.includes('API key not valid')) {
            return "La clave de API no es válida. Por favor, contacta al administrador del sitio.";
        }
        // Generic but informative error
        return `Error al verificar: ${error.message}. Por favor, inténtalo de nuevo más tarde.`;
    }
    // Fallback for non-Error objects
    return "Ocurrió un error desconocido durante la verificación.";
}


export const verifyFact = async (prompt: string, imageBase64: string | null, imageMimeType: string | null): Promise<VerificationResult> => {
  const model = 'gemini-2.5-flash';
  
  const textPart = {
      text: `Realiza una verificación de hechos (fact-check) sobre la siguiente afirmación y/o imagen. Sé conciso, objetivo y claro.
Inicia tu respuesta con una ÚNICA palabra clave de veredicto de esta lista: [Verdadero, Falso, Engañoso, Mixto, Sin Evidencia].
Después del veredicto, en una nueva línea, proporciona una breve explicación que lo respalde.
La afirmación es: "${prompt}"`
  };

  const parts: any[] = [textPart];

  if (imageBase64 && imageMimeType) {
    const imagePart = fileToGenerativePart(imageBase64, imageMimeType);
    parts.unshift(imagePart);
  }

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const response: GenerateContentResponse = await ai.models.generateContent({
        model: model,
        contents: { parts: parts },
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      const rawAnalysis = response.text;
      const lines = rawAnalysis.split('\n');
      const verdict = lines[0].trim().replace(/[.:]/g, '') || "Sin Veredicto"; // Get first line, remove punctuation
      const analysis = lines.slice(1).join('\n').trim();

      const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
      
      const sources: GroundingChunk[] =
        groundingMetadata?.groundingChunks
          ?.filter((chunk: any) => chunk.web?.uri)
          .map((chunk: any) => ({
            web: {
              uri: chunk.web.uri,
              title: chunk.web.title || chunk.web.uri,
            },
          })) || [];

      // Success, return result immediately
      return { verdict, analysis, sources };

    } catch (error) {
      console.error(`Error en el intento ${attempt + 1}/${MAX_RETRIES}:`, error);

      // If this is the last attempt, format and return the final error.
      if (attempt === MAX_RETRIES - 1) {
        return {
            verdict: "Error",
            analysis: formatErrorMessage(error),
            sources: []
        };
      }

      // Calculate delay with exponential backoff and add jitter
      const backoffDelay = INITIAL_DELAY_MS * Math.pow(2, attempt);
      const jitter = backoffDelay * Math.random() * 0.2; // 0-20% jitter
      await delay(backoffDelay + jitter);
    }
  }

  // This should theoretically not be reached if MAX_RETRIES > 0
  return {
      verdict: "Error",
      analysis: "No se pudo completar la verificación después de varios intentos.",
      sources: []
  };
};