import { expect, test, type Locator, type Page } from '@playwright/test';
import { expectAccessible, expectNoHorizontalOverflow, watchErrors } from './helpers';

const MODULE = 'm14-placas/';

const LESSONS = [
  '01-simbolos-e-esquemas',
  '02-anatomia-da-placa',
  '03-identificando-componentes',
  '04-jumpers-e-dip-switches',
  '05-soldagem-e-dessoldagem',
  '06-bornes-conectores-e-emendas',
];

/** Scrolls through the page so every island hydrates, and waits for the simulations. */
async function hydrateAll(page: Page) {
  for (const island of await page.locator('astro-island').all()) {
    await island.scrollIntoViewIfNeeded();
    // A 3D model above an island keeps the main thread busy while it loads.
    await expect(island).not.toHaveAttribute('ssr', { timeout: 30_000 });
  }
  for (const sim of await page.locator('[data-simulation]').all()) {
    await expect(sim).toHaveAttribute('data-ready', '', { timeout: 30_000 });
  }
}

/** The hydrated lesson widget whose root has `selector`. */
async function widget(page: Page, selector: string) {
  const island = page.locator(`astro-island:has(${selector})`).first();
  await island.scrollIntoViewIfNeeded();
  await expect(island).not.toHaveAttribute('ssr', { timeout: 30_000 });
  return island.locator(selector);
}

/** Picks the radio choice labelled `name`; the styled label sits over the input. */
async function choose(root: Locator, name: string | RegExp) {
  await root.locator('label.lw__choice', { hasText: name }).click();
  await expect(root.getByRole('radio', { name })).toBeChecked();
}

test.describe('módulo 14: placas eletrônicas', () => {
  test('the module page lists the six lessons', async ({ page }) => {
    const errors = watchErrors(page);
    await page.goto(MODULE);
    for (const slug of LESSONS) {
      await expect(page.locator(`a[href$="/${MODULE}${slug}/"]`).first()).toBeVisible();
    }
    errors.expectClean();
  });

  for (const slug of LESSONS) {
    test(`lesson ${slug} loads its simulations and widgets without errors`, async ({ page }) => {
      // With software WebGL (CI) each 3D canvas blocks the page while its shaders compile.
      test.setTimeout(120_000);
      const errors = watchErrors(page);
      await page.goto(`${MODULE}${slug}/`);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      await hydrateAll(page);
      await expectNoHorizontalOverflow(page);
      await expectAccessible(page);
      errors.expectClean();
    });
  }

  test('lesson 14.1 shows the part behind each reference designator', async ({ page }) => {
    // The 3D board redraws on every pick, which is slow with software WebGL.
    test.setTimeout(90_000);
    const errors = watchErrors(page);
    await page.goto(`${MODULE}01-simbolos-e-esquemas/`);
    const esquema = await widget(page, 'section.esquema-placa');
    const ficha = esquema.locator('.placa-ficha');
    await expect(ficha).toContainText('U1');
    await expect(ficha).toContainText('555');
    await choose(esquema, /^K1$/);
    await expect(ficha.locator('.placa-ficha__ref')).toHaveText('K1');
    await expect(ficha).toContainText('Relé de 12 V');
    errors.expectClean();
  });

  test('the identification game of lesson 14.3 scores eight rounds', async ({ page }) => {
    test.setTimeout(90_000);
    const errors = watchErrors(page);
    await page.goto(`${MODULE}03-identificando-componentes/`);
    const jogo = await widget(page, 'section.jogo-placa');
    for (let round = 1; round <= 8; round++) {
      await expect(jogo.locator('legend')).toContainText(`Peça ${round} de 8`);
      await jogo.locator('label.lw__choice').first().click();
      await expect(jogo.locator('.jogo-placa__feedback')).toBeVisible();
      await jogo
        .getByRole('button', { name: round < 8 ? 'Próxima peça' : 'Ver o resultado' })
        .click();
    }
    await expect(jogo.locator('.jogo-placa__placar')).toHaveText(/^[0-8] de 8$/);
    await jogo.getByRole('button', { name: 'Jogar de novo' }).click();
    await expect(jogo.locator('legend')).toContainText('Peça 1 de 8');
    errors.expectClean();
  });

  test('the jumper of lesson 14.4 switches the timer between one shot and blinking', async ({
    page,
  }) => {
    test.setTimeout(90_000);
    const errors = watchErrors(page);
    await page.goto(`${MODULE}04-jumpers-e-dip-switches/`);
    const placa = await widget(page, 'section.jumper-dip');
    const relay = placa.locator('.jumper-dip__lampada');
    const trigger = placa.getByRole('button', { name: 'Apertar DISPARO' });
    await expect(relay).toHaveText('Relé desligado');
    await expect(placa).toContainText('liga o relé por 1,1 s');
    // LONGO and RV1 at 1 MΩ: a two-minute pulse, so no slow 3D redraw can hide it.
    await placa.getByRole('checkbox', { name: /LONGO/ }).check();
    await placa.getByRole('slider', { name: 'Trimpot TEMPO (RV1)' }).fill('1000000');
    await expect(placa).toContainText('liga o relé por 121 s');
    await trigger.click();
    await expect(relay).toHaveText('Relé ligado');
    await expect(trigger).toBeDisabled();
    // PISCA: the 555 runs by itself, and the button does nothing.
    await choose(placa, /PISCA/);
    await expect(placa).toContainText('fica 76 s ligado e 76 s desligado');
    await expect(relay).toHaveText('Relé ligado');
    await expect(trigger).toBeDisabled();
    await choose(placa, /Sem jumper/);
    await expect(relay).toHaveText('Relé desligado');
    await expect(placa).toContainText('imprevisível');
    errors.expectClean();
  });

  test('the bad contact calculator of lesson 14.6 follows P = I² × R', async ({ page }) => {
    const errors = watchErrors(page);
    await page.goto(`${MODULE}06-bornes-conectores-e-emendas/`);
    const calc = await widget(page, 'section.mau-contato');
    const power = calc.locator('[data-potencia]');
    const slider = calc.getByRole('slider', { name: 'Resistência do contato' });
    // Shower, 25 A: 2 mΩ gives 1,25 W and 50 mΩ gives 31 W.
    await expect(power).toHaveText(/^1,[23] W$/);
    await slider.fill('5');
    await expect(calc.locator('.lw__range-head')).toContainText('50 mΩ');
    await expect(power).toHaveText('31 W');
    // The 5 A LED strip makes 25 times less heat with the same contact.
    await choose(calc, /Fita de LED/);
    await expect(power).toHaveText(/^1,[23] W$/);
    errors.expectClean();
  });
});
