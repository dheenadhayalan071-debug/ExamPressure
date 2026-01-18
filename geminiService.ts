
import { GoogleGenAI, Type } from "@google/genai";
import { MistakeCategory, Question, StudyMaterial, Answer } from "./types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateDailyPaper = async (examName: string, isRecovery: boolean): Promise<Question[]> => {
  const prompt = `Act as a senior academic examiner for "${examName}".
  Generate a high-stakes daily mock paper with 30 questions.
  Divide the paper into logical "Sections" based on the actual syllabus of "${examName}" (e.g., if UPSC: Polity, History, Economy; if Science: Physics, Chemistry, Biology).
  
  Difficulty: ${isRecovery ? 'Recovery Mode (Foundation focus)' : 'Standard High-Stakes (Brutal)'}.
  
  Format: Return a JSON array of objects.
  Each object must have: id, section, text, options (4 choices), correct_answer, is_verified_source (75% true), trap_explanation.
  Ensure questions are challenging and include specific board/exam traps.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            section: { type: Type.STRING },
            text: { type: Type.STRING },
            options: { type: Type.ARRAY, items: { type: Type.STRING } },
            correct_answer: { type: Type.STRING },
            is_verified_source: { type: Type.BOOLEAN },
            trap_explanation: { type: Type.STRING }
          },
          required: ["id", "section", "text", "options", "correct_answer", "is_verified_source", "trap_explanation"]
        }
      }
    }
  });

  return JSON.parse(response.text || "[]");
};

export const suggestMistakeCategories = async (
  examName: string, 
  wrongAnswers: { answer: Answer, question: Question }[]
): Promise<Record<string, { category: MistakeCategory, reasoning: string }>> => {
  if (wrongAnswers.length === 0) return {};

  const dataToAnalyze = wrongAnswers.map(wa => ({
    answerId: wa.answer.id,
    question: wa.question.text,
    options: wa.question.options,
    correctAnswer: wa.question.correct_answer,
    userAnswer: wa.answer.user_answer,
    timeSpent: wa.answer.time_spent,
    trapExplanation: wa.question.trap_explanation
  }));

  const prompt = `Act as a specialized evaluation mentor for "${examName}".
  Analyze the following incorrect answers and categorize them: 'Knowledge Gap', 'Trap', 'Overthinking', 'Time Pressure', 'Blind Guess'.
  Use 'timeSpent' (seconds) to diagnose behavioral errors.
  
  Data: ${JSON.stringify(dataToAnalyze)}`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          suggestions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                answerId: { type: Type.STRING },
                category: { type: Type.STRING },
                reasoning: { type: Type.STRING }
              },
              required: ["answerId", "category", "reasoning"]
            }
          }
        }
      }
    }
  });

  const parsed = JSON.parse(response.text || '{"suggestions": []}');
  const result: Record<string, { category: MistakeCategory, reasoning: string }> = {};
  parsed.suggestions.forEach((s: any) => {
    result[s.answerId] = { category: s.category as MistakeCategory, reasoning: s.reasoning };
  });
  return result;
};

export const analyzeMistakes = async (examName: string, data: any): Promise<{feedback: string, nextDayPlan: StudyMaterial[], mentorPersona: string, motivation: string}> => {
  const prompt = `Act as a BRUTAL senior mentor for "${examName}". 
  If UPSC: Act as a retired IAS officer who expects absolute discipline.
  If Board/SSLC/CBSE: Act as a legendary, strict Board Examiner.
  
  TONE RULES:
  - NO sugarcoating. Be cold and objective.
  - Emphasize STRICT FOLLOW-UP. Mention that NO excuses (like leaves or breaks) are tolerated.
  - Success is the only acceptable outcome.
  - Add a "Motivation" section that is grim and high-stakes (e.g. "Every second you waste is a step toward failure").
  
  Analyze results: ${JSON.stringify(data)}. 
  
  Format response as JSON with:
  1. mentorPersona: A title.
  2. feedback: Brutal objective analysis of errors.
  3. nextDayPlan: 3 study blocks.
  4. motivation: A strict, high-stakes final motivation sentence.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          mentorPersona: { type: Type.STRING },
          feedback: { type: Type.STRING },
          nextDayPlan: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                topic: { type: Type.STRING },
                summary: { type: Type.STRING },
                priority: { type: Type.STRING }
              }
            }
          },
          motivation: { type: Type.STRING }
        },
        required: ["mentorPersona", "feedback", "nextDayPlan", "motivation"]
      }
    }
  });

  return JSON.parse(response.text || '{"feedback": "", "nextDayPlan": [], "mentorPersona": "Examiner", "motivation": ""}');
};
