import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';

const kanjiCatalog = JSON.parse(readFileSync(new URL('../../data/joyo_kanji.json', import.meta.url), 'utf8'));
const kanjiItems = kanjiCatalog.categories.flatMap((category) => category.items);
const storageKey = 'jp-menus.study.v1.sushi';
const rows = (page) => page.locator('[data-menu-item-row]');
const screenNavigation = (page) => page.getByRole('navigation', { name: '학습 화면' });
const termInTable = (page, term) => page.locator('.cell-content[data-column="term"]').getByText(term, { exact: true });

async function openKanji(page) {
  await screenNavigation(page).getByRole('button', { name: /^상용한자/ }).click();
  await expect(page.getByRole('heading', { name: '상용한자 2,136' })).toBeVisible();
}

async function openMenus(page) {
  await screenNavigation(page).getByRole('button', { name: /^메뉴 단어/ }).click();
  await expect(page.getByRole('heading', { name: '일본 메뉴 정복' })).toBeVisible();
}

async function readProgress(page) {
  return page.evaluate((key) => JSON.parse(localStorage.getItem(key)), storageKey);
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await expect(page.getByRole('table')).toBeVisible();
});

test('kanji is a separate keyboard-operable screen and clears transient study controls', async ({ page }) => {
  await page.getByRole('button', { name: '참치·부위', exact: true }).click();
  await page.getByRole('searchbox', { name: '메뉴 검색' }).fill('중뱃살');
  await page.getByRole('button', { name: '외운 항목 숨기기' }).click();
  await page.getByRole('button', { name: '한자·표기 열 가리기' }).click();

  const kanjiButton = screenNavigation(page).getByRole('button', { name: /^상용한자/ });
  await kanjiButton.focus();
  await expect(kanjiButton).toBeFocused();
  await kanjiButton.press('Enter');
  await expect(kanjiButton).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('heading', { name: '상용한자 2,136' })).toBeVisible();
  await expect(page.getByRole('searchbox', { name: '한자 검색' })).toHaveValue('');
  await expect(page.getByRole('button', { name: '외운 항목 숨기기' })).toHaveAttribute('aria-pressed', 'false');
  await expect(page.getByRole('button', { name: '한자 열 가리기' })).toHaveAttribute('aria-pressed', 'false');
  await expect(page.getByRole('navigation', { name: '한자 학년' }).getByRole('button', { name: '전체', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('button', { name: '면·카레', exact: true })).toHaveCount(0);
  await expect(rows(page)).toHaveCount(60);

  await page.getByRole('searchbox', { name: '한자 검색' }).fill('鬱');
  await page.getByRole('button', { name: '음독·훈독 열 가리기' }).click();
  await openMenus(page);
  await expect(page.getByRole('searchbox', { name: '메뉴 검색' })).toHaveValue('');
  await expect(page.getByRole('button', { name: '후리가나 열 가리기' })).toHaveAttribute('aria-pressed', 'false');
  await expect(page.getByRole('button', { name: '전체', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('button', { name: '면·카레', exact: true })).toBeVisible();
  await expect(rows(page)).toHaveCount(60);
});

test('all seven grade filters and Japanese/Korean search apply to the kanji catalog', async ({ page }) => {
  await openKanji(page);
  const grades = page.getByRole('navigation', { name: '한자 학년' });
  const search = page.getByRole('searchbox', { name: '한자 검색' });

  for (const category of kanjiCatalog.categories) {
    const filter = grades.getByRole('button', { name: category.label_ko, exact: true });
    await filter.click();
    await expect(filter).toHaveAttribute('aria-pressed', 'true');
    await expect(rows(page)).toHaveCount(60);
    await expect(rows(page).first().locator('[data-column="term"]')).toHaveText(category.items[0].term);
  }

  await grades.getByRole('button', { name: '초등 1학년', exact: true }).click();
  await search.fill('鬱');
  await expect(rows(page)).toHaveCount(0);
  await grades.getByRole('button', { name: '중학교 이상', exact: true }).click();
  await expect(termInTable(page, '鬱')).toBeVisible();

  await grades.getByRole('button', { name: '전체', exact: true }).click();
  const mountain = kanjiItems.find((item) => item.term === '山');
  for (const query of [mountain.term, mountain.reading, mountain.meaning_ko]) {
    await search.fill(query);
    await expect(termInTable(page, '山')).toBeVisible();
  }
  await search.fill('해당없음-test-2136');
  await expect(rows(page)).toHaveCount(0);
});

test('kanji pagination loads 60 at a time and resets after filtering and screen changes', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 900 });
  await openKanji(page);
  await expect(rows(page)).toHaveCount(60);
  const canvas = page.locator('main');
  await canvas.evaluate((element) => element.scrollTo(0, element.scrollHeight));
  await expect(rows(page)).toHaveCount(120);

  await page.getByRole('navigation', { name: '한자 학년' }).getByRole('button', { name: '초등 1학년', exact: true }).click();
  await expect(rows(page)).toHaveCount(60);
  await canvas.evaluate((element) => element.scrollTo(0, element.scrollHeight));
  await expect(rows(page)).toHaveCount(80);
  await openMenus(page);
  await expect(rows(page)).toHaveCount(60);
  await openKanji(page);
  await expect(rows(page)).toHaveCount(60);
});

