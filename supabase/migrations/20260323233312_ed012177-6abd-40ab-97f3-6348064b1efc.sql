
CREATE OR REPLACE FUNCTION get_undercovered_skills(min_analyzed int DEFAULT 3)
RETURNS TABLE(skill_id text, skill_name text, category text, description text, analyzed_count bigint, gap bigint)
LANGUAGE sql STABLE
AS $$
  SELECT 
    cfs.id as skill_id,
    cfs.name as skill_name,
    cfs.category,
    cfs.description,
    count(DISTINCT j.id) FILTER (WHERE j.automation_risk_percent IS NOT NULL) as analyzed_count,
    GREATEST(0, min_analyzed - count(DISTINCT j.id) FILTER (WHERE j.automation_risk_percent IS NOT NULL)) as gap
  FROM canonical_future_skills cfs
  LEFT JOIN job_future_skills jfs ON jfs.canonical_skill_id = cfs.id
  LEFT JOIN jobs j ON j.id = jfs.job_id
  GROUP BY cfs.id, cfs.name, cfs.category, cfs.description
  HAVING count(DISTINCT j.id) FILTER (WHERE j.automation_risk_percent IS NOT NULL) < min_analyzed
  ORDER BY 
    count(DISTINCT j.id) FILTER (WHERE j.automation_risk_percent IS NOT NULL) ASC,
    GREATEST(0, min_analyzed - count(DISTINCT j.id) FILTER (WHERE j.automation_risk_percent IS NOT NULL)) DESC
$$;
