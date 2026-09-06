import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await expect(page.getByRole('table')).toBeVisible();
});

test('mobile layout has no horizontal overflow', async ({ page }) => {
  for (const width of [320, 375, 430, 480]) {
    await page.setViewportSize({ width, height: 900 });
    await page.reload();
    await expect(page.getByRole('table')).toBeVisible();

    const dimensions = await page.evaluate(() => ({
      viewport: window.innerWidth,
      page: document.documentElement.scrollWidth,
      canvas: document.querySelector('main').getBoundingClientRect().width,
    }));

    expect(dimensions.page).toBe(dimensions.viewport);
    expect(dimensions.canvas).toBe(width);
    await expect(page.getByRole('columnheader', { name: '암기 상태' })).toBeVisible();
  }
});

test('desktop keeps the mobile canvas centered', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.reload();

  const canvas = await page.locator('main').boundingBox();
  expect(canvas.width).toBe(480);
  expect(Math.abs(canvas.x - (1440 - 480) / 2)).toBeLessThanOrEqual(1);
});

test('column concealment preserves geometry and the sticky header', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 375, height: 900 });
  const term = page.getByText('握り', { exact: true });
  const cell = term.locator('xpath=ancestor::td');
  const row = term.locator('xpath=ancestor::tr');
  const beforeCell = await cell.boundingBox();
  const beforeRow = await row.boundingBox();

  await page.getByRole('button', { name: '한자·표기 열 가리기' }).click();
  await expect(page.getByRole('button', { name: '한자·표기 열 보이기' })).toHaveAttribute('aria-pressed', 'true');
  await expect(term).toHaveCSS('visibility', 'hidden');
  await expect(term).toHaveCSS('transition-property', 'visibility');
  await expect(term).toHaveCSS('transition-duration', '0.001s');

  const afterCell = await cell.boundingBox();
  const afterRow = await row.boundingBox();
  expect(afterCell.width).toBe(beforeCell.width);
  expect(afterCell.height).toBe(beforeCell.height);
  expect(afterRow.height).toBe(beforeRow.height);

  await page.getByRole('button', { name: '한자·표기 열 보이기' }).click();
  await expect(page.getByRole('button', { name: '한자·표기 열 가리기' })).toHaveAttribute('aria-pressed', 'false');
  await expect(term).toHaveCSS('visibility', 'visible');

  await page.getByRole('button', { name: '한자·표기 열 가리기' }).click();
  await expect(term).toHaveCSS('visibility', 'hidden');

  await page.locator('main').evaluate((canvas) => canvas.scrollTo(0, 1200));
  await page.waitForTimeout(100);
  const header = await page.getByRole('button', { name: '한자·표기 열 보이기' }).boundingBox();
  expect(header.y).toBeLessThanOrEqual(1);

  await page.getByRole('button', { name: '한자·표기 열 보이기' }).click();
  await expect(page.getByRole('button', { name: '한자·표기 열 가리기' })).toHaveAttribute('aria-pressed', 'false');
  await expect(term).toHaveCSS('visibility', 'visible');
});

test('menu rows render in batches and load more near the bottom', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 900 });
  const rows = page.locator('[data-menu-item-row]');

  await expect(rows).toHaveCount(60);
  await expect(page.getByRole('status')).toContainText('단어를 더 불러와요');

  await page.locator('main').evaluate((canvas) => canvas.scrollTo(0, canvas.scrollHeight));
  await expect(rows).toHaveCount(120);
});

test('mastered state dims a row and survives reload', async ({ page }) => {
  const term = page.getByText('握り', { exact: true });
  const row = term.locator('xpath=ancestor::tr');
  const button = row.locator('td:last-child button');

  await button.click();
  await expect(button).toHaveAttribute('aria-pressed', 'true');
  await expect(row).toHaveCSS('opacity', '0.35');

  await page.reload();
  const restoredRow = page.getByText('握り', { exact: true }).locator('xpath=ancestor::tr');
  await expect(restoredRow).toHaveCSS('opacity', '0.35');

  await restoredRow.locator('td:last-child button').click();
  await expect(restoredRow).toHaveCSS('opacity', '1');
});