test('mastery persists in the released schema and reset affects only the current screen', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const menuRow = page.getByText('握り', { exact: true }).locator('xpath=ancestor::tr');
  await menuRow.locator('td:last-child button').click();
  await expect(page.locator('header')).toContainText(/1\s*\/\s*1,?576/);
  const menuId = (await readProgress(page)).mastered_ids[0];

  await openKanji(page);
  const firstKanji = kanjiItems[0];
  const firstRow = rows(page).first();
  await firstRow.locator('td:last-child button').click();
  await expect(firstRow).toHaveCSS('opacity', '0.35');
  await expect(page.locator('header')).toContainText(/1\s*\/\s*2,?136/);
  expect(await readProgress(page)).toEqual({ schema_version: 1, mastered_ids: [menuId, firstKanji.id] });

  await page.getByRole('button', { name: '외운 항목 숨기기' }).click();
  await expect(termInTable(page, firstKanji.term)).toHaveCount(0);
  await page.reload();
  await expect(menuRow).toHaveCSS('opacity', '0.35');
  await openKanji(page);
  await expect(rows(page).first().locator('[data-column="term"]')).toHaveText(firstKanji.term);
  await expect(rows(page).first()).toHaveCSS('opacity', '0.35');
  await expect(page.getByRole('button', { name: '외운 항목 숨기기' })).toHaveAttribute('aria-pressed', 'false');

  page.once('dialog', (dialog) => dialog.dismiss());
  await page.getByRole('button', { name: '초기화', exact: true }).click();
  await expect(rows(page).first()).toHaveCSS('opacity', '0.35');
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: '초기화', exact: true }).click();
  await expect(rows(page).first()).toHaveCSS('opacity', '1');
  await expect(page.locator('header')).toContainText(/0\s*\/\s*2,?136/);
  expect((await readProgress(page)).mastered_ids).toEqual([menuId]);

  await rows(page).first().locator('td:last-child button').click();
  await openMenus(page);
  await expect(menuRow).toHaveCSS('opacity', '0.35');
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: '초기화', exact: true }).click();
  await expect(menuRow).toHaveCSS('opacity', '1');
  expect((await readProgress(page)).mastered_ids).toEqual([firstKanji.id]);
  await page.reload();
  await openKanji(page);
  await expect(rows(page).first()).toHaveCSS('opacity', '0.35');
});

test('malformed persisted progress does not prevent either screen from starting', async ({ page }) => {
  for (const invalid of ['{broken', 'null', '{"schema_version":1,"mastered_ids":"bad"}']) {
    await page.evaluate(({ key, value }) => localStorage.setItem(key, value), { key: storageKey, value: invalid });
    await page.reload();
    await expect(page.getByRole('table')).toBeVisible();
    await openKanji(page);
    await expect(rows(page)).toHaveCount(60);
    await expect(page.locator('header')).toContainText(/0\s*\/\s*2,?136/);
  }
});

