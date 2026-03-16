

## Plan: Quantified Quadrant Chart for Competitive Landscape

### Current State
The quadrant chart (lines 638–691) already plots competitors on two axes (AI Exposure Intelligence vs. Adaptive Upskilling) using percentage-based positioning. However, the axes have no quantified scale — just directional arrows and vague quadrant labels like "Generic Training" and "Legacy HR Tech."

### What Changes

**Add quantified axis scales and gridlines** to the existing quadrant chart:

1. **X-Axis: "AI Exposure Intelligence" scored 0–10**
   - 0 = No AI exposure insight
   - 3 = Static skills taxonomy (Workday, Gloat)
   - 5 = Manual risk assessment (McKinsey, Deloitte)
   - 8 = Automated task-level scoring
   - 10 = Real-time model-aware re-calibration (Infinite Sim)

2. **Y-Axis: "Adaptive Upskilling" scored 0–10**
   - 0 = No training capability
   - 2 = One-time reports (consultancies)
   - 5 = Generic course catalogs (LinkedIn Learning, Coursera)
   - 8 = Personalized learning paths
   - 10 = Simulation-based adaptive training (Infinite Sim)

3. **Visual enhancements:**
   - Add tick marks at 0, 2, 4, 6, 8, 10 along both axes with numeric labels
   - Add subtle gridlines (dashed, low opacity) at each tick
   - Update competitor dot positions to map to quantified scores (e.g., McKinsey → x:6, y:2; LinkedIn Learning → x:1.5, y:5.5)
   - Add a diagonal "white space" zone highlight (upper-right quadrant) using `brand-human/5` fill
   - Color competitor dots using brand tokens: incumbents in `brand-ai/40`, Infinite Sim in `brand-human` with glow ring
   - Optionally add score tooltips or small "(6, 2)" labels next to each dot

4. **Quadrant labels updated** to reflect the quantified scale:
   - Bottom-left (0-5, 0-5): "Blind Spot" 
   - Bottom-right (5-10, 0-5): "Analysis Without Action"
   - Top-left (0-5, 5-10): "Training Without Intelligence"
   - Top-right (5-10, 5-10): "Adaptive AI Readiness"

### Technical Approach
- All changes within `src/pages/Investors.tsx`, lines 638–691
- Keep the existing CSS-positioned dot approach but update x/y values to map to 0–10 scale
- Add axis tick elements as absolutely positioned spans
- Add gridlines as divs with `border-dashed border-border/20`
- Upper-right quadrant highlight as a positioned div with `bg-brand-human/5 rounded-lg`
- Use `brand-ai` for incumbent dots, `brand-human` for Infinite Sim