test('hide mastered removes mastered rows and restores them', async ({ page }) => {
  const term = page.getByText('握り', { exact: true });
  const row = term.locator('xpath=ancestor::tr');

  await row.locator('td:last-child button').click();
  await page.getByRole('button', { name: '외운 항목 숨기기' }).click();

  await expect(page.getByText('握り', { exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: '외운 항목 숨기기' })).toHaveAttribute('aria-pressed', 'true');

  await page.getByRole('button', { name: '외운 항목 숨기기' }).click();
  await expect(page.getByText('握り', { exact: true })).toBeVisible();
  await expect(page.getByText('握り', { exact: true }).locator('xpath=ancestor::tr')).toHaveCSS('opacity', '0.35');
});

test('search and category filters narrow the catalog', async ({ page }) => {
  await page.getByRole('searchbox', { name: '메뉴 검색' }).fill('중뱃살');
  await expect(page.getByText('中とろ', { exact: true })).toBeVisible();
  await expect(page.getByText('握り', { exact: true })).toHaveCount(0);

  await page.getByRole('searchbox', { name: '메뉴 검색' }).fill('');
  await page.getByRole('button', { name: '참치·부위', exact: true }).click();
  await expect(page.locator('.cell-content').getByText('鮪', { exact: true })).toBeVisible();
  await expect(page.getByText('握り', { exact: true })).toHaveCount(0);
});

test('menu tabs switch catalogs and reset the category filter', async ({ page }) => {
  await page.getByRole('button', { name: '면·카레', exact: true }).click();
  await expect(page.getByRole('button', { name: '면·카레', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByText('ラーメン', { exact: true })).toBeVisible();
  await expect(page.getByText('握り', { exact: true })).toHaveCount(0);

  await page.getByRole('button', { name: '라멘집', exact: true }).click();
  await expect(page.getByRole('button', { name: '라멘집', exact: true })).toHaveAttribute('aria-pressed', 'true');

  await page.getByRole('button', { name: '육류·구이', exact: true }).click();
  await expect(page.getByRole('button', { name: '전체', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByText('焼肉', { exact: true })).toBeVisible();
});

test('empty search results keep the desktop canvas position stable', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 700 });

  const before = await page.evaluate(() => ({
    x: document.querySelector('main').getBoundingClientRect().x,
    canvasWidth: document.querySelector('main').getBoundingClientRect().width,
    scrollWidth: document.querySelector('main').clientWidth,
    clientWidth: document.documentElement.clientWidth,
  }));

  await page.getByRole('searchbox', { name: '메뉴 검색' }).fill('결과없음-xyz');
  await expect(page.getByText('보여줄 단어가 없어요')).toBeVisible();

  const after = await page.evaluate(() => {
    const canvas = document.querySelector('main');
    const canvasStyle = getComputedStyle(canvas);
    return {
      x: canvas.getBoundingClientRect().x,
      canvasWidth: canvas.getBoundingClientRect().width,
      scrollWidth: canvas.clientWidth,
      clientWidth: document.documentElement.clientWidth,
      overflowY: canvasStyle.overflowY,
      scrollbarGutter: canvasStyle.scrollbarGutter,
    };
  });

  expect(after.x).toBe(before.x);
  expect(after.canvasWidth).toBe(before.canvasWidth);
  expect(after.scrollWidth).toBe(before.scrollWidth);
  expect(after.clientWidth).toBe(before.clientWidth);
  expect(after.overflowY).toBe('scroll');
  expect(after.scrollbarGutter).toContain('stable');
});

test('long cells stay on one line and expose their full value on tap', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 900 });
  await page.getByRole('searchbox', { name: '메뉴 검색' }).fill('フィラデルフィアロール');

  const value = page.getByText('フィラデルフィアロール', { exact: true });
  await expect(value).toHaveAttribute('data-fit', 'tight');
  await expect(value).toHaveCSS('white-space', 'nowrap');
  await expect(value).toHaveCSS('overflow', 'hidden');

  const bounds = await value.evaluate((element) => ({
    valueRight: element.getBoundingClientRect().right,
    cellRight: element.closest('td').getBoundingClientRect().right,
  }));
  expect(bounds.valueRight).toBeLessThanOrEqual(bounds.cellRight);

  await value.click();
  const dialog = page.getByRole('dialog', { name: '한자·표기' });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText('フィラデルフィアロール', { exact: true })).toBeVisible();

  await dialog.getByRole('button', { name: '닫기' }).click();
  await expect(dialog).toHaveCount(0);
});
