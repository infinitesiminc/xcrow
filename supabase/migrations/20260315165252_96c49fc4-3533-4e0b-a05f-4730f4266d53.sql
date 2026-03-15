-- Remove duplicate task clusters, keeping only the earliest set per job
DELETE FROM public.job_task_clusters
WHERE id NOT IN (
  SELECT DISTINCT ON (job_id, sort_order) id
  FROM public.job_task_clusters
  ORDER BY job_id, sort_order, id ASC
)