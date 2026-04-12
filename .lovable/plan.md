

# Move Chat to Floating Overlay

Replace the fixed 380px right column chat panel with a floating bubble/drawer that opens on click, giving full width to the main content area.

## Changes

### 1. Create `FloatingChat` wrapper component
**New file: `src/components/leadgen/FloatingChat.tsx`**
- A fixed-position chat bubble button (bottom-right corner) with a message icon and unread indicator
- On click, opens the `PipelineChat` component in a slide-up panel (approx 400px wide, 500px tall) anchored to bottom-right
- Click outside or close button dismisses it
- Smooth open/close animation (scale + fade)

### 2. Update `LeadGen.tsx` layout
- Remove the permanent `w-[380px]` chat column from the flex layout
- Import and render `<FloatingChat>` instead, passing `leadCount`
- Main content area now gets full width on all screen sizes

### 3. Mobile support
- On mobile, the overlay expands to near-full-screen width
- The bubble stays visible but smaller

## Technical details
- Use existing `PipelineChat` component unchanged inside the overlay
- State managed with `useState` for open/closed
- z-index above other content (z-50)
- No new dependencies needed

