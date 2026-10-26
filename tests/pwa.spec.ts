import { expect, test } from "@playwright/test";

test("production PWA publishes a valid manifest and install icons", async ({
  page,
  request,
}) => {
  const response = await page.goto("/");
  expect(response?.ok()).toBeTruthy();
  await expect(page.locator("#root")).not.toBeEmpty();
  await expect(page.locator('link[rel="manifest"]')).toHaveAttribute(
    "href",
    "/manifest.json",
  );

  const manifestResponse = await request.get("/manifest.json");
  expect(manifestResponse.ok()).toBeTruthy();
  const manifest = await manifestResponse.json();
  expect(manifest.name).toBe("CapWords Study");
  expect(manifest.short_name).toBe("CapWords");
  expect(manifest.display).toBe("standalone");
  expect(manifest.start_url).toBe("/");
  expect(manifest.scope).toBe("/");
  expect(manifest.icons).toHaveLength(2);

  for (const icon of manifest.icons as { src: string; sizes: string }[]) {
    const iconResponse = await request.get(icon.src);
    expect(iconResponse.ok()).toBeTruthy();
    const bytes = await iconResponse.body();
    const expectedSize = Number(icon.sizes.split("x")[0]);
    expect(bytes.subarray(0, 8)).toEqual(
      Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    );
    expect(bytes.readUInt32BE(16)).toBe(expectedSize);
    expect(bytes.readUInt32BE(20)).toBe(expectedSize);
  }
});

test("installed shell reloads offline from precache", async ({ page, context }) => {
  await page.goto("/");
  await page.waitForFunction(async () => {
    if (!("serviceWorker" in navigator)) return false;
    const registration = await navigator.serviceWorker.getRegistration("/");
    return Boolean(registration?.active);
  });
  await page.reload();
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
  await expect(page.getByText("Welcome to", { exact: true })).toBeVisible();

  await context.setOffline(true);
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.getByText("Welcome to", { exact: true })).toBeVisible();
  await expect(page.getByText("CapWords", { exact: true })).toBeVisible();
});

test("production build does not publish source captures or activate QA fixture routes", async ({
  page,
  request,
}) => {
  const capture = await request.get("/references/001.png");
  expect(capture.status()).toBe(404);

  await page.goto("/?screen=collection&fixture=1");
  await expect(page.getByText("Welcome to", { exact: true })).toBeVisible();
});
