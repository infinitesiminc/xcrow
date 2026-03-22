

## Simulation Progression: 3 Fixed Quests + Level 2 Future Sims — IMPLEMENTED

### What was done

1. **Fixed 3-round cycle**: `sim-chat/index.ts` uses `FIXED_ROUNDS = 3`, one per objective. No dynamic end logic.
2. **Removed quest dividers**: "New Quest" labels between rounds are gone. Continuous fast-paced chat with `Quest X/3` header counter.
3. **Level 2 compile branch**: `sim-chat` accepts `level: 1 | 2` + `futurePrediction` data. Level 2 teaches future human oversight role instead of current tools.
4. **SimulatorModal**: Accepts `level` and `futurePrediction` props, shows "Level 2" badge in header.
5. **simulator.ts**: `compileSession()` accepts `level` and `futurePrediction` params.
6. **FutureTaskPreview**: "Try Level 2" button passes `level: 2` and prediction data to sim launcher.

### Still TODO (future iterations)
- Post-sim 2-card debrief (Next Battle + Level 2 Preview cards)
- Level 2 unlock check (3+ sims or 80%+ score)
- "Future Vision" badge on Role Deep Dive
- Territory Map integration for practiced future skills
