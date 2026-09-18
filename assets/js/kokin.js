/* ============================================================================
   KOKIN — JS de la landing (autoalojado, sin dependencias, cargado con defer)
   ----------------------------------------------------------------------------
   Principio: la página es HTML prerenderizado y funciona sin este archivo.
   Esto es SÓLO mejora progresiva para dos cosas:
     1) enviar los formularios de lista de espera a Supabase (backend propio);
     2) arrastrar los UTM de la URL al campo `origen`.
   No se carga ningún SDK ni script de CDN: es un fetch a la API REST de
   Supabase, que es el backend del propio producto, no un rastreador de
   terceros. Por eso no hace falta banner de cookies: no se escribe ninguna.
   ========================================================================== */
(function () {
  "use strict";

  /* --- Configuración: rellena con tu proyecto Supabase antes de desplegar ---
     La anon/publishable key está pensada para vivir en el cliente; la
     seguridad real la da la Row Level Security de la tabla `lista_espera`
     (permitir INSERT anónimo, nada de SELECT). */
  var SUPABASE_URL = "https://TU-PROYECTO.supabase.co";
  var SUPABASE_ANON_KEY = "TU_ANON_KEY";
  var TABLE = "lista_espera";

  /* Idioma de la página, para el campo `idioma` */
  var idioma = (document.documentElement.lang || "es").slice(0, 2);

  /* UTMs y referrer -> string compacto para el campo `origen`.
     Anónimo: no guardamos nada personal, sólo de dónde vino la visita. */
  function leerOrigen() {
    var p = new URLSearchParams(location.search);
    var claves = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"];
    var partes = [];
    claves.forEach(function (k) {
      var v = p.get(k);
      if (v) partes.push(k.replace("utm_", "") + "=" + v);
    });
    if (!partes.length && document.referrer) {
      try { partes.push("ref=" + new URL(document.referrer).hostname); } catch (e) {}
    }
    return partes.join("&") || "directo";
  }
  var origen = leerOrigen();

  function esEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }

  function enviar(form) {
    var input = form.querySelector('input[type="email"]');
    var msg = form.parentNode.querySelector(".form-msg");
    var btn = form.querySelector('button[type="submit"], button');
    var email = (input.value || "").trim();

    function decir(texto, estado) {
      if (!msg) return;
      msg.textContent = texto;
      msg.setAttribute("data-state", estado);
    }

    if (!esEmail(email)) {
      decir("Revisa el correo, no parece válido.", "err");
      input.focus();
      return;
    }

    // Prenda: de las casillas marcadas (votación de básicos) o del data-prenda.
    var prenda;
    var casillas = form.querySelectorAll('input[name="prenda"]:checked');
    if (form.querySelector('input[name="prenda"]')) {
      var vals = Array.prototype.map.call(casillas, function (c) { return c.value; });
      // Si marcó "Todos", se guarda así y no la lista entera: es más legible
      // al leer los votos y significa lo mismo.
      if (vals.indexOf("todos") !== -1) prenda = "voto:todos";
      else prenda = "voto:" + (vals.length ? vals.join(",") : "cualquiera");
    } else {
      prenda = form.getAttribute("data-prenda") || "kok001";
    }
    if (btn) { btn.disabled = true; }
    decir("Apuntando…", "");

    fetch(SUPABASE_URL + "/rest/v1/" + TABLE, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": "Bearer " + SUPABASE_ANON_KEY,
        "Prefer": "return=minimal"
      },
      body: JSON.stringify({ email: email, idioma: idioma, prenda: prenda, origen: origen })
    })
      .then(function (r) {
        if (r.ok) {
          form.reset();
          decir("Hecho. Te avisamos cuando salga.", "ok");
        } else {
          decir("No se pudo guardar. Inténtalo en un momento.", "err");
        }
      })
      .catch(function () {
        decir("Sin conexión. Inténtalo en un momento.", "err");
      })
      .finally(function () { if (btn) btn.disabled = false; });
  }

  document.querySelectorAll("form.waitlist, form.vote").forEach(function (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      enviar(form);
    });
  });
})();
