import { test, expect, Page } from "@playwright/test";
import fs from "node:fs";
import { collectionLoadingReference } from "../src/data/collectionLoadingReference";
import { captureReferenceTimestamps } from "../src/data/captureReference";
import { DEMO_FLOWER_WORD } from "../src/data/demoVocabulary";
import { scenarioMemoryIntroCopy } from "../src/data/scenarioMemoryIntroReference";
import { reviewSummaryCapture } from "../src/theme/reviewSummaryCapture";
import { streakReference } from "../src/data/streakReference";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
const source082086DateReference = {
  monthIndex: 8,
  dayOfMonth: 11,
  singleWordTarget: "Une Femme",
} as const;
const routes = [
  "welcome",
  "intro",
  "languages",
  "home",
  "collection",
  "camera",
  "confirm",
  "result",
  "detail",
  "examples",
  "memoryIntro",
  "review",
  "reviewResult",
  "streak",
  "profile",
  "paywall",
  "story",
];
async function ready(page: Page) {
  await page.waitForFunction(() => document.body.innerText.trim().length > 0);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(550);
}
async function swipeReviewCard(page: Page, distance: number) {
  const card = page.getByTestId("review-card");
  const bounds = await card.boundingBox();
  expect(bounds).not.toBeNull();
  const startX = bounds!.x + bounds!.width / 2;
  const startY = bounds!.y + bounds!.height / 2;
  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(startX + distance, startY, { steps: 6 });
  if (distance > 0) {
    await expect(page.getByTestId("review-gesture-cue")).toContainText(
      "Got it!",
    );
    await expect(page.getByTestId("review-gesture-pointer")).toBeVisible();
  } else {
    await expect(page.getByTestId("review-swipe-feedback")).toContainText(
      "Needs review",
    );
  }
  await page.mouse.up();
}
test("17 route screenshot sweep without runtime errors", async ({ page }) => {
  fs.mkdirSync("qa/screens", { recursive: true });
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  for (const route of routes) {
    const referenceState =
      route === "paywall"
        ? "&paywallSource=050&paywallLanguage=ko"
        : route === "confirm"
          ? "&confirmPhoto=012"
          : "";
    await page.goto(`/?screen=${route}&fixture=1${referenceState}`);
    await ready(page);
    if (route === "confirm") {
      await expect(page.getByLabel("Retake image", { exact: true })).toHaveCSS(
        "background-color",
        "rgba(0, 0, 0, 0.16)",
      );
    }
    if (route === "welcome") {
      await expect(page.getByText("9:41", { exact: true })).toHaveCount(0);
    }
    await page.screenshot({ path: `qa/screens/${route}.png` });
    expect(errors, `runtime errors on ${route}`).toEqual([]);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(393);
  }
});
test("source 051 Confirm guidance keeps its controls inside the captured panel", async ({
  page,
}) => {
  fs.mkdirSync("qa/screens", { recursive: true });
  await page.goto("/?screen=confirm&fixture=1&confirmGuidance=1");
  await ready(page);

  const panel = page.getByTestId("recognition-guidance-panel");
  const card = page.getByTestId("confirm-guidance-polaroid");
  await expect(panel).toBeVisible();
  await expect(
    page.getByText("Recognize this photo?", { exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel("Retake image", { exact: true })).toBeVisible();
  await expect(
    page.getByLabel("Confirm object", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByLabel("Crop and rotate", { exact: true }),
  ).toBeVisible();

  const panelBounds = await panel.boundingBox();
  const cardBounds = await card.boundingBox();
  const viewport = page.viewportSize();
  expect(panelBounds).not.toBeNull();
  expect(cardBounds).not.toBeNull();
  expect(viewport).not.toBeNull();
  expect(panelBounds!.y + panelBounds!.height).toBeCloseTo(viewport!.height, 0);
  expect(cardBounds!.y + cardBounds!.height).toBeLessThan(panelBounds!.y);
  await page.screenshot({ path: "qa/screens/confirm051.png" });

  await page.getByLabel("Crop and rotate", { exact: true }).click();
  await expect(page.getByText(/Confirm selection/)).toBeVisible();
});
test("captures extra source pairs and the empty-Home fixture", async ({
  page,
}) => {
  fs.mkdirSync("qa/screens", { recursive: true });

  await page.goto("/?screen=confirm&fixture=1");
  await ready(page);
  await page.getByLabel("Crop and rotate", { exact: true }).click();
  await ready(page);
  await expect(page.getByTestId("crop-editor-grid")).toHaveCount(0);
  await expect(page.getByTestId("crop-frame-corners")).toBeVisible();
  await expect(page.getByTestId("crop-action-select-ratio")).toBeVisible();
  await page.screenshot({ path: "qa/screens/cropEditor.png" });
  await expect(page.getByLabel("Select image ratio")).toBeVisible();
  await page.getByLabel("Select image ratio", { exact: true }).click();
  await ready(page);
  const ratioOptions = page.getByTestId("action-sheet-options");
  await expect(ratioOptions).toBeVisible();
  expect(
    await page.locator('[data-testid^="action-sheet-option-"]').count(),
  ).toBe(8);
  for (const label of [
    "Original",
    "Square",
    "3:2",
    "5:3",
    "4:3",
    "5:4",
    "7:5",
    "16:9",
  ]) {
    await expect(
      page.getByRole("button", { name: label, exact: true }),
    ).toBeVisible();
  }
  const ratioBounds = await ratioOptions.boundingBox();
  expect(ratioBounds).not.toBeNull();
  expect(ratioBounds!.width).toBeCloseTo(377, 0);
  expect(ratioBounds!.height).toBeCloseTo(456, 0);
  expect(
    await ratioOptions.evaluate(
      (element) => getComputedStyle(element).backgroundColor,
    ),
  ).toBe("rgb(197, 198, 198)");
  await expect(page.getByTestId("action-sheet-cancel")).toBeVisible();
  await page.screenshot({ path: "qa/screens/cropRatio.png" });
  await page.getByRole("button", { name: "4:3", exact: true }).click();
  await ready(page);
  await expect(page.getByTestId("crop-frame-corners")).toBeVisible();
  await page.screenshot({ path: "qa/screens/cropEditor054.png" });

  await page.goto("/?screen=profile&fixture=1");
  await ready(page);
  await page.getByLabel("Edit nickname", { exact: true }).click();
  await ready(page);
  await page.screenshot({ path: "qa/screens/profileNickname.png" });
  await page.getByText("Cancel", { exact: true }).click();
  await page.getByText("System Language", { exact: true }).click();
  await ready(page);
  await page.screenshot({ path: "qa/screens/systemLanguage.png" });

  await page.goto("/?screen=result&fixture=1");
  await ready(page);
  await page.getByText(/Not what you expected/).click();
  await page
    .getByLabel("Target object name", { exact: true })
    .fill("Sunflower");
  await ready(page);
  await page.screenshot({ path: "qa/screens/objectNameSunflower.png" });

  await page.goto("/?screen=home&fixture=1");
  await ready(page);
  await page.evaluate(() => {
    const key = "@capwords/state";
    const saved = JSON.parse(localStorage.getItem(key)!);
    saved.state.words = [];
    localStorage.setItem(key, JSON.stringify(saved));
  });
  await page.goto("/?screen=home");
  await ready(page);
  await page.screenshot({ path: "qa/screens/homeEmpty.png" });
});
test("source 033 preserves its count snapshot without fabricating a word", async ({
  page,
}) => {
  fs.mkdirSync("qa/screens", { recursive: true });
  await page.goto("/?screen=collection&fixture=1&emptyCollection=1");
  await ready(page);
  await expect(page.getByText("Sep 11", { exact: true })).toBeVisible();
  await expect(page.getByText("1 Words", { exact: true })).toBeVisible();
  await expect(page.getByTestId("collection-word-card")).toHaveCount(0);
  const emptyState = page.getByTestId("empty-collection-state");
  await expect(emptyState).toContainText("Haven't snapped anything yet?");
  await expect(emptyState).toContainText("Take a look around you!");
  await expect(page.getByLabel("Open camera", { exact: true })).toBeVisible();
  await page.screenshot({
    path: "qa/screens/collectionEmpty033.png",
    animations: "disabled",
  });
});
test("shows the source-099 one-word Collection loading state", async ({
  page,
}) => {
  fs.mkdirSync("qa/screens", { recursive: true });
  await page.goto("/?screen=home&fixture=1");
  await ready(page);
  await page.evaluate((wordTarget) => {
    const key = "@capwords/state";
    const savedText = localStorage.getItem(key);
    if (!savedText) throw new Error("Reference fixture state is missing");
    const saved = JSON.parse(savedText);
    saved.state.words = saved.state.words.filter(
      (word: { target: string }) => word.target === wordTarget,
    );
    localStorage.setItem(key, JSON.stringify(saved));
  }, collectionLoadingReference.wordTarget);

  await page.goto("/?screen=collection&fixture=1&collectionLoading=1");
  await ready(page);
  await expect(page.getByText("Sep 11", { exact: true })).toBeVisible();
  await expect(page.getByText("1 Words", { exact: true })).toBeVisible();
  await expect(
    page.getByLabel(collectionLoadingReference.accessibilityLabel),
  ).toBeVisible();
  await expect(page.getByTestId("empty-collection-state")).toHaveCount(0);
  await expect(page.getByLabel("Open camera", { exact: true })).toHaveCount(0);
  await page.screenshot({
    path: "qa/screens/collectionLoading099.png",
    animations: "disabled",
  });
});
test("source 018 shows inline actions for a long-pressed Collection word", async ({
  page,
}) => {
  fs.mkdirSync("qa/screens", { recursive: true });
  await page.goto("/?screen=collection&fixture=1");
  await ready(page);
  await expect(page.getByText("4 Words", { exact: true })).toBeVisible();
  await page
    .getByLabel("Open Tournesol", { exact: true })
    .click({ delay: 650 });
  await expect(page.getByTestId("collection-inline-actions")).toBeVisible();
  await expect(page.getByLabel("Save and copy sticker")).toBeVisible();
  await expect(page.getByLabel("Delete word")).toBeVisible();
  await expect(page.getByText("Manage sticker", { exact: true })).toHaveCount(
    0,
  );
  await page.screenshot({
    path: "qa/screens/collectionActions018.png",
    animations: "disabled",
  });

  await page.getByLabel("Delete word").click();
  await expect(page.getByLabel("Open Tournesol", { exact: true })).toHaveCount(
    0,
  );
  await expect(page.getByText("3 Words", { exact: true })).toBeVisible();
  await expect(page.getByTestId("collection-inline-actions")).toHaveCount(0);
  await expect(
    page.getByLabel("Open Une Femme", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByLabel("Open Obscurité", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByLabel("Open Un cornet de glace", { exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: "qa/screens/collectionDeleted019.png",
    animations: "disabled",
  });
});

test("source 039 shows the saved-and-copied toast and saves through an isolated fixture", async ({
  page,
}) => {
  fs.mkdirSync("qa/screens", { recursive: true });
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));

  await page.goto("/?screen=collection&fixture=1");
  await ready(page);
  await page
    .getByLabel("Open Tournesol", { exact: true })
    .click({ delay: 650 });
  const saveAction = page.getByLabel("Save and copy sticker", { exact: true });
  await expect(saveAction).toBeVisible();
  await saveAction.click();
  const toast = page.getByTestId("collection-save-toast");
  await expect(toast).toContainText("Sticker saved to Photos!");
  await expect(toast).toContainText("Copied! Paste it anywhere");
  await expect(
    page.getByTestId("collection-save-toast-sparkles"),
  ).toBeVisible();
  await expect(toast).toContainText("+1");
  await page.screenshot({
    path: "qa/screens/collectionSaveToast039.png",
    animations: "disabled",
  });
  expect(errors).toEqual([]);
});

test("persisted Collection deletion feeds MemoryIntro's real Review queue", async ({
  page,
}) => {
  await page.goto("/?screen=collection&fixture=1");
  await ready(page);
  await page
    .getByLabel("Open Tournesol", { exact: true })
    .click({ delay: 650 });
  await page.getByLabel("Delete word", { exact: true }).click();
  await expect(page.getByText("3 Words", { exact: true })).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(() => {
        const saved = localStorage.getItem("@capwords/state");
        return saved ? JSON.parse(saved).state.words.length : 0;
      }),
    )
    .toBe(3);

  const persistedTargets = await page.evaluate(() => {
    const saved = JSON.parse(localStorage.getItem("@capwords/state")!);
    return saved.state.words.map((word: { target: string }) => word.target);
  });
  await page.goto("/?screen=memoryIntro");
  await ready(page);
  await page.getByRole("button", { name: "Try a Demo", exact: true }).click();

  const progress = page.getByRole("progressbar", {
    name: "Review progress",
    exact: true,
  });
  await expect(progress).toHaveAttribute("aria-valuemax", "3");
  const cardText = await page.getByTestId("review-card").innerText();
  expect(
    persistedTargets.some((target: string) =>
      cardText.toLocaleLowerCase().includes(target.toLocaleLowerCase()),
    ),
  ).toBe(true);
});

test("saved-word image export controls use a no-side-effect browser fixture", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/?screen=detail&fixture=1&imageExportFixture=1");
  await ready(page);
  await page.getByLabel("Word actions", { exact: true }).click();
  const download = page.getByRole("button", {
    name: /Download image/,
  });
  await expect(download).toBeVisible();
  await expect(page.getByRole("button", { name: /Share image/ })).toHaveCount(
    0,
  );
  await download.click();
  await expect(
    page.getByText("Test fixture: download requested; no image was exported.", {
      exact: true,
    }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});
test("paywall 050 offers selectable plans but never starts billing", async ({
  page,
}) => {
  await page.goto(
    "/?screen=paywall&fixture=1&paywallSource=050&paywallLanguage=ko",
  );
  await ready(page);
  await expect(page.getByText(/Join\s+CapWords/)).toBeVisible();
  await expect(
    page.getByText("Make faster progress", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("in Korean", { exact: true })).toBeVisible();
  const annual = page.getByTestId("paywall-plan-annual");
  const monthly = page.getByTestId("paywall-plan-monthly");
  await expect(annual).toHaveAttribute("aria-checked", "true");
  await expect(monthly).toHaveAttribute("aria-checked", "false");
  await expect(
    page.getByText("Try 3 days free, then S$ 19.98/year", { exact: true }),
  ).toBeVisible();

  await monthly.click();
  await expect(monthly).toHaveAttribute("aria-checked", "true");
  await expect(
    page.getByText("S$ 8.98/month · billed monthly", { exact: true }),
  ).toBeVisible();
  await annual.click();
  await page.getByTestId("paywall-trial").click();
  await expect(
    page.getByText(
      "This educational clone is not connected to billing. No subscription or payment has been started.",
      { exact: true },
    ),
  ).toBeVisible();
  await page.getByRole("button", { name: "Got it", exact: true }).click();
  await expect(page.getByTestId("paywall-trial")).toBeVisible();

  await page.goto("/?screen=paywall&fixture=1");
  await ready(page);
  await expect(page.getByLabel("Back", { exact: true })).toBeVisible();
  await expect(
    page.getByText("DEMO · NO BILLING", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("in French", { exact: true })).toBeVisible();
  await page.getByLabel("Back", { exact: true }).click();
  await expect(page.getByText("Settings", { exact: true })).toBeVisible();
});
test("paywall 073 offer state is source-backed and demo-only", async ({
  page,
}) => {
  fs.mkdirSync("qa/screens", { recursive: true });
  await page.goto(
    "/?screen=paywall&fixture=1&paywallSource=073&paywallLanguage=ko",
  );
  await ready(page);
  await expect(page.getByText("Powered by", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Cancel", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("See it. Snap it.", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Learn Korean with AI.", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Apple Design Award", { exact: true }),
  ).toBeVisible();
  for (const label of [
    "Unlimited recognition",
    "Photos & videos, one-tap AI",
    "Word stickers, saved forever",
  ]) {
    await expect(page.getByText(label, { exact: true })).toBeVisible();
  }
  await expect(page.getByTestId("paywall-offer-confetti")).toBeVisible();
  await page.screenshot({ path: "qa/screens/paywallOffer.png" });

  const annual = page.getByTestId("paywall-offer-annual");
  const monthly = page.getByTestId("paywall-offer-monthly");
  await expect(annual).toHaveAttribute("aria-checked", "true");
  await monthly.click();
  await expect(monthly).toHaveAttribute("aria-checked", "true");
  await annual.click();
  await page.getByTestId("paywall-offer-trial").click();
  await expect(
    page.getByText(
      /not connected to billing\. No subscription or payment has been started/,
    ),
  ).toBeVisible();
  await page.getByRole("button", { name: "Got it", exact: true }).click();
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(page.getByText("Settings", { exact: true })).toBeVisible();
});

test("source 095 reuses the settled marketing offer without confetti or billing", async ({
  page,
}) => {
  fs.mkdirSync("qa/screens", { recursive: true });
  await page.goto(
    "/?screen=paywall&fixture=1&paywallSource=095&paywallLanguage=ko",
  );
  await ready(page);
  await expect(page.getByText("Powered by", { exact: true })).toBeVisible();
  await expect(
    page.getByText("Learn Korean with AI.", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("radio", {
      name: "Best Value, free for 3 days, then S$19.98 per year",
    }),
  ).toBeVisible();
  await expect(page.getByText("S$ 8.98", { exact: true })).toBeVisible();
  await expect(
    page.getByText("Apple Design Award", { exact: true }),
  ).toBeVisible();
  for (const artwork of [
    "paywall-offer-background",
    "paywall-benefit-icon-infinite",
    "paywall-benefit-icon-book",
    "paywall-benefit-icon-lock-open",
  ]) {
    await expect(page.getByTestId(artwork)).toBeVisible();
  }
  await expect(page.getByTestId("paywall-offer-confetti")).toHaveCount(0);
  await expect(page.getByTestId("paywall-offer-annual")).toHaveAttribute(
    "aria-checked",
    "true",
  );
  await page.screenshot({
    path: "qa/screens/paywallOffer095.png",
    animations: "disabled",
    caret: "hide",
  });

  await page.getByTestId("paywall-offer-trial").click();
  await expect(
    page.getByText(
      "This educational clone is not connected to billing. No subscription or payment has been started.",
      { exact: true },
    ),
  ).toBeVisible();
  await page.getByRole("button", { name: "Got it", exact: true }).click();
  await expect(page.getByTestId("paywall-offer-trial")).toBeVisible();
});

test("paywall 064 success alert is a visual-only fixture", async ({ page }) => {
  fs.mkdirSync("qa/screens", { recursive: true });
  await page.goto(
    "/?screen=paywall&fixture=1&paywallSource=064&paywallLanguage=ko",
  );
  await ready(page);

  const alert = page.getByTestId("paywall-purchase-success");
  await expect(alert).toBeVisible();
  await expect(page.getByText("You're all set", { exact: true })).toBeVisible();
  await expect(
    page.getByText("Your purchase was successful.", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "OK", exact: true }),
  ).toBeVisible();
  await page.screenshot({ path: "qa/screens/paywallSuccess064.png" });

  await page.getByTestId("paywall-purchase-success-ok").click();
  await expect(alert).toHaveCount(0);
  await expect(page.getByTestId("paywall-offer-trial")).toBeVisible();
  await expect(
    page.getByText("Your purchase was successful.", { exact: true }),
  ).toHaveCount(0);
});
test("onboarding selects native and learning languages, supports back, and persists both", async ({
  page,
}) => {
  fs.mkdirSync("qa/screens", { recursive: true });
  await page.goto("/?screen=intro&fixture=1");
  await ready(page);
  await page.getByText("Get Started", { exact: true }).click();
  const nativeStep = page.getByTestId("languages-native");
  await expect(nativeStep).toBeVisible();
  await expect(page.getByText(/Choose Your\s+Native Language/)).toBeVisible();
  await expect(page.getByTestId("language-flag-en")).toBeVisible();
  await expect(page.getByTestId("language-option-en")).toHaveCSS(
    "border-width",
    "2px",
  );
  await expect(
    page.getByRole("button", { name: "Next", exact: true }),
  ).toHaveCount(0);
  await page.screenshot({ path: "qa/screens/languagesNative.png" });

  await page.getByTestId("language-option-en-GB").click();
  await expect(page.getByTestId("language-option-en-GB")).toHaveCSS(
    "border-width",
    "3px",
  );
  await expect(
    page.getByRole("button", { name: "Next", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Next", exact: true }).click();
  const learningStep = page.getByTestId("languages-learning");
  await expect(learningStep).toBeVisible();
  await expect(page.getByTestId("language-flag-fr")).toBeVisible();
  await expect(page.getByTestId("language-option-fr")).toHaveCSS(
    "border-width",
    "2px",
  );
  await expect(
    page.getByRole("button", { name: "Next", exact: true }),
  ).toHaveCount(0);
  await page.getByTestId("language-option-fr").click();
  await expect(page.getByTestId("language-option-fr")).toHaveCSS(
    "border-width",
    "3px",
  );
  await expect(
    page.getByRole("button", { name: "Next", exact: true }),
  ).toBeVisible();
  await page.screenshot({ path: "qa/screens/languagesLearning.png" });

  await page.getByLabel("Back", { exact: true }).click();
  await expect(nativeStep).toBeVisible();
  await expect(page.getByTestId("language-option-en-GB")).toHaveCSS(
    "border-width",
    "3px",
  );
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(learningStep).toBeVisible();
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(page.getByText("Good Afternoon", { exact: true })).toBeVisible();
  await page.waitForFunction(() => {
    const state = JSON.parse(
      localStorage.getItem("@capwords/state") || "{}",
    ).state;
    return (
      state?.onboarded === true &&
      state.nativeLanguage === "en-GB" &&
      state.learningLanguage === "fr"
    );
  });
  const saved = await page.evaluate(
    () => JSON.parse(localStorage.getItem("@capwords/state") || "{}").state,
  );
  expect(saved.nativeLanguage).toBe("en-GB");
  expect(saved.learningLanguage).toBe("fr");
});
test("source 080 captures the selected native-language onboarding state", async ({
  page,
}) => {
  fs.mkdirSync("qa/screens", { recursive: true });
  await page.goto("/?screen=languages&fixture=1&languageSource=080");
  await ready(page);

  const nativeStep = page.getByTestId("languages-native");
  const englishOption = page.getByTestId("language-option-en");
  await expect(nativeStep).toBeVisible();
  await expect(page.getByText(/Choose Your\s+Native Language/)).toBeVisible();
  await expect(englishOption).toHaveAttribute("aria-checked", "true");
  await expect(englishOption).toHaveCSS("border-width", "3px");
  await expect(page.getByTestId("language-option-zh")).toBeVisible();
  await expect(page.getByTestId("language-option-en-GB")).toBeVisible();
  await expect(page.getByTestId("language-option-es")).toBeVisible();
  await expect(page.getByTestId("language-option-ja")).toBeVisible();
  await expect(page.getByTestId("language-option-ko")).toBeVisible();
  await expect(page.getByLabel("Back", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Next", exact: true }),
  ).toBeVisible();

  const saved = await page.evaluate(
    () => JSON.parse(localStorage.getItem("@capwords/state") || "{}").state,
  );
  expect(saved.nativeLanguage).toBe("en");
  await page.screenshot({
    path: "qa/screens/languageNativeSelected080.png",
    animations: "disabled",
  });
});

test("fixture capture → confirm → result → library saves a fifth word", async ({
  page,
}) => {
  fs.mkdirSync("qa/screens", { recursive: true });
  await page.goto("/?screen=camera&fixture=1");
  await ready(page);
  await expect(page.getByText("Long press to recognize video")).toBeVisible();
  await expect(page.getByTestId("capture-shutter-artwork")).toBeVisible();
  await expect(page.getByLabel("Choose image", { exact: true })).toBeVisible();
  await page.screenshot({
    path: "qa/screens/camera.png",
    animations: "disabled",
  });
  await page.getByLabel("Capture photo", { exact: true }).click();
  await page.getByLabel("Confirm object", { exact: true }).click();
  await page.getByLabel("Save sticker", { exact: true }).click();
  await expect(page.getByText("5 Words", { exact: true })).toBeVisible();
});

test("profile Need help opens the captured Spoken Content tutorial states", async ({
  page,
}) => {
  fs.mkdirSync("qa/screens", { recursive: true });
  await page.goto("/?screen=profile&fixture=1&profileState=spokenContentStep1");
  await ready(page);
  const step1 = page.getByTestId("spoken-content-tutorial-step-1");
  await expect(step1).toBeVisible();
  await expect(page.getByText("Open Settings", { exact: true })).toBeVisible();
  const illustrationBounds = await step1.locator("img").boundingBox();
  expect(illustrationBounds).not.toBeNull();
  expect(illustrationBounds!.width).toBeGreaterThan(280);
  expect(
    Math.abs(
      illustrationBounds!.height - illustrationBounds!.width / (868 / 1195),
    ),
  ).toBeLessThan(1);
  const stepLabelBounds = await page
    .getByText("Step 1", { exact: true })
    .boundingBox();
  expect(stepLabelBounds).not.toBeNull();
  expect(stepLabelBounds!.y).toBeGreaterThan(
    illustrationBounds!.y + illustrationBounds!.height,
  );
  await page.screenshot({ path: "qa/screens/spokenContentStep1.png" });

  await page.getByRole("button", { name: "Next", exact: true }).click();
  const step3 = page.getByTestId("spoken-content-tutorial-step-3");
  await expect(step3).toBeVisible();
  await expect(
    page.getByText("Select Spoken Content", { exact: true }),
  ).toBeVisible();
  await page.screenshot({ path: "qa/screens/spokenContentStep3.png" });

  await page
    .getByRole("button", { name: "Back to Step 1", exact: true })
    .click();
  await expect(step1).toBeVisible();
  await page.getByRole("button", { name: "Back to voice selection" }).click();
  const help = page.getByRole("button", { name: "Need help?", exact: true });
  await expect(help).toBeVisible();
  await help.click();
  await expect(step1).toBeVisible();
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(step3).toBeVisible();
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(step3).toHaveCount(0);
  await expect(page.getByText("Settings", { exact: true })).toBeVisible();
});

test("a failed library metadata write leaves Result retryable and unsaved", async ({
  page,
}) => {
  await page.goto("/?screen=result&fixture=1");
  await ready(page);
  await page.evaluate(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key === "@capwords/state") throw new Error("simulated storage full");
      return original.call(this, key, value);
    };
  });

  await page.getByLabel("Save sticker", { exact: true }).click();
  await expect(
    page.getByText("Could not save photo", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText(
      "The word could not be saved to the library. Check available storage and try again.",
      { exact: true },
    ),
  ).toBeVisible();
  await expect(page.getByLabel("Save sticker", { exact: true })).toBeEnabled();
  const wordCount = await page.evaluate(() => {
    const saved = JSON.parse(localStorage.getItem("@capwords/state")!);
    return saved.state.words.length;
  });
  expect(wordCount).toBe(4);
});

test("source 092 renders Tournesol encouragement from the existing due-word queue", async ({
  page,
}) => {
  await page.goto("/?screen=review&fixture=1&reviewSource=092");
  await ready(page);

  await expect(page.getByTestId("review-progress")).toContainText("2 / 4");
  await expect(page.getByTestId("review-feedback-card")).toBeVisible();
  await expect(page.getByText("Tournesol", { exact: true })).toBeVisible();
  await expect(
    page.getByText("You've got this!", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText(
      "Take your time, this word will stay in your practice list",
      { exact: true },
    ),
  ).toBeVisible();
  await expect(page.getByTestId("review-feedback-skip")).toBeDisabled();
  const wordCount = await page.evaluate(() => {
    const saved = JSON.parse(localStorage.getItem("@capwords/state")!);
    return saved.state.words.length;
  });
  expect(wordCount).toBe(4);
  await page.screenshot({ path: "qa/screens/reviewEncouragement092.png" });
});

test("source 058 renders its captured Needs review state on the due ice-cream card", async ({
  page,
}) => {
  fs.mkdirSync("qa/screens", { recursive: true });
  await page.goto("/?screen=review&fixture=1&reviewSource=058");
  await ready(page);

  const progress = page.getByTestId("review-progress");
  await expect(progress).toHaveAttribute("aria-valuenow", "0");
  await expect(progress).toHaveAttribute("aria-valuemax", "5");
  const card = page.getByTestId("review-card");
  await expect(card).toHaveAttribute(
    "aria-label",
    "Review needs-review card: Un cornet de glace",
  );
  await expect(page.getByTestId("review-gesture-cue")).toContainText(
    "Needs review",
  );
  await expect(page.getByTestId("review-gesture-pointer")).toBeVisible();
  await expect(
    page.getByText("un cornet de glace", { exact: true }),
  ).toBeVisible();
  await expect(page.getByTestId("review-practice")).toBeVisible();

  const wordCount = await page.evaluate(() => {
    const saved = JSON.parse(localStorage.getItem("@capwords/state")!);
    return saved.state.words.length;
  });
  expect(wordCount).toBe(4);
  await page.screenshot({
    path: "qa/screens/reviewNeedsReview058.png",
    animations: "disabled",
    caret: "hide",
  });
});

test("source 068 renders the static Tap for details card from the existing due queue", async ({
  page,
}) => {
  fs.mkdirSync("qa/screens", { recursive: true });
  await page.goto("/?screen=review&fixture=1&reviewSource=068");
  await ready(page);

  const progress = page.getByTestId("review-progress");
  await expect(progress).toHaveAttribute("aria-valuenow", "0");
  await expect(progress).toHaveAttribute("aria-valuemax", "5");
  const card = page.getByTestId("review-card");
  await expect(card).toHaveAttribute(
    "aria-label",
    "Review tap-details card: Un cornet de glace",
  );
  await expect(page.getByTestId("review-tap-details-cue")).toContainText(
    "Tap for details",
  );
  await expect(page.getByTestId("review-gesture-pointer")).toBeVisible();
  await expect(
    page.getByText("un cornet de glace", { exact: true }),
  ).toBeVisible();
  await expect(page.getByTestId("review-practice")).toBeVisible();

  const wordCount = await page.evaluate(() => {
    const saved = JSON.parse(localStorage.getItem("@capwords/state")!);
    return saved.state.words.length;
  });
  expect(wordCount).toBe(4);
  await page.screenshot({
    path: "qa/screens/reviewTapDetails068.png",
    animations: "disabled",
    caret: "hide",
  });
});

test("source 081 renders the ice-cream speaking card from the real due queue", async ({
  page,
}) => {
  fs.mkdirSync("qa/screens", { recursive: true });
  await page.goto("/?screen=review&fixture=1&reviewSource=081");
  await ready(page);

  const progress = page.getByRole("progressbar", {
    name: "Review progress",
    exact: true,
  });
  await expect(progress).toHaveAttribute("aria-valuenow", "0");
  await expect(progress).toHaveAttribute("aria-valuemax", "4");
  const card = page.getByTestId("review-card");
  await expect(card).toHaveAttribute(
    "aria-label",
    "Review card: Un cornet de glace",
  );
  await expect(
    page.getByText("Cornet de glace", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("/kɔʁ.nɛ də ɡlas/", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Say the word out loud", { exact: true }),
  ).toBeVisible();
  await expect(page.getByTestId("review-microphone-artwork")).toBeVisible();
  await expect(page.getByTestId("review-practice")).toBeVisible();
  await expect(card).toHaveCSS("background-color", "rgb(223, 228, 231)");

  const bounds = await card.boundingBox();
  expect(bounds).not.toBeNull();
  expect(Math.abs(bounds!.x - 41.5)).toBeLessThan(1);
  expect(Math.abs(bounds!.y - 207)).toBeLessThan(1);
  expect(Math.abs(bounds!.width - 310)).toBeLessThan(1);
  expect(Math.abs(bounds!.height - 437)).toBeLessThan(1);

  const savedWords = await page.evaluate(() => {
    const saved = JSON.parse(localStorage.getItem("@capwords/state")!);
    return saved.state.words.map((word: { target: string }) => word.target);
  });
  expect(savedWords).toHaveLength(4);
  expect(savedWords).toContain("Un cornet de glace");
  await page.screenshot({
    path: "qa/screens/reviewPractice081.png",
    animations: "disabled",
    caret: "hide",
  });
});

test("source 087 renders the first Tournesol practice card from the due queue", async ({
  page,
}) => {
  await page.goto("/?screen=review&fixture=1&reviewSource=087");
  await ready(page);

  const progress = page.getByRole("progressbar", {
    name: "Review progress",
    exact: true,
  });
  await expect(progress).toHaveAttribute("aria-valuenow", "1");
  await expect(progress).toHaveAttribute("aria-valuemax", "4");
  const card = page.getByTestId("review-card");
  await expect(card).toHaveAttribute("aria-label", "Review card: Tournesol");
  await expect(page.getByText("Tournesol", { exact: true })).toBeVisible();
  await expect(page.getByText("/tuʁ.nə.sɔl/", { exact: true })).toBeVisible();
  await expect(
    page.getByText("Hold to speak → master the word!", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Play pronunciation", exact: true }),
  ).toBeVisible();
  await expect(page.getByTestId("review-practice")).toBeVisible();
  await expect(card).toHaveCSS("background-color", "rgb(213, 131, 61)");

  const bounds = await card.boundingBox();
  expect(bounds).not.toBeNull();
  expect(Math.abs(bounds!.x - 49)).toBeLessThan(1);
  expect(Math.abs(bounds!.y - 218)).toBeLessThan(1);
  expect(Math.abs(bounds!.width - 295)).toBeLessThan(1);
  expect(Math.abs(bounds!.height - 416)).toBeLessThan(1);

  const wordCount = await page.evaluate(() => {
    const saved = JSON.parse(localStorage.getItem("@capwords/state")!);
    return saved.state.words.length;
  });
  expect(wordCount).toBe(4);
  await page.screenshot({
    path: "qa/screens/reviewPractice087.png",
    animations: "disabled",
    caret: "hide",
  });
});

test("source 089 renders Tournesol retry feedback from the real due queue", async ({
  page,
}) => {
  await page.goto("/?screen=review&fixture=1&reviewSource=089");
  await ready(page);

  const progress = page.getByRole("progressbar", {
    name: "Review progress",
    exact: true,
  });
  await expect(progress).toHaveAttribute("aria-valuenow", "2");
  await expect(progress).toHaveAttribute("aria-valuemax", "4");
  const card = page.getByTestId("review-card");
  await expect(card).toHaveAttribute(
    "aria-label",
    "Review retry feedback card: Tournesol",
  );
  await expect(page.getByText("Tournesol", { exact: true })).toBeVisible();
  const feedback = page.getByTestId("review-retry-feedback");
  await expect(feedback).toBeVisible();
  await expect(
    feedback.getByText("You're putting in effort,let's try again!", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(feedback.getByText("Tap", { exact: true })).toBeVisible();
  await expect(
    feedback.getByText("to hear the ideal speed", { exact: true }),
  ).toBeVisible();
  await expect(page.getByTestId("review-retry-feedback-audio")).toBeVisible();
  await expect(page.getByText("/tuʁ.nə.sɔl/", { exact: true })).toBeVisible();
  await expect(
    page.getByText("Hold to speak → master the word!", { exact: true }),
  ).toBeVisible();
  await expect(page.getByTestId("review-practice")).toBeVisible();
  await expect(card).toHaveCSS("background-color", "rgb(209, 130, 58)");

  const bounds = await card.boundingBox();
  expect(bounds).not.toBeNull();
  expect(Math.abs(bounds!.x - 49)).toBeLessThan(1);
  expect(Math.abs(bounds!.y - 170)).toBeLessThan(1);
  expect(Math.abs(bounds!.width - 295)).toBeLessThan(1);
  expect(Math.abs(bounds!.height - 513)).toBeLessThan(1);

  const wordCount = await page.evaluate(() => {
    const saved = JSON.parse(localStorage.getItem("@capwords/state")!);
    return saved.state.words.length;
  });
  expect(wordCount).toBe(4);
  await page.screenshot({
    path: "qa/screens/reviewRetry089.png",
    animations: "disabled",
    caret: "hide",
  });
});

test("source 094 renders its Tournesol snapshot from the real due-word queue", async ({
  page,
}) => {
  await page.goto("/?screen=review&fixture=1&reviewSource=094");
  await ready(page);

  await expect(page.getByTestId("review-progress")).toContainText("2 / 4");
  await expect(page.getByTestId("review-progress")).toHaveAttribute(
    "aria-valuenow",
    "2",
  );
  await expect(page.getByTestId("review-snapshot-card")).toBeVisible();
  await expect(page.getByText("Tournesol", { exact: true })).toBeVisible();
  await expect(page.getByText("/tuʁ.nə.sɔl/", { exact: true })).toBeVisible();
  await expect(page.getByTestId("review-snapshot-skip")).toBeDisabled();
  await page.screenshot({ path: "qa/screens/reviewSnapshot094.png" });
});

test("source 096 shows Tournesol leaving as the queued Une Femme card enters", async ({
  page,
}) => {
  fs.mkdirSync("qa/screens", { recursive: true });
  await page.goto("/?screen=review&fixture=1&reviewSource=096");
  await ready(page);

  const progress = page.getByTestId("review-progress");
  await expect(progress).toContainText("2 / 4");
  await expect(progress).toHaveAttribute("aria-valuenow", "2");
  const currentCard = page.getByTestId("review-card");
  const nextCard = page.getByTestId("review-transition-next-card");
  await expect(currentCard).toBeVisible();
  await expect(currentCard).toHaveAttribute(
    "aria-label",
    "Review transition card: Tournesol",
  );
  await expect(currentCard).toContainText("tournesol");
  await expect(nextCard).toHaveAttribute(
    "aria-label",
    "Next review card: Une Femme",
  );
  const transitionPortraitFrame = page.getByTestId("review-portrait-frame");
  await expect(transitionPortraitFrame).toBeVisible();
  await expect(transitionPortraitFrame.locator("img")).toBeVisible();
  await expect(nextCard).toContainText("une femme");
  await expect(page.getByTestId("review-gesture-cue")).toHaveCount(0);
  await expect(page.getByTestId("review-gesture-pointer")).toHaveCount(0);
  await expect(
    page.getByText("Hold to speak → master the word!", { exact: true }),
  ).toBeVisible();

  const wordCount = await page.evaluate(() => {
    const saved = JSON.parse(localStorage.getItem("@capwords/state")!);
    return saved.state.words.length;
  });
  expect(wordCount).toBe(4);
  await page.screenshot({
    path: "qa/screens/reviewTransition096.png",
    animations: "disabled",
    caret: "hide",
  });
});

test("source 098 renders the real Une Femme practice card at captured 3/4 progress", async ({
  page,
}) => {
  await page.goto("/?screen=review&fixture=1&reviewSource=098");
  await ready(page);

  const progress = page.getByRole("progressbar", {
    name: "Review progress",
    exact: true,
  });
  await expect(progress).toHaveAttribute("aria-valuenow", "3");
  await expect(progress).toHaveAttribute("aria-valuemax", "4");
  const card = page.getByTestId("review-card");
  await expect(card).toHaveAttribute("aria-label", "Review card: Une Femme");
  await expect(page.getByText("Une femme", { exact: true })).toBeVisible();
  await expect(page.getByText("/yn fam/", { exact: true })).toBeVisible();
  await expect(
    page.getByText("Hold to speak → master the word!", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Play pronunciation", exact: true }),
  ).toBeVisible();
  await expect(page.getByTestId("review-practice")).toBeVisible();

  const cardBounds = await card.boundingBox();
  const portraitBounds = await page
    .getByTestId("review-card-illustration")
    .boundingBox();
  const portraitFrame = page.getByTestId("review-portrait-frame");
  await expect(portraitFrame).toBeVisible();
  const photoBounds = await portraitFrame.locator("img").boundingBox();
  const microphoneBounds = await page
    .getByTestId("review-practice")
    .boundingBox();
  expect(cardBounds).not.toBeNull();
  expect(portraitBounds).not.toBeNull();
  expect(microphoneBounds).not.toBeNull();
  expect(Math.abs(cardBounds!.x - 42)).toBeLessThan(1);
  expect(Math.abs(cardBounds!.y - 207)).toBeLessThan(1);
  expect(Math.abs(cardBounds!.width - 309)).toBeLessThan(1);
  expect(Math.abs(cardBounds!.height - 437)).toBeLessThan(1);
  expect(Math.abs(portraitBounds!.x - 104)).toBeLessThan(1);
  expect(Math.abs(portraitBounds!.y - 273)).toBeLessThan(1);
  expect(Math.abs(portraitBounds!.width - 186)).toBeLessThan(1);
  expect(Math.abs(portraitBounds!.height - 186)).toBeLessThan(1);
  expect(photoBounds).not.toBeNull();
  expect(Math.abs(photoBounds!.x - 119)).toBeLessThan(1);
  expect(Math.abs(photoBounds!.y - 288)).toBeLessThan(1);
  expect(Math.abs(photoBounds!.width - 156)).toBeLessThan(1);
  expect(Math.abs(photoBounds!.height - 133)).toBeLessThan(1);
  expect(Math.abs(microphoneBounds!.x - 154.5)).toBeLessThan(1);
  expect(microphoneBounds!.width).toBe(84);

  const wordCount = await page.evaluate(() => {
    const saved = JSON.parse(localStorage.getItem("@capwords/state")!);
    return saved.state.words.length;
  });
  expect(wordCount).toBe(4);
  await page.screenshot({
    path: "qa/screens/reviewPractice098.png",
    animations: "disabled",
    caret: "hide",
  });
});

test("review records all four ratings and survives a non-fixture reload", async ({
  page,
}) => {
  await page.goto("/?screen=review&fixture=1");
  await ready(page);
  for (let i = 0; i < 4; i++) {
    await page
      .getByLabel("Hold to record your pronunciation attempt", { exact: true })
      .click();
    await page.getByText("Got it!", { exact: true }).click();
    await page.waitForTimeout(400);
  }
  await expect(
    page.getByRole("button", { name: "Finish", exact: true }),
  ).toBeVisible();
  await expect(page.getByTestId("review-completion-progress")).toContainText(
    "100%",
  );
  await expect(
    page
      .getByTestId("review-completion-group-good")
      .getByTestId("review-completion-word-card"),
  ).toHaveCount(4);
  await expect(
    page
      .getByTestId("review-completion-group-again")
      .getByTestId("review-completion-word-card"),
  ).toHaveCount(0);
  await expect
    .poll(() =>
      page.evaluate(() => {
        const saved = JSON.parse(localStorage.getItem("@capwords/state")!);
        return saved.state.lastReview?.total;
      }),
    )
    .toBe(4);
  await page.goto("/?screen=reviewResult");
  await ready(page);
  await expect(page.getByTestId("review-celebration-burst")).toBeVisible();
  await expect(page.getByText("4 words", { exact: true })).toBeVisible();
  await expect(page.getByText("Got it! 4", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Back to Home", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Back to Home", exact: true }).click();
  await expect(page.getByText("Good Afternoon", { exact: true })).toBeVisible();
  await page.goto("/?screen=home");
  await ready(page);
  await expect(
    page.getByText("Awesome! You've snapped 4 words!"),
  ).toBeVisible();
  const values = await page.evaluate(() => Object.values(localStorage));
  expect(
    values.some((v) => v.includes("repetitions") && v.includes("reviewDates")),
  ).toBeTruthy();
});

test("review cards accept right and left swipe ratings", async ({ page }) => {
  await page.goto("/?screen=review&fixture=1");
  await ready(page);

  await swipeReviewCard(page, 160);
  await expect(page.getByTestId("review-progress")).toHaveAttribute(
    "aria-valuenow",
    "1",
  );
  await swipeReviewCard(page, -160);
  await expect(page.getByTestId("review-progress")).toHaveAttribute(
    "aria-valuenow",
    "2",
  );
});

test("review completion offers another session only while words remain due", async ({
  page,
}) => {
  await page.goto("/?screen=review&fixture=1");
  await ready(page);
  for (let i = 0; i < 4; i++) {
    await page
      .getByLabel("Hold to record your pronunciation attempt", { exact: true })
      .click();
    await page
      .getByText(i === 0 ? "Needs review" : "Got it!", { exact: true })
      .click();
    await page.waitForTimeout(400);
  }
  await page.goto("/?screen=reviewResult");
  await ready(page);
  const reviewAgain = page.getByRole("button", {
    name: "Review Again",
    exact: true,
  });
  await expect(reviewAgain).toBeVisible();
  await reviewAgain.click();
  await expect(
    page.getByLabel("Hold to record your pronunciation attempt", {
      exact: true,
    }),
  ).toBeVisible();
});

test("streak calendar selects a day and clears it when navigating months", async ({
  page,
}) => {
  await page.goto("/?screen=streak&fixture=1");
  await ready(page);
  await expect(
    page.getByText("September 12, 2025", { exact: true }),
  ).toBeVisible();

  await page.getByLabel("Calendar day 11", { exact: true }).click();
  await expect(
    page.getByText("September 11, 2025", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByLabel("Calendar day 11, selected", { exact: true }),
  ).toBeVisible();

  await page.getByLabel("Previous month", { exact: true }).click();
  await expect(
    page.getByText("August 12, 2025", { exact: true }),
  ).toBeVisible();
  await page.getByLabel("Next month", { exact: true }).click();
  await expect(
    page.getByText("September 12, 2025", { exact: true }),
  ).toBeVisible();
});

test("review session contains only due words and handles an empty queue", async ({
  page,
}) => {
  await page.goto("/?screen=home&fixture=1");
  await ready(page);
  const dueTarget = await page.evaluate(() => {
    const key = "@capwords/state";
    const raw = localStorage.getItem(key);
    if (!raw) throw new Error("The review fixture was not persisted.");
    const saved = JSON.parse(raw) as {
      state: {
        dailyGoal: number;
        words: { target: string; review: { dueAt: string } }[];
      };
    };
    saved.state.dailyGoal = 5;
    saved.state.words.forEach((word, index) => {
      word.review.dueAt = new Date(
        Date.now() + (index === 0 ? -86_400_000 : 86_400_000),
      ).toISOString();
    });
    localStorage.setItem(key, JSON.stringify(saved));
    return saved.state.words[0]!.target.toLowerCase();
  });

  await page.goto("/?screen=review");
  await ready(page);
  await expect(page.getByTestId("review-progress")).toHaveAttribute(
    "aria-valuemax",
    "1",
  );
  await expect(page.getByText(dueTarget, { exact: true })).toBeVisible();

  await page.evaluate(() => {
    const key = "@capwords/state";
    const saved = JSON.parse(localStorage.getItem(key)!) as {
      state: { words: { review: { dueAt: string } }[] };
    };
    saved.state.words.forEach((word) => {
      word.review.dueAt = "2999-01-01T00:00:00.000Z";
    });
    localStorage.setItem(key, JSON.stringify(saved));
  });
  await page.goto("/?screen=review");
  await ready(page);
  await expect(
    page.getByText("You're all caught up", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Back to Home", exact: true }).click();
  await expect(
    page.getByText("Awesome! You've snapped 4 words!", { exact: true }),
  ).toBeVisible();
});

test("legacy and invalid review summaries do not reset the saved library", async ({
  page,
}) => {
  await page.goto("/?screen=home&fixture=1");
  await ready(page);
  const originalIds = await page.evaluate(() => {
    const saved = JSON.parse(localStorage.getItem("@capwords/state")!);
    return saved.state.words.map((word: { id: string }) => word.id);
  });

  await page.evaluate(() => {
    const key = "@capwords/state";
    const saved = JSON.parse(localStorage.getItem(key)!);
    delete saved.state.lastReview;
    localStorage.setItem(key, JSON.stringify(saved));
  });
  await page.goto("/?screen=home");
  await ready(page);
  const migrated = await page.evaluate(() => {
    const saved = JSON.parse(localStorage.getItem("@capwords/state")!);
    return {
      ids: saved.state.words.map((word: { id: string }) => word.id),
      lastReview: saved.state.lastReview,
    };
  });
  expect(migrated.ids).toEqual(originalIds);
  expect(migrated.lastReview).toBeNull();

  await page.evaluate(() => {
    const key = "@capwords/state";
    const saved = JSON.parse(localStorage.getItem(key)!);
    saved.state.lastReview = { good: "bad" };
    localStorage.setItem(key, JSON.stringify(saved));
  });
  await page.goto("/?screen=home");
  await ready(page);
  const recovered = await page.evaluate(() => {
    const saved = JSON.parse(localStorage.getItem("@capwords/state")!);
    return {
      ids: saved.state.words.map((word: { id: string }) => word.id),
      lastReview: saved.state.lastReview,
    };
  });
  expect(recovered.ids).toEqual(originalIds);
  expect(recovered.lastReview).toBeNull();
});

test("crop editor applies a ratio and real image transformation", async ({
  page,
}) => {
  await page.goto("/?screen=confirm&fixture=1");
  await ready(page);
  await page.getByLabel("Crop and rotate", { exact: true }).click();
  await page.getByLabel("Select image ratio", { exact: true }).click();
  await page.getByRole("button", { name: "16:9", exact: true }).click();
  const expectedAspectRatio = 16 / 9;
  const frame = page.getByTestId("crop-editor-frame");
  const frameBounds = await frame.boundingBox();
  expect(frameBounds).not.toBeNull();
  expect(frameBounds!.width / frameBounds!.height).toBeCloseTo(
    expectedAspectRatio,
    2,
  );
  await page.getByLabel("Zoom in", { exact: true }).click();
  await page.getByText("✓ Confirm selection", { exact: true }).click();
  await expect(
    page.getByLabel("Confirm object", { exact: true }),
  ).toBeVisible();
  const outputImageRatio = () =>
    page.locator("img").evaluateAll((elements) => {
      const image = (elements as HTMLImageElement[])
        .filter((candidate) => candidate.naturalWidth > 100)
        .sort(
          (left, right) =>
            right.naturalWidth * right.naturalHeight -
            left.naturalWidth * left.naturalHeight,
        )[0];
      return image ? image.naturalWidth / image.naturalHeight : 0;
    });
  await expect.poll(outputImageRatio).toBeCloseTo(expectedAspectRatio, 2);
});
test("profile nickname editor persists a changed name", async ({ page }) => {
  await page.goto("/?screen=profile&fixture=1");
  await ready(page);
  await page.getByLabel("Edit nickname", { exact: true }).click();
  await page.getByLabel("Nickname", { exact: true }).fill("QA Learner");
  await page.getByText("Save", { exact: true }).click();
  await expect(page.getByText("QA Learner", { exact: true })).toBeVisible();
});

test("profile nickname drafts cancel cleanly and require a trimmed change", async ({
  page,
}) => {
  await page.goto("/?screen=profile&fixture=1");
  await ready(page);
  await page.getByLabel("Edit nickname", { exact: true }).click();
  const input = page.getByLabel("Nickname", { exact: true });
  const save = page.getByRole("button", { name: "Save", exact: true });
  await expect(save).toBeDisabled();
  await input.fill("   ");
  await expect(save).toBeDisabled();
  await input.fill("Cancelled draft");
  await page.getByText("Cancel", { exact: true }).click();

  await page.getByLabel("Edit nickname", { exact: true }).click();
  await expect(input).toHaveValue("");
  await expect(save).toBeDisabled();
  await input.fill("  Learner  ");
  await expect(save).toBeEnabled();
  await save.click();
  await expect(page.getByText("Learner", { exact: true })).toBeVisible();
  const savedName = await page.evaluate(() => {
    const saved = JSON.parse(localStorage.getItem("@capwords/state")!);
    return saved.state.profileName;
  });
  expect(savedName).toBe("Learner");
});

test("source 045 opens the platform photo picker and applies the selected avatar", async ({
  page,
}) => {
  await page.goto("/?screen=profile&fixture=1");
  await ready(page);
  const choosePhoto = page.getByLabel("Choose profile photo", {
    exact: true,
  });
  const portrait = choosePhoto.locator("img");
  const originalSource = await portrait.getAttribute("src");
  const chooser = page.waitForEvent("filechooser");
  await choosePhoto.click();
  await (await chooser).setFiles("assets/study-portrait.jpg");
  await expect
    .poll(() => portrait.getAttribute("src"))
    .not.toBe(originalSource);
  await expect(page.getByLabel("Edit nickname", { exact: true })).toBeVisible();
});

test("profile language loading and success states match sources 062 and 071", async ({
  page,
}) => {
  fs.mkdirSync("qa/screens", { recursive: true });

  await page.goto("/?screen=profile&fixture=1&profileState=languageLoading062");
  await ready(page);
  await expect(page.getByText("Sam", { exact: true })).toBeVisible();
  await expect(
    page.getByText("Changing learning language...", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Off", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("switch", { name: "Review reminders" }),
  ).toHaveAttribute("aria-checked", "true");
  await page.screenshot({
    path: "qa/screens/languageSwitchLoading062.png",
    animations: "disabled",
  });

  await page.goto("/?screen=profile&fixture=1&profileState=languageSuccess071");
  await ready(page);
  await expect(
    page.getByText("Language Switch Successful!", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Start learning in your new language and keep exploring!", {
      exact: true,
    }),
  ).toBeVisible();
  await page.screenshot({
    path: "qa/screens/languageSwitchSuccess071.png",
    animations: "disabled",
  });
  await page.getByRole("button", { name: "OK", exact: true }).click();
  await expect(
    page.getByLabel("Choose learning language", { exact: true }),
  ).toBeVisible();
});

test("source 046 stages a learning-language choice until Done and keeps saved words", async ({
  page,
}) => {
  fs.mkdirSync("qa/screens", { recursive: true });
  await page.goto("/?screen=profile&fixture=1");
  await ready(page);

  const stateBefore = await page.evaluate(
    () => JSON.parse(localStorage.getItem("@capwords/state") || "{}").state,
  );
  const languageButton = page.getByLabel("Choose learning language", {
    exact: true,
  });
  await languageButton.click();

  await expect(
    page.getByText(/Change the language\s+you want to learn/),
  ).toBeVisible();
  await expect(
    page.getByText(
      /After switching languages,\s+your previous\s+learning data will remain/,
    ),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Change native language", exact: true }),
  ).toBeVisible();

  const chinese = page.getByRole("radio", { name: "Chinese", exact: true });
  await chinese.click();
  await expect(chinese).toHaveAttribute("aria-checked", "true");
  await expect(page.getByTestId("language-flag-zh")).toBeVisible();
  const stagedState = await page.evaluate(
    () => JSON.parse(localStorage.getItem("@capwords/state") || "{}").state,
  );
  expect(stagedState.learningLanguage).toBe(stateBefore.learningLanguage);
  await page.screenshot({
    path: "qa/screens/profileLanguageSheet046.png",
    animations: "disabled",
  });

  await page.getByLabel("Close language selection", { exact: true }).click();
  await expect(
    page.getByText(/Change the language\s+you want to learn/),
  ).toBeHidden();
  const cancelledState = await page.evaluate(
    () => JSON.parse(localStorage.getItem("@capwords/state") || "{}").state,
  );
  expect(cancelledState.learningLanguage).toBe(stateBefore.learningLanguage);

  await languageButton.click();
  await page.getByRole("radio", { name: "Chinese", exact: true }).click();
  await page.getByRole("button", { name: "Done", exact: true }).click();
  await expect(
    page.getByText("Language Switch Successful!", { exact: true }),
  ).toBeVisible();
  const savedState = await page.evaluate(
    () => JSON.parse(localStorage.getItem("@capwords/state") || "{}").state,
  );
  expect(savedState.learningLanguage).toBe("zh");
  expect(savedState.words).toEqual(stateBefore.words);
});

test("daily reminder source 063 uses independent preferences and persists wheel selection", async ({
  page,
}) => {
  fs.mkdirSync("qa/screens", { recursive: true });
  await page.goto("/?screen=profile&fixture=1&profileState=reminderTime063");
  await ready(page);
  await expect(
    page.getByText("Daily Reminder", { exact: true }).last(),
  ).toBeVisible();
  await expect(
    page.getByText("When should we remind you to snap something new?", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("switch", { name: "Daily reminder" }),
  ).toHaveAttribute("aria-checked", "true");
  await expect(
    page.getByRole("button", { name: "Reminder hour 09", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Reminder minute 00", exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: "qa/screens/dailyReminder063.png",
    animations: "disabled",
  });

  await page
    .getByRole("button", { name: "Reminder hour 10", exact: true })
    .click();
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          JSON.parse(localStorage.getItem("@capwords/state") || "{}").state
            ?.dailyReminderTime,
      ),
    )
    .toBe("10:00");
});

test("daily reminder source 047 renders 08:00 and persists wheel changes", async ({
  page,
}) => {
  fs.mkdirSync("qa/screens", { recursive: true });
  await page.goto("/?screen=profile&fixture=1&profileState=reminderTime047");
  await ready(page);
  await expect(
    page.getByText("Daily Reminder", { exact: true }).last(),
  ).toBeVisible();
  await expect(
    page.getByRole("switch", { name: "Daily reminder" }),
  ).toHaveAttribute("aria-checked", "true");
  await expect(
    page.getByRole("button", { name: "Reminder hour 08", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Reminder minute 00", exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: "qa/screens/dailyReminder047.png",
    animations: "disabled",
  });

  await page
    .getByRole("button", { name: "Reminder hour 09", exact: true })
    .click();
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          JSON.parse(localStorage.getItem("@capwords/state") || "{}").state
            ?.dailyReminderTime,
      ),
    )
    .toBe("09:00");
});

test("daily reminder source 026 keeps the disabled 08:00 state", async ({
  page,
}) => {
  fs.mkdirSync("qa/screens", { recursive: true });
  await page.goto(
    "/?screen=profile&fixture=1&profileState=reminderDisabled026",
  );
  await ready(page);

  const reminderSwitch = page.getByRole("switch", {
    name: "Daily reminder",
  });
  await expect(
    page.getByText("Daily Reminder", { exact: true }).last(),
  ).toBeVisible();
  await expect(reminderSwitch).toHaveAttribute("aria-checked", "false");
  await expect(
    page.getByRole("button", { name: "Reminder hour 08", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Reminder minute 00", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Reminder hour 09", exact: true }),
  ).toBeDisabled();
  await page.screenshot({
    path: "qa/screens/dailyReminderDisabled026.png",
    animations: "disabled",
  });

  const reminderTime = () =>
    page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("@capwords/state") || "{}").state
          ?.dailyReminderTime,
    );
  await expect.poll(reminderTime).toBe("08:00");
  await reminderSwitch.click();
  await expect(reminderSwitch).toHaveAttribute("aria-checked", "true");
  await page
    .getByRole("button", { name: "Reminder hour 09", exact: true })
    .click();
  await expect.poll(reminderTime).toBe("09:00");
});

test("source 048 stages a Korean preferred voice and saves on Done", async ({
  page,
}) => {
  fs.mkdirSync("qa/screens", { recursive: true });
  await page.goto("/?screen=profile&fixture=1&profileState=voiceChooser048");
  await ready(page);

  await expect(
    page.getByText("Choose Your Preferred Voice", { exact: false }),
  ).toBeVisible();
  await expect(
    page.getByText(
      "Download high-quality voices in Settings, then come back to preview and switch here!",
      { exact: true },
    ),
  ).toBeVisible();
  await expect(page.getByText("Korean", { exact: true }).last()).toBeVisible();
  const montse = page.getByRole("radio", { name: "Montse" });
  const daria = page.getByRole("radio", { name: "Daria" });
  await expect(montse).toHaveAttribute("aria-checked", "true");
  await expect(
    page.getByRole("button", { name: "Preview Majed" }),
  ).toBeVisible();
  await expect(page.getByRole("radio", { name: "Zuzana" })).toBeDisabled();
  await page.screenshot({
    path: "qa/screens/profileVoiceChooser048.png",
    animations: "disabled",
  });

  await daria.click();
  await expect(daria).toHaveAttribute("aria-checked", "true");
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          JSON.parse(localStorage.getItem("@capwords/state") || "{}").state
            ?.preferredSpeechVoiceId,
      ),
    )
    .toBe("source048:montse");

  await page.getByRole("button", { name: "Done", exact: true }).click();
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          JSON.parse(localStorage.getItem("@capwords/state") || "{}").state
            ?.preferredSpeechVoiceId,
      ),
    )
    .toBe("source048:daria");
  await page.getByRole("button", { name: "Change Voice" }).click();
  await expect(page.getByRole("radio", { name: "Daria" })).toHaveAttribute(
    "aria-checked",
    "true",
  );
});

test("source 049 completes the Profile voice guide without claiming a download", async ({
  page,
}) => {
  fs.mkdirSync("qa/screens", { recursive: true });
  await page.goto("/?screen=profile&fixture=1&profileState=voiceDownload049");
  await ready(page);

  const completion = page.getByTestId("profile-voice-download-completion-049");
  await expect(completion).toBeVisible();
  await expect(page.getByText("Step 6", { exact: true })).toBeVisible();
  await expect(
    page.getByText("Choose & Download", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText(
      "After download, you can choose select the voice directly from the settings page",
      { exact: true },
    ),
  ).toBeVisible();
  const illustration = completion.locator("img");
  const illustrationBounds = await illustration.boundingBox();
  expect(illustrationBounds).not.toBeNull();
  expect(illustrationBounds!.width).toBeGreaterThan(250);
  expect(
    Math.abs(
      illustrationBounds!.height - illustrationBounds!.width / (842 / 1020),
    ),
  ).toBeLessThan(1);
  await expect(
    page.getByRole("button", { name: "Restart voice guide unavailable" }),
  ).toBeDisabled();
  await page.screenshot({
    path: "qa/screens/profileVoiceDownload049.png",
    animations: "disabled",
  });

  await page.getByRole("button", { name: "Back to voice selection" }).click();
  await expect(completion).toHaveCount(0);
  await expect(
    page.getByText("Choose Your Preferred Voice", { exact: false }),
  ).toBeVisible();

  await page.goto("/?screen=profile&fixture=1&profileState=voiceDownload049");
  await ready(page);
  await page.getByRole("button", { name: "Done", exact: true }).click();
  await expect(
    page.getByTestId("profile-voice-download-completion-049"),
  ).toHaveCount(0);
  await expect(page.getByText("Settings", { exact: true })).toBeVisible();
});

test("legacy single reminder setting migrates without discarding local data", async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      "@capwords/state",
      JSON.stringify({
        version: 1,
        state: {
          onboarded: true,
          nativeLanguage: "en",
          learningLanguage: "fr",
          profileName: "Legacy learner",
          dailyGoal: 10,
          reminders: false,
          sound: true,
          words: [],
          reviewDates: [],
          lastReview: null,
        },
      }),
    );
  });
  await page.goto("/?screen=profile");
  await ready(page);
  await expect(page.getByText("Off", { exact: true })).toBeVisible();
  const migrated = await page.evaluate(
    () => JSON.parse(localStorage.getItem("@capwords/state") || "{}").state,
  );
  expect(migrated.dailyReminderEnabled).toBe(false);
  expect(migrated.reviewRemindersEnabled).toBe(false);
  expect(migrated.dailyReminderTime).toBe("09:00");
  expect(migrated.preferredSpeechVoiceId).toBe(null);
});

test("learning-language choice commits before the success message appears", async ({
  page,
}) => {
  await page.goto("/?screen=profile&fixture=1");
  await ready(page);
  await page.getByLabel("Choose learning language", { exact: true }).click();
  await page.getByText("Korean", { exact: true }).click();
  await page.getByRole("button", { name: "Done", exact: true }).click();
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          JSON.parse(localStorage.getItem("@capwords/state") || "{}").state
            ?.learningLanguage,
      ),
    )
    .toBe("ko");
  await expect(
    page.getByText("Language Switch Successful!", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "OK", exact: true }).click();
  await expect(
    page.getByLabel("Choose learning language", { exact: true }),
  ).toContainText("Korean");
});

test("result name editor has measured source geometry and guards invalid drafts", async ({
  page,
}) => {
  await page.goto("/?screen=result&fixture=1");
  await ready(page);
  await page.getByText(/Not what you expected/).click();
  const editor = page.getByTestId("object-name-editor");
  const input = editor.getByLabel("Target object name", { exact: true });
  const save = editor.getByRole("button", { name: "Save", exact: true });
  await expect(input).toHaveValue("");
  await expect(input).toHaveAttribute("placeholder", "Une Femme");
  await expect(save).toBeDisabled();
  await expect(editor.getByLabel("Native language meaning")).toHaveCount(0);
  const box = await editor.boundingBox();
  expect(box).not.toBeNull();
  expect(Math.abs(box!.x - 59)).toBeLessThan(1);
  expect(Math.abs(box!.y - 243.33)).toBeLessThan(2);
  expect(Math.abs(box!.width - 275.33)).toBeLessThan(1);
  expect(Math.abs(box!.height - 265.33)).toBeLessThan(2);
  await page.screenshot({
    path: "qa/screens/resultEdit.png",
    animations: "disabled",
    caret: "hide",
  });
  await input.fill("   ");
  await expect(save).toBeDisabled();
  await input.fill(" Une Femme ");
  await expect(save).toBeDisabled();
  await input.fill("Tulipe");
  await expect(save).toBeEnabled();
  await page.screenshot({
    path: "qa/screens/resultEdit-enabled.png",
    animations: "disabled",
    caret: "hide",
  });
});

test("result name drafts are discarded on Cancel/backdrop and committed only by Save", async ({
  page,
}) => {
  await page.goto("/?screen=result&fixture=1");
  await ready(page);
  const open = () => page.getByText(/Not what you expected/).click();
  const editor = page.getByTestId("object-name-editor");
  await open();
  await editor
    .getByLabel("Target object name", { exact: true })
    .fill("Cancelled draft");
  await editor.getByRole("button", { name: "Cancel object name" }).click();
  await expect(page.getByText("Une Femme", { exact: true })).toBeVisible();
  await expect(page.getByText("Cancelled draft", { exact: true })).toHaveCount(
    0,
  );
  await open();
  await expect(
    editor.getByLabel("Target object name", { exact: true }),
  ).toHaveValue("");
  await editor
    .getByLabel("Target object name", { exact: true })
    .fill("Dismissed draft");
  await page
    .getByLabel("Dismiss dialog", { exact: true })
    .click({ position: { x: 10, y: 10 } });
  await expect(editor).toHaveCount(0);
  await expect(page.getByText("Une Femme", { exact: true })).toBeVisible();
  await open();
  await editor
    .getByLabel("Target object name", { exact: true })
    .fill("  Tulipe  ");
  await editor.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByText("Tulipe", { exact: true })).toBeVisible();
  await expect(page.getByText("A woman", { exact: true })).toBeVisible();
  await open();
  await expect(
    editor.getByLabel("Target object name", { exact: true }),
  ).toHaveAttribute("placeholder", "Tulipe");
  await editor.getByRole("button", { name: "Cancel object name" }).click();
  await page.getByLabel("Save sticker", { exact: true }).click();
  await expect(page.getByText("Tulipe", { exact: true })).toBeVisible();
});

test("manual recognition fallback preserves target and meaning editing without leaking cancelled drafts", async ({
  page,
}) => {
  await page.goto("/?screen=camera");
  await ready(page);
  const chooser = page.waitForEvent("filechooser");
  await page.getByLabel("Choose image", { exact: true }).click();
  await (await chooser).setFiles("assets/study-portrait.jpg");
  await page.getByLabel("Confirm object", { exact: true }).click();
  const editor = page.getByTestId("object-name-editor");
  await expect(editor).toBeVisible();
  await editor
    .getByLabel("Target object name", { exact: true })
    .fill("Cancelled target");
  await editor
    .getByLabel("Native language meaning", { exact: true })
    .fill("Cancelled meaning");
  await editor.getByRole("button", { name: "Cancel object name" }).click();
  await expect(page.getByText("New word", { exact: true })).toBeVisible();
  await expect(page.getByText("Your object", { exact: true })).toBeVisible();
  await page.getByText(/Not what you expected/).click();
  await expect(
    editor.getByLabel("Native language meaning", { exact: true }),
  ).toHaveValue("");
  await editor
    .getByLabel("Target object name", { exact: true })
    .fill(" Objet ");
  await editor
    .getByLabel("Native language meaning", { exact: true })
    .fill(" Object ");
  await editor.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByText("Objet", { exact: true })).toBeVisible();
  await expect(page.getByText("Object", { exact: true })).toBeVisible();
  await expect(page.getByText(/not an AI result/)).toBeVisible();
});

test("source 022 review goal matches its captured count, geometry and accessible choices", async ({
  page,
}) => {
  await page.goto("/?screen=streak&fixture=1&reviewGoal=022");
  await ready(page);
  await page
    .getByRole("button", { name: "Set Daily Review Count", exact: true })
    .click();
  const dialog = page.getByTestId("daily-review-goal");
  await expect(
    dialog.getByRole("radiogroup", {
      name: "Daily review amount",
      exact: true,
    }),
  ).toBeVisible();
  await expect(dialog.getByRole("radio")).toHaveCount(8);
  await expect(dialog).toContainText("You have 5 words left to review");
  const five = dialog.getByRole("radio", { name: "5 words", exact: true });
  await expect(five).toBeChecked();
  const ten = dialog.getByRole("radio", { name: "10 words", exact: true });
  await ten.click();
  await expect(ten).toBeChecked();
  await expect(five).not.toBeChecked();
  await five.click();
  await expect(five).toBeChecked();
  await expect(ten).not.toBeChecked();
  await expect(five).toHaveCSS("background-color", "rgb(255, 109, 0)");
  const box = await dialog.boundingBox();
  const tile = await five.boundingBox();
  const done = await dialog
    .getByRole("button", { name: "Done", exact: true })
    .boundingBox();
  expect(box).not.toBeNull();
  expect(tile).not.toBeNull();
  expect(done).not.toBeNull();
  expect(Math.abs(box!.x - 59)).toBeLessThan(1);
  expect(Math.abs(box!.y - 234.33)).toBeLessThan(2);
  expect(Math.abs(box!.width - 275)).toBeLessThan(1);
  expect(Math.abs(box!.height - 383.33)).toBeLessThan(2);
  expect(Math.abs(tile!.x - 93.67)).toBeLessThan(1);
  expect(Math.abs(tile!.y - 347)).toBeLessThan(1);
  expect(tile!.width).toBe(50);
  expect(tile!.height).toBe(50);
  expect(Math.abs(done!.y - 488.67)).toBeLessThan(1);
  await page.screenshot({
    path: "qa/screens/reviewGoal.png",
    animations: "disabled",
    caret: "hide",
  });
  await page.setViewportSize({ width: 320, height: 568 });
  const small = await dialog.boundingBox();
  expect(small!.x).toBeGreaterThanOrEqual(0);
  expect(small!.y).toBeGreaterThanOrEqual(0);
  expect(small!.x + small!.width).toBeLessThanOrEqual(320);
  expect(small!.y + small!.height).toBeLessThanOrEqual(568);
});

test("source 043 renders the captured 15-word review goal on the existing Streak screen", async ({
  page,
}) => {
  await page.goto("/?screen=streak&fixture=1&reviewGoal=043");
  await ready(page);
  await expect(page.getByText("4 words", { exact: true })).toBeVisible();
  await page
    .getByRole("button", { name: "Set Daily Review Count", exact: true })
    .click();

  const dialog = page.getByTestId("daily-review-goal");
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText("You have 15 words left to review");
  await expect(dialog.getByRole("radio")).toHaveCount(8);
  await expect(
    dialog.getByRole("radio", { name: "15 words", exact: true }),
  ).toBeChecked();
  await page.screenshot({
    path: "qa/screens/reviewGoal043.png",
    animations: "disabled",
    caret: "hide",
  });
  await dialog
    .getByRole("button", { name: "Cancel daily review amount", exact: true })
    .click();
  await expect(dialog).not.toBeVisible();
});

test("daily review goal Cancel and backdrop discard drafts while Done persists the latest choice", async ({
  page,
}) => {
  await page.goto("/?screen=streak&fixture=1");
  await ready(page);
  const open = () =>
    page
      .getByRole("button", { name: "Set Daily Review Count", exact: true })
      .click();
  const dialog = page.getByTestId("daily-review-goal");
  await open();
  await dialog.getByRole("radio", { name: "25 words", exact: true }).click();
  await dialog
    .getByRole("button", { name: "Cancel daily review amount", exact: true })
    .click();
  await open();
  await expect(
    dialog.getByRole("radio", { name: "10 words", exact: true }),
  ).toBeChecked();
  await dialog.getByRole("radio", { name: "30 words", exact: true }).click();
  await page
    .getByLabel("Dismiss dialog", { exact: true })
    .click({ position: { x: 10, y: 10 } });
  await open();
  await expect(
    dialog.getByRole("radio", { name: "10 words", exact: true }),
  ).toBeChecked();
  await dialog.getByRole("radio", { name: "20 words", exact: true }).click();
  await dialog.getByRole("button", { name: "Done", exact: true }).click();
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          JSON.parse(localStorage.getItem("@capwords/state") || "{}").state
            ?.dailyGoal,
      ),
    )
    .toBe(20);
  await open();
  await expect(
    dialog.getByRole("radio", { name: "20 words", exact: true }),
  ).toBeChecked();
  await dialog.getByRole("radio", { name: "40 words", exact: true }).click();
  await dialog
    .getByRole("button", { name: "Cancel daily review amount", exact: true })
    .click();
  await page.goto("/?screen=streak");
  await ready(page);
  await open();
  await expect(
    dialog.getByRole("radio", { name: "20 words", exact: true }),
  ).toBeChecked();
});

test("daily review amount counts due words and does not silently rewrite an unsupported persisted goal", async ({
  page,
}) => {
  await page.goto("/?screen=streak&fixture=1");
  await ready(page);
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          JSON.parse(localStorage.getItem("@capwords/state") || "{}").state
            ?.words?.length,
      ),
    )
    .toBe(4);
  await page.evaluate(() => {
    const saved = JSON.parse(localStorage.getItem("@capwords/state")!);
    saved.state.dailyGoal = 0;
    saved.state.words.forEach(
      (word: { review: { dueAt: string } }, index: number) => {
        word.review.dueAt =
          index === 0 ? "2000-01-01T00:00:00.000Z" : "2100-01-01T00:00:00.000Z";
      },
    );
    localStorage.setItem("@capwords/state", JSON.stringify(saved));
  });
  await page.goto("/?screen=streak");
  await ready(page);
  await page
    .getByRole("button", { name: "Set Daily Review Count", exact: true })
    .click();
  const dialog = page.getByTestId("daily-review-goal");
  await expect(
    dialog.getByText("You have 1 word left to review", { exact: true }),
  ).toBeVisible();
  await expect(dialog.getByRole("radio", { checked: true })).toHaveCount(0);
  await expect(
    dialog.getByRole("button", { name: "Done", exact: true }),
  ).toBeDisabled();
  expect(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("@capwords/state")!).state.dailyGoal,
    ),
  ).toBe(0);
  await dialog.getByRole("radio", { name: "15 words", exact: true }).click();
  await dialog.getByRole("button", { name: "Done", exact: true }).click();
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          JSON.parse(localStorage.getItem("@capwords/state")!).state.dailyGoal,
      ),
    )
    .toBe(15);
});

