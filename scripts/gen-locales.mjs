// Regenera /en/ /de/ /nl/ /fr/ a partir de es/index.html.
//   node scripts/gen-locales.mjs
// Las cuatro copias son andamios: misma estructura y metaetiquetas
// localizadas (lang, canónica, og:locale, JSON-LD, selector de idioma) con el
// copy visible AÚN EN ESPAÑOL, marcado como pendiente de traducción. Cada vez
// que se edite es/index.html hay que volver a ejecutarlo para que las cuatro
// no se queden atrás.
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const src = fs.readFileSync(path.join(root, 'es', 'index.html'), 'utf8');

// og:locale + el nombre del idioma tal y como aparece en el desplegable de la
// cabecera (ahí van los nombres completos; en el pie, sólo los códigos).
const locales = {
  en: ['en_US', 'English'],
  de: ['de_DE', 'Deutsch'],
  nl: ['nl_NL', 'Nederlands'],
  fr: ['fr_FR', 'Français'],
};

for (const [lc, [og, nombre]] of Object.entries(locales)) {
  const UP = lc.toUpperCase();
  let s = src;
  const rep = (a, b, n) => {
    const c = s.split(a).length - 1;
    if (n !== undefined && c !== n) throw new Error(`${lc}: "${a.slice(0, 50)}" esperaba ${n}, hay ${c}`);
    if (c === 0) throw new Error(`${lc}: no encontrado "${a.slice(0, 50)}"`);
    s = s.split(a).join(b);
  };

  rep('<html lang="es">', `<html lang="${lc}">`, 1);
  rep('  <meta charset="utf-8">\n', `  <meta charset="utf-8">
  <!-- ============================================================
       PENDIENTE DE TRADUCCION AL ${UP}.
       Estructura y metaetiquetas estructurales (lang, canonica,
       hreflang, og:locale, JSON-LD) ya localizadas. El COPY visible
       (title, description, titulares, parrafos, FAQ) sigue en espanol
       a la espera de revision con hablantes nativas que ademas cosen.
       No publicar como definitivo.
       ============================================================ -->
`, 1);
  rep('<link rel="canonical" href="https://kokin.app/es/">', `<link rel="canonical" href="https://kokin.app/${lc}/">`, 1);
  rep('<meta property="og:locale" content="es_ES">', `<meta property="og:locale" content="${og}">`, 1);
  rep('<meta property="og:url" content="https://kokin.app/es/">', `<meta property="og:url" content="https://kokin.app/${lc}/">`, 1);
  rep('"url": "https://kokin.app/es/",', `"url": "https://kokin.app/${lc}/",`, 1);
  rep('"inLanguage": "es",', `"inLanguage": "${lc}",`, 1);
  rep('<a class="brand" href="/es/"', `<a class="brand" href="/${lc}/"`, 2);
  rep('<summary aria-label="Cambiar idioma">ES</summary>', `<summary aria-label="Cambiar idioma">${UP}</summary>`, 1);

  // Selector de idioma. Va dos veces con formatos distintos: en la cabecera con
  // el nombre completo del idioma, en el pie sólo con el codigo. En las dos, el
  // actual pierde el aria-current y lo gana el nuevo.
  rep('<a href="/es/" hreflang="es" aria-current="true">Espanol</a>'.replace('Espanol', 'Español'),
      '<a href="/es/" hreflang="es">Español</a>', 1);
  rep(`<a href="/${lc}/" hreflang="${lc}">${nombre}</a>`,
      `<a href="/${lc}/" hreflang="${lc}" aria-current="true">${nombre}</a>`, 1);
  rep('<a href="/es/" hreflang="es" aria-current="true">ES</a>', '<a href="/es/" hreflang="es">ES</a>', 1);
  rep(`<a href="/${lc}/" hreflang="${lc}">${UP}</a>`, `<a href="/${lc}/" hreflang="${lc}" aria-current="true">${UP}</a>`, 1);

  // Enlaces de ruta: legales y herramientas. Cada idioma tiene los suyos.
  for (const p of ['aviso-legal', 'privacidad', 'terminos']) rep(`href="/es/${p}/"`, `href="/${lc}/${p}/"`, 1);
  rep('href="/es/herramientas/medidor-estiramiento/"', `href="/${lc}/herramientas/medidor-estiramiento/"`, 1);

  fs.writeFileSync(path.join(root, lc, 'index.html'), s);
  console.log(`${lc}/index.html regenerado`);
}
