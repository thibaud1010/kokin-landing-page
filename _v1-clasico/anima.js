/* ============================================================================
   KOKIN — Movimiento y configurador (autoalojado, sin dependencias, defer)
   ----------------------------------------------------------------------------
   Todo esto es mejora progresiva. El contenido ya está en el HTML y se ve sin
   este archivo; aquí sólo se le da vida:
     1) reveals escalonados al entrar en pantalla (estilo to-top.ch);
     2) cabecera que se condensa y se aparta al hacer scroll (estilo alkemy);
     3) el configurador del Aria: eliges y el figurín grande cambia.
   Se respeta `prefers-reduced-motion`: si se pide calma, no se anima nada;
   el contenido simplemente está, ya visible.
   ========================================================================== */
(function () {
  "use strict";

  var quieto = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* --- 1. REVEALS ---------------------------------------------------------
     El CSS oculta [data-reveal] SOLO bajo `html.js` y sólo si no se pide
     calma. Aquí los revelamos al entrar en viewport, con un escalonado según
     su posición entre hermanos para que un grupo entre "en cascada". */
  function reveals() {
    if (quieto) return; // en calma ya están visibles; no tocamos nada
    var items = Array.prototype.slice.call(document.querySelectorAll("[data-reveal]"));
    if (!items.length) return;

    function delayDe(el) {
      var i = 0, s = el;
      while ((s = s.previousElementSibling)) { if (s.hasAttribute("data-reveal")) i++; }
      return Math.min(i * 70, 350);
    }

    if (!("IntersectionObserver" in window)) {
      items.forEach(function (el) { el.classList.add("is-in"); });
      return;
    }

    var io = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.style.transitionDelay = delayDe(e.target) + "ms";
        e.target.classList.add("is-in");
        obs.unobserve(e.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });

    items.forEach(function (el) { io.observe(el); });

    // El raíl de medidas del héroe no es [data-reveal] pero "se traza" al cargar.
    var rail = document.querySelector(".measure-rail");
    if (rail) requestAnimationFrame(function () { rail.classList.add("is-in"); });
  }

  /* --- 2. CABECERA REACTIVA -----------------------------------------------
     Al bajar se aparta (deja ver la prenda); al subir vuelve. Cerca del borde
     superior siempre visible. rAF para no castigar el scroll en móvil. */
  function cabecera() {
    var header = document.querySelector(".site-header");
    if (!header) return;

    /* Dos umbrales distintos para entrar y para salir (histéresis). Con un
       único umbral, el temblor natural del trackpad cruza la línea decenas de
       veces por segundo y la barra parpadea. Y en vez de comparar con el
       fotograma anterior, se acumula el recorrido en una dirección: así un
       microrrebote no cuenta como "cambio de sentido". */
    var ENTRA = 40, SALE = 10;     // para la sombra de "scrolled"
    var GIRO = 24;                 // recorrido mínimo para ocultar o mostrar
    var ultimo = window.pageYOffset || 0;
    var acumulado = 0, oculta = false, pendiente = false;

    function aplica() {
      pendiente = false;
      var y = window.pageYOffset || 0;
      var dy = y - ultimo;
      ultimo = y;

      if (y > ENTRA) header.classList.add("scrolled");
      else if (y < SALE) header.classList.remove("scrolled");

      // Un menú abierto o el foco dentro: la barra no se mueve
      if (header.querySelector("details[open]") || header.contains(document.activeElement)) {
        if (oculta) { oculta = false; header.classList.remove("nav-hidden"); }
        acumulado = 0;
        return;
      }
      if (quieto || y < 180) {
        if (oculta) { oculta = false; header.classList.remove("nav-hidden"); }
        acumulado = 0;
        return;
      }

      // El acumulado se reinicia al cambiar de sentido
      if ((dy > 0) !== (acumulado > 0)) acumulado = 0;
      acumulado += dy;

      if (!oculta && acumulado > GIRO) { oculta = true; header.classList.add("nav-hidden"); acumulado = 0; }
      else if (oculta && acumulado < -GIRO) { oculta = false; header.classList.remove("nav-hidden"); acumulado = 0; }
    }

    window.addEventListener("scroll", function () {
      if (!pendiente) { pendiente = true; requestAnimationFrame(aplica); }
    }, { passive: true });
    aplica();
  }

  /* --- 3. CONFIGURADOR DEL ARIA -------------------------------------------
     Los botones llevan data-target (neck|back|flare|forro) y, cuando cambian
     el dibujo, data-d con el trazo del figurín grande. Aquí sólo conectamos. */
  function configurador() {
    var svg = document.querySelector(".aria-live");
    var figure = document.querySelector(".aria-figure");
    if (!svg) return;

    var neck = svg.querySelector(".aria-neck");
    var skirt = svg.querySelector(".aria-skirt");
    var forro = svg.querySelector(".aria-forro");
    var skirtG = svg.querySelector(".aria-skirt-g");

    // Palabras para la lectura en voz alta / el resumen (con acentos)
    var texto = {
      neck: { redondo: "redondo", pico: "pico", cuadrado: "cuadrado", barco: "barco", corazon: "corazón" },
      back: { alta: "alta", pico: "pico", gota: "gota", cruzada: "cruzada", baja: "baja" },
      flare: { recto: "recto", leve: "leve", medio: "medio", circular: "circular" },
      forro: { si: "con forro", no: "sin forro" }
    };
    function readout(target, value) {
      var out = document.querySelector('.aria-readout [data-out="' + target + '"]');
      if (out && texto[target] && texto[target][value]) out.textContent = texto[target][value];
    }

    function pulso() {
      if (quieto || !figure) return;
      figure.classList.remove("pulse");
      // reinicia la animación
      void figure.offsetWidth;
      figure.classList.add("pulse");
    }

    function marca(btn) {
      var target = btn.getAttribute("data-target");
      document.querySelectorAll('[data-target="' + target + '"]').forEach(function (b) {
        b.setAttribute("aria-pressed", b === btn ? "true" : "false");
      });
    }

    // Métricas del motor: el largo sale del deslizador (cm reales), el resto
    // refleja la elección. La holgura NO se inventa: se calcula con la tela.
    function setMetric(name, val) {
      var el = document.querySelector('[data-metric="' + name + '"]');
      if (el) el.textContent = val;
    }
    var recalcEl = document.querySelector("[data-recalc]");
    var recalcT;
    function recalculando() {
      if (!recalcEl || quieto) return;
      recalcEl.classList.add("on");
      clearTimeout(recalcT);
      recalcT = setTimeout(function () { recalcEl.classList.remove("on"); }, 560);
    }

    document.querySelectorAll("[data-target]").forEach(function (btn) {
      // el rango (largo) se maneja aparte
      if (btn.tagName === "INPUT") return;
      btn.addEventListener("click", function () {
        var target = btn.getAttribute("data-target");
        var value = btn.getAttribute("data-value");
        var d = btn.getAttribute("data-d");
        marca(btn);
        readout(target, value);
        recalculando();
        if (target === "neck" && neck && d) { neck.setAttribute("d", d); setMetric("escote", texto.neck[value]); pulso(); }
        else if (target === "flare" && skirt && d) { skirt.setAttribute("d", d); setMetric("vuelo", texto.flare[value]); pulso(); }
        else if (target === "forro" && forro) { forro.style.opacity = value === "si" ? "1" : "0"; }
      });
    });

    // Largo del ruedo: escala la falda desde la cintura (no recalcula el trazo).
    // El deslizador (62..116) se traduce a un ruedo aproximado en cm, real.
    var largo = document.getElementById("largo");
    if (largo && skirtG) {
      var setLargo = function () {
        var v = Number(largo.value);
        skirtG.style.transform = "scaleY(" + (v / 100) + ")";
        var cm = Math.round(40 + (v - 62) / (116 - 62) * 70);
        setMetric("ruedo", cm + " cm");
      };
      largo.addEventListener("input", setLargo);
      setLargo();
    }
  }

  /* --- 4. SELECTOR DE TEMA ------------------------------------------------
     Cambia data-theme en <html>, lo recuerda y avisa al motor para que
     repinte con los colores del tema nuevo. */
  function tema() {
    var KEY = "kokin:tema-web";
    var btns = document.querySelectorAll("[data-theme-set]");
    if (!btns.length) return;
    function sinc(t) {
      btns.forEach(function (b) { b.setAttribute("aria-pressed", b.getAttribute("data-theme-set") === t ? "true" : "false"); });
    }
    function set(t, guardar) {
      if (t === "carbon") document.documentElement.removeAttribute("data-theme");
      else document.documentElement.setAttribute("data-theme", t);
      sinc(t);
      if (guardar) { try { localStorage.setItem(KEY, t); } catch (e) {} }
      try { window.dispatchEvent(new CustomEvent("kokin:tema")); } catch (e) {}
    }
    sinc(document.documentElement.getAttribute("data-theme") || "carbon");
    btns.forEach(function (b) {
      b.addEventListener("click", function () { set(b.getAttribute("data-theme-set"), true); });
    });
  }

  /* --- 5. VÍDEOS: reproducir sólo en pantalla ------------------------------
     Los .mp4 (mudos, en bucle) se reproducen cuando entran en viewport y se
     pausan al salir: nada de 5 vídeos corriendo a la vez ni gasto de datos en
     móvil. Si se pide menos movimiento, no se reproducen: queda el póster. */
  function videos() {
    var vids = document.querySelectorAll("video.v-io");
    if (!vids.length || quieto) return;
    if (!("IntersectionObserver" in window)) {
      vids.forEach(function (v) { var p = v.play(); if (p && p.catch) p.catch(function () {}); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        var v = e.target;
        if (e.isIntersecting) { var p = v.play(); if (p && p.catch) p.catch(function () {}); }
        else { v.pause(); }
      });
    }, { threshold: 0.25 });
    vids.forEach(function (v) { io.observe(v); });
  }

  /* --- 6. CARRUSEL DE PRENDAS ---------------------------------------------
     El track ya se desliza solo (scroll-snap nativo). Aquí sólo conectamos las
     flechas y las apagamos cuando se llega a un extremo. Si falla el JS, el
     carrusel sigue funcionando con el dedo, la rueda y el teclado. */
  function carrusel() {
    document.querySelectorAll("[data-carousel]").forEach(function (car) {
      var track = car.querySelector(".carousel__track");
      var prev = car.querySelector('[data-car="prev"]');
      var next = car.querySelector('[data-car="next"]');
      if (!track || !prev || !next) return;
      /* Si el track no desborda (en escritorio el CSS lo pinta como rejilla
         de cuatro), no hay nada que deslizar: ni copias, ni bucle, ni
         movimiento automático. Las flechas están ocultas por CSS. */
      if (track.scrollWidth <= track.clientWidth + 2) return;

      /* Bucle infinito: duplicamos las tarjetas una vez. Cuando el scroll pasa
         de la mitad, restamos esa mitad de golpe (sin animación): el salto cae
         justo sobre una tarjeta idéntica, así que no se ve. Las copias van
         aria-hidden y sin data-reveal (si no, quedarían invisibles esperando
         al observer) para no duplicar contenido a los lectores de pantalla. */
      var originales = Array.prototype.slice.call(track.children);
      var mitad = 0;
      if (!quieto && originales.length > 1) {
        originales.forEach(function (card) {
          var copia = card.cloneNode(true);
          copia.setAttribute("aria-hidden", "true");
          copia.removeAttribute("data-reveal");
          copia.classList.add("is-in");
          copia.querySelectorAll("[data-reveal]").forEach(function (el) {
            el.removeAttribute("data-reveal"); el.classList.add("is-in");
          });
          track.appendChild(copia);
        });
      }
      /* La distancia del bucle es exactamente dónde empieza la primera copia:
         al restarla, cada tarjeta cae sobre su gemela y el salto es invisible. */
      function medirMitad() {
        var primeraCopia = track.children[originales.length];
        mitad = primeraCopia ? primeraCopia.offsetLeft - track.children[0].offsetLeft : 0;
      }

      function paso() {
        var card = track.firstElementChild;
        if (!card) return track.clientWidth;
        var gap = parseFloat(getComputedStyle(track).columnGap || "0") || 0;
        return card.getBoundingClientRect().width + gap;
      }
      function normaliza() {
        if (!mitad) return;
        if (track.scrollLeft >= mitad) track.scrollLeft -= mitad;
        else if (track.scrollLeft < 0) track.scrollLeft += mitad;
      }
      function mover(dir) {
        normaliza();
        track.scrollBy({ left: dir * paso(), behavior: quieto ? "auto" : "smooth" });
      }
      function estado() {
        if (mitad) { prev.disabled = false; next.disabled = false; return; }
        var max = track.scrollWidth - track.clientWidth - 2;
        prev.disabled = track.scrollLeft <= 2;
        next.disabled = track.scrollLeft >= max;
      }

      window.addEventListener("resize", function () { medirMitad(); estado(); });
      medirMitad(); estado();
      // Volvemos a medir cuando la maquetación ya está asentada (webfonts,
      // imágenes): si midiéramos sólo al inicio, el salto del bucle bailaría.
      requestAnimationFrame(medirMitad);
      window.addEventListener("load", function () { medirMitad(); estado(); });

      /* --- Deslizamiento CONTINUO y suave ---------------------------------
         Nada de saltar una tarjeta cada 3 s: eso se siente robótico. El track
         avanza unos pocos píxeles por fotograma, y la velocidad se acelera y
         se frena de forma progresiva (interpolación), así que arrancar y parar
         no dan tirones. Las flechas no "saltan": empujan, y el empujón se va
         consumiendo con suavidad. El bucle sigue siendo invisible porque al
         pasar de `mitad` restamos esa distancia sobre una tarjeta gemela.
         Con prefers-reduced-motion no se anima nada de esto. */
      if (quieto || !mitad) {
        prev.addEventListener("click", function () { mover(-1); });
        next.addEventListener("click", function () { mover(1); });
        return;
      }

      track.classList.add("is-auto");   // desactiva el scroll-snap: pelea con el deslizamiento
      var VEL = 26;                     // píxeles por segundo (paseo tranquilo)
      var pos = track.scrollLeft, vel = 0, objetivo = VEL, empujon = 0;
      var visible = true, activo = true, ultimo = 0, raf = 0;

      function quiere() { return (visible && activo && !document.hidden) ? VEL : 0; }

      function frame(t) {
        if (!ultimo) ultimo = t;
        var dt = Math.min((t - ultimo) / 1000, 0.05);   // límite: evita saltos al volver de otra pestaña
        ultimo = t;
        objetivo = quiere();
        vel += (objetivo - vel) * Math.min(dt * 3.2, 1); // acelera/frena progresivamente
        var paso2 = empujon * Math.min(dt * 5, 1);        // el empujón de las flechas se consume suave
        empujon -= paso2;
        pos += vel * dt + paso2;
        if (mitad) {
          if (pos >= mitad) pos -= mitad;
          else if (pos < 0) pos += mitad;
        }
        track.scrollLeft = pos;
        raf = requestAnimationFrame(frame);
      }
      raf = requestAnimationFrame(frame);

      // Si alguien arrastra el carrusel a mano, seguimos desde donde lo dejó
      track.addEventListener("pointerdown", function () { activo = false; });
      window.addEventListener("pointerup", function () {
        pos = track.scrollLeft; activo = true;
      });
      track.addEventListener("wheel", function () { pos = track.scrollLeft; }, { passive: true });

      prev.addEventListener("click", function () { empujon -= paso(); });
      next.addEventListener("click", function () { empujon += paso(); });

      car.addEventListener("pointerenter", function () { activo = false; });
      car.addEventListener("pointerleave", function () { activo = true; });
      car.addEventListener("focusin", function () { activo = false; });
      car.addEventListener("focusout", function () { activo = true; });
      if ("IntersectionObserver" in window) {
        new IntersectionObserver(function (es) {
          es.forEach(function (e) { visible = e.isIntersecting; });
        }, { threshold: 0.15 }).observe(car);
      }
    });
  }

  /* --- 7. CASILLA "TODOS" --------------------------------------------------
     Marcarla marca las demás; desmarcar cualquiera la desmarca a ella. */
  function todos() {
    var all = document.querySelector("[data-check-all]");
    if (!all) return;
    var form = all.closest("form");
    if (!form) return;
    var otras = Array.prototype.filter.call(
      form.querySelectorAll('input[name="prenda"]'),
      function (c) { return c !== all; }
    );
    all.addEventListener("change", function () {
      otras.forEach(function (c) { c.checked = all.checked; });
    });
    otras.forEach(function (c) {
      c.addEventListener("change", function () {
        all.checked = otras.every(function (o) { return o.checked; });
      });
    });
  }

  /* --- 8. MEDIDOR DE ESTIRAMIENTO ------------------------------------------
     El control va de 10 a 20 cm sobre una marca de 10 cm, así que el
     estiramiento es (valor - 10) / 10, de 0 % a 100 %. Al mover:
       · la tira crece y su trama se separa (las fibras cediendo),
       · el porcentaje y la categoría se actualizan,
       · el alfiler se mueve por las bandas y se marca la fila de la tabla.
     Sin JS el bloque se queda en el 50 % que trae el HTML y se lee igual. */
  function medidor() {
    var input = document.getElementById("estirar");
    if (!input) return;

    var BANDAS = [
      { max: 25,  clave: "bajo",     nombre: "Estiramiento bajo",
        uso: "Para camisetas holgadas y vestidos sueltos." },
      { max: 50,  clave: "medio",    nombre: "Estiramiento medio",
        uso: "Para camisetas entalladas, buzos y faldas de punto." },
      { max: 75,  clave: "alto",     nombre: "Estiramiento alto",
        uso: "Para leggings, calzas y tops deportivos." },
      { max: 1e9, clave: "muy-alto", nombre: "Estiramiento muy alto",
        uso: "Para trajes de baño, danza y prendas de compresión." }
    ];
    function sel(n) { return document.querySelector('[data-s="' + n + '"]'); }
    var elStrip = sel("strip"), elCm = sel("cm"), elPct = sel("pct"),
        elCat = sel("cat"), elUso = sel("use"), elPin = sel("pin");
    var segs = document.querySelectorAll(".bands__seg");
    var filas = document.querySelectorAll(".tabla tbody tr");

    function pinta() {
      var cm = Number(input.value);
      var pct = Math.round((cm - 10) / 10 * 100);
      var banda = BANDAS.find(function (b) { return pct < b.max; }) || BANDAS[3];

      // La tira ocupa cm/20 del ancho (la regla llega a 20 cm)
      if (elStrip) {
        elStrip.style.width = (cm / 20 * 100) + "%";
        // la trama se abre de 9px a 15px conforme cede la tela
        elStrip.style.setProperty("--trama", (9 + (pct / 100) * 6).toFixed(1) + "px");
      }
      if (elCm) elCm.textContent = cm.toFixed(1).replace(".", ",") + " cm";
      if (elPct) elPct.textContent = pct;
      if (elCat) elCat.textContent = banda.nombre;
      if (elUso) elUso.textContent = banda.uso;
      if (elPin) elPin.style.left = Math.min(pct, 100) + "%";

      segs.forEach(function (s) { s.classList.toggle("on", s.getAttribute("data-band") === banda.clave); });
      filas.forEach(function (f) { f.classList.toggle("on", f.getAttribute("data-band") === banda.clave); });
    }

    input.addEventListener("input", pinta);
    pinta();
  }

  /* --- 9. MENÚS DESPLEGABLES ----------------------------------------------
     Un <details> nativo sólo se cierra volviendo a pulsar su título: si haces
     clic fuera, se queda abierto. Aquí se cierra al pulsar fuera, con Escape
     (devolviendo el foco al título) y al abrir otro menú. Es mejora
     progresiva: sin JS el menú sigue funcionando, sólo que hay que cerrarlo
     a mano, así que no se pierde nada. */
  function menus() {
    var abribles = function () { return document.querySelectorAll("details.tools, details.lang"); };

    document.addEventListener("pointerdown", function (e) {
      abribles().forEach(function (d) {
        if (d.open && !d.contains(e.target)) d.open = false;
      });
    });

    document.addEventListener("keydown", function (e) {
      if (e.key !== "Escape") return;
      abribles().forEach(function (d) {
        if (!d.open) return;
        d.open = false;
        var s = d.querySelector("summary");
        if (s && d.contains(document.activeElement)) s.focus();
      });
    });

    // Abrir uno cierra el otro: dos menús desplegados a la vez se solapan
    abribles().forEach(function (d) {
      d.addEventListener("toggle", function () {
        if (!d.open) return;
        abribles().forEach(function (o) { if (o !== d) o.open = false; });
      });
    });
  }

  function init() { reveals(); cabecera(); configurador(); tema(); videos(); carrusel(); todos(); medidor(); menus(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
