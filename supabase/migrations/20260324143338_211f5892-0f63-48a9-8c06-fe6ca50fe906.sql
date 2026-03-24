ALTER TABLE public.canonical_future_skills ADD COLUMN skill_number integer;

WITH numbered AS (
  SELECT id,
    ROW_NUMBER() OVER (
      ORDER BY
        CASE category
          WHEN 'Technical' THEN 1
          WHEN 'Analytical' THEN 2
          WHEN 'Strategic' THEN 3
          WHEN 'Communication' THEN 4
          WHEN 'Leadership' THEN 5
          WHEN 'Creative' THEN 6
          WHEN 'Ethics & Compliance' THEN 7
          WHEN 'Human Edge' THEN 8
        END,
        demand_count DESC,
        name ASC
    ) AS num
  FROM public.canonical_future_skills
)
UPDATE public.canonical_future_skills cfs
SET skill_number = numbered.num
FROM numbered
WHERE cfs.id = numbered.id;