declare global {
  interface Window {
    __reviewAudio: {
      events: {
        type: string;
        text?: string;
        language?: string;
        rate?: number;
      }[];
      utterances: SpeechSynthesisUtterance[];
    };
  }
}

test("review front uses centered progress and measured practice-button geometry with manual controls only in the sheet", async ({
  page,
}) => {
  await page.goto("/?screen=review&fixture=1&reviewSource=021");
  await ready(page);
  const progress = page.getByRole("progressbar", {
    name: "Review progress",
    exact: true,
  });
  await expect(progress).toHaveAttribute("aria-valuenow", "0");
  await expect(progress).toHaveAttribute("aria-valuemax", "5");
  const pill = await progress.boundingBox();
  const card = await page.getByTestId("review-card").boundingBox();
  const practiceButton = await page
    .getByTestId("review-practice")
    .boundingBox();
  expect(Math.abs(pill!.x - 154.5)).toBeLessThan(1);
  expect(Math.abs(pill!.y - 65)).toBeLessThan(1);
  expect(Math.abs(card!.x - 49)).toBeLessThan(1);
  expect(Math.abs(card!.y - 218)).toBeLessThan(1);
  expect(card!.width).toBe(295);
  expect(card!.height).toBe(416);
  expect(Math.abs(practiceButton!.y - 730)).toBeLessThan(1);
  expect(practiceButton!.width).toBe(70);
  await expect(
    page.getByText("un cornet de glace", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("/œ̃ kɔʁ.nɛ də ɡlas/", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Hold to speak → master the word!", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Got it!", { exact: true })).not.toBeVisible();
  await expect(
    page.getByRole("button", { name: "Play pronunciation", exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: "qa/screens/review.png",
    animations: "disabled",
    caret: "hide",
  });
  await page.setViewportSize({ width: 320, height: 568 });
  await page.getByTestId("review-practice").scrollIntoViewIfNeeded();
  await expect(page.getByTestId("review-practice")).toBeInViewport();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(320);
});

test("source 021 records a temporary voice attempt while held and clears it on rating", async ({
  page,
}) => {
  await page.context().grantPermissions(["microphone"]);
  await page.goto("/?screen=review&fixture=1&reviewSource=021");
  await ready(page);
  const source021SyntheticClipHoldMs = 1200;
  const practiceButton = page.getByTestId("review-practice");
  const bounds = await practiceButton.boundingBox();
  expect(bounds).not.toBeNull();

  await page.mouse.move(
    bounds!.x + bounds!.width / 2,
    bounds!.y + bounds!.height / 2,
  );
  await page.mouse.down();
  const recordingStatus = page.getByTestId("review-recording-status");
  await expect(recordingStatus).toHaveText("Recording… release to finish", {
    timeout: 10000,
  });
  await page.waitForTimeout(source021SyntheticClipHoldMs);
  await page.mouse.up();
  await expect(recordingStatus).toHaveCount(0);

  await practiceButton.click();
  await expect(
    page.getByText(
      "Your attempt stays temporary on this device; it is not uploaded or automatically scored.",
      { exact: true },
    ),
  ).toBeVisible({ timeout: 10000 });
  const replayAttempt = page.getByText("Listen to your attempt", {
    exact: true,
  });
  await expect(replayAttempt).toBeVisible();
  await replayAttempt.click();
  const stopAttempt = page.getByText("Stop your attempt", { exact: true });
  await expect(stopAttempt).toBeVisible({ timeout: 3000 });
  await stopAttempt.click();
  await page.getByRole("button", { name: "Got it!", exact: true }).click();
  await expect(
    page.getByRole("progressbar", { name: "Review progress", exact: true }),
  ).toHaveAttribute("aria-valuenow", "1");
  await expect(
    page.getByText(
      "Your attempt stays temporary on this device; it is not uploaded or automatically scored.",
      { exact: true },
    ),
  ).not.toBeVisible();
});

test("source 042 shows the mid-swipe Review cue and source-derived pointer", async ({
  page,
}) => {
  await page.goto("/?screen=review&fixture=1&reviewGesture=042");
  await ready(page);
  const progress = page.getByRole("progressbar", {
    name: "Review progress",
    exact: true,
  });
  await expect(progress).toHaveAttribute("aria-valuenow", "0");
  await expect(progress).toHaveAttribute("aria-valuemax", "5");
  await expect(page.getByTestId("review-gesture-cue")).toContainText("Got it!");
  await expect(page.getByTestId("review-gesture-pointer")).toBeVisible();
  await expect(
    page.getByText("un cornet de glace", { exact: true }),
  ).toBeVisible();
  const card = await page.getByTestId("review-card").boundingBox();
  expect(card).not.toBeNull();
  expect(Math.abs(card!.x - 96)).toBeLessThan(3);
  expect(Math.abs(card!.y - 199)).toBeLessThan(3);
  expect(Math.abs(card!.width - 333)).toBeLessThan(3);
  expect(Math.abs(card!.height - 453)).toBeLessThan(3);
  await page.screenshot({
    path: "qa/screens/reviewGesture042.png",
    animations: "disabled",
    caret: "hide",
  });
});

test("a live right swipe shows the source-042 cue before the rating commits", async ({
  page,
}) => {
  await page.goto("/?screen=review&fixture=1&reviewSource=021");
  await ready(page);
  const card = page.getByTestId("review-card");
  const cardBounds = await card.boundingBox();
  expect(cardBounds).not.toBeNull();
  const startX = cardBounds!.x + cardBounds!.width / 2;
  const startY = cardBounds!.y + cardBounds!.height / 2;
  const progress = page.getByTestId("review-progress");
  const source042DragDistance = 66;

  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(startX + source042DragDistance, startY, { steps: 5 });
  await expect(page.getByTestId("review-gesture-cue")).toBeVisible();
  await expect(page.getByTestId("review-gesture-pointer")).toBeVisible();
  await expect(progress).toHaveAttribute("aria-valuenow", "0");
  await page.screenshot({
    path: "qa/screens/reviewGesture042Live.png",
    animations: "disabled",
    caret: "hide",
  });

  await page.mouse.move(startX + 160, startY, { steps: 5 });
  await page.mouse.up();
  await expect(progress).toHaveAttribute("aria-valuenow", "1");
});

test("review pronunciation stops before replay, ignores stale callbacks, and stops on rating and exit", async ({
  page,
}) => {
  await page.addInitScript(() => {
    window.__reviewAudio = { events: [], utterances: [] };
    Object.defineProperty(window.speechSynthesis, "speak", {
      configurable: true,
      value: (utterance: SpeechSynthesisUtterance) => {
        window.__reviewAudio.utterances.push(utterance);
        window.__reviewAudio.events.push({
          type: "speak",
          text: utterance.text,
          language: utterance.lang,
          rate: utterance.rate,
        });
        utterance.onstart?.call(utterance, {} as SpeechSynthesisEvent);
      },
    });
    Object.defineProperty(window.speechSynthesis, "cancel", {
      configurable: true,
      value: () => {
        window.__reviewAudio.events.push({ type: "stop" });
      },
    });
  });
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/?screen=review&fixture=1");
  await ready(page);
  const play = () =>
    page
      .getByRole("button", { name: "Play pronunciation", exact: true })
      .click();
  const stopping = page.getByRole("button", {
    name: "Stop pronunciation",
    exact: true,
  });
  await play();
  await expect(stopping).toHaveAttribute("aria-busy", "true");
  const firstEvents = await page.evaluate(() => window.__reviewAudio.events);
  expect(firstEvents.slice(-2).map((event) => event.type)).toEqual([
    "stop",
    "speak",
  ]);
  expect(firstEvents.at(-1)).toMatchObject({ language: "fr" });
  expect(firstEvents.at(-1)!.rate).toBeCloseTo(0.8);
  const firstText = firstEvents.at(-1)!.text!;
  expect(await page.getByTestId("review-card").textContent()).toContain(
    firstText.toLowerCase(),
  );
  await stopping.click();
  await play();
  await page.evaluate(() => {
    const old = window.__reviewAudio.utterances[0];
    old.onend?.call(old, {} as SpeechSynthesisEvent);
  });
  await expect(stopping).toBeVisible();
  await page.evaluate(() => {
    const current = window.__reviewAudio.utterances[1];
    current.onend?.call(current, {} as SpeechSynthesisEvent);
  });
  await expect(
    page.getByRole("button", { name: "Play pronunciation", exact: true }),
  ).toBeVisible();
  await play();
  await page
    .getByLabel("Hold to record your pronunciation attempt", { exact: true })
    .click();
  await expect(
    page.getByText(/automatic speech assessment is not connected/i),
  ).toBeVisible();
  await page.getByRole("button", { name: "Needs review", exact: true }).click();
  await expect(
    page.getByRole("progressbar", { name: "Review progress", exact: true }),
  ).toHaveAttribute("aria-valuenow", "1");
  await play();
  await expect(stopping).toBeVisible();
  const next = await page.evaluate(() =>
    window.__reviewAudio.events
      .filter((event) => event.type === "speak")
      .at(-1),
  );
  expect(next!.text).not.toBe(firstText);
  await page.evaluate(() => {
    const current = window.__reviewAudio.utterances.at(-1)!;
    current.onerror?.call(current, {
      error: "synthesis-failed",
    } as SpeechSynthesisErrorEvent);
  });
  await expect(page.getByRole("alert")).toHaveText(
    "Pronunciation playback unavailable. Try again.",
  );
  await play();
  await expect(stopping).toBeVisible();
  const stops = await page.evaluate(
    () =>
      window.__reviewAudio.events.filter((event) => event.type === "stop")
        .length,
  );
  await page
    .getByRole("button", { name: "Back to review summary", exact: true })
    .click();
  await expect(page.getByText("Review Again", { exact: true })).toBeVisible();
  expect(
    await page.evaluate(
      () =>
        window.__reviewAudio.events.filter((event) => event.type === "stop")
          .length,
    ),
  ).toBeGreaterThan(stops);
  await page.evaluate(() => {
    const old = window.__reviewAudio.utterances.at(-1)!;
    old.onend?.call(old, {} as SpeechSynthesisEvent);
  });
  expect(errors).toEqual([]);
});

function copyPhotoWithTimestamp(
  assetPath: string,
  fileName: string,
  timestamp: number,
) {
  const directory = fs.mkdtempSync(join(tmpdir(), "capwords-reference-photo-"));
  const photoPath = join(directory, basename(fileName));
  fs.copyFileSync(assetPath, photoPath);
  const modifiedAt = new Date(timestamp);
  fs.utimesSync(photoPath, modifiedAt, modifiedAt);
  return {
    path: photoPath,
    cleanup: () => fs.rmSync(directory, { recursive: true, force: true }),
  };
}

async function importManualPhoto(page: Page, fullImageHint = false) {
  await page.goto(`/?screen=camera${fullImageHint ? "&fullImageHint=1" : ""}`);
  await ready(page);
  const sourcePhoto = fullImageHint
    ? copyPhotoWithTimestamp(
        "assets/gummble-source-065-photo-crop.png",
        "source-065-photo.png",
        captureReferenceTimestamps.source065,
      )
    : undefined;
  try {
    const chooser = page.waitForEvent("filechooser");
    await page.getByLabel("Choose image", { exact: true }).click();
    await (
      await chooser
    ).setFiles(sourcePhoto?.path ?? "assets/study-portrait.jpg");
    await expect(
      page.getByLabel("Confirm object", { exact: true }),
    ).toBeVisible();
  } finally {
    sourcePhoto?.cleanup();
  }
}

test("camera tap remains a photo and long press opens the disclosed video-frame flow", async ({
  page,
}) => {
  await page.goto("/?screen=camera&fixture=1&videoFrame=1");
  await ready(page);
  await expect(page.getByText("Long press to recognize video")).toBeVisible();

  await page.getByLabel("Capture photo", { exact: true }).click();
  await expect(
    page.getByLabel("Confirm object", { exact: true }),
  ).toBeVisible();
  await expect(page.getByTestId("videoFrameDisclosure")).toHaveCount(0);
  await page.getByLabel("Retake image", { exact: true }).click();
  await ready(page);

  const shutter = page.getByLabel("Capture photo", { exact: true });
  const bounds = await shutter.boundingBox();
  expect(bounds).not.toBeNull();
  await page.mouse.move(
    bounds!.x + bounds!.width / 2,
    bounds!.y + bounds!.height / 2,
  );
  await page.mouse.down();
  await expect(
    page.getByTestId("camera-video-recording-progress"),
  ).toBeVisible();
  await expect(page.getByTestId("camera-video-recording-hint")).toHaveCSS(
    "opacity",
    "0",
  );
  await page.waitForTimeout(1350);
  await page.screenshot({
    path: "qa/screens/cameraRecording010.png",
    animations: "disabled",
  });
  await page.mouse.up();

  await expect(
    page.getByLabel("Confirm object", { exact: true }),
  ).toBeVisible();
  await expect(page.getByTestId("videoFrameDisclosure")).toHaveText(
    "This flow uses one still frame; full-video analysis is not connected.",
  );
  await page.screenshot({
    path: "qa/screens/confirmVideoFrame.png",
    animations: "disabled",
  });
});

test("source 034 uses the captured live-camera frame without the video hint", async ({
  page,
}) => {
  await page.goto("/?screen=camera&fixture=1&captureState=034");
  await ready(page);

  await expect(page.getByText("Please place the object")).toBeVisible();
  await expect(page.getByText("Long press to recognize video")).toHaveCount(0);
  const shutter = page.getByLabel("Capture photo", { exact: true });
  const shutterBounds = await shutter.boundingBox();
  expect(shutterBounds).not.toBeNull();
  expect(shutterBounds!.width).toBeCloseTo(100, 0);
  await expect(page.getByLabel("Choose image", { exact: true })).toBeVisible();
  await expect(page.getByTestId("capture-shutter-artwork")).toBeVisible();

  await page.screenshot({
    path: "qa/screens/cameraSource034.png",
    animations: "disabled",
  });
});

test("source 035 renders the captured circular preview and confirm controls", async ({
  page,
}) => {
  await page.goto("/?screen=confirm&fixture=1&confirmState=035");
  await ready(page);

  const previewRing = page.getByTestId("capture-preview-ring-035");
  await expect(previewRing).toBeVisible();
  await expect(page.getByTestId("source035-preview-media")).toBeVisible();
  const ringBounds = await previewRing.boundingBox();
  expect(ringBounds).not.toBeNull();
  expect(ringBounds!.x).toBeCloseTo(39, 0);
  expect(ringBounds!.y).toBeCloseTo(269, 0);
  expect(ringBounds!.width).toBeCloseTo(314, 0);
  const retakeButton = page.getByLabel("Retake image", { exact: true });
  const confirmButton = page.getByLabel("Confirm object", { exact: true });
  const cropButton = page.getByLabel("Crop and rotate", { exact: true });
  await expect(retakeButton).toHaveCSS("background-color", "rgb(10, 9, 11)");
  const [retakeBounds, confirmBounds, cropBounds] = await Promise.all([
    retakeButton.boundingBox(),
    confirmButton.boundingBox(),
    cropButton.boundingBox(),
  ]);
  expect(retakeBounds).not.toBeNull();
  expect(confirmBounds).not.toBeNull();
  expect(cropBounds).not.toBeNull();
  expect(retakeBounds!.x).toBeCloseTo(45, 0);
  expect(retakeBounds!.width).toBeCloseTo(50, 0);
  expect(confirmBounds!.x).toBeCloseTo(146.5, 0);
  expect(confirmBounds!.width).toBeCloseTo(100, 0);
  expect(cropBounds!.x).toBeCloseTo(298, 0);
  expect(cropBounds!.width).toBeCloseTo(50, 0);
  await expect(page.getByLabel("Retake image", { exact: true })).toBeVisible();
  await expect(
    page.getByLabel("Confirm object", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByLabel("Crop and rotate", { exact: true }),
  ).toBeVisible();
  for (const button of [retakeButton, confirmButton, cropButton]) {
    await expect(button.locator("img")).toHaveCount(1);
  }

  await page.screenshot({
    path: "qa/screens/confirmPreview035.png",
    animations: "disabled",
  });
});

test("full-image mode restores and confirms the untouched original after a crop", async ({
  page,
}) => {
  await importManualPhoto(page, true);
  await expect(page.getByText("Tap to recognize the full image")).toBeVisible();
  await expect(page.getByText("Sep 11", { exact: true })).toBeVisible();
  const sourcePhoto = page.getByLabel("Selected photo", { exact: true });
  await expect(sourcePhoto).toBeVisible();
  await expect
    .poll(() =>
      sourcePhoto
        .locator("img")
        .evaluate((node) => (node as HTMLImageElement).naturalWidth),
    )
    .toBe(1180);
  await page.screenshot({
    path: "qa/screens/confirmFullImageHint.png",
    animations: "disabled",
  });
  await page.getByLabel("Crop and rotate", { exact: true }).click();
  await page.getByLabel("Select image ratio", { exact: true }).click();
  await page.getByTestId("action-sheet-option-four-three").click();
  await page.getByLabel("Zoom in", { exact: true }).click();
  await page.getByText("✓ Confirm selection", { exact: true }).click();
  await page.getByLabel("Recognize full image", { exact: true }).click();
  await expect(
    page.getByLabel("Use cropped image", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByLabel("Full original image", { exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: "qa/screens/confirmFullImage.png",
    animations: "disabled",
  });
  await page.getByLabel("Confirm object", { exact: true }).click();
  await expect(page.getByText(/not an AI result/)).toBeVisible();
  await expect(page.getByLabel("Save sticker", { exact: true })).toBeDisabled();
});

test("manual photo cannot save placeholders or incomplete names and discarded drafts do not enter the library", async ({
  page,
}) => {
  await importManualPhoto(page);
  await page.getByLabel("Confirm object", { exact: true }).click();
  const editor = page.getByTestId("object-name-editor");
  const target = editor.getByLabel("Target object name", { exact: true });
  const meaning = editor.getByLabel("Native language meaning", { exact: true });
  const commit = editor.getByRole("button", { name: "Save", exact: true });
  await expect(meaning).toHaveValue("");
  await target.fill("Objet");
  await expect(commit).toBeDisabled();
  await meaning.fill("   ");
  await expect(commit).toBeDisabled();
  await meaning.fill("Object");
  await target.fill("   ");
  await expect(commit).toBeDisabled();
  await editor.getByLabel("Cancel object name", { exact: true }).click();
  await expect(page.getByLabel("Save sticker", { exact: true })).toBeDisabled();
  await expect(
    page.getByText(/Add a name and meaning before saving/),
  ).toBeVisible();
  await page.getByText(/Not what you expected/).click();
  await target.fill("Objet");
  await meaning.fill("Object");
  await expect(commit).toBeEnabled();
  await commit.click();
  await expect(page.getByLabel("Save sticker", { exact: true })).toBeEnabled();
  await page.getByText(/Not what you expected/).click();
  await expect(meaning).toHaveValue("Object");
  await meaning.fill("");
  await expect(commit).toBeDisabled();
  await editor.getByLabel("Cancel object name", { exact: true }).click();
  await expect(page.getByText("Object", { exact: true })).toBeVisible();
  await page.getByLabel("Discard", { exact: true }).click();
  await expect(page.getByLabel("Choose image", { exact: true })).toBeVisible();
  expect(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("@capwords/state")!).state.words.length,
    ),
  ).toBe(0);
});

test("real imported photo crop and manual labels survive one save, reload, Home and Collection", async ({
  page,
}) => {
  await importManualPhoto(page);
  await page.getByLabel("Crop and rotate", { exact: true }).click();
  await page.getByLabel("Select image ratio", { exact: true }).click();
  await page.getByTestId("action-sheet-option-four-three").click();
  await page.getByLabel("Zoom in", { exact: true }).click();
  await page.getByText("✓ Confirm selection", { exact: true }).click();
  await page.getByLabel("Confirm object", { exact: true }).click();
  const editor = page.getByTestId("object-name-editor");
  await editor
    .getByLabel("Target object name", { exact: true })
    .fill(" Objet importé ");
  await editor
    .getByLabel("Native language meaning", { exact: true })
    .fill(" Imported object ");
  await editor.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByText(/not an AI result/)).toBeVisible();
  await page.getByLabel("Save sticker", { exact: true }).evaluate((element) => {
    (element as HTMLElement).click();
    (element as HTMLElement).click();
  });
  await expect(
    page.getByLabel("Open Objet importé", { exact: true }),
  ).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          JSON.parse(localStorage.getItem("@capwords/state")!).state.words
            .length,
      ),
    )
    .toBe(1);
  const saved = await page.evaluate(
    () =>
      JSON.parse(localStorage.getItem("@capwords/state")!).state.words[0] as {
        target: string;
        native: string;
        imageUri: string;
      },
  );
  expect(saved).toMatchObject({
    target: "Objet importé",
    native: "Imported object",
  });
  expect(saved.imageUri).toMatch(/^data:image\/jpeg;base64,/);
  const ratio = await page.evaluate(
    (uri) =>
      new Promise<number>((resolve, reject) => {
        const image = new window.Image();
        image.onload = () => resolve(image.naturalWidth / image.naturalHeight);
        image.onerror = () => reject(new Error("Saved photo failed to decode"));
        image.src = uri;
      }),
    saved.imageUri,
  );
  expect(ratio).toBeCloseTo(4 / 3, 2);
  await page.goto("/?screen=collection");
  await ready(page);
  await expect(
    page.getByLabel("Open Objet importé", { exact: true }),
  ).toBeVisible();
  expect(
    await page
      .locator("img")
      .evaluateAll(
        (images, uri) =>
          images.some(
            (image) =>
              image instanceof HTMLImageElement &&
              image.complete &&
              image.naturalWidth > 0 &&
              image.currentSrc === uri,
          ),
        saved.imageUri,
      ),
  ).toBe(true);
  await page.screenshot({
    path: "qa/screens/manualSaved.png",
    animations: "disabled",
  });
  await page.getByLabel("Open Objet importé", { exact: true }).click();
  await expect(
    page.getByText("Imported object", { exact: true }),
  ).toBeVisible();
  await page.goto("/?screen=home");
  await ready(page);
  await expect(page.getByText("1 Word", { exact: true })).toBeVisible();
  await page.getByLabel(/word collection/).click();
  await expect(
    page.getByLabel("Open Objet importé", { exact: true }),
  ).toBeVisible();
});

