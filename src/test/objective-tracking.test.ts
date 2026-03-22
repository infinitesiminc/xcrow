import { describe, it, expect } from "vitest";

// ── OBJ_EVAL tag parsing logic (extracted for testing) ──

function parseObjEvalTags(reply: string): Record<string, boolean> {
  const status: Record<string, boolean> = {};
  const evalPattern = /\[OBJ_EVAL:([^:]+):(PASS|FAIL)\]/g;
  let match;
  while ((match = evalPattern.exec(reply)) !== null) {
    if (match[2] === "PASS") status[match[1]] = true;
  }
  // Legacy format
  const legacyPattern = /\[OBJECTIVE_MET:([^\]]+)\]/g;
  while ((match = legacyPattern.exec(reply)) !== null) {
    status[match[1]] = true;
  }
  return status;
}

function cleanMessageForDisplay(content: string): string {
  return content
    .replace(/🤖\s*\*?\*?AI Today:?\*?\*?\s*.+/g, "")
    .replace(/💡\s*\*?\*?Human Edge:?\*?\*?\s*.+/g, "")
    .replace(/\[SCAFFOLDING\]/g, "")
    .replace(/\[OBJECTIVE_MET:[^\]]+\]/g, "")
    .replace(/\[OBJ_EVAL:[^\]]+\]/g, "")
    .replace(/\[SCAFFOLD_TIER:\d\]/g, "")
    .replace(/\[ALL_OBJECTIVES_MET\]/g, "")
    .replace(/\[NEEDS_DEPTH\]/g, "")
    .replace(/\[TARGET_OBJ:[^\]]+\]/g, "")
    .trim();
}

function extractPassedObjectives(content: string): string[] {
  const results: string[] = [];
  const pattern = /\[OBJ_EVAL:([^:]+):PASS\]/g;
  let match;
  while ((match = pattern.exec(content)) !== null) {
    results.push(match[1]);
  }
  // Legacy
  const legacy = /\[OBJECTIVE_MET:([^\]]+)\]/g;
  while ((match = legacy.exec(content)) !== null) {
    results.push(match[1]);
  }
  return results;
}

// ── Tests ──

describe("OBJ_EVAL Tag Parsing", () => {
  it("parses PASS tags correctly", () => {
    const reply = "Great answer! You nailed it. [OBJ_EVAL:tool_selection:PASS]";
    const status = parseObjEvalTags(reply);
    expect(status).toEqual({ tool_selection: true });
  });

  it("ignores FAIL tags (does not mark as met)", () => {
    const reply = "Keep trying! [OBJ_EVAL:tool_selection:FAIL]";
    const status = parseObjEvalTags(reply);
    expect(status).toEqual({});
  });

  it("handles multiple tags in one message", () => {
    const reply = "Excellent! [OBJ_EVAL:tool_selection:PASS] [OBJ_EVAL:human_judgment:FAIL]";
    const status = parseObjEvalTags(reply);
    expect(status).toEqual({ tool_selection: true });
  });

  it("handles legacy OBJECTIVE_MET tags", () => {
    const reply = "Well done! [OBJECTIVE_MET:validate_output]";
    const status = parseObjEvalTags(reply);
    expect(status).toEqual({ validate_output: true });
  });

  it("handles mixed new and legacy tags", () => {
    const reply = "[OBJ_EVAL:tool_selection:PASS] [OBJECTIVE_MET:human_judgment]";
    const status = parseObjEvalTags(reply);
    expect(status).toEqual({ tool_selection: true, human_judgment: true });
  });

  it("returns empty for no tags", () => {
    const reply = "Keep going, you're doing well!";
    const status = parseObjEvalTags(reply);
    expect(status).toEqual({});
  });
});

describe("Clean Message for Display", () => {
  it("strips OBJ_EVAL tags", () => {
    const msg = "Great work! [OBJ_EVAL:tool_selection:PASS]";
    expect(cleanMessageForDisplay(msg)).toBe("Great work!");
  });

  it("strips FAIL tags too", () => {
    const msg = "Try again. [OBJ_EVAL:tool_selection:FAIL]";
    expect(cleanMessageForDisplay(msg)).toBe("Try again.");
  });

  it("strips legacy OBJECTIVE_MET tags", () => {
    const msg = "Nice! [OBJECTIVE_MET:abc]";
    expect(cleanMessageForDisplay(msg)).toBe("Nice!");
  });

  it("strips ALL_OBJECTIVES_MET", () => {
    const msg = "All done! [ALL_OBJECTIVES_MET]";
    expect(cleanMessageForDisplay(msg)).toBe("All done!");
  });

  it("strips NEEDS_DEPTH", () => {
    const msg = "Can you elaborate? [NEEDS_DEPTH]";
    expect(cleanMessageForDisplay(msg)).toBe("Can you elaborate?");
  });

  it("strips SCAFFOLD_TIER tags", () => {
    const msg = "Let me help. [SCAFFOLD_TIER:2]";
    expect(cleanMessageForDisplay(msg)).toBe("Let me help.");
  });

  it("strips TARGET_OBJ tags", () => {
    const msg = "Next scenario. [TARGET_OBJ:tool_selection]";
    expect(cleanMessageForDisplay(msg)).toBe("Next scenario.");
  });

  it("strips multiple tags at once", () => {
    const msg = "Done! [OBJ_EVAL:x:PASS] [SCAFFOLD_TIER:1] [ALL_OBJECTIVES_MET] [NEEDS_DEPTH]";
    expect(cleanMessageForDisplay(msg)).toBe("Done!");
  });
});

describe("Extract Passed Objectives from Message", () => {
  it("extracts PASS objectives", () => {
    const msg = "Good job [OBJ_EVAL:tool_selection:PASS] [OBJ_EVAL:human_judgment:FAIL]";
    expect(extractPassedObjectives(msg)).toEqual(["tool_selection"]);
  });

  it("extracts legacy objectives", () => {
    const msg = "[OBJECTIVE_MET:validate_output]";
    expect(extractPassedObjectives(msg)).toEqual(["validate_output"]);
  });

  it("returns empty for no passes", () => {
    const msg = "[OBJ_EVAL:tool_selection:FAIL]";
    expect(extractPassedObjectives(msg)).toEqual([]);
  });

  it("extracts multiple passes", () => {
    const msg = "[OBJ_EVAL:a:PASS] [OBJ_EVAL:b:PASS] [OBJ_EVAL:c:FAIL]";
    expect(extractPassedObjectives(msg)).toEqual(["a", "b"]);
  });
});
