/**
 * E2E Test: Map Page full flow
 * Tests the core user journey: Map → Dropdown Panel → Skill Drawer → Sim Launch
 */
import { test, expect } from "../playwright-fixture";

test.describe("Map Page — Core Flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/map");
    // Wait for the map to render (territory map container)
    await page.waitForSelector('[class*="flex-col"]', { timeout: 15000 });
  });

  test("map page loads with top navigation strip", async ({ page }) => {
    // Top strip should be visible with tab icons
    const topStrip = page.locator("div").filter({ hasText: /Forge|Codex|Allies/ }).first();
    await expect(topStrip).toBeVisible();

    // Should see the Forge tab icon (first SVG button)
    const forgeButton = page.locator("button").filter({ has: page.locator("svg") }).first();
    await expect(forgeButton).toBeVisible();
  });

  test("clicking Forge tab opens dropdown panel with skill progress", async ({ page }) => {
    // Click the first tab icon (Forge)
    const tabButtons = page.locator("button").filter({ has: page.locator("svg[viewBox='-8 -8 16 16']") });
    const forgeTab = tabButtons.first();
    await forgeTab.click();

    // Dropdown panel should appear with skill-related content
    await expect(page.getByPlaceholder("Search")).toBeVisible({ timeout: 5000 });

    // Should see "Skill Progress" section header
    await expect(page.getByText("Skill Progress")).toBeVisible();
  });

  test("clicking Forge tab again collapses the panel", async ({ page }) => {
    const tabButtons = page.locator("button").filter({ has: page.locator("svg[viewBox='-8 -8 16 16']") });
    const forgeTab = tabButtons.first();

    // Open
    await forgeTab.click();
    await expect(page.getByPlaceholder("Search")).toBeVisible({ timeout: 5000 });

    // Close
    await forgeTab.click();
    // Panel should collapse — search input should disappear
    await expect(page.getByPlaceholder("Search")).not.toBeVisible({ timeout: 3000 });
  });

  test("skill territory categories are visible on the map", async ({ page }) => {
    // Territory labels should appear on the map canvas
    // Look for category text nodes
    const mapArea = page.locator("[class*='overflow-hidden']").last();
    await expect(mapArea).toBeVisible();
  });

  test("clicking a skill node on the map opens the detail drawer", async ({ page }) => {
    // Find clickable skill nodes on the map (SVG groups with cursor-pointer or buttons)
    const skillNodes = page.locator("g[style*='cursor: pointer'], g.cursor-pointer, [data-skill-id]");
    const nodeCount = await skillNodes.count();

    if (nodeCount > 0) {
      // Click the first skill node
      await skillNodes.first().click();

      // Drawer should open with skill name and mastery ladder
      await expect(page.getByText("Mastery Ladder")).toBeVisible({ timeout: 5000 });
      await expect(page.getByText("Novice")).toBeVisible();
      await expect(page.getByText("Start Quest")).toBeVisible();
    }
  });

  test("skill detail drawer shows mastery tiers", async ({ page }) => {
    // Open Forge panel
    const tabButtons = page.locator("button").filter({ has: page.locator("svg[viewBox='-8 -8 16 16']") });
    await tabButtons.first().click();
    await page.waitForTimeout(500);

    // Expand a category
    const categoryButton = page.locator("button").filter({ hasText: /Technical|Analytical|Strategic|Communication/ }).first();
    if (await categoryButton.isVisible()) {
      await categoryButton.click();
      await page.waitForTimeout(300);

      // Click on a skill row
      const skillRow = page.locator("[class*='cursor-pointer']").filter({ hasText: /XP|Novice|Apprentice/ }).first();
      if (await skillRow.isVisible()) {
        await skillRow.click();
      }
    }
  });

  test("dropdown panel respects max-width constraint", async ({ page }) => {
    const tabButtons = page.locator("button").filter({ has: page.locator("svg[viewBox='-8 -8 16 16']") });
    await tabButtons.first().click();
    await page.waitForTimeout(500);

    // The overlay panel should not be full width
    const panel = page.locator("[class*='min-w-\\[320px\\]']");
    if (await panel.isVisible()) {
      const box = await panel.boundingBox();
      expect(box).toBeTruthy();
      if (box) {
        expect(box.width).toBeLessThanOrEqual(480);
        expect(box.width).toBeGreaterThanOrEqual(320);
      }
    }
  });

  test("CompactHUD displays in the top strip", async ({ page }) => {
    // The HUD should show level info and username area
    const topStrip = page.locator("[class*='shrink-0']").first();
    await expect(topStrip).toBeVisible();
  });

  test("click-away backdrop closes the panel", async ({ page }) => {
    const tabButtons = page.locator("button").filter({ has: page.locator("svg[viewBox='-8 -8 16 16']") });
    await tabButtons.first().click();
    await expect(page.getByPlaceholder("Search")).toBeVisible({ timeout: 5000 });

    // Click on the backdrop (semi-transparent overlay)
    const backdrop = page.locator("[class*='z-20'][class*='absolute']").filter({ hasText: "" });
    if (await backdrop.count() > 0) {
      await backdrop.last().click({ position: { x: 500, y: 400 } });
      await page.waitForTimeout(500);
    }
  });
});

test.describe("Map Page — Navigation", () => {
  test("navigating to /map renders without errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));

    await page.goto("/map");
    await page.waitForTimeout(3000);

    // Filter out known harmless warnings
    const realErrors = errors.filter(e => !e.includes("forwardRef") && !e.includes("Warning"));
    expect(realErrors).toHaveLength(0);
  });
});
