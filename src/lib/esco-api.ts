import { supabase } from "@/integrations/supabase/client";

export interface EscoPathway {
  title: string;
  uri: string;
  skillOverlap: number;
  sharedSkills: string[];
  totalSkills: number;
  newSkillsNeeded: string[];
}

export interface EscoMatchResult {
  primary: {
    title: string;
    uri: string;
    skillCount: number;
    essentialSkills: string[];
  };
  pathways: EscoPathway[];
}

export async function fetchCareerPathways(jobTitle: string): Promise<EscoMatchResult> {
  const { data, error } = await supabase.functions.invoke("esco-lookup", {
    body: { action: "match", query: jobTitle },
  });

  if (error) throw new Error(error.message || "Failed to fetch career pathways");
  if (data?.error) throw new Error(data.error);
  return data as EscoMatchResult;
}

export async function searchEscoOccupations(query: string, limit = 10) {
  const { data, error } = await supabase.functions.invoke("esco-lookup", {
    body: { action: "search", query, limit },
  });

  if (error) throw new Error(error.message || "Failed to search occupations");
  return data?.results as { uri: string; title: string }[];
}
