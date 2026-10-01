import { GoogleGenAI, Type } from "@google/genai";
import { createClient } from "@/lib/supabase/server";

export interface AIRecommendationResult {
  activityId: string;
  studentExplanation: string;
  pedagogicalReason: string;
  isAiGenerated: boolean;
}

// Gemini model (override with GEMINI_MODEL in .env). gemini-2.0-flash was
// retired by Google; gemini-3.8-flash is the current Flash model.
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.8-flash";

export async function getPersonalizedRecommendation(
  studentId: string,
  schoolId: string | null = null
): Promise<AIRecommendationResult | null> {
  const supabase = await createClient();

  // 1. Fetch available activities
  // Default activities + this student's school's own activities only
  let activitiesQuery = supabase.from("activities").select("id, domain_id, title, description, stage");
  activitiesQuery = schoolId
    ? activitiesQuery.or(`school_id.is.null,school_id.eq.${schoolId}`)
    : activitiesQuery.is("school_id", null);
  const { data: activities } = await activitiesQuery;

  // 2. Fetch screening results
  const { data: screeningResults } = await supabase
    .from("screening_domain_results")
    .select("domain_id, status, combined_score")
    .eq("student_id", studentId);

  // 3. Fetch current mastery progress
  const { data: progressRecords } = await supabase
    .from("skill_progress")
    .select("*, skills(domain_id)")
    .eq("student_id", studentId);

  // Identify mastered domain IDs
  const masteredDomains = new Set<string>();
  if (progressRecords) {
    for (const p of progressRecords) {
      if (Number(p.mastery_percentage) >= 100 && p.skills?.domain_id) {
        masteredDomains.add(p.skills.domain_id);
      }
    }
  }

  const availableActivities = activities || [];

  // Identify active need domains that are NOT yet mastered
  const activeNeedDomains = (screeningResults || [])
    .filter(
      (r) => r.status === "needs_practice" && !masteredDomains.has(r.domain_id)
    )
    .map((r) => r.domain_id);

  // Eligible activities (exclude already mastered domains)
  const candidateActivities = availableActivities.filter(
    (a) => !masteredDomains.has(a.domain_id)
  );

  const fallbackActivity =
    candidateActivities.find((a) => activeNeedDomains.includes(a.domain_id)) ||
    candidateActivities[0] ||
    availableActivities[0];

  if (!fallbackActivity) return null; // no activities available yet

  const fallbackResult: AIRecommendationResult = {
    activityId: fallbackActivity.id,
    studentExplanation: `Let's practice ${fallbackActivity.title}!`,
    pedagogicalReason: `Selected because ${fallbackActivity.domain_id.replace("_", " ")} is in the student's active learning path.`,
    isAiGenerated: false,
  };

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return fallbackResult;
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    const promptData = {
      active_student_needs: activeNeedDomains,
      candidate_activities: candidateActivities.map((a) => ({
        id: a.id,
        domain: a.domain_id,
        title: a.title,
        description: a.description,
      })),
    };

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: JSON.stringify(promptData),
      config: {
        systemInstruction:
          "You are the adaptive learning engine for NeuroBridge. Select the best activity ID from candidate_activities for the student's active needs. Return clean JSON with selected_activity_id, a friendly student_explanation, and a pedagogical_reason.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            selected_activity_id: { type: Type.STRING },
            student_explanation: { type: Type.STRING },
            pedagogical_reason: { type: Type.STRING },
          },
          required: [
            "selected_activity_id",
            "student_explanation",
            "pedagogical_reason",
          ],
        },
      },
    });

    const parsed = JSON.parse(response.text || "{}");

    const matchedActivity = candidateActivities.find(
      (a) => a.id === parsed.selected_activity_id
    );

    if (matchedActivity) {
      return {
        activityId: matchedActivity.id,
        studentExplanation: parsed.student_explanation,
        pedagogicalReason: parsed.pedagogical_reason,
        isAiGenerated: true,
      };
    }

    return fallbackResult;
  } catch (error) {
    console.error("Gemini Recommendation Error:", error);
    return fallbackResult;
  }
}
