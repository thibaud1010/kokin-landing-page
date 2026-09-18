/* ============================================================================
   KOKIN — Movimiento e interacción de la landing (autoalojado, sin
   dependencias, cargado con defer).
   ----------------------------------------------------------------------------
   Todo lo de aquí es MEJORA PROGRESIVA. El contenido ya está en el HTML y se
   lee entero sin este archivo; el CSS sólo esconde algo cuando existe la clase
   `js` en <html> y no se ha pedido calma. Seis cosas:
     1) reveals escalonados al entrar en pantalla;
     2) displays que entran por líneas (se envuelven aquí, no en el HTML);
     3) cabecera: se vuelve papel al salir del héroe y se aparta al bajar;
     4) el carrusel de scroll de la sección 01;
     5) vídeos: se reproducen sólo cuando se ven;
     6) raíles horizontales: arrastre con el ratón y botones anterior/siguiente.
   Con `prefers-reduced-motion: reduce` no se anima nada y los vídeos se quedan
   en su póster.
   ========================================================================== */
(function () {
  "use strict";

  var quieto = window.matchMedia &&
               window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* --- 1. DISPLAYS POR LÍNEAS ---------------------------------------------
     Cada `.line` del HTML se envuelve en un <span> que se desplaza dentro de
     su propia máscara. Se hace en JS para no ensuciar el marcado: sin JS el
     titular es texto normal. Debe correr ANTES de los reveals. */
  function lineas() {
    if (quieto) return;
    document.querySelectorAll("[data-lines]").forEach(function (el) {
      el.querySelectorAll(".line").forEach(function (linea) {
        if (linea.dataset.wrapped) return;   // ya envuelta
        linea.dataset.wrapped = "1";
        var span = document.createElement("span");
        while (linea.firstChild) span.appendChild(linea.firstChild);
        linea.appendChild(span);
      });
    });
  }

  /* --- 2. REVEALS ---------------------------------------------------------
     Un solo observador para `[data-reveal]` y `[data-lines]`. El escalonado
     sale de la posición entre hermanos, así un grupo entra en cascada sin
     tener que numerar nada en el HTML. */
  function reveals() {
    var items = [].slice.call(
      document.querySelectorAll("[data-reveal], [data-lines], [data-trace]")
    );
    if (!items.length) return;

    if (quieto || !("IntersectionObserver" in window)) {
      items.forEach(function (el) { el.classList.add("is-in"); });
      return;
    }

    function retraso(el) {
      var i = 0, s = el;
      while ((s = s.previousElementSibling)) {
        if (s.hasAttribute("data-reveal") || s.hasAttribute("data-lines") ||
            s.hasAttribute("data-trace")) i++;
      }
      return Math.min(i * 70, 350);
    }

    var io = new IntersectionObserver(function (entradas, obs) {
      entradas.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.style.transitionDelay = retraso(e.target) + "ms";
        e.target.classList.add("is-in");
        obs.unobserve(e.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });

    items.forEach(function (el) { io.observe(el); });
  }

  /* --- 2b. CARRUSEL DE SCROLL (sección 01) --------------------------------
     La caja mide varias pantallas de alto; esa altura de más es el recorrido.
     Se traduce la posición del scroll dentro de la caja a un índice de frase y
     se marcan las clases: `is-in` la que toca, `is-out` las ya pasadas. Nada
     de fijar el scroll ni de secuestrarlo — el escenario es `position:sticky`,
     así que la rueda del ratón sigue haciendo exactamente lo que hace siempre.
     Con calma pedida se muestran las cuatro y no se engancha nada. */
  var COLA = 0.5;   // tramos extra de reposo para la última frase

  function diapositivas() {
    document.querySelectorAll("[data-slides]").forEach(function (caja) {
      var slides = [].slice.call(caja.querySelectorAll(".slide"));
      if (!slides.length) return;

      if (quieto) {
        slides.forEach(function (s) { s.classList.add("is-in"); });
        return;
      }

      var ticks = [].slice.call(caja.querySelectorAll(".slides__ticks li"));
      var num = caja.querySelector("[data-slides-n]");
      caja.style.setProperty("--n", slides.length);

      var actual = -1, pendiente = false;

      function pinta() {
        pendiente = false;
        var recorrido = caja.offsetHeight - window.innerHeight;
        var avance = recorrido > 0
          ? -caja.getBoundingClientRect().top / recorrido
          : 0;
        avance = Math.max(0, Math.min(1, avance));

        // Se reparte el recorrido entre `n + COLA` tramos en vez de entre `n`:
        // los tres primeros pasan algo más rápido y la última frase —la que
        // remata— se queda quieta un rato antes de que el escenario se suelte.
        // El min() además evita que el índice se salga al final del recorrido.
        var i = Math.min(slides.length - 1,
                         Math.floor(avance * (slides.length + COLA)));
        if (i === actual) return;
        actual = i;

        slides.forEach(function (s, j) {
          s.classList.toggle("is-in", j === i);
          s.classList.toggle("is-out", j < i);
        });
        ticks.forEach(function (t, j) { t.classList.toggle("is-on", j <= i); });
        caja.dataset.activa = i;      // el CSS mueve el fondo con esto
        if (num) num.textContent = ("0" + (i + 1)).slice(-2);
      }

      window.addEventListener("scroll", function () {
        if (pendiente) return;
        pendiente = true;
        requestAnimationFrame(pinta);
      }, { passive: true });
      window.addEventListener("resize", function () { actual = -1; pinta(); });

      pinta();
    });
  }

  /* --- 3. CABECERA --------------------------------------------------------
     Dos estados independientes:
       is-solid  → ya no estamos sobre el héroe: fondo papel y tinta negra.
       is-hidden → se está bajando: se aparta para dejar ver la prenda.
     Histéresis en el umbral de ocultar/mostrar (12 px) para que no parpadee
     con el rebote del scroll en móvil. Todo dentro de un rAF. */
  function cabecera() {
    var header = document.querySelector(".site-header");
    var hero = document.querySelector(".hero");
    if (!header) return;

    var ultimo = window.scrollY;
    var pendiente = false;

    function aplica() {
      pendiente = false;
      var y = window.scrollY;
      var limite = hero ? hero.offsetHeight - 80 : 80;

      header.classList.toggle("is-solid", y > limite);

      if (y < limite || y < 120) {
        header.classList.remove("is-hidden");
      } else if (y - ultimo > 12) {
        header.classList.add("is-hidden");
      } else if (ultimo - y > 12) {
        header.classList.remove("is-hidden");
      }
      ultimo = y;
    }

    window.addEventListener("scroll", function () {
      if (pendiente) return;
      pendiente = true;
      requestAnimationFrame(aplica);
    }, { passive: true });

    aplica();
  }

  /* --- 4. VÍDEOS ----------------------------------------------------------
     `preload="none"` en el HTML: no se descarga nada hasta que el vídeo entra
     en pantalla. Al salir se pausa (ahorra batería en móvil). Con calma
     pedida no se reproduce ninguno: se queda el póster, que ya es la foto. */
  function videos() {
    var vids = [].slice.call(document.querySelectorAll("video[data-io]"));
    if (!vids.length) return;

    if (quieto) {
      vids.forEach(function (v) { v.removeAttribute("autoplay"); v.pause(); });
      return;
    }

    if (!("IntersectionObserver" in window)) {
      vids.forEach(function (v) { v.play().catch(function () {}); });
      return;
    }

    var io = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (e) {
        var v = e.target;
        if (e.isIntersecting) {
          if (v.preload === "none") v.preload = "auto";
          v.play().catch(function () {});   // iOS con ahorro de batería: da igual
        } else {
          v.pause();
        }
      });
    }, { threshold: 0.2 });

    vids.forEach(function (v) { io.observe(v); });
  }

  /* --- 5. RAÍLES HORIZONTALES ---------------------------------------------
     El scroll es nativo (con snap): en móvil ya funciona solo y sin JS. Aquí
     se añaden dos cosas de escritorio: arrastrar con el ratón y los botones
     anterior/siguiente, que se desactivan al llegar a cada extremo. */
  function railes() {
    document.querySelectorAll("[data-rail]").forEach(function (rail) {
      var track = rail.querySelector(".rail__track");
      var prev  = rail.querySelector('[data-rail-btn="prev"]');
      var next  = rail.querySelector('[data-rail-btn="next"]');
      if (!track) return;

      function paso() {
        var primera = track.firstElementChild;
        return primera ? primera.getBoundingClientRect().width + 1 : track.clientWidth * .8;
      }

      /* Si el raíl cabe entero (pantalla muy ancha, pocas tarjetas) no hay nada
         que recorrer: se esconden los botones en vez de dejarlos apagados, que
         parece un fallo. */
      function estado() {
        var max = track.scrollWidth - track.clientWidth;
        var recorrible = max > 4;
        rail.classList.toggle("is-static", !recorrible);
        if (!prev || !next) return;
        prev.disabled = !recorrible || track.scrollLeft <= 2;
        next.disabled = !recorrible || track.scrollLeft >= max - 2;
      }

      function mover(dir) {
        track.scrollBy({
          left: paso() * dir,
          behavior: quieto ? "auto" : "smooth"
        });
      }

      if (prev) prev.addEventListener("click", function () { mover(-1); });
      if (next) next.addEventListener("click", function () { mover(1); });

      track.addEventListener("scroll", function () {
        requestAnimationFrame(estado);
      }, { passive: true });
      window.addEventListener("resize", estado);
      window.addEventListener("load", estado);   // las fotos cambian el ancho
      estado();

      /* Arrastre con el ratón. Sólo con puntero fino: en táctil el scroll
         nativo ya es mejor. Se desactiva el snap mientras se arrastra para
         que no dé tirones, y se vuelve a activar al soltar. */
      if (!window.matchMedia || !window.matchMedia("(pointer: fine)").matches) return;

      var abajo = false, inicioX = 0, inicioScroll = 0, movido = 0;

      track.addEventListener("pointerdown", function (e) {
        if (e.button !== 0) return;
        abajo = true; movido = 0;
        inicioX = e.clientX;
        inicioScroll = track.scrollLeft;
        rail.classList.add("is-drag");
      });

      track.addEventListener("pointermove", function (e) {
        if (!abajo) return;
        var d = e.clientX - inicioX;
        if (Math.abs(d) > 3) {
          movido = Math.abs(d);
          track.setPointerCapture(e.pointerId);
          e.preventDefault();
        }
        track.scrollLeft = inicioScroll - d;
      });

      function soltar(e) {
        if (!abajo) return;
        abajo = false;
        rail.classList.remove("is-drag");
        if (e && e.pointerId != null && track.hasPointerCapture(e.pointerId)) {
          track.releasePointerCapture(e.pointerId);
        }
        estado();
      }
      track.addEventListener("pointerup", soltar);
      track.addEventListener("pointercancel", soltar);
      track.addEventListener("pointerleave", soltar);

      /* Si se ha arrastrado, el clic que viene detrás no debe abrir el enlace. */
      track.addEventListener("click", function (e) {
        if (movido > 6) { e.preventDefault(); e.stopPropagation(); }
        movido = 0;
      }, true);
    });
  }

  /* --- 6. CASILLA «TODOS» -------------------------------------------------
     En la votación de básicos: marcar «Todos» apaga las demás, y marcar
     cualquier otra apaga «Todos». Sin JS el formulario sigue enviándose con
     lo que haya marcado. */
  function todos() {
    var form = document.querySelector("form.vote");
    if (!form) return;
    var all = form.querySelector("[data-check-all]");
    if (!all) return;
    var resto = [].slice.call(form.querySelectorAll('input[name="prenda"]'))
      .filter(function (c) { return c !== all; });

    all.addEventListener("change", function () {
      if (all.checked) resto.forEach(function (c) { c.checked = false; });
    });
    resto.forEach(function (c) {
      c.addEventListener("change", function () {
        if (c.checked) all.checked = false;
      });
    });
  }

  /* --- 7. MENÚS <details> -------------------------------------------------
     Sólo uno abierto a la vez, y se cierran al hacer clic fuera o con Escape.
     El <details> ya funciona solo: esto es sólo comodidad. */
  function menus() {
    var ds = [].slice.call(document.querySelectorAll(".nav details"));
    if (!ds.length) return;

    ds.forEach(function (d) {
      d.addEventListener("toggle", function () {
        if (!d.open) return;
        ds.forEach(function (o) { if (o !== d) o.open = false; });
      });
    });

    document.addEventListener("click", function (e) {
      ds.forEach(function (d) { if (!d.contains(e.target)) d.open = false; });
    });
    document.addEventListener("keydown", function (e) {
      if (e.key !== "Escape") return;
      ds.forEach(function (d) {
        if (!d.open) return;
        d.open = false;
        var s = d.querySelector("summary");
        if (s) s.focus();
      });
    });
  }

  function init() {
    lineas();
    reveals();
    diapositivas();
    cabecera();
    videos();
    railes();
    todos();
    menus();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
