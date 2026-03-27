

# Fix: Wire Up the 3-Act Flow

## Problem
The 3-act components (`DisruptVentureBuild`, `DisruptPitchBattle`, `DisruptFinalScoreboard`) exist but are unreachable because:

1. **Solo mode has no Acts 2/3** — it goes map → battle → score with no venture or pitch phase
2. **Team mode transitions are broken** — `DisruptTeamBattle.onComplete()` only sets local state (`setPhase("team-venture")`) but never updates `disrupt_rooms.status` to `"venture"` in the database, so realtime sync doesn't work for other team members
3. **No host controls** for advancing between acts (battle → venture → pitch → completed)
4. **`DisruptTeamBattle.finishBattle`** doesn't set `act: 2` on the team record

## Fix Plan

### 1. Add Solo 3-Act Flow (Disrupt.tsx)
- After `solo-score`, add a "Continue to Venture Build" button that transitions to a new `solo-venture` phase
- After venture, add `solo-pitch` phase for VC Q&A
- After pitch, show final combined score
- Reuse the existing `DisruptVentureBuild` and `DisruptPitchBattle` components with a solo-compatible wrapper (create a mock team/room object for solo play)

### 2. Fix Team Act Transitions (DisruptTeamBattle.tsx)
- In `finishBattle`, after scoring, also update `disrupt_teams.act` to `2`
- When all teams in a room have `act >= 2`, auto-update `disrupt_rooms.status` to `"venture"` OR add host control

### 3. Add Host Act-Advance Controls (DisruptDraft.tsx or new component)
- Show a floating host control bar during team play that displays:
  - Current act status
  - "Advance to Act 2: Build" button (sets room status to `"venture"`)
  - "Advance to Act 3: Pitch" button (sets room status to `"pitching"`)
  - "Show Results" button (sets room status to `"completed"`)
- Only visible to `room.created_by === user.id`

### 4. Fix DisruptVentureBuild.tsx
- The `finishVenture` function already updates `act: 2` — change to `act: 3` so it progresses correctly
- Ensure the component works in both solo and team contexts

### 5. Fix DisruptPitchBattle.tsx  
- Ensure it renders correctly for both solo and team modes
- Wire up the voting → completed transition

### Files Modified
- `src/pages/Disrupt.tsx` — Add solo Acts 2/3 phases, add host control bar for team mode
- `src/components/disrupt/DisruptTeamBattle.tsx` — Update `finishBattle` to set `act: 2`
- `src/components/disrupt/DisruptVentureBuild.tsx` — Fix act progression value
- `src/components/disrupt/DisruptPitchBattle.tsx` — Solo mode compatibility

### Technical Details
- Solo mode creates a synthetic team/room object so venture/pitch components work without database records
- Host controls use `supabase.from("disrupt_rooms").update({ status })` to trigger realtime transitions for all clients
- The `ScoreScreen` component gets a "Continue Building" CTA that advances to Act 2

