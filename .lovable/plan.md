

# Homepage UI Overhaul — Claude-inspired Clean Chat Layout

## Reference Analysis
The uploaded screenshot shows Claude's homepage: a clean, warm, centered layout with a personalized greeting, a prominent multi-line text input, and minimal chrome. The current Infinite Sim homepage has a dark, busy layout with a small single-line input, visible chat history scrolling, and role cards competing for attention.

## Plan

### 1. Redesign Homepage Layout (Index.tsx)
- Remove the "Your AI Career Guide" header and stats line ("20,000+ roles · 290+ companies")
- Add a warm, personalized greeting: time-based ("Good morning/afternoon/evening") + user's name if signed in, otherwise generic welcome
- Center the greeting vertically in the upper portion of the page
- Push role cards section further down; hide until chat returns results (no "Trending Roles" on initial load — or keep them subtle)

### 2. Redesign Chat Input (HomepageChat.tsx)
- Replace the small single-line `<input>` with a larger, card-like container similar to Claude's:
  - Multi-line `<textarea>` with auto-resize
  - Rounded container with subtle border/shadow
  - Placeholder: "How can I help you today?"
  - Send button inside the container (bottom-right)
- Move suggestion chips **inside or just below** the input card
- Chat messages appear **above** the input when conversation starts, pushing greeting up/away

### 3. Visual Styling
- Softer background gradient (warm, not purple-tinted)
- Greeting uses large, elegant display font (already have `font-display`)
- Input card: white/card background, subtle shadow, generous padding
- Remove the sparkle avatar icon from assistant messages — keep it cleaner
- Overall: more whitespace, less visual noise

### 4. Interaction Flow
- **Initial state**: Greeting + large input + suggestion chips. No role cards visible.
- **After first message**: Greeting shrinks/hides, chat conversation appears above input, role cards slide in below if returned by AI.
- Input stays anchored at its position (doesn't jump to bottom).

### Files to Edit
- `src/pages/Index.tsx` — layout restructure, greeting logic
- `src/components/HomepageChat.tsx` — textarea upgrade, layout changes, suggestion chip repositioning
- `src/index.css` — possible minor tweaks for warm tones (optional)

