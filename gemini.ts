import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

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
        type: SchemaType.ARRAY,
        description: "Lista de participantes para un sorteo, extraída del texto.",
        items: {
          type: SchemaType.OBJECT,
          properties: {
            name: {
              type: SchemaType.STRING,
              description: "Nombre del participante (en mayúsculas)",
            },
            colonia: {
              type: SchemaType.STRING,
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