test('kanji screen fits all supported viewports and retains usable touch targets', async ({ page }) => {
  await openKanji(page);
  for (const width of [320, 375, 430, 480, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    const dimensions = await page.evaluate(() => {
      const canvas = document.querySelector('main').getBoundingClientRect();
      return { viewport: innerWidth, page: document.documentElement.scrollWidth, width: canvas.width, x: canvas.x };
    });
    expect(dimensions.page).toBe(dimensions.viewport);
    expect(dimensions.width).toBe(Math.min(width, 480));
    expect(Math.abs(dimensions.x - (width - dimensions.width) / 2)).toBeLessThanOrEqual(1);
    await expect(page.getByRole('columnheader', { name: '암기 상태' })).toBeVisible();

    for (const target of [
      screenNavigation(page).getByRole('button', { name: /^상용한자/ }),
      page.getByRole('navigation', { name: '한자 학년' }).getByRole('button', { name: '전체', exact: true }),
      rows(page).first().locator('td:last-child button'),
    ]) {
      const box = await target.boundingBox();
      expect(box.width).toBeGreaterThanOrEqual(44);
      expect(box.height).toBeGreaterThanOrEqual(44);
    }
  }
});

test('all kanji columns unmount text without changing geometry and the header stays sticky', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 900 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openKanji(page);
  const row = rows(page).first();
  const before = await row.evaluate((element) => ({
    height: element.getBoundingClientRect().height,
    cells: [...element.querySelectorAll('td')].map((cell) => ({ width: cell.getBoundingClientRect().width, height: cell.getBoundingClientRect().height })),
  }));

  for (const [column, label] of [['term', '한자'], ['reading', '음독·훈독'], ['meaning', '한국어 뜻']]) {
    await page.getByRole('button', { name: `${label} 열 가리기` }).click();
    await expect(page.getByRole('button', { name: `${label} 열 보이기` })).toHaveAttribute('aria-pressed', 'true');
    const content = row.locator(`[data-column="${column}"]`);
    await expect(content).toBeEmpty();
    await expect(content).toHaveAttribute('aria-hidden', 'true');
    await expect(content.locator('xpath=..')).toBeDisabled();
  }
  const after = await row.evaluate((element) => ({
    height: element.getBoundingClientRect().height,
    cells: [...element.querySelectorAll('td')].map((cell) => ({ width: cell.getBoundingClientRect().width, height: cell.getBoundingClientRect().height })),
  }));
  expect(after).toEqual(before);

  await page.locator('main').evaluate((element) => element.scrollTo(0, 1200));
  await expect.poll(async () => (await page.getByRole('button', { name: '한자 열 보이기' }).boundingBox()).y).toBeLessThanOrEqual(1);
  await page.getByRole('button', { name: '한자 열 보이기' }).click();
  await expect(row.locator('[data-column="term"]')).toHaveText(kanjiItems[0].term);
  await expect(row.locator('[data-column="reading"]')).toBeEmpty();
  await page.reload();
  await openKanji(page);
  const restoredReading = rows(page).first().locator('[data-column="reading"]');
  await expect(restoredReading).not.toBeEmpty();
  await expect(restoredReading.locator('xpath=..')).toHaveAttribute('title', kanjiItems[0].reading);
});

test('long on and kun readings open in a keyboard-operable detail sheet and copy completely', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await openKanji(page);
  const entry = kanjiItems.find((item) => item.term === '生');
  expect(entry.reading.length).toBeGreaterThan(15);
  await page.getByRole('searchbox', { name: '한자 검색' }).fill(entry.term);
  const row = termInTable(page, entry.term).locator('xpath=ancestor::tr');
  const reading = row.locator('[data-column="reading"]');
  await expect(reading).toContainText('음:');
  await expect(reading).toContainText('훈:');
  await expect(reading).toHaveCSS('overflow', 'hidden');
  const control = reading.locator('xpath=..');
  await control.focus();
  await control.press('Enter');
  const dialog = page.getByRole('dialog', { name: '음독·훈독' });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText(entry.reading, { exact: true })).toBeVisible();
  expect(await dialog.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
  await page.evaluate(() => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText(value) { window.__copiedKanjiReading = value; return Promise.resolve(); } },
    });
  });
  const copy = dialog.getByRole('button', { name: `${entry.reading} 복사` });
  await copy.focus();
  await copy.press('Enter');
  await expect(dialog.getByRole('status')).toContainText('복사됨');
  expect(await page.evaluate(() => window.__copiedKanjiReading)).toBe(entry.reading);

  await page.evaluate(() => {
    navigator.clipboard.writeText = () => Promise.reject(new Error('Clipboard permission denied'));
    document.execCommand = (command) => {
      if (command !== 'copy') return false;
      window.__fallbackKanjiReading = document.activeElement.value;
      return true;
    };
  });
  await copy.press('Enter');
  await expect.poll(() => page.evaluate(() => window.__fallbackKanjiReading)).toBe(entry.reading);
  await expect(copy).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(dialog.getByRole('button', { name: '닫기' })).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(copy).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(control).toBeFocused();
});
