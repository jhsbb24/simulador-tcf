/*
  Pruebas automáticas del Simulador TCF Canada.
  Uso:  cd tests && npm install && npm test
  (Necesita Node.js 18+ y Playwright con Chromium: npx playwright install chromium)
*/
const http = require("http");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { chromium } = require("playwright");

const ROOT = path.resolve(__dirname, "..");
const DAY = 24 * 60 * 60 * 1000;
const START = new Date("2026-03-02T09:00:00"); // un lunes cualquiera, hora local

/* ---------- Servidor local mínimo (localhost = contexto seguro: portapapeles y micrófono) ---------- */
function startServer() {
  return new Promise(resolve => {
    const server = http.createServer((req, res) => {
      const url = decodeURIComponent(req.url.split("?")[0]);
      const file = path.join(ROOT, url === "/" ? "index.html" : url);
      if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); res.end(); return; }
      res.writeHead(200, { "Content-Type": file.endsWith(".html") ? "text/html; charset=utf-8" : "application/octet-stream" });
      fs.createReadStream(file).pipe(res);
    });
    server.listen(0, "127.0.0.1", () => resolve(server));
  });
}

/* ---------- Mini marco de pruebas ---------- */
const results = [];
async function test(name, fn) {
  const t0 = Date.now();
  try { await fn(); results.push([true, name]); console.log(`  ✓ ${name} (${Date.now() - t0} ms)`); }
  catch (e) { results.push([false, name]); console.log(`  ✗ ${name}\n      ${String(e && e.stack || e).split("\n").slice(0, 4).join("\n      ")}`); }
}
function assert(cond, msg) { if (!cond) throw new Error(msg || "assert falló"); }
function eq(a, b, msg) { if (a !== b) throw new Error(`${msg || "valores distintos"}: esperado ${JSON.stringify(b)}, obtenido ${JSON.stringify(a)}`); }

let browser, BASE;
async function newPage(opts = {}) {
  const ctx = await browser.newContext({
    viewport: opts.viewport || { width: 390, height: 844 },
    isMobile: !!opts.mobile, hasTouch: !!opts.mobile, acceptDownloads: true
  });
  await ctx.grantPermissions(["clipboard-read", "clipboard-write", "microphone"], { origin: BASE });
  const page = await ctx.newPage();
  page.errors = [];
  page.external = [];
  page.on("pageerror", e => page.errors.push(e.message));
  page.on("console", m => { if (m.type() === "error") page.errors.push(m.text()); });
  page.on("dialog", d => d.accept());
  page.on("request", r => { if (!r.url().startsWith(BASE) && !r.url().startsWith("blob:") && !r.url().startsWith("data:")) page.external.push(r.url()); });
  if (opts.initScript) await page.addInitScript(opts.initScript);
  if (opts.clock) await page.clock.install({ time: START });
  await page.goto(BASE + "/index.html" + (opts.hash || ""));
  return page;
}
const S = page => page.evaluate(() => JSON.parse(JSON.stringify(window.TCF.state)));
const txt = (page, sel) => page.locator(sel).first().innerText();
async function go(page, route) { await page.evaluate(r => { location.hash = "#" + r; }, route); await page.waitForTimeout(30); }
async function noErrors(page) { eq(page.errors.length, 0, "errores en la página: " + page.errors.join(" | ")); }

