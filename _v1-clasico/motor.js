/* ============================================================================
   KOKIN — Motor del héroe (autoalojado, sin dependencias, defer)
   ----------------------------------------------------------------------------
   Dibuja en un <canvas> un patrón que se traza y se recalcula solo y reacciona
   al cursor: el generador paramétrico, hecho visible. Pieza "wow" pero
   decorativa (canvas aria-hidden) y mejora progresiva: sin JS queda el panel
   con su HUD. Respeta prefers-reduced-motion (un fotograma, sin bucle), se
   pausa fuera de pantalla / pestaña oculta, y toma sus colores del TEMA activo
   (se repinta al cambiar de tema desde la barra).
   ========================================================================== */
(function () {
  "use strict";
  var quieto = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Arranque: teclea la línea de estado bajo el titular. */
  (function boot() {
    var el = document.querySelector(".hero-boot .boot-text");
    if (!el || quieto) return;
    var full = el.textContent;
    el.textContent = "";
    var i = 0;
    (function tick() {
      el.textContent = full.slice(0, i++);
      if (i <= full.length) setTimeout(tick, 26);
    })();
  })();

  (function engine() {
    var canvas = document.querySelector(".engine-canvas");
    if (!canvas || !canvas.getContext) return;
    var wrap = canvas.parentElement;
    var ctx = canvas.getContext("2d");
    var DPR = Math.min(window.devicePixelRatio || 1, 2);
    var W = 0, H = 0;

    // Colores del tema (se releen al cambiar de tema)
    var COL = { on: "#f4f1ea", accent: "#ffc400" };
    function leerColores() {
      var cs = getComputedStyle(document.documentElement);
      COL.on = (cs.getPropertyValue("--on-deep") || "#f4f1ea").trim();
      COL.accent = (cs.getPropertyValue("--accent") || "#ffc400").trim();
    }
    leerColores();
    window.addEventListener("kokin:tema", function () { leerColores(); if (quieto) draw(); });

    function resize() {
      var r = wrap.getBoundingClientRect();
      W = r.width; H = r.height;
      canvas.width = Math.round(W * DPR);
      canvas.height = Math.round(H * DPR);
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    }
    resize();
    window.addEventListener("resize", resize);
    // El panel tiene aspect-ratio y entra con un reveal: su tamaño puede ser 0
    // en el primer render. Al resolverse, reajustamos el canvas y repintamos,
    // para que el patrón no se quede en blanco.
    if ("ResizeObserver" in window) {
      new ResizeObserver(function () { resize(); if (W > 0 && H > 0) { running = true; start(); } }).observe(wrap);
    }

    var ptr = { x: 0.5, y: 0.4, tx: 0.5, ty: 0.4 };
    wrap.addEventListener("pointermove", function (e) {
      var r = wrap.getBoundingClientRect();
      ptr.tx = (e.clientX - r.left) / r.width;
      ptr.ty = (e.clientY - r.top) / r.height;
    });
    wrap.addEventListener("pointerleave", function () { ptr.tx = 0.5; ptr.ty = 0.4; });

    var t = 0, running = true, active = false, raf = 0;

    function silhouette(cx, Lsh, Rsh, neckY, shY, Lw, Rw, waistY, Lh, Rh, hemY) {
      ctx.beginPath();
      ctx.moveTo(Rsh, shY);
      ctx.quadraticCurveTo(Rw + (Rsh - Rw) * 0.2, (shY + waistY) / 2, Rw, waistY);
      ctx.lineTo(Rh, hemY);
      ctx.quadraticCurveTo(cx, hemY + (hemY - waistY) * 0.06, Lh, hemY);
      ctx.lineTo(Lw, waistY);
      ctx.quadraticCurveTo(Lw - (Lw - Lsh) * 0.2, (shY + waistY) / 2, Lsh, shY);
      ctx.quadraticCurveTo(cx, neckY, Rsh, shY);
      ctx.stroke();
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      var ox = (ptr.x - 0.5) * 14, oy = (ptr.y - 0.4) * 10;

      // rejilla de trazado
      ctx.globalAlpha = 0.06; ctx.strokeStyle = COL.on; ctx.lineWidth = 1; ctx.setLineDash([]);
      for (var gx = (ox * 0.3) % 28; gx < W; gx += 28) { ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke(); }
      for (var gy = (oy * 0.3) % 28; gy < H; gy += 28) { ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke(); }
      ctx.globalAlpha = 1;

      var neckDepth = 0.05 + 0.02 * Math.sin(t * 0.9);
      var waistW = 0.11 + 0.006 * Math.cos(t * 0.7);
      var flare = 0.20 + 0.06 * (0.5 + 0.5 * Math.sin(t * 0.5));
      var cx = W * 0.5 + ox, top = H * 0.16 + oy;
      var shY = top, neckY = top + H * neckDepth, waistY = top + H * 0.30, hemY = top + H * 0.62;
      var sw = W * 0.16, ww = W * waistW, hw = W * (waistW + flare);
      var Lsh = cx - sw, Rsh = cx + sw, Lw = cx - ww, Rw = cx + ww, Lh = cx - hw, Rh = cx + hw;

      // margen de costura (acento, discontinuo)
      ctx.globalAlpha = 0.35; ctx.strokeStyle = COL.accent; ctx.setLineDash([4, 6]); ctx.lineWidth = 1.2;
      silhouette(cx, Lsh - 4, Rsh + 4, neckY - 4, shY, Lw - 6, Rw + 6, waistY, Lh - 8, Rh + 8, hemY + 4);
      ctx.globalAlpha = 1; ctx.setLineDash([]);

      // costura principal (on-deep con brillo de acento)
      ctx.save();
      ctx.strokeStyle = COL.on; ctx.lineWidth = 1.6; ctx.lineJoin = "round"; ctx.lineCap = "round";
      ctx.shadowColor = COL.accent; ctx.shadowBlur = 8;
      silhouette(cx, Lsh, Rsh, neckY, shY, Lw, Rw, waistY, Lh, Rh, hemY);
      ctx.restore();

      // costura de talle
      ctx.globalAlpha = 0.4; ctx.strokeStyle = COL.on; ctx.setLineDash([5, 7]);
      ctx.beginPath(); ctx.moveTo(Lw, waistY); ctx.quadraticCurveTo(cx, waistY + 8, Rw, waistY); ctx.stroke();
      ctx.globalAlpha = 1; ctx.setLineDash([]);

      // nodos de control; el más cercano al cursor se enciende
      var nodes = [[Lsh, shY], [Rsh, shY], [cx, neckY], [Lw, waistY], [Rw, waistY], [Lh, hemY], [Rh, hemY]];
      var pxp = ptr.x * W, pyp = ptr.y * H, near = -1, nd = 1e9;
      nodes.forEach(function (n, i) { var dx = n[0] - pxp, dy = n[1] - pyp, dd = dx * dx + dy * dy; if (dd < nd) { nd = dd; near = i; } });
      nodes.forEach(function (n, i) {
        ctx.beginPath();
        ctx.fillStyle = COL.accent;
        if (i === near) { ctx.globalAlpha = 1; ctx.shadowColor = COL.accent; ctx.shadowBlur = 12; }
        else { ctx.globalAlpha = 0.9; ctx.shadowBlur = 0; }
        ctx.arc(n[0], n[1], i === near ? 5 : 2.6, 0, Math.PI * 2); ctx.fill();
      });
      ctx.globalAlpha = 1; ctx.shadowBlur = 0;

      // acotación del ruedo
      ctx.globalAlpha = 0.55; ctx.strokeStyle = COL.accent; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(Lh, hemY + 14); ctx.lineTo(Rh, hemY + 14);
      ctx.moveTo(Lh, hemY + 10); ctx.lineTo(Lh, hemY + 18);
      ctx.moveTo(Rh, hemY + 10); ctx.lineTo(Rh, hemY + 18); ctx.stroke();
      ctx.fillStyle = COL.on; ctx.font = '9px "IBM Plex Mono", monospace'; ctx.textAlign = "center";
      ctx.fillText("RUEDO", cx, hemY + 26);
      ctx.globalAlpha = 1;
    }

    function loop() {
      if (!running || quieto) { active = false; return; }
      ptr.x += (ptr.tx - ptr.x) * 0.06;
      ptr.y += (ptr.ty - ptr.y) * 0.06;
      t += 0.012;
      draw();
      raf = requestAnimationFrame(loop);
    }
    function start() {
      resize();
      if (quieto) { draw(); return; }
      if (active) return;
      active = true; loop();
    }

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (es) {
        es.forEach(function (e) { running = e.isIntersecting; if (running) start(); });
      }, { threshold: 0.01 }).observe(wrap);
    }
    document.addEventListener("visibilitychange", function () { if (!document.hidden) { running = true; start(); } });

    start();
  })();
})();
