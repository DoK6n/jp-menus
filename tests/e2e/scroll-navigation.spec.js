import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';

const sushi = JSON.parse(readFileSync(new URL('../../data/sushi.json', import.meta.url), 'utf8'));
const kanji = JSON.parse(readFileSync(new URL('../../data/joyo_kanji.json', import.meta.url), 'utf8'));
const allItems = (catalog) => catalog.categories.flatMap((category) => category.items);
const rows = (page) => page.locator('[data-menu-item-row]');
const navigation = (page) => page.getByRole('navigation', { name: '페이지 이동' });
const topButton = (page) => navigation(page).getByRole('button', { name: '맨 위로 이동', exact: true });
const bottomButton = (page) => navigation(page).getByRole('button', { name: '맨 아래로 이동', exact: true });
const scroller = (page) => page.locator('main#study-scroll');

async function expectAtBottom(page) {
  await expect.poll(() => scroller(page).evaluate((element) =>
    element.scrollHeight - element.clientHeight - element.scrollTop,
  )).toBeLessThanOrEqual(1);
  await expect(bottomButton(page)).toBeDisabled();
  await expect(topButton(page)).toBeEnabled();
}

async function expectAtTop(page) {
  await expect.poll(() => scroller(page).evaluate((element) => element.scrollTop)).toBe(0);
  await expect(topButton(page)).toBeDisabled();
  await expect(bottomButton(page)).toBeEnabled();
}

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 375, height: 900 });
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await expect(page.getByRole('table')).toBeVisible();
});

test('scroll shortcuts reach the complete menu end and support keyboard return to the top', async ({ page }) => {
  await expectAtTop(page);
  await expect(rows(page)).toHaveCount(60);
  await expect(topButton(page)).toHaveAttribute('aria-controls', 'study-scroll');
  await expect(bottomButton(page)).toHaveAttribute('aria-controls', 'study-scroll');

  // Ordinary scrolling still appends just one batch, while the shortcut reaches the true end.
  await scroller(page).evaluate((element) => element.scrollTo(0, element.scrollHeight));
  await expect(rows(page)).toHaveCount(120);
  await expect(topButton(page)).toBeEnabled();
  await expect(bottomButton(page)).toBeEnabled();
  await bottomButton(page).focus();
  await bottomButton(page).press('Enter');
  await expect(rows(page)).toHaveCount(317);
  await expectAtBottom(page);
  await expect(rows(page).last().locator('[data-column="term"]')).toHaveText(allItems(sushi).at(-1).term);

  await topButton(page).focus();
  await topButton(page).press('Space');
  await expectAtTop(page);
  await expect(page.getByRole('heading', { name: '일본 메뉴 정복' })).toBeInViewport();
});

test('kanji end navigation respects all 2,136 entries, the active grade, and empty results', async ({ page }) => {
  await page.getByRole('navigation', { name: '학습 화면' }).getByRole('button', { name: '상용한자', exact: true }).click();
  await expect(rows(page)).toHaveCount(60);
  await expectAtTop(page);
  await bottomButton(page).click();
  await expect(rows(page)).toHaveCount(2136);
  await expectAtBottom(page);
  await expect(rows(page).last().locator('[data-column="term"]')).toHaveText(allItems(kanji).at(-1).term);

  await topButton(page).click();
  await expectAtTop(page);
  await page.getByRole('navigation', { name: '한자 학년' }).getByRole('button', { name: '초등 1학년', exact: true }).click();
  await expect(rows(page)).toHaveCount(60);
  await bottomButton(page).click();
  await expect(rows(page)).toHaveCount(80);
  await expectAtBottom(page);
  await expect(rows(page).last().locator('[data-column="term"]')).toHaveText(kanji.categories[0].items.at(-1).term);

  await topButton(page).click();
  await page.getByRole('searchbox', { name: '한자 검색' }).fill('scroll-empty-results-2136');
  await expect(rows(page)).toHaveCount(0);
  await expect(topButton(page)).toBeDisabled();
  await expect(bottomButton(page)).toBeDisabled();
});

test('circular controls stay within the mobile canvas and clear the final row at every supported width', async ({ page }) => {
  for (const width of [320, 375, 430, 480, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.reload();
    await expect(bottomButton(page)).toBeEnabled();
    await bottomButton(page).click();
    await expect(rows(page)).toHaveCount(317);
    await expectAtBottom(page);

    const canvas = await scroller(page).boundingBox();
    const footer = await navigation(page).boundingBox();
    expect(canvas.width).toBe(Math.min(width, 480));
    expect(footer.y).toBeGreaterThanOrEqual(canvas.y + canvas.height - 1);
    expect(footer.x).toBeGreaterThanOrEqual(canvas.x - 1);
    expect(footer.x + footer.width).toBeLessThanOrEqual(canvas.x + canvas.width + 1);
    expect(footer.y + footer.height).toBeLessThanOrEqual(901);

    for (const button of [topButton(page), bottomButton(page)]) {
      const shape = await button.evaluate((element) => {
        const box = element.getBoundingClientRect();
        return { x: box.x, y: box.y, width: box.width, height: box.height, radius: getComputedStyle(element).borderTopLeftRadius };
      });
      expect(shape.width).toBeGreaterThanOrEqual(44);
      expect(shape.height).toBeGreaterThanOrEqual(44);
      expect(Math.abs(shape.width - shape.height)).toBeLessThanOrEqual(1);
      expect(parseFloat(shape.radius)).toBeGreaterThanOrEqual(shape.radius.endsWith('%') ? 50 : shape.width / 2);
      expect(shape.x).toBeGreaterThan(canvas.x + canvas.width / 2);
      expect(shape.x + shape.width).toBeLessThanOrEqual(canvas.x + canvas.width);
      await expect(button.locator('svg')).toHaveAttribute('aria-hidden', 'true');
    }

    const lastRow = await rows(page).last().boundingBox();
    const lastMastery = await rows(page).last().locator('td:last-child button').boundingBox();
    expect(lastRow.y).toBeGreaterThanOrEqual(canvas.y);
    expect(lastRow.y + lastRow.height).toBeLessThanOrEqual(footer.y + 1);
    expect(lastMastery.y + lastMastery.height).toBeLessThanOrEqual(footer.y + 1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
  }
});

test('scroll navigation leaves the focus order while a cell detail sheet is open', async ({ page }) => {
  const cell = rows(page).first().locator('td').first().getByRole('button');
  await cell.click();
  const dialog = page.getByRole('dialog', { name: '한자·표기' });
  await expect(dialog).toBeVisible();
  await expect(navigation(page)).toBeHidden();
  await expect(page.getByRole('button', { name: '맨 위로 이동', exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: '맨 아래로 이동', exact: true })).toHaveCount(0);

  for (let step = 0; step < 3; step += 1) {
    await page.keyboard.press('Tab');
    expect(await dialog.evaluate((element) => element.contains(document.activeElement))).toBe(true);
  }
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(navigation(page)).toBeVisible();
  await expect(cell).toBeFocused();
  await expectAtTop(page);
});