(async () => {
  const server = await startServer();
  BASE = `http://127.0.0.1:${server.address().port}`;
  browser = await chromium.launch({ args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream", "--autoplay-policy=no-user-gesture-required"] });

  console.log("\n📚 Contenido");
  await test("Bancos: ≥30 temas por tarea, ids únicos y los 11 ejes en cada tarea", async () => {
    const page = await newPage();
    const info = await page.evaluate(() => {
      const { BANK, THEMES } = window.TCF;
      const out = {};
      const ids = new Set();
      let dup = 0;
      for (const k of Object.keys(BANK)) {
        const ths = {};
        BANK[k].forEach(t => { if (ids.has(t.id)) dup++; ids.add(t.id); ths[t.th] = (ths[t.th] || 0) + 1; });
        const missing = Object.keys(THEMES).filter(th => th !== "perso" && !ths[th]);
        const bad = BANK[k].filter(t => !THEMES[t.th]).length;
        out[k] = { n: BANK[k].length, missing, bad, minPerTheme: Math.min(...Object.keys(THEMES).filter(th => th !== "perso").map(th => ths[th] || 0)) };
      }
      return { out, dup };
    });
    eq(info.dup, 0, "ids repetidos");
    for (const k of ["EE1", "EE2", "EE3", "EO1", "EO2", "EO3"]) {
      const o = info.out[k];
      assert(o.n >= 30, `${k}: solo ${o.n} temas`);
      eq(o.missing.length, 0, `${k}: faltan ejes ${o.missing}`);
      eq(o.bad, 0, `${k}: temas con eje inválido`);
      assert(o.minPerTheme >= 3, `${k}: algún eje tiene menos de 3 temas`);
    }
    await noErrors(page);
  });
  await test("EO Tâche 2: cada situación tiene entre 10 y 15 ideas; EE Tâche 3 tiene dos documentos", async () => {
    const page = await newPage();
    const r = await page.evaluate(() => ({
      ideas: window.TCF.BANK.EO2.map(t => t.ideas.length),
      docs: window.TCF.BANK.EE3.every(t => t.d1 && t.d2 && t.a1 && t.a2),
      eo1: window.TCF.BANK.EO1.every(t => t.q.length >= 4)
    }));
    assert(r.ideas.every(n => n >= 10 && n <= 15), "ideas fuera de 10-15: " + r.ideas.join(","));
    assert(r.docs, "falta algún documento en EE3");
    assert(r.eo1, "algún entretien tiene menos de 4 preguntas");
  });
  await test("Tarjetas: ≥80 y las 7 categorías con contenido", async () => {
    const page = await newPage();
    const r = await page.evaluate(() => {
      const { CARDS, CARD_CATS } = window.TCF;
      const per = {};
      CARDS.forEach(c => { per[c.cat] = (per[c.cat] || 0) + 1; });
      return { n: CARDS.length, per, cats: Object.keys(CARD_CATS), ok: CARDS.every(c => c.es && c.fr && c.ex), ids: new Set(CARDS.map(c => c.id)).size };
    });
    assert(r.n >= 80, "solo " + r.n + " tarjetas");
    eq(r.ids, r.n, "ids de tarjetas repetidos");
    eq(r.cats.length, 7, "categorías");
    r.cats.forEach(c => assert(r.per[c] >= 10, `categoría ${c} con ${r.per[c]} tarjetas`));
    assert(r.ok, "tarjeta incompleta");
  });

  console.log("\n✍️ Contador de palabras");
  await test("countWords cuenta como el examen", async () => {
    const page = await newPage();
    const cases = await page.evaluate(() => [
      ["", 0], ["   ", 0], ["Bonjour", 1], ["Bonjour !", 1], ["c'est-à-dire", 1], ["je ne l'ai pas vu", 5],
      ["Salut ! Comment ça va ? Très bien : merci.", 7], ["« Bonjour » — dit-il", 2], ["Il a 25 ans.", 4], ["un\nbon\tfils", 3]
    ].map(([s, n]) => [s, n, window.TCF.countWords(s)]));
    cases.forEach(([s, n, got]) => eq(got, n, `countWords(${JSON.stringify(s)})`));
  });
  await test("Contador en vivo: rojo fuera de 60–120 y verde dentro (Tâche 1)", async () => {
    const page = await newPage({ hash: "#escrita" });
    await page.click('[data-act="ee-practice"][data-task="1"]');
    await page.click('[data-act="ee-start"]');
    const words = n => Array.from({ length: n }, (_, i) => "mot" + i).join(" ");
    for (const [n, cls] of [[0, "bad"], [59, "bad"], [60, "ok"], [120, "ok"], [121, "bad"]]) {
      await page.fill("#ee-text", words(n));
      eq(await txt(page, "#ee-wc-num"), String(n), "número de palabras");
      const c = await page.getAttribute("#ee-wc", "class");
      assert(c.includes(cls), `con ${n} palabras se esperaba ${cls}, clase: ${c}`);
    }
    assert((await txt(page, "#ee-wc-msg")).includes("sobran 1"), "mensaje de sobran");
    await page.fill("#ee-text", words(50));
    assert((await txt(page, "#ee-wc-msg")).includes("faltan 10"), "mensaje de faltan");
    await noErrors(page);
  });
  await test("Botones de acentos insertan la letra en el texto", async () => {
    const page = await newPage({ hash: "#escrita" });
    await page.click('[data-act="ee-practice"][data-task="2"]');
    await page.click('[data-act="ee-start"]');
    await page.fill("#ee-text", "Je suis all");
    await page.focus("#ee-text");
    await page.click('.accents button[data-ch="é"]');
    eq(await page.inputValue("#ee-text"), "Je suis allé", "texto con acento");
  });

  console.log("\n⏱️ Cronómetros");
  await test("Escrita · práctica: cuenta regresiva de 10:00, aviso y fin automático", async () => {
    const page = await newPage({ hash: "#escrita", clock: true });
    await page.click('[data-act="ee-practice"][data-task="1"]');
    await page.click('[data-act="ee-start"]');
    eq(await txt(page, "#ee-clock"), "10:00", "inicio");
    await page.fill("#ee-text", "Bonjour Marie, je t'écris pour te raconter ma nouvelle vie.");
    await page.clock.fastForward(60 * 1000);
    eq(await txt(page, "#ee-clock"), "09:00", "después de 1 min");
    await page.clock.fastForward(5 * 60 * 1000 + 30 * 1000);
    eq(await txt(page, "#ee-clock"), "03:30", "después de 6 min 30");
    assert((await page.getAttribute("#ee-timerbar", "class")).includes("warn"), "aviso en los últimos 5 min");
    await page.clock.fastForward(3 * 60 * 1000 + 31 * 1000);
    await page.waitForSelector("text=Tarea terminada");
    assert(await page.isVisible("text=Se acabó el tiempo"), "aviso de tiempo terminado");
    const st = await S(page);
    eq(st.sessions.length, 1, "sesión registrada");
    eq(st.sessions[0].comp, "EE"); eq(st.sessions[0].task, 1); eq(st.sessions[0].words, 10, "palabras guardadas");
    await noErrors(page);
  });
  await test("Escrita · examen completo: un solo cronómetro de 60:00 para las 3 tareas", async () => {
    const page = await newPage({ hash: "#escrita", clock: true });
    await page.click('[data-act="ee-exam"]');
    await page.click('[data-act="ee-start"]');
    eq(await txt(page, "#ee-clock"), "60:00", "inicio examen");
    eq(await page.locator(".tab").count(), 3, "3 pestañas");
    await page.fill("#ee-text", "Premier texte pour la tâche un.");
    await page.click('[data-act="ee-tab"][data-i="1"]');
    assert((await txt(page, "#ee-topic, .consigne")).includes("Tâche 2"), "consigna de la Tâche 2");
    await page.fill("#ee-text", "Deuxième texte.");
    await page.clock.fastForward(20 * 60 * 1000);
    eq(await txt(page, "#ee-clock"), "40:00", "el tiempo es común");
    eq(await txt(page, "#ee-tabwc-0"), "6 mots", "contador de la pestaña 1");
    await page.click('[data-act="ee-tab"][data-i="0"]');
    eq(await page.inputValue("#ee-text"), "Premier texte pour la tâche un.", "el texto de la Tâche 1 se conserva");
    await page.clock.fastForward(40 * 60 * 1000 + 1000);
    await page.waitForSelector("text=Examen terminado");
    const st = await S(page);
    eq(st.sessions.filter(s => s.mode === "examen").length, 2, "2 tareas con texto registradas (la 3 estaba vacía)");
    await noErrors(page);
  });
  await test("Oral · Tâche 2: 2:00 de preparación y luego 3:30 de interacción", async () => {
    const page = await newPage({ hash: "#oral", clock: true });
    await page.click('[data-act="eo-practice"][data-task="2"]');
    await page.click('[data-act="eo-help"]');
    const n = await page.locator(".ideas li").count();
    assert(n >= 10 && n <= 15, "ideas visibles: " + n);
    await page.click('[data-act="eo-help"]');
    eq(await page.locator(".ideas li").count(), 0, "la ayuda se oculta");
    await page.click('[data-act="eo-start"]');
    assert((await txt(page, ".timer-label")).includes("Preparación"), "fase de preparación");
    eq(await txt(page, "#eo-clock"), "02:00");
    await page.clock.fastForward(120 * 1000 + 300);
    assert((await txt(page, ".timer-label")).includes("Hablando"), "fase de habla");
    eq(await txt(page, "#eo-clock"), "03:30");
    await page.clock.fastForward(210 * 1000 + 300);
    await page.waitForSelector("text=Tarea terminada");
    const st = await S(page);
    eq(st.sessions.length, 1); eq(st.sessions[0].comp, "EO"); eq(st.sessions[0].task, 2);
    await noErrors(page);
  });
  await test("Oral · Tâche 1: preguntas del examinador una por una (2:00)", async () => {
    const page = await newPage({ hash: "#oral", clock: true });
    await page.click('[data-act="eo-practice"][data-task="1"]');
    await page.click('[data-act="eo-start"]');
    eq(await txt(page, "#eo-clock"), "02:00");
    const q1 = await txt(page, "#eo-question");
    assert(q1.includes("présenter"), "la primera pregunta es la presentación");
    await page.click('[data-act="eo-next-q"]');
    const q2 = await txt(page, "#eo-question");
    assert(q2 !== q1, "la pregunta cambia");
    assert((await page.innerText("#eo-topic")).includes("Pregunta 2 de"), "contador de preguntas");
  });
  await test("Oral · examen completo: 2:00 → 10 s → 2:00 + 3:30 → 10 s → 4:30 (12 min)", async () => {
    const page = await newPage({ hash: "#oral", clock: true });
    await page.click('[data-act="eo-exam"]');
    await page.click('[data-act="eo-start"]');
    eq(await txt(page, "#eo-clock"), "02:00", "T1");
    await page.clock.fastForward(120 * 1000 + 300);
    eq(await txt(page, "#eo-clock"), "00:10", "pausa");
    await page.clock.fastForward(10 * 1000 + 300);
    assert((await txt(page, ".timer-label")).includes("Preparación · Tâche 2"), "T2 preparación");
    await page.clock.fastForward(120 * 1000 + 300);
    eq(await txt(page, "#eo-clock"), "03:30", "T2 habla");
    await page.clock.fastForward(210 * 1000 + 300);
    await page.clock.fastForward(10 * 1000 + 300);
    assert((await txt(page, ".timer-label")).includes("Tâche 3"), "T3");
    eq(await txt(page, "#eo-clock"), "04:30", "T3 habla");
    await page.clock.fastForward(270 * 1000 + 300);
    await page.waitForSelector("text=Examen oral terminado");
    const st = await S(page);
    eq(st.sessions.map(s => s.task).join(","), "1,2,3", "3 tareas registradas");
    await noErrors(page);
  });

  console.log("\n📋 Copiar y guardar");
  await test("«Copiar para corrección» copia tarea, consigna y texto", async () => {
    const page = await newPage({ hash: "#escrita" });
    await page.click('[data-act="ee-practice"][data-task="3"]');
    const title = await txt(page, "#ee-topic h2");
    await page.click('[data-act="ee-start"]');
    await page.fill("#ee-text", "À mon avis, le débat est intéressant.");
    await page.click('[data-act="ee-copy"]');
    await page.waitForTimeout(100);
    const clip = await page.evaluate(() => navigator.clipboard.readText());
    ["Claude", "Tâche 3", "120 à 180 mots", "Consigne :", "Document 1", "Document 2", "Mon texte :", "À mon avis, le débat est intéressant.", "Nombre de mots : 7"]
      .forEach(s => assert(clip.includes(s), "falta en el portapapeles: " + s));
    assert(clip.includes(title.replace(/ /g, " ")), "falta el título del tema");
  });
  await test("La tarea en curso sobrevive a una recarga de la página", async () => {
    const page = await newPage({ hash: "#escrita" });
    await page.click('[data-act="ee-practice"][data-task="1"]');
    await page.click('[data-act="ee-start"]');
    await page.fill("#ee-text", "Texte à ne pas perdre.");
    await page.waitForTimeout(500);
    await page.reload();
    await go(page, "escrita");
    eq(await page.inputValue("#ee-text"), "Texte à ne pas perdre.", "texto recuperado");
    assert(/^(09:[45]\d|10:00)$/.test(await txt(page, "#ee-clock")), "el cronómetro sigue");
  });

  console.log("\n🎙️ Grabación");
  await test("Grabar, escuchar y descargar la voz (MediaRecorder)", async () => {
    const page = await newPage({ hash: "#oral" });
    await page.click('[data-act="eo-practice"][data-task="3"]');
    await page.click('[data-act="eo-start"]');
    await page.click('[data-act="rec-start"]');
    await page.waitForSelector(".rec-status");
    await page.waitForTimeout(1500);
    await page.click('[data-act="rec-stop"]');
    await page.waitForSelector("#eo-recorder audio");
    const info = await page.evaluate(async () => {
      const a = document.querySelector("#eo-recorder a[download]");
      const blob = await (await fetch(a.href)).blob();
      return { name: a.getAttribute("download"), size: blob.size };
    });
    assert(/^TCF-oral-tache3-.*\.(webm|m4a|ogg)$/.test(info.name), "nombre de archivo: " + info.name);
    assert(info.size > 500, "audio vacío: " + info.size);
    const dl = page.waitForEvent("download");
    await page.click("#eo-recorder a[download]");
    assert((await dl).suggestedFilename() === info.name, "descarga");
    await page.click('[data-act="eo-end-task"]');
    await page.waitForSelector("text=Tarea terminada");
    assert(await page.locator(".rec-item audio").count() === 1, "la grabación aparece en el resumen");
    await noErrors(page);
  });

  console.log("\n🃏 Tarjetas");
  await test("«No lo sabía» hace volver la tarjeta 3 tarjetas después; «Lo sabía» la manda a mañana", async () => {
    const page = await newPage({ hash: "#tarjetas", clock: true });
    const first = await page.getAttribute("#flashcard", "data-id");
    await page.click('button[data-act="card-reveal"]');
    assert(await page.isVisible("#fc-answer"), "respuesta visible");
    await page.click('[data-act="card-no"]');
    const known = [];
    for (let i = 0; i < 3; i++) {
      const id = await page.getAttribute("#flashcard", "data-id");
      assert(id !== first, "la fallada no vuelve inmediatamente");
      known.push(id);
      await page.click('button[data-act="card-reveal"]');
      await page.click('[data-act="card-yes"]');
    }
    eq(await page.getAttribute("#flashcard", "data-id"), first, "la fallada vuelve tras 3 tarjetas");
    const st = await S(page);
    eq(st.cards[first].box, 0, "caja de la fallada");
    eq(st.cards[first].due, "2026-03-02", "la fallada se repasa hoy");
    known.forEach(id => { eq(st.cards[id].box, 1, "caja de la acertada"); eq(st.cards[id].due, "2026-03-03", "la acertada vuelve mañana"); });
    await noErrors(page);
  });
  await test("Repetición espaciada: 3 aciertos en días distintos = dominada (y se ve en Progreso)", async () => {
    const page = await newPage({ hash: "#tarjetas", clock: true });
    await page.click('[data-act="card-filter"][data-cat="conn"]');
    const answerAll = async () => {
      let n = 0;
      while (await page.locator("#flashcard").count()) {
        await page.click('button[data-act="card-reveal"]');
        await page.click('[data-act="card-yes"]');
        n++;
      }
      return n;
    };
    const total = await answerAll();
    assert(total >= 10, "tarjetas en la categoría: " + total);
    eq(await txt(page, "#cards-due"), "0", "nada pendiente hoy");
    await page.clock.fastForward(DAY);
    await page.click('[data-act="card-filter"][data-cat="conn"]');
    eq(await txt(page, "#cards-due"), String(total), "todas vuelven al día siguiente");
    eq(await answerAll(), total);
    await page.clock.fastForward(2 * DAY);
    await page.click('[data-act="card-filter"][data-cat="conn"]');
    eq(await txt(page, "#cards-due"), "0", "aún no toca (caja 2 = 3 días)");
    await page.clock.fastForward(DAY);
    await page.click('[data-act="card-filter"][data-cat="conn"]');
    eq(await answerAll(), total);
    eq(await txt(page, "#cards-mastered"), `${total}/${total}`, "dominadas en Tarjetas");
    await go(page, "progreso");
    eq(await txt(page, '.cat-row[data-cat="conn"] .mastered'), `${total}/${total}`, "dominadas en Progreso");
    eq(await txt(page, '.cat-row[data-cat="en"] .mastered'), "0/18", "otra categoría sin dominar");
    await noErrors(page);
  });

  console.log("\n📈 Seguimiento");
  await test("Resultados CO: lista 1-40 marcada, gráfica con meta NCLC 8 y tarjeta de competencia", async () => {
    const page = await newPage({ hash: "#comprension", clock: true });
    const link = page.locator("#ftcf-link");
    eq(await link.getAttribute("href"), "https://fuck-tcf.xyz");
    eq(await link.getAttribute("target"), "_blank");
    const add = async (test, score, date) => {
      await page.selectOption('#res-form [name="type"]', "CO");
      await page.selectOption('#res-form [name="test"]', String(test));
      await page.fill('#res-form [name="score"]', String(score));
      await page.fill('#res-form [name="date"]', date);
      await page.fill('#res-form [name="note"]', "Erreurs sur les chiffres");
      await page.click('#res-form button[type="submit"]');
    };
    await add(1, 420, "2026-02-27");
    await add(2, 480, "2026-02-28");
    await add(3, 510, "2026-03-01");
    await page.fill('#res-form [name="score"]', "800");
    await page.click('#res-form button[type="submit"]');
    assert(await page.isVisible("#res-error"), "valida puntaje > máximo");
    eq(await txt(page, "#done-count-CO"), "3/40", "tests marcados");
    eq(await page.getAttribute('#grid-CO [data-n="2"]', "aria-pressed"), "true");
    await page.click('#grid-CE [data-n="7"]');
    eq(await txt(page, "#done-count-CE"), "1/40", "marcar a mano");
    eq(await page.locator("#results-list li").count(), 3, "3 resultados");
    await go(page, "progreso");
    eq(await page.locator('[data-chart="CO"] .chart-dot').count(), 3, "3 puntos en la gráfica");
    eq(await page.locator('[data-chart="CO"] .chart-goal').count(), 1, "línea de meta");
    assert((await page.locator('[data-chart="CO"] .chart-goal-label').textContent()).includes("503"), "meta 503");
    assert((await txt(page, "#comp-CO")).includes("510/699"), "último resultado");
    assert((await txt(page, "#comp-CO")).includes("Meta alcanzada"), "meta alcanzada (510 ≥ 503)");
    assert((await txt(page, "#comp-CE")).includes("Meta NCLC 8"), "meta visible en CE");
    await page.hover('[data-chart="CO"] .chart-hit[data-i="2"]');
    assert((await txt(page, "#tip-CO")).includes("Test 3"), "información al pasar el ratón");
    await noErrors(page);
  });
  await test("Racha de días seguidos y registro del NCLC de Claude", async () => {
    const page = await newPage({ hash: "#tarjetas", clock: true });
    for (let d = 0; d < 3; d++) {
      if (d) { await page.clock.fastForward(DAY); await page.click('[data-act="card-filter"][data-cat="faux"]'); }
      await page.click('button[data-act="card-reveal"]');
      await page.click('[data-act="card-yes"]');
    }
    await go(page, "progreso");
    eq(await txt(page, "#streak-current"), "3", "racha de 3 días");
    await page.clock.fastForward(2 * DAY);
    await go(page, "inicio"); await go(page, "progreso");
    eq(await txt(page, "#streak-current"), "0", "la racha se corta si faltas un día");
    eq(await txt(page, "#streak-best"), "3", "mejor racha");
    await go(page, "escrita");
    await page.click('[data-act="ee-practice"][data-task="2"]');
    await page.click('[data-act="ee-start"]');
    await page.fill("#ee-text", "Un texte court.");
    await page.click('[data-act="ee-finish"]');
    await page.selectOption('select[data-change="nclc"]', "7");
    await go(page, "progreso");
    assert((await txt(page, "#comp-EE")).includes("NCLC 7"), "NCLC registrado en la competencia");
    assert((await txt(page, "#prod-table")).includes("1"), "tabla de tareas por tipo");
    eq(await txt(page, "#streak-current"), "1", "practicar hoy reinicia la racha");
    await noErrors(page);
  });
  await test("«Siguiente paso sugerido» recomienda lo menos practicado en 7 días", async () => {
    const page = await newPage({ hash: "#progreso", clock: true });
    const key = async () => { await go(page, "inicio"); await go(page, "progreso"); return page.getAttribute("#view-progreso #suggest-card", "data-key"); };
    eq(await key(), "EO", "sin datos: empieza por oral");
    for (let i = 0; i < 3; i++) {
      await go(page, "oral");
      await page.click('[data-act="eo-practice"][data-task="1"]');
      await page.click('[data-act="eo-start"]');
      await page.click('[data-act="eo-end-task"]');
      await page.click('[data-act="eo-close"]');
    }
    eq(await key(), "EE", "con 3 orales sugiere escrita");
    assert((await txt(page, "#view-progreso #suggest-card")).includes("Tâche 1"), "sugiere la tarea menos hecha");
    await go(page, "comprension");
    for (const [type, t] of [["CO", 1], ["CO", 2], ["CE", 1]]) {
      await page.selectOption('#res-form [name="type"]', type);
      await page.selectOption('#res-form [name="test"]', String(t));
      await page.fill('#res-form [name="score"]', "450");
      await page.click('#res-form button[type="submit"]');
    }
    for (let i = 0; i < 3; i++) {
      await go(page, "escrita");
      await page.click('[data-act="ee-practice"][data-task="1"]');
      await page.click('[data-act="ee-start"]');
      await page.fill("#ee-text", "Bonjour à tous.");
      await page.click('[data-act="ee-finish"]');
      await page.click('[data-act="ee-close"]');
    }
    eq(await key(), "TAR", "tarjetas (0 repasos) es lo menos practicado");
    await page.clock.fastForward(8 * DAY);
    eq(await key(), "EO", "una semana después, todo vuelve a cero");
    await noErrors(page);
  });
  await test("Exportar e importar respaldo (JSON) entre dispositivos", async () => {
    const page = await newPage({ hash: "#comprension" });
    await page.fill('#res-form [name="score"]', "33");
    await page.fill('#res-form [name="max"]', "39");
    await page.click('#res-form button[type="submit"]');
    eq(await page.inputValue('#res-form [name="max"]'), "39", "recuerda el último máximo usado");
    await go(page, "progreso");
    const dlP = page.waitForEvent("download");
    await page.click('[data-act="export"]');
    const dl = await dlP;
    assert(/^respaldo-tcf-\d{4}-\d{2}-\d{2}\.json$/.test(dl.suggestedFilename()), "nombre del respaldo");
    const file = path.join(os.tmpdir(), "respaldo-prueba-tcf.json");
    await dl.saveAs(file);
    const data = JSON.parse(fs.readFileSync(file, "utf8"));
    eq(data.app, "simulador-tcf-canada");
    eq(data.state.results.length, 1);
    const other = await newPage({ hash: "#progreso" });
    eq((await S(other)).results.length, 0, "el otro dispositivo empieza vacío");
    await other.setInputFiles("#import-file", file);
    await other.waitForFunction(() => window.TCF.state.results.length === 1);
    assert((await txt(other, "#comp-CO")).includes("33/39"), "datos importados visibles");
    fs.unlinkSync(file);
    await noErrors(page); await noErrors(other);
  });
  await test("«Mis temas» entran al sorteo marcados como «Mío» (y la ayuda de Tâche 2)", async () => {
    const page = await newPage({ hash: "#comprension" });
    await page.click("#mt-toggle");
    await page.selectOption('#mt-form [name="task"]', "EE1");
    await page.selectOption('#mt-form [name="th"]', "perso");
    await page.fill('#mt-form [name="text"]', "Écrivez un message à votre voisin pour l'inviter à un pique-nique.");
    await page.click('#mt-form button[type="submit"]');
    await page.click("#mt-toggle");
    await page.selectOption('#mt-form [name="task"]', "EO2");
    assert(await page.isVisible("#mt-help-field"), "campo de ayuda para Tâche 2");
    await page.selectOption('#mt-form [name="th"]', "perso");
    await page.fill('#mt-form [name="text"]', "Vous voulez louer un kayak. Posez des questions au loueur.");
    await page.fill('#mt-form [name="help"]', "Combien coûte la location ?\nFaut-il un gilet ?");
    await page.click('#mt-form button[type="submit"]');
    eq(await page.locator("#mytopics-list li").count(), 2, "2 temas guardados");
    await go(page, "escrita");
    await page.click('[data-act="ee-practice"][data-task="1"]');
    await page.selectOption('select[data-change="ee-theme"]', "perso");
    assert((await txt(page, "#ee-topic")).includes("Mío"), "insignia Mío");
    assert((await txt(page, "#ee-topic")).includes("pique-nique"), "texto del tema propio");
    await go(page, "oral");
    await page.click('[data-act="eo-practice"][data-task="2"]');
    await page.selectOption('select[data-change="eo-theme"]', "perso");
    await page.click('[data-act="eo-help"]');
    assert((await txt(page, "#eo-topic")).includes("Faut-il un gilet"), "ayuda propia");
    const pool = await page.evaluate(() => window.TCF.topicPool("EE1").length);
    eq(pool, 34, "33 originales + 1 propio en el sorteo");
    await noErrors(page);
  });

  console.log("\n🛡️ Robustez y diseño");
  await test("Si localStorage falla, la app avisa y sigue funcionando", async () => {
    const page = await newPage({
      hash: "#escrita",
      initScript: () => {
        const boom = () => { throw new Error("bloqueado"); };
        Storage.prototype.getItem = boom; Storage.prototype.setItem = boom; Storage.prototype.removeItem = boom;
      }
    });
    assert(await page.isVisible("#storage-warning"), "aviso visible");
    await page.click('[data-act="ee-practice"][data-task="1"]');
    await page.click('[data-act="ee-start"]');
    await page.fill("#ee-text", "Ça marche quand même.");
    eq(await txt(page, "#ee-wc-num"), "4");
    await go(page, "tarjetas");
    await page.click('button[data-act="card-reveal"]');
    await page.click('[data-act="card-yes"]');
    await noErrors(page);
  });
  await test("Sin peticiones a internet (todo está en index.html)", async () => {
    const page = await newPage({ hash: "#inicio" });
    for (const r of ["escrita", "oral", "tarjetas", "comprension", "progreso"]) await go(page, r);
    eq(page.external.length, 0, "peticiones externas: " + page.external.join(", "));
  });
  for (const width of [320, 390, 1280]) {
    await test(`Sin desbordamiento horizontal a ${width}px en todas las pantallas`, async () => {
      const page = await newPage({ viewport: { width, height: 800 }, mobile: width < 800, clock: true });
      const check = async label => {
        const over = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
        assert(over <= 0, `${label}: ${over}px de más`);
      };
      for (const r of ["inicio", "escrita", "oral", "tarjetas", "comprension", "progreso"]) { await go(page, r); await check(r); }
      await go(page, "escrita");
      await page.click('[data-act="ee-exam"]'); await page.click('[data-act="ee-start"]'); await check("examen escrito");
      await page.click('[data-act="ee-finish"]'); await check("resumen escrito");
      await go(page, "oral");
      await page.click('[data-act="eo-practice"][data-task="2"]'); await page.click('[data-act="eo-help"]'); await page.click('[data-act="eo-start"]'); await check("oral en curso");
      await go(page, "tarjetas"); await page.click('button[data-act="card-reveal"]'); await check("tarjeta");
      await noErrors(page);
    });
  }

  await browser.close();
  server.close();
  const failed = results.filter(r => !r[0]);
  console.log(`\n${failed.length ? "❌" : "✅"} ${results.length - failed.length}/${results.length} pruebas superadas\n`);
  process.exit(failed.length ? 1 : 0);
})();
