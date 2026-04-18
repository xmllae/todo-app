const { test, expect } = require('@playwright/test');

async function seedGuestTask(page) {
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
              id: 424242,
              text: 'Study concept',
              done: false,
              priority: 'normal',
              created: Date.now(),
              star: false,
              planTime: '12:23',
              fromTpl: false,
              note: '',
              subtasks: [],
              duration: 20,
              recurRuleId: '',
              tags: [],
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
        recurRules: [],
        customTags: [],
        defaultSortMode: 'created',
        autoSortEnabled: false,
      }),
    );
  });
}

test('loads the app shell', async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveTitle(/Tuole/);
  await expect(page.locator('#appMain')).toBeAttached();
});

test('opens search with the Ctrl+K shortcut', async ({ page }) => {
  await seedGuestTask(page);
  await page.goto('/');

  await expect(page.locator('.header-search-trigger')).toBeVisible();
  await expect(page.locator('.header-search-kbd')).toHaveText('Ctrl K');

  await page.keyboard.press('Control+K');

  await expect(page.locator('#searchWrap')).toHaveClass(/open/);
  await expect(page.locator('#searchIn')).toBeFocused();
});

test('renders the desktop task workspace as three columns', async ({ page }) => {
  await seedGuestTask(page);
  await page.goto('/');

  await expect(page.locator('#globalSideNav')).toBeVisible();
  await expect(page.locator('#globalSideNav')).toContainText('日期快捷');
  await expect(page.locator('#globalSideNav')).toContainText('清单');

  const layout = await page.evaluate(() => {
    const nav = document.querySelector('#globalSideNav').getBoundingClientRect();
    const main = document.querySelector('#taskMode .task-main-col').getBoundingClientRect();
    const dash = document.querySelector('#taskMode .task-dash-col').getBoundingClientRect();
    return {
      navWidth: nav.width,
      navRight: nav.right,
      mainLeft: main.left,
      mainRight: main.right,
      mainWidth: main.width,
      dashLeft: dash.left,
    };
  });

  expect(layout.navWidth).toBeGreaterThanOrEqual(216);
  expect(layout.navWidth).toBeLessThanOrEqual(228);
  expect(layout.navRight).toBeLessThan(layout.mainLeft);
  expect(layout.mainWidth).toBeLessThanOrEqual(1080);
  expect(layout.dashLeft).toBeGreaterThan(layout.mainRight);
});

test('keeps the task list before dashboard cards on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await seedGuestTask(page);
  await page.goto('/');

  const item = page.locator('#tList .task-item[data-id="424242"]');
  await expect(item).toBeVisible();

  const layout = await page.evaluate(() => {
    const box = (selector) => {
      const el = document.querySelector(selector);
      const r = el.getBoundingClientRect();
      return { y: Math.round(r.y), h: Math.round(r.height) };
    };
    return {
      main: box('#taskMode .task-main-col'),
      dash: box('#taskMode .task-dash-col'),
      task: box('#tList .task-item[data-id="424242"]'),
    };
  });

  expect(layout.main.h).toBeGreaterThan(180);
  expect(layout.task.h).toBeGreaterThan(48);
  expect(layout.dash.y).toBeGreaterThan(layout.main.y + layout.main.h - 1);
});

test('header today context returns to today pending tasks', async ({ page }) => {
  await seedGuestTask(page);
  await page.goto('/');

  const todayLabel = await page.locator('#headerContext .header-context-date').textContent();
  await expect(page.locator('#headerContext .header-context-date')).toHaveText('今天');
  await expect(page.locator('#tList .task-item[data-id="424242"]')).toBeVisible();

  await page.evaluate(() => {
    quickGo(1);
    setF('done');
  });

  await expect(page.locator('#headerContext .header-context-date')).toHaveText(todayLabel || '');
  await expect(page.locator('#tList .task-item[data-id="424242"]')).toHaveCount(0);

  await page.locator('#headerContext').click();

  await expect(page.locator('#tList .task-item[data-id="424242"]')).toBeVisible();
  await expect(page.locator('#sidebar')).not.toHaveClass(/open/);
});

test('opens task detail from the empty check-slot gap', async ({ page }) => {
  await seedGuestTask(page);
  await page.goto('/');

  const item = page.locator('#tList .task-item[data-id="424242"]');
  await expect(item).toBeVisible();

  const slotBox = await item.locator('.task-ck-slot').boundingBox();
  const ringBox = await item.locator('.chk-ring').boundingBox();
  if (!slotBox || !ringBox) {
    throw new Error('Expected task check slot and ring to be visible');
  }

  await page.mouse.click(slotBox.x + slotBox.width - 2, slotBox.y + slotBox.height - 2);

  await expect(page.locator('#taskDetailPanel')).toHaveClass(/task-detail-panel--open/);
  await expect(page.locator('#drawer-task-title-input')).toHaveValue('Study concept');
});
