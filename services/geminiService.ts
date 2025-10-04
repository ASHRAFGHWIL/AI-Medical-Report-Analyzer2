import { GoogleGenAI, Type } from "@google/genai";
import type { AnalysisResult, Language } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const getPrompt = (language: Language) => {
  const langInstruction = language === 'ar' 
    ? "All text in the JSON output, including keys and values, must be in Arabic."
    : "All text in the JSON output, including keys and values, must be in English.";

  return `
    You are an expert AI in medical report analysis, trained on WHO and NIH standards.
    Analyze the provided medical lab report image.
    First, extract the following patient information: Name, Age, Date of the medical test, and the Type of medical test (e.g., "Complete Blood Count", "Lipid Panel"). If any of this information is not present, use a placeholder like "Not specified".
    
    Next, identify key metrics, compare them to standard reference ranges, and classify each as 'normal', 'moderate', or 'severe' based on deviation from the norm.
    Provide a simplified summary for a patient, a detailed academic report for a physician, and actionable recommendations.
    You MUST provide your response as a single, valid JSON object with no surrounding text or markdown.
    ${langInstruction}
  `;
};

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    patientDetails: {
      type: Type.OBJECT,
      description: "Patient's demographic and test information.",
      properties: {
        name: { type: Type.STRING, description: "The patient's full name as it appears on the report." },
        age: { type: Type.STRING, description: "The patient's age as it appears on the report." },
        testDate: { type: Type.STRING, description: "The date the medical test was conducted." },
        testType: { type: Type.STRING, description: "The name or type of the medical test (e.g., 'CBC', 'Lipid Profile')." },
      },
      required: ["name", "age", "testDate", "testType"],
    },
    patientSummary: {
      type: Type.STRING,
      description: "A simplified, easy-to-understand summary of the key findings for the patient.",
    },
    physicianReport: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          parameter: { type: Type.STRING, description: "The name of the medical parameter (e.g., Glucose, Hemoglobin)." },
          value: { type: Type.STRING, description: "The measured value with units (e.g., '110 mg/dL')." },
          referenceRange: { type: Type.STRING, description: "The normal reference range with units (e.g., '70-100 mg/dL')." },
          status: { type: Type.STRING, description: "Classification of the result: 'normal', 'moderate', or 'severe'." },
          explanation: { type: Type.STRING, description: "A brief academic explanation of the finding for a physician." },
        },
        required: ["parameter", "value", "referenceRange", "status", "explanation"]
      }
    },
    recommendations: {
      type: Type.OBJECT,
      properties: {
        general: { type: Type.ARRAY, items: { type: Type.STRING }, description: "General health recommendations." },
        nutrition: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Specific nutritional and dietary advice." },
        physicalTherapy: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Physical therapy or exercise recommendations." },
      },
      required: ["general", "nutrition", "physicalTherapy"]
    }
  },
  required: ["patientDetails", "patientSummary", "physicianReport", "recommendations"],
};

export const analyzeMedicalReport = async (
  base64ImageData: string,
  mimeType: string,
  language: Language
): Promise<AnalysisResult> => {
  try {
    const imagePart = {
      inlineData: {
        data: base64ImageData,
        mimeType: mimeType,
      },
    };

    const textPart = {
      text: getPrompt(language),
    };

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      // FIX: Changed from an array with one item to a single content object, which is cleaner for single-turn requests.
      contents: { parts: [imagePart, textPart] },
      config: {
        responseMimeType: 'application/json',
        responseSchema: responseSchema,
        temperature: 0.2,
      },
    });

    const jsonText = response.text.trim();
    // FIX: The response text is a JSON string that needs to be parsed.
    const result: AnalysisResult = JSON.parse(jsonText);
    return result;

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    if (error instanceof Error && error.message.includes('JSON')) {
        throw new Error('Failed to get a valid analysis from the AI. The response was not in the expected format.');
    }
    throw new Error('An error occurred while analyzing the medical report.');
  }
};