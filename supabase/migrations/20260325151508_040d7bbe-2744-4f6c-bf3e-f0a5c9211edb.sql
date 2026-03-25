
UPDATE canonical_future_skills cfs
SET demand_count = COALESCE(stats.demand, 0),
    job_count = COALESCE(stats.jobs, 0)
FROM (
  SELECT canonical_skill_id,
         COUNT(*)::int AS demand,
         COUNT(DISTINCT job_id)::int AS jobs
  FROM job_future_skills
  WHERE canonical_skill_id IS NOT NULL
  GROUP BY canonical_skill_id
) stats
WHERE cfs.id = stats.canonical_skill_id;
