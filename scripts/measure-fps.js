// Mide los fps de cada skin del juego abierto en /games/<id>/play (SPEC 13).
// Uso: navegar al juego y ejecutar browser_run_code_unsafe con filename "scripts/measure-fps.js".
async (page) => {
  const ROUNDS = 2;
  const WARMUP_MS = 2000;
  const SAMPLE_MS = 6000;
  const SLOW_FRAME_MS = 20;
  const MIN_FPS = 55;
  const MAX_GAP_TO_RETRO = 5;
  const MAX_SLOW_PERCENT = 2;

  const url = page.url();
  const gameId = url.match(/\/games\/([^/]+)\/play/)?.[1];
  if (!gameId) throw new Error(`Abre /games/<id>/play antes de medir (${url})`);
  const skins = await page
    .locator("select.skin-select")
    .first()
    .evaluate((select) => [...select.options].map((option) => option.value));

  // Se serializa al navegador: no puede usar variables externas
  const sampleFrames = ([sampleMs, slowFrameMs]) =>
    new Promise((resolve) => {
      const intervals = [];
      let last = null;
      const start = performance.now();
      const tick = (now) => {
        if (last !== null) intervals.push(now - last);
        last = now;
        if (now - start < sampleMs) return requestAnimationFrame(tick);
        const sorted = [...intervals].sort((a, b) => a - b);
        const slowFrames = intervals.filter((i) => i > slowFrameMs).length;
        resolve({
          fps: intervals.length / ((now - start) / 1000),
          p95: sorted[Math.floor(sorted.length * 0.95)],
          slowPercent: (slowFrames / intervals.length) * 100,
        });
      };
      requestAnimationFrame(tick);
    });

  // Se mide en la misma pestaña: otra ventana compite por la GPU y falsea los fps
  const skinKey = `${gameId}-skin`;
  const originalSkin = await page.evaluate((key) => localStorage.getItem(key), skinKey);
  const setSkin = (value) =>
    page.evaluate(
      ([key, skin]) =>
        skin === null ? localStorage.removeItem(key) : localStorage.setItem(key, skin),
      [skinKey, value],
    );

  const samples = {};
  for (let round = 0; round < ROUNDS; round++) {
    for (const skin of skins) {
      await setSkin(skin);
      await page.reload();
      await page.waitForSelector("canvas");
      await page.waitForTimeout(WARMUP_MS);
      const sample = await page.evaluate(sampleFrames, [SAMPLE_MS, SLOW_FRAME_MS]);
      (samples[skin] ??= []).push(sample);
    }
  }
  await setSkin(originalSkin);
  await page.reload();

  // Se toma la mejor ronda de cada skin para descartar picos ajenos al juego
  const best = (skin) =>
    samples[skin].reduce((a, b) => (b.fps > a.fps ? b : a));
  const retroFps = best("retro").fps;
  // Si la línea base no llega, la máquina está cargada y la comparación no sirve
  if (retroFps < MIN_FPS) {
    return `Medición inválida: retro solo llega a ${retroFps.toFixed(1)} fps. Libera la máquina y vuelve a medir.`;
  }
  return Object.fromEntries(
    skins.map((skin) => {
      const { fps, p95, slowPercent } = best(skin);
      const passes =
        fps >= MIN_FPS &&
        retroFps - fps <= MAX_GAP_TO_RETRO &&
        slowPercent <= MAX_SLOW_PERCENT;
      return [
        skin,
        `${fps.toFixed(1)} fps · p95 ${p95.toFixed(1)} ms · lentos ${slowPercent.toFixed(1)}% · ${passes ? "OK" : "FALLA"}`,
      ];
    }),
  );
}