test("Detail opens Examples from the selected library word", async ({
  page,
}) => {
  await page.goto("/?screen=collection&fixture=1");
  await ready(page);
  await page
    .getByLabel(`Open ${DEMO_FLOWER_WORD.target}`, { exact: true })
    .click();
  await expect(page.getByLabel("Listen to pronunciation")).toBeVisible();
  await page.getByText("View examples", { exact: true }).click();
  await expect(
    page.getByText(DEMO_FLOWER_WORD.example, { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText(DEMO_FLOWER_WORD.exampleTranslation, { exact: true }),
  ).toBeVisible();

  await page.getByLabel("Close examples", { exact: true }).click();
  await expect(page.getByLabel("Listen to pronunciation")).toBeVisible();
});

test("Home date filters open one-, three-, and four-word Collections", async ({
  page,
}) => {
  fs.mkdirSync("qa/screens", { recursive: true });
  await page.goto("/?screen=home&fixture=1");
  await ready(page);
  const dates = await page.evaluate((reference) => {
    const key = "@capwords/state";
    const saved = JSON.parse(localStorage.getItem(key)!);
    const today = new Date();
    const sourceDate = new Date(
      today.getFullYear(),
      reference.monthIndex,
      reference.dayOfMonth,
      12,
    );
    const previousDate = new Date(sourceDate);
    previousDate.setDate(previousDate.getDate() - 1);
    saved.state.words.forEach((word: { createdAt: string; target: string }) => {
      word.createdAt = (
        word.target === reference.singleWordTarget ? previousDate : sourceDate
      ).toISOString();
    });
    localStorage.setItem(key, JSON.stringify(saved));
    const label = (date: Date) =>
      date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    return {
      today: label(today),
      previous: label(previousDate),
      source: label(sourceDate),
      sourceDateIso: sourceDate.toISOString(),
      singleWordTarget: reference.singleWordTarget as string,
      threeWordTargets: saved.state.words
        .filter(
          (word: { target: string }) =>
            word.target !== reference.singleWordTarget,
        )
        .map((word: { target: string }) => word.target),
      allTargets: saved.state.words.map(
        (word: { target: string }) => word.target,
      ),
    };
  }, source082086DateReference);

  await page.goto("/?screen=home");
  await ready(page);
  await expect(
    page.getByText("Start your day with a new word.", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Snap something nearby!", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("1 Word", { exact: true })).toBeVisible();
  await expect(page.getByText("3 Words", { exact: true })).toBeVisible();

  await page
    .getByLabel(`Start a new word for ${dates.today}`, { exact: true })
    .click();
  await expect(page.getByLabel("Capture photo", { exact: true })).toBeVisible();
  await page.goto("/?screen=home");
  await ready(page);
  await page
    .getByLabel(`Open ${dates.previous} word collection`, { exact: true })
    .click();
  await expect(page.getByText("1 Word", { exact: true })).toBeVisible();
  await expect(
    page.getByLabel(`Open ${dates.singleWordTarget}`, { exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel(/^Open (?!camera$)/)).toHaveCount(1);
  await page
    .getByLabel(`Open ${dates.singleWordTarget}`, { exact: true })
    .click();
  await page.getByLabel("Back", { exact: true }).click();
  await expect(page.getByText("1 Word", { exact: true })).toBeVisible();
  await expect(
    page.getByLabel(`Open ${dates.singleWordTarget}`, { exact: true }),
  ).toBeVisible();

  await page.getByLabel("Back", { exact: true }).click();
  await page
    .getByLabel(`Open ${dates.source} word collection`, { exact: true })
    .click();
  await expect(page.getByText("Sep 11", { exact: true })).toBeVisible();
  await expect(page.getByText("3 Words", { exact: true })).toBeVisible();
  for (const target of dates.threeWordTargets) {
    await expect(
      page.getByLabel(`Open ${target}`, { exact: true }),
    ).toBeVisible();
  }
  await expect(
    page.getByLabel(`Open ${dates.singleWordTarget}`, { exact: true }),
  ).toHaveCount(0);
  await page.screenshot({
    path: "qa/screens/dateScopedCollection086.png",
    animations: "disabled",
  });

  await page.getByLabel("Back", { exact: true }).click();
  await page.evaluate((sourceDateIso) => {
    const key = "@capwords/state";
    const saved = JSON.parse(localStorage.getItem(key)!);
    saved.state.words.forEach((word: { createdAt: string }) => {
      word.createdAt = sourceDateIso;
    });
    localStorage.setItem(key, JSON.stringify(saved));
  }, dates.sourceDateIso);
  await page.goto("/?screen=home");
  await ready(page);
  await page
    .getByLabel(`Open ${dates.source} word collection`, { exact: true })
    .click();
  await expect(page.getByText("Sep 11", { exact: true })).toBeVisible();
  await expect(page.getByText("4 Words", { exact: true })).toBeVisible();
  for (const target of dates.allTargets) {
    await expect(
      page.getByLabel(`Open ${target}`, { exact: true }),
    ).toBeVisible();
  }
  await page.screenshot({
    path: "qa/screens/dateScopedCollection082.png",
    animations: "disabled",
  });
});

test("Home offers a due-word review card with start and defer actions", async ({
  page,
}) => {
  await page.goto("/?screen=home&fixture=1");
  await ready(page);
  await expect(page.getByTestId("home-review-prompt")).toHaveCount(0);

  await page.evaluate(() => {
    const key = "@capwords/state";
    const saved = JSON.parse(localStorage.getItem(key) || "{}");
    saved.state.reviewDates = [];
    saved.state.words[0].review.dueAt = new Date(0).toISOString();
    localStorage.setItem(key, JSON.stringify(saved));
  });
  await page.goto("/?screen=home");
  await ready(page);
  await expect(page.getByTestId("home-review-prompt")).toBeVisible();

  await page.evaluate(() => {
    const key = "@capwords/state";
    const saved = JSON.parse(localStorage.getItem(key) || "{}");
    const now = new Date();
    saved.state.reviewDates = [
      `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`,
    ];
    localStorage.setItem(key, JSON.stringify(saved));
  });
  await page.goto("/?screen=home");
  await ready(page);
  await expect(page.getByTestId("home-review-prompt")).toHaveCount(0);

  await page.goto("/?screen=home&fixture=1&homeReview=1");
  await ready(page);
  const prompt = page.getByTestId("home-review-prompt");
  await expect(prompt).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Start Review", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Review later", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Sep 12", { exact: true })).toBeVisible();
  await expect(page.getByText("4 Words", { exact: true })).toBeVisible();
  await expect(page.getByText("Good Afternoon", { exact: true })).toHaveCount(
    0,
  );
  const fanSurfaceColors = [
    "rgb(222, 227, 229)",
    "rgb(201, 125, 57)",
    "rgb(40, 40, 39)",
    "rgb(102, 99, 92)",
  ];
  for (const [index, color] of fanSurfaceColors.entries()) {
    await expect(page.getByTestId(`card-fan-card-${index}`)).toHaveCSS(
      "background-color",
      color,
    );
  }
  const orangeFanCardSize = await page
    .getByTestId("card-fan-card-1")
    .evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        width: parseFloat(style.width),
        height: parseFloat(style.height),
      };
    });
  expect(orangeFanCardSize.width).toBeCloseTo(112.24, 1);
  expect(orangeFanCardSize.height).toBeCloseTo(136.16, 1);
  const emptyTodayCard = page.getByRole("button", {
    name: "Start a new word for Sep 12",
    exact: true,
  });
  await expect(emptyTodayCard).toHaveCSS(
    "background-color",
    "rgb(232, 232, 232)",
  );
  const emptyTodayBounds = await emptyTodayCard.boundingBox();
  expect(emptyTodayBounds!.width).toBe(353);
  expect(emptyTodayBounds!.height).toBe(191);
  await page.screenshot({
    path: "qa/screens/homeReview.png",
    animations: "disabled",
  });

  await page.getByRole("button", { name: "Start Review", exact: true }).click();
  await expect(page.getByTestId("review-card")).toBeVisible();
  await expect(page.getByTestId("review-progress")).toHaveAttribute(
    "aria-valuemax",
    "4",
  );

  await page.goto("/?screen=home&fixture=1&homeReview=1");
  await ready(page);
  await page.getByRole("button", { name: "Review later", exact: true }).click();
  await expect(page.getByTestId("home-review-prompt")).toHaveCount(0);
  await expect(page.getByText("Good Afternoon", { exact: true })).toBeVisible();
  const reviewDates = await page.evaluate(
    () =>
      JSON.parse(localStorage.getItem("@capwords/state") || "{}").state
        ?.reviewDates,
  );
  expect(reviewDates).toEqual([]);
});

test("source 040 Home invitation uses its measured greeting and four-card fan", async ({
  page,
}) => {
  fs.mkdirSync("qa/screens", { recursive: true });
  await page.goto("/?screen=home&fixture=1&homeReviewSource=040");
  await ready(page);

  await expect(page.getByText("Good Evening", { exact: true })).toBeVisible();
  await expect(
    page.getByText("Start your day with a new word!", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Sep 12", { exact: true }).first()).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Start Review", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Review later", exact: true }),
  ).toBeVisible();
  await expect(page.locator('[data-testid^="card-fan-card-"]')).toHaveCount(4);
  await page.screenshot({
    path: "qa/screens/homeReview040.png",
    animations: "disabled",
  });

  await page.getByRole("button", { name: "Start Review", exact: true }).click();
  await expect(page.getByTestId("review-progress")).toHaveAttribute(
    "aria-valuemax",
    "4",
  );
});

test("source 041 Streak empty state is driven by an empty due queue", async ({
  page,
}) => {
  fs.mkdirSync("qa/screens", { recursive: true });
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.goto("/?screen=streak&fixture=1&streakSource=041");
  await ready(page);

  await expect(page.getByText("0", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Day streak", { exact: true })).toBeVisible();
  await expect(
    page.getByText("No words to review today", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Keep up with daily reviews\nknowledge stays in your mind", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByText("September 11, 2025", { exact: true }),
  ).toBeVisible();
  const previousMonth = page.getByRole("button", { name: "Previous month" });
  await expect(previousMonth).toHaveCSS(
    "background-color",
    "rgb(248, 248, 248)",
  );
  await expect(previousMonth).toHaveCSS("border-radius", "15px");
  await expect(page.getByText("S", { exact: true }).first()).toHaveCSS(
    "color",
    "rgb(255, 139, 54)",
  );
  await expect(page.getByTestId("streak-empty-calendar-day-dot-7")).toHaveCSS(
    "width",
    "30px",
  );
  await expect(page.getByTestId("streak-empty-calendar-day-dot-11")).toHaveCSS(
    "border-color",
    "rgb(255, 139, 54)",
  );
  await expect(page.getByTestId("empty-review-streak")).toBeVisible();
  await expect(page.locator('[data-testid^="card-fan-card-"]')).toHaveCount(0);
  const wordCount = await page.evaluate(
    () =>
      JSON.parse(localStorage.getItem("@capwords/state") || "{}").state?.words
        ?.length ?? 0,
  );
  expect(wordCount).toBe(0);
  await page.screenshot({
    path: "qa/screens/streakEmpty041.png",
    animations: "disabled",
  });
});

test("source 057 streak reminder uses the existing due-word library", async ({
  page,
}) => {
  fs.mkdirSync("qa/screens", { recursive: true });
  await page.goto("/?screen=home&fixture=1");
  await ready(page);

  const existingWordCount = await page.evaluate(() => {
    const saved = JSON.parse(localStorage.getItem("@capwords/state") || "{}");
    return saved.state?.words?.length ?? 0;
  });
  expect(existingWordCount).toBe(4);
  await page.evaluate((reviewDateKey) => {
    const saved = JSON.parse(localStorage.getItem("@capwords/state") || "{}");
    saved.state.reviewDates = [reviewDateKey];
    localStorage.setItem("@capwords/state", JSON.stringify(saved));
  }, streakReference.source057.reviewDateKey);

  await page.goto("/?screen=streak&fixture=1&streakSource=057");
  await ready(page);
  await expect(page.getByTestId("streak-reminder-artwork-057")).toBeVisible();
  await expect(
    page.getByText("Oops! No review yet today", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Your 1-day streak is on fire, keep it going!", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByText("September 12, 2025", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByTestId("streak-reminder-calendar-marker-057-11"),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Start Review", exact: true }),
  ).toBeVisible();
  await expect(page.locator('[data-testid^="card-fan-card-"]')).toHaveCount(4);
  const snapshot = await page.evaluate(() => {
    const saved = JSON.parse(localStorage.getItem("@capwords/state") || "{}");
    return {
      wordCount: saved.state.words.length,
      reviewDates: saved.state.reviewDates,
    };
  });
  expect(snapshot).toEqual({
    wordCount: 4,
    reviewDates: [streakReference.source057.reviewDateKey],
  });
  await page.screenshot({
    path: "qa/screens/streakReminder057.png",
    animations: "disabled",
    caret: "hide",
  });

  await page.getByRole("button", { name: "Start Review", exact: true }).click();
  await expect(page.getByTestId("review-progress")).toHaveAttribute(
    "aria-valuemax",
    "4",
  );
});

test("source 085 prepared-example intro matches measured geometry and actions", async ({
  page,
}) => {
  fs.mkdirSync("qa/screens", { recursive: true });
  const source085 = "/?screen=memoryIntro&fixture=1&memoryIntroState=085";
  await page.goto(source085);
  await ready(page);

  await expect(page.getByTestId("prepared-example-085")).toBeVisible();
  await expect(
    page.getByText(/We've prepared an\s+example for you!/),
  ).toBeVisible();
  await expect(
    page.getByText(/Try capturing this object to see how/),
  ).toBeVisible();
  const photo = page.getByLabel(
    "Example photo of a soft-serve ice cream cone",
    { exact: true },
  );
  await expect(photo).toBeVisible();
  const photoBounds = await photo.boundingBox();
  expect(photoBounds).not.toBeNull();
  expect(photoBounds!.x).toBeCloseTo(117, 0);
  expect(photoBounds!.y).toBeCloseTo(190, 0);
  expect(photoBounds!.width).toBeCloseTo(159, 0);
  expect(photoBounds!.height).toBeCloseTo(186, 0);

  const primary = page.getByRole("button", {
    name: "Try a Demo",
    exact: true,
  });
  const primaryBounds = await primary.boundingBox();
  expect(primaryBounds).not.toBeNull();
  expect(primaryBounds!.x).toBeCloseTo(87.7, 0);
  expect(primaryBounds!.y).toBeCloseTo(662, 0);
  expect(primaryBounds!.width).toBeCloseTo(218, 0);
  expect(primaryBounds!.height).toBeCloseTo(60, 0);
  await page.screenshot({
    path: "qa/screens/memoryIntro085.png",
    animations: "disabled",
  });

  await page
    .getByRole("button", { name: "Snap Your First Word", exact: true })
    .click();
  await expect(page.getByLabel("Capture photo", { exact: true })).toBeVisible();

  await page.goto(source085);
  await ready(page);
  await page.getByRole("button", { name: "Try a Demo", exact: true }).click();
  await expect(page.getByTestId("review-card")).toBeVisible();
});

test("source 097 presents Scenario Memory Cards as a Collection sheet", async ({
  page,
}) => {
  fs.mkdirSync("qa/screens", { recursive: true });
  const source097 = "/?screen=memoryIntro&fixture=1&memoryIntroState=097";
  await page.goto(source097);
  await ready(page);

  await expect(page.getByTestId("scenario-memory-intro-097")).toBeVisible();
  const sheetBounds = await page
    .getByTestId("scenario-memory-intro-097")
    .boundingBox();
  expect(sheetBounds).not.toBeNull();
  expect(sheetBounds!.y).toBeCloseTo(128, 0);
  expect(sheetBounds!.height).toBeCloseTo(724, 0);
  await expect(
    page.getByText(scenarioMemoryIntroCopy.title, { exact: true }),
  ).toBeVisible();
  const titleBounds = await page
    .getByText(scenarioMemoryIntroCopy.title, { exact: true })
    .boundingBox();
  expect(titleBounds).not.toBeNull();
  expect(titleBounds!.y).toBeCloseTo(564, 0);
  await expect(
    page.getByText(
      /CapWords will help you review captured\s+words using the memory curve\./,
    ),
  ).toBeVisible();
  const descriptionBounds = await page
    .getByText(
      /CapWords will help you review captured\s+words using the memory curve\./,
    )
    .boundingBox();
  expect(descriptionBounds).not.toBeNull();
  expect(descriptionBounds!.y).toBeCloseTo(629, 0);
  const illustration = page.getByLabel(
    scenarioMemoryIntroCopy.illustrationAccessibilityLabel,
    { exact: true },
  );
  await expect(illustration).toBeVisible();
  const illustrationBounds = await illustration.boundingBox();
  expect(illustrationBounds).not.toBeNull();
  expect(illustrationBounds!.x).toBeCloseTo(16.5, 0);
  expect(illustrationBounds!.y).toBeCloseTo(212, 0);
  expect(illustrationBounds!.width).toBeCloseTo(360, 0);
  expect(illustrationBounds!.height).toBeCloseTo(281, 0);
  const primary = page.getByRole("button", {
    name: scenarioMemoryIntroCopy.tryDemo,
    exact: true,
  });
  await expect(primary).toBeVisible();
  const primaryBounds = await primary.boundingBox();
  expect(primaryBounds).not.toBeNull();
  expect(primaryBounds!.x).toBeCloseTo(65.5, 0);
  expect(primaryBounds!.y).toBeCloseTo(699, 0);
  expect(primaryBounds!.width).toBeCloseTo(262, 0);
  expect(primaryBounds!.height).toBeCloseTo(60, 0);
  await expect(
    page.getByRole("button", {
      name: scenarioMemoryIntroCopy.tryLater,
      exact: true,
    }),
  ).toBeVisible();
  await page.screenshot({
    path: "qa/screens/memoryIntro097.png",
    animations: "disabled",
  });

  await page
    .getByRole("button", {
      name: scenarioMemoryIntroCopy.tryLater,
      exact: true,
    })
    .click();
  await expect(page.getByText("Sep 11", { exact: true })).toBeVisible();
  await expect(page.getByText("4 Words", { exact: true })).toBeVisible();
  await expect(
    page.getByLabel(`Open ${DEMO_FLOWER_WORD.target}`, { exact: true }),
  ).toBeVisible();

  await page.goto(source097);
  await ready(page);
  await page
    .getByRole("button", { name: scenarioMemoryIntroCopy.tryDemo, exact: true })
    .click();
  await expect(page.getByTestId("review-card")).toBeVisible();
});

test("source 066 imports its flower photo through the gallery before full-image confirmation", async ({
  page,
}) => {
  fs.mkdirSync("qa/screens", { recursive: true });
  await page.goto("/?screen=camera&fixture=1");
  await ready(page);

  const sourcePhoto = copyPhotoWithTimestamp(
    "assets/gummble-source-066-photo-crop.png",
    "source-066-photo.png",
    captureReferenceTimestamps.source066,
  );
  try {
    const chooser = page.waitForEvent("filechooser");
    await page.getByLabel("Choose image", { exact: true }).click();
    await (await chooser).setFiles(sourcePhoto.path);
    await expect(page).toHaveURL(/screen=confirm/);
    await expect(page.getByText("Sep 12", { exact: true })).toBeVisible();

    await page.getByLabel("Recognize full image", { exact: true }).click();
    const image = page.getByLabel("Full original image", { exact: true });
    await expect(image).toBeVisible();
    await expect
      .poll(() =>
        image
          .locator("img")
          .evaluate((node) => (node as HTMLImageElement).naturalWidth),
      )
      .toBe(1179);
    await expect(
      page.getByLabel("Retake image", { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByLabel("Confirm object", { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByLabel("Crop and rotate", { exact: true }),
    ).toBeVisible();

    await page.screenshot({
      path: "qa/screens/confirmFullImage.png",
      animations: "disabled",
    });
    await page.getByLabel("Confirm object", { exact: true }).click();
    await expect(page.getByText("Sep 12", { exact: true })).toBeVisible();
  } finally {
    sourcePhoto.cleanup();
  }
});

test("web photo import remains usable through manual save when native foreground removal is unavailable", async ({
  page,
}) => {
  const sourcePhoto = copyPhotoWithTimestamp(
    "assets/gummble-source-066-photo-crop.png",
    "web-import-source-066.png",
    captureReferenceTimestamps.source066,
  );
  try {
    await page.goto("/?screen=camera");
    await ready(page);
    const chooser = page.waitForEvent("filechooser");
    await page.getByLabel("Choose image", { exact: true }).click();
    await (await chooser).setFiles(sourcePhoto.path);

    await expect(page).toHaveURL(/screen=confirm/);
    await expect(page.getByText("Sep 12", { exact: true })).toBeVisible();
    await expect(
      page.getByLabel("Crop and rotate", { exact: true }),
    ).toBeVisible();
    await page.getByLabel("Confirm object", { exact: true }).click();

    await expect(page.getByLabel("Target object name")).toBeVisible();
    await page.getByLabel("Target object name").fill("fleur");
    await page.getByLabel("Native language meaning").fill("flower");
    await page.getByRole("button", { name: "Save", exact: true }).click();
    await expect(
      page.getByLabel("Save sticker", { exact: true }),
    ).toBeEnabled();
    await page.getByLabel("Save sticker", { exact: true }).click();

    await expect(page).toHaveURL(/screen=collection/);
    const savedFlower = page.getByLabel("Open fleur", { exact: true });
    await expect(savedFlower).toBeVisible();
    await expect
      .poll(() =>
        savedFlower
          .locator("img")
          .evaluate((node) => (node as HTMLImageElement).naturalWidth),
      )
      .toBeGreaterThan(0);

    await page.reload();
    await ready(page);
    const persistedFlower = page.getByLabel("Open fleur", { exact: true });
    await expect(persistedFlower).toBeVisible();
    await expect
      .poll(() =>
        persistedFlower
          .locator("img")
          .evaluate((node) => (node as HTMLImageElement).naturalWidth),
      )
      .toBeGreaterThan(0);
  } finally {
    sourcePhoto.cleanup();
  }
});

for (const sourceId of ["101", "102"] as const) {
  const progressText = "75%";
  const progressValue = sourceId === "101" ? "6 percent" : "75 percent";

  test(`review progress source-${sourceId} renders the captured visual state`, async ({
    page,
  }) => {
    await page.goto(
      `/?screen=reviewResult&fixture=1&reviewProgress=${sourceId}`,
    );
    await ready(page);

    await expect(page.getByTestId(`review-progress-${sourceId}`)).toBeVisible();
    const progressDisplay = page.getByTestId(
      `review-progress-percent-${sourceId}`,
    );
    if (sourceId === "101") {
      await expect(progressDisplay).toContainText("8");
      await expect(progressDisplay).toContainText("6");
      await expect(progressDisplay).toContainText("%");
      await expect(
        page.getByTestId("review-progress-transition-dash-101"),
      ).toBeVisible();
    } else {
      await expect(progressDisplay).toHaveText(progressText);
    }
    await expect(
      page.getByRole("img", {
        name: `Congratulations, ${progressValue}, September 12, 2025`,
      }),
    ).toBeVisible();
    await expect(page.getByText("Day streak", { exact: true })).toHaveCount(0);
    await page.screenshot({ path: `qa/screens/reviewProgress${sourceId}.png` });
  });
}

test("review progress source-100 renders the captured zero-percent frame", async ({
  page,
}) => {
  await page.goto("/?screen=reviewResult&fixture=1&reviewProgress=100");
  await ready(page);

  await expect(page.getByTestId("review-progress-100")).toBeVisible();
  await expect(page.getByTestId("review-progress-percent-100")).toHaveText(
    "0%",
  );
  await expect(page.getByRole("img", { name: "0 percent" })).toBeVisible();
  await expect(page.getByText("Congratulations", { exact: true })).toHaveCount(
    0,
  );
  await page.screenshot({ path: "qa/screens/reviewProgress100.png" });
});

test("source-059 Review result captures the shared scrolled summary state", async ({
  page,
}) => {
  await page.goto("/?screen=reviewResult&fixture=1");
  await ready(page);

  const scroll = page.getByTestId("review-result-scroll");
  const close = page.getByRole("button", {
    name: "Close streak",
    exact: true,
  });
  const closeBefore = await close.boundingBox();
  expect(closeBefore).not.toBeNull();

  await scroll.hover();
  await page.mouse.wheel(0, reviewSummaryCapture.source059.scrollOffsetY);
  await expect
    .poll(() =>
      scroll.evaluate((element) => (element as HTMLElement).scrollTop),
    )
    .toBeGreaterThan(0);

  const closeAfter = await close.boundingBox();
  expect(closeAfter).not.toBeNull();
  expect(closeAfter!.y).toBeCloseTo(closeBefore!.y, 0);
  await expect(page.getByText("4 words", { exact: true })).toBeVisible();
  await expect(page.getByText("50%", { exact: true })).toBeVisible();
  await expect(page.getByText("Got it! 2", { exact: true })).toBeVisible();
  await expect(page.getByText("Needs review 2", { exact: true })).toBeVisible();
  await expect(
    page.getByText("September 12, 2025", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Review Again", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Set Daily Review Count", exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: "qa/screens/reviewResult059.png",
    animations: "disabled",
  });

  await close.click();
  await expect(page.getByText("Good Afternoon", { exact: true })).toBeVisible();
});

test("source-105 review summary uses captured stats and a deterministic confetti frame", async ({
  page,
}) => {
  await page.goto("/?screen=reviewResult&fixture=1&reviewSummary=105");
  await ready(page);

  await expect(page.getByText("2", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("4 words", { exact: true })).toBeVisible();
  await expect(page.getByText("75%", { exact: true })).toBeVisible();
  await expect(page.getByText("Got it! 3", { exact: true })).toBeVisible();
  await expect(page.getByText("Needs review 1", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Review Again", exact: true }),
  ).toBeVisible();
  await expect(page.getByTestId("review-celebration-burst")).toBeVisible();
  await expect(page.getByTestId("review-confetti-particle")).toHaveCount(16);
  await page.screenshot({ path: "qa/screens/reviewSummary105.png" });

  await page.getByRole("button", { name: "Review Again", exact: true }).click();
  await expect(
    page.getByLabel("Hold to record your pronunciation attempt", {
      exact: true,
    }),
  ).toBeVisible();
});

for (const sourceId of ["103", "104"] as const) {
  test(`review completion source-${sourceId} renders its captured result variant`, async ({
    page,
  }) => {
    await page.goto(
      `/?screen=reviewResult&fixture=1&reviewCompletion=${sourceId}`,
    );
    await ready(page);

    await expect(page.getByTestId("review-completion-summary")).toBeVisible();
    await expect(page.getByTestId("review-completion-progress")).toContainText(
      "75%",
    );
    await expect(page.getByTestId("review-completion-group-good")).toHaveCount(
      1,
    );
    await expect(
      page
        .getByTestId("review-completion-group-good")
        .getByTestId("review-completion-word-card"),
    ).toHaveCount(3);
    await expect(
      page
        .getByTestId("review-completion-group-again")
        .getByTestId("review-completion-word-card"),
    ).toHaveCount(1);
    await expect(
      page.getByRole("button", { name: "Finish", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Review Again", exact: true }),
    ).toBeVisible();
    await expect(page.getByText("Day streak", { exact: true })).toHaveCount(0);
    await expect(page.getByTestId("review-confetti-particle")).toHaveCount(
      sourceId === "103" ? 25 : 0,
    );
    await page.screenshot({
      path: `qa/screens/reviewCompletion${sourceId}.png`,
      animations: "disabled",
    });

    if (sourceId === "103") {
      await page
        .getByRole("button", { name: "Review Again", exact: true })
        .click();
      await expect(
        page.getByLabel("Hold to record your pronunciation attempt", {
          exact: true,
        }),
      ).toBeVisible();
    } else {
      await page.getByRole("button", { name: "Finish", exact: true }).click();
      await expect(
        page.getByText("Good Afternoon", { exact: true }),
      ).toBeVisible();
    }
  });
}

test("source 013, 053, 055, and 093 render captured Result data and actions", async ({
  page,
}) => {
  fs.mkdirSync("qa/screens", { recursive: true });

  await page.goto("/?screen=result&fixture=1&resultSource=013");
  await ready(page);
  await expect(page.getByText("La Fleur", { exact: true })).toBeVisible();
  await expect(page.getByText("Flower", { exact: true })).toBeVisible();
  await expect(
    page.getByLabel("Play pronunciation", { exact: true }),
  ).toBeVisible();
  await page.screenshot({ path: "qa/screens/result013.png" });
  await page.getByLabel("Save sticker", { exact: true }).click();
  await expect(page.getByText("5 Words", { exact: true })).toBeVisible();

  await page.goto("/?screen=result&fixture=1&resultSource=053");
  await ready(page);
  await expect(page.getByText("Obscurité", { exact: true })).toBeVisible();
  await expect(page.getByText("Darkness", { exact: true })).toBeVisible();
  await expect(
    page.getByLabel("Play pronunciation", { exact: true }),
  ).toBeVisible();
  await page.screenshot({ path: "qa/screens/result053.png" });

  await page.goto("/?screen=result&fixture=1&resultSource=055");
  await ready(page);
  await expect(page.getByText("Sep 11", { exact: true })).toBeVisible();
  await expect(page.getByText("Tournesol", { exact: true })).toBeVisible();
  await expect(page.getByText("Sunflower", { exact: true })).toBeVisible();
  await expect(
    page.getByLabel("Play pronunciation", { exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel("Retake", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Save sticker", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Discard", { exact: true })).toBeVisible();
  await page.screenshot({ path: "qa/screens/result055.png" });

  await page.goto("/?screen=result&fixture=1&resultSource=093");
  await ready(page);
  await expect(page.getByText("Sep 11", { exact: true })).toBeVisible();
  await expect(
    page.getByText("Un Cornet De Glace", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Ice Cream Cone", { exact: true })).toBeVisible();
  const source093TargetBounds = await page
    .getByText("Un Cornet De Glace", { exact: true })
    .boundingBox();
  const source093NativeBounds = await page
    .getByText("Ice Cream Cone", { exact: true })
    .boundingBox();
  expect(source093TargetBounds).not.toBeNull();
  expect(source093NativeBounds).not.toBeNull();
  expect(
    source093TargetBounds!.y + source093TargetBounds!.height,
  ).toBeLessThanOrEqual(source093NativeBounds!.y);
  await expect(
    page.getByLabel("Play pronunciation", { exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel("Retake", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Save sticker", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Discard", { exact: true })).toBeVisible();
  await page.screenshot({ path: "qa/screens/result093.png" });
});
