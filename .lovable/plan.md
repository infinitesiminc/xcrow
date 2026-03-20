

# Enhance Company Marquee with Real Job Previews

## What changes

Turn the static company pill marquee into an interactive component. When a student clicks a company chip, a dropdown/popover appears showing 3-5 real jobs from that company (fetched from the `jobs` table), each clickable to launch a simulation.

## How it works

1. **Make `CompanyChip` clickable** — on click, query `jobs` + `companies` tables for that company name, fetch up to 5 jobs with their task clusters
2. **Show a popover/dropdown** below the chip with real job titles, departments, and AI exposure scores
3. **Each job row is clickable** — launches the `SimulatorModal` with the job's top task (from `job_task_clusters`)
4. **Auth gate** — if not logged in, clicking a job opens the auth modal first

## Technical approach

### File: `src/components/CompanyMarquee.tsx`
- Add `onClick` callback prop to `CompanyChip`
- Add `onJobSelect` callback prop to `CompanyMarquee`

### File: `src/pages/Students.tsx`
- Add state for selected company and its jobs
- On company click: query `companies` by name -> get `company_id` -> fetch jobs with task clusters
- Render a popover/panel showing the fetched jobs
- Wire job clicks into the existing `SimulatorModal` flow (reuse `simJob` state + auth gate)

### Data flow
```text
Click chip "Anthropic"
  → supabase.from("companies").select("id").eq("name", "Anthropic")
  → supabase.from("jobs").select("id, title, department, augmented_percent")
      .eq("company_id", id).limit(5)
  → supabase.from("job_task_clusters").select("cluster_name, job_id")
      .in("job_id", jobIds).limit(1 per job)
  → Show popover with jobs + "Practice" buttons
```

### UI design
- Popover anchored below the marquee area (not per-chip, to avoid layout issues with the scrolling animation)
- Shows company name + logo at top
- List of jobs: title, department badge, exposure %, and a "Practice" button
- Clicking "Practice" launches simulator with that job's top task
- Click outside or another company to dismiss

