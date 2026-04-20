import { GoogleGenerativeAI, Schema, Type } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

export const extractParticipantsFromText = async (rawText: string) => {
  if (!apiKey || apiKey === "PLACEHOLDER_API_KEY") {
    throw new Error("Agrega tu clave de API de Gemini válida en el archivo .env.local");
  }

  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    // Utilizamos un esquema para forzar respuesta 100% en JSON e ignorar prosa.
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        description: "Lista de participantes para un sorteo, extraída del texto.",
        items: {
          type: Type.OBJECT,
          properties: {
            name: {
              type: Type.STRING,
              description: "Nombre del participante (en mayúsculas)",
            },
            colonia: {
              type: Type.STRING,
              description: "Colonia del participante (en mayúsculas). Usa texto vacío si no se especifica.",
            },
          },
          required: ["name", "colonia"],
        },
      },
    },
  });

  const prompt = `
  Extrae todos los participantes del siguiente texto en bruto proveniente de una captura PDF. 
  La salida debe ajustarse de forma estricta al esquema JSON solicitado. Si la colonia no existe, envíala como "".

  TEXTO:
  ---
  ${rawText}
  ---
  `;

  try {
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    return JSON.parse(responseText);
  } catch (error) {
    console.error("Fallo general extrayendo participantes con Gemini:", error);
    throw error;
  }
};

export const generatePresenterComment = async (contextType: 'WINNER' | 'ELIMINATED', name: string, prize?: string) => {
  if (!apiKey || apiKey === "PLACEHOLDER_API_KEY") {
    return contextType === 'WINNER' ? \`¡Muchas felicidades a \${name}!\` : \`¡Suerte para la próxima, \${name}!\`;
  }

  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  let prompt = '';
  
  if (contextType === 'WINNER') {
    prompt = \`Actúa como un presentador de televisión divertido y entusiasta en un sorteo por el Día de las Madres. El jugador "\${name}" acaba de ganar el premio: "\${prize}". Genera un comentario corto celebrando (máximo 15 palabras). Sé jovial y alegre.\`;
  } else {
    prompt = \`Actúa como un presentador de televisión divertido en un sorteo por el Día de las Madres. El jugador "\${name}" acaba de ser eliminado de la ruleta. Genera un comentario corto y simpático o sarcástico pero suave (máximo 15 palabras).\`;
  }

  try {
    const result = await model.generateContent(prompt);
    return result.response.text().replace(/"/g, '').trim();
  } catch (e) {
    console.error("Fallo al generar comentario con Gemini:", e);
    return contextType === 'WINNER' ? \`¡Muchas felicidades a \${name}!\` : \`¡Suerte para la próxima, \${name}!\`;
  }
};
