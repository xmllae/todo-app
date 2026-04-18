const fs = require('fs');
const path = require('path');
const { test, expect } = require('@playwright/test');
const { AxeBuilder } = require('@axe-core/playwright');
const { PNG } = require('pngjs');

const RESULTS_DIR = path.join(process.cwd(), 'test-results');
const BASELINE_DIR = path.join(process.cwd(), 'tests', 'visual-baselines');
const MAX_PIXEL_DIFF_RATIO = 0.015;

let pixelmatch;

test.beforeAll(async () => {
  pixelmatch = (await import('pixelmatch')).default;
  fs.mkdirSync(RESULTS_DIR, { recursive: true });
});

async function seedUiState(page) {
  await page.addInitScript(() => {
    const now = new Date();
    const dateKey = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, '0'),
      String(now.getDate()).padStart(2, '0'),
    ].join('-');

    localStorage.setItem('tuole_guest_mode', '1');
    localStorage.setItem(
      'tuole_guest',
      JSON.stringify({
        tasks: {
          [dateKey]: [
            {
              id: 9001,
              text: 'Study concept',
              done: false,
              priority: 'high',
              created: Date.now(),
              star: false,
              planTime: '12:23',
              fromTpl: false,
              note: 'Review key examples.',
              subtasks: [
                { id: 1, text: 'Outline notes', done: false },
                { id: 2, text: 'Review mistakes', done: false },
              ],
              duration: 20,
              recurRuleId: 'daily-review',
              tags: ['study'],
              color: '',
              frozen: false,
              frozenUntil: '',
              status: 'todo',
              archived: false,
              dismissed: false,
            },
            {
              id: 9002,
              text: 'Plan small task',
              done: false,
              priority: 'normal',
              created: Date.now() + 1,
              star: false,
              planTime: '',
              fromTpl: false,
              note: '',
              subtasks: [],
              duration: 0,
              recurRuleId: '',
              tags: ['work'],
              color: '',
              frozen: false,
              frozenUntil: '',
              status: 'todo',
              archived: false,
              dismissed: false,
            },
          ],
        },
        templates: [],
        sortStates: {},
        recurRules: [
          {
            id: 'daily-review',
            type: 'daily',
            interval: 1,
            label: 'Daily',
            startDate: dateKey,
          },
        ],
        customTags: ['work', 'study'],
        defaultSortMode: 'created',
        autoSortEnabled: false,
      }),
    );
  });
}

async function openSeededApp(page, viewport) {
  await page.setViewportSize(viewport);
  await seedUiState(page);
  await page.goto('/');
  await expect(page.locator('#appMain')).toBeVisible();
  await expect(page.locator('#tList .task-item[data-id="9001"]')).toBeVisible();
  await page.waitForTimeout(250);
}

async function screenshotAndCompare(page, testInfo, name) {
  const actualPath = path.join(RESULTS_DIR, `ui-current-${name}.png`);
  const diffPath = path.join(RESULTS_DIR, `ui-diff-${name}.png`);
  const baselinePath = path.join(BASELINE_DIR, `${name}.png`);

  await page.screenshot({ path: actualPath, fullPage: true });
  await testInfo.attach(`ui-current-${name}`, {
    path: actualPath,
    contentType: 'image/png',
  });

  if (!fs.existsSync(baselinePath)) {
    testInfo.annotations.push({
      type: 'visual-baseline',
      description: `No baseline found at ${baselinePath}; screenshot saved for review.`,
    });
    return;
  }

  const actual = PNG.sync.read(fs.readFileSync(actualPath));
  const baseline = PNG.sync.read(fs.readFileSync(baselinePath));

  expect(actual.width, `${name} screenshot width changed`).toBe(baseline.width);
  expect(actual.height, `${name} screenshot height changed`).toBe(baseline.height);

  const diff = new PNG({ width: actual.width, height: actual.height });
  const mismatchPixels = pixelmatch(
    baseline.data,
    actual.data,
    diff.data,
    actual.width,
    actual.height,
    { threshold: 0.12 },
  );
  const mismatchRatio = mismatchPixels / (actual.width * actual.height);

  if (mismatchPixels > 0) {
    fs.writeFileSync(diffPath, PNG.sync.write(diff));
    await testInfo.attach(`ui-diff-${name}`, {
      path: diffPath,
      contentType: 'image/png',
    });
  }

  expect(mismatchRatio, `${name} pixel diff ratio`).toBeLessThanOrEqual(MAX_PIXEL_DIFF_RATIO);
}

async function checkAccessibility(page, testInfo, name) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  const critical = results.violations.filter((violation) => violation.impact === 'critical');
  const serious = results.violations.filter((violation) => violation.impact === 'serious');
  const reportPath = path.join(RESULTS_DIR, `axe-${name}.json`);

  fs.writeFileSync(reportPath, JSON.stringify(results.violations, null, 2));
  await testInfo.attach(`axe-${name}`, {
    path: reportPath,
    contentType: 'application/json',
  });

  testInfo.annotations.push({
    type: 'a11y',
    description: `${name}: ${critical.length} critical and ${serious.length} serious axe findings in report.`,
  });

  if (process.env.UI_A11Y_STRICT === '1') {
    expect(critical).toEqual([]);
  }
}

test('desktop UI visual and accessibility self-check', async ({ page }, testInfo) => {
  await openSeededApp(page, { width: 1600, height: 900 });

  await expect(page.locator('#globalSideNav')).toBeVisible();
  await expect(page.locator('#taskMode .task-dash-col')).toBeVisible();

  await screenshotAndCompare(page, testInfo, 'desktop');
  await checkAccessibility(page, testInfo, 'desktop');
});

test('mobile UI visual and accessibility self-check', async ({ page }, testInfo) => {
  await openSeededApp(page, { width: 390, height: 844 });

  const mainBox = await page.locator('#taskMode .task-main-col').boundingBox();
  const dashBox = await page.locator('#taskMode .task-dash-col').boundingBox();

  expect(mainBox && dashBox && dashBox.y).toBeGreaterThan((mainBox?.y || 0) + (mainBox?.height || 0) - 1);

  await screenshotAndCompare(page, testInfo, 'mobile');
  await checkAccessibility(page, testInfo, 'mobile');
});
