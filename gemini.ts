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
              description: "Nombre completo del participante incluyendo sus apellidos (en MAYÚSCULAS y corrigiendo ortografía)",
            },
            colonia: {
              type: SchemaType.STRING,
              description: "ÚNICAMENTE el nombre de la colonia geográfica (en MAYÚSCULAS). Excluye anuncios o frases largas.",
            },
          },
          required: ["name", "colonia"],
        },
      },
    },
  });

  const prompt = `
  Extrae cuidadosamente todos los participantes del siguiente texto en bruto proveniente de una captura PDF. 

  REGLAS ESTRICTAS DE EXTRACCIÓN:
  1. Cada registro debe tener Nombre y Apellido(s).
  2. Asigna correctamente la COLONIA a su participante. Si no hay, pon "".
  3. CORRIGE cualquier error de ortografía o caracteres raros producidos por el escaneo del PDF.
  4. MANTÉN DE FORMA ESTRICTA EL ORDEN de los participantes tal cual aparecen en el documento.
  5. EXCLUYE BASURA: El campo 'colonia' debe contener ÚNICAMENTE el nombre de la colonia / zona. ESTÁ PROHIBIDO incluir texto promocional (ej. "Renta de lavadoras", "La burbuja feliz", "Participa en la rifa") o fechas.

  La salida debe ajustarse al esquema JSON solicitado.

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


