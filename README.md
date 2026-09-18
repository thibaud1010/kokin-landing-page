# Kokin — Web pública (landing)

Landing estática de Kokin: HTML y CSS prerenderizados, cinco idiomas, cero
dependencias externas en tiempo de ejecución. Su único objetivo es que la
visitante cree una cuenta gratuita y trace su primer vestido (el **Aria**);
en segundo plano, capta emails para la lista de espera de las prendas futuras.

Es un proyecto **separado** de la app (`studio8-app`): no comparte estado con
ella y se despliega como archivos estáticos. Lo único que comparten es la
paleta del tema **«lujo»** (ver más abajo).

## Estructura

```
/                     index.html      Redirector por idioma (noindex) + fallback sin JS
/es/ /en/ /de/ /nl/ /fr/  index.html  Las cinco variantes de la landing
/app/                 index.html      MARCADOR de la app (noindex). Sustituir por el deploy real
/assets/css/kokin.css                 Hoja única. Variables de marca al principio (bloques 0 y 1)
/assets/js/kokin.js                   Mejora progresiva: envío de la lista de espera a Supabase
/assets/js/anima.js                   Mejora progresiva: reveals, cabecera, vídeos, raíles horizontales
/assets/video/ks1-*-web.mp4           Vídeos web (mudos, ~1,1-1,4MB) — se reproducen sólo en pantalla
/assets/img/look/                     Fotos y pósters de KS1 servidos por la web (dos anchos, webp + jpg)
/assets/img/portada/                  ORIGINALES del cliente (23MB por vídeo). NO desplegar
/assets/img/brand/wordmark.svg        Logotipo sin fondo, en currentColor (se inlinea como <symbol>)
/scripts/shot.mjs                     Capturas por CDP para revisar el diseño (no es parte del sitio)
/_v1-clasico/                         El diseño anterior completo, por si hay que volver
/assets/fonts/LEER.txt                Cómo autoalojar las fuentes
/sitemap.xml  /robots.txt
```

**El español es el idioma de referencia y su copy es definitivo.** Los otros
cuatro replican la estructura y las metaetiquetas estructurales (`lang`,
canónica, `hreflang`, `og:locale`, JSON-LD), pero su texto visible sigue en
español a la espera de traducción con hablantes nativas que además cosen. Cada
uno lleva un comentario `PENDIENTE DE TRADUCCIÓN` arriba.

Para regenerar los cuatro scaffolds tras editar `es/index.html`:

```bash
node scripts/gen-locales.mjs
```

Parte solo de `es/` y reescribe lo estructural (idioma, canónica, `og:locale`,
JSON-LD, selector de idioma, enlaces legales) en `/en/ /de/ /nl/ /fr/`.

## Antes de desplegar (lista de pendientes)

1. **Dominio.** Todo usa `https://kokin.app` de ejemplo. Busca y reemplaza por
   el dominio real en: los cinco `index.html` (canónica, OG, hreflang),
   `sitemap.xml`, `robots.txt` y el redirector raíz.
2. **Fotos reales.** Sustituye los SVG de `/assets/img/` por las fotos de la
   prenda cosida. El héroe es el LCP: pásalo a AVIF/WebP con `srcset` (el
   marcado de producción está comentado junto a la `<img>` del héroe) y
   actualiza el `<link rel="preload">` del `<head>`.
3. **Fuentes.** Deja los `.woff2` en `/assets/fonts/` (ver `LEER.txt`). Sin
   ellos la página se ve bien con los fallbacks del sistema.
4. **Supabase.** Rellena `SUPABASE_URL` y `SUPABASE_ANON_KEY` en
   `assets/js/kokin.js`. Crea la tabla `lista_espera (email, idioma, prenda,
   origen)` con RLS que permita solo `INSERT` anónimo.
5. **Cabecera del hosting.** Añade `X-Robots-Tag: noindex` sobre `/app/*` (el
   `<meta>` no basta si un enlace externo apunta a la app). Sirve AVIF/WebP con
   `Content-Type` correcto y cachea `/assets/*` con hash/immutable.
6. **OG image.** Reemplaza `og-cover.svg` por un `.jpg`/`.png` ≥1200×630:
   muchos scrapers sociales no rasterizan SVG.
7. **Legales.** Crea `/es/aviso-legal/`, `/es/privacidad/`, `/es/terminos/`
   (enlazados desde el pie).

## Dirección visual (resumen) — v2 «editorial»

La página se lee como un **lookbook de revista de moda**, tomando como
referencia la estructura y el ritmo de `serotoninn.com`, pero con la paleta,
el logotipo y el contenido de Kokïn. Lo que se copia del referente es la
*forma*, no el contenido: vídeo a sangre, secciones numeradas, raíles
horizontales y tipografía condensada ultra-negra.

- **Paleta.** Sin cambios respecto a `PALETA.md`: papel `#f7f2ea`, tinta
  `#16150f`, hilo rojo `#c2402d` (con `--red-ink` sobre claro y `--red-bright`
  sobre oscuro). Lo que cambia es el **reparto**: papel y tinta ocupan casi
  todo y el rojo se reserva a la numeración de sección (`01.`), a las palabras
  marcadas dentro de un titular y al foco.
- **Tipografía.** El referente usa fuentes de pago (Thunder + PP Fraktion
  Mono). Los equivalentes libres:
  - **Anton** → los displays enormes (condensada ultra-negra).
  - **Archivo** (variable en peso *y ancho*) → subtítulos, navegación, botones.
  - **Inter** → texto corrido. **JetBrains Mono** → etiquetas, `(paréntesis)`
    y `[corchetes]`.
  Fraunces sale de la web (el logotipo la lleva ya convertida a trazados, así
  que la marca no cambia). **Nota para traducir:** el interlineado de los
  displays no puede bajar de `.95`; por debajo, la tilde de una MAYÚSCULA
  acentuada (PATRÓN, BÁSICOS) choca con la línea de arriba y desaparece.
- **Estructura.** Héroe de vídeo a pantalla completa → marquesina →
  `01.` problema (carrusel de scroll) → `02.` **el generador** (vídeo de la app
  a sangre) → `03.` cómo funciona (sobre tinta) →
  `04.` KS1 con raíl de fotos → banda de vídeo a sangre → `05.` qué te llevas →
  `06.` en camino (raíl de categorías + votación) → `07.` técnica → `08.` FAQ →
  `09.` cierre → pie con el logotipo a sangre.
- **La sección `01` es un carrusel de scroll** (`kokin.css` §6, `anima.js`
  `diapositivas()`). El argumento va en cuatro frases: la caja mide
  `4 × 95svh` y dentro hay un escenario `position: sticky` que se queda quieto
  mientras se recorre. Cada frase entra por un lado (`data-from`: arriba,
  abajo, derecha, arriba) y al pasar SIGUE en esa dirección en vez de volver,
  para que se lea como un avance. Detalles que importan:
  - **No se secuestra el scroll.** El fijado es `sticky` puro: la rueda hace lo
    de siempre y se puede saltar la sección de un gesto. Sólo se traduce la
    posición a un índice.
  - El recorrido se reparte entre `n + 0,5` tramos (`COLA` en `anima.js`), no
    entre `n`: así la frase de remate se queda quieta un rato antes de que el
    escenario se suelte, en vez de irse a la vez que aparece.
  - **Las cuatro frases están siempre en el HTML y en orden**, sólo ocultas con
    `opacity`: un lector de pantalla las lee seguidas, como el párrafo que
    eran. Sin JS o con `prefers-reduced-motion` no hay fijado ni nada oculto —
    se apilan y se leen (comprobado con `Emulation.setEmulatedMedia`).
  - El desplazamiento horizontal en reposo **nunca puede superar el margen
    lateral** (`--gut`), o la diapositiva que espera a la derecha se sale del
    móvil. De ahí `clamp(.9rem, 3.5vw, 2.75rem)` y no `3rem`.
  - **Las cuatro frases NO van en el mismo tipo, y es a propósito.** La 1 y la
    4 son display (Anton, mayúsculas): se ven. La 2 y la 3 van en `.prosa`
    —caja baja, Inter ligera, interlineado 1.5, medida de 32 caracteres, en
    dos párrafos con aire—: se leen. Poner un párrafo largo en condensada y en
    mayúsculas lo hace ilegible. El resalte va por **peso y tinta**
    (`<b>`), no por color; el rojo se guarda para **una** idea por
    diapositiva (`<em>`).
  - **Fondo vivo**, tres capas que se recolocan con cada frase: dos manchas
    difusas —la grande en `--kraft`, el papel del propio sistema; la pequeña
    en rojo, puesta donde está el avance, así que **señala**, no decora
    (PALETA.md, regla 2)— y encima el **contorno real de KS1** como marca de
    agua (`assets/img/patron/trazo-ks1.svg`), que además gira un poco.
    Truco: la posición por frase va en la propiedad `translate`, la deriva
    lenta de fondo en `transform` y el giro en `rotate`. Son tres propiedades
    distintas y por eso se combinan en vez de pisarse; con las tres metidas en
    `transform`, la última gana y las otras desaparecen.
  - El trazado de fondo se centra con **márgenes calculados** desde su ancho
    (`--w`), no con `transform` ni con `translate`, que ya están ocupados.
- **La sección `02` es una pantalla de vídeo a sangre** (`kokin.css` §15): la
  grabación real de la app ocupa el alto completo y encima sólo va el texto.
  Dos decisiones que vienen de haberlo probado:
  - **Todo el texto va al pie, junto.** Arriba la grabación tiene su propia
    cabecera —el logotipo de la app y el «Regresar»— y cualquier rótulo puesto
    ahí se le encima y no hay quien lo lea.
  - **El velo NO es uniforme.** Se cierra casi del todo por debajo del 64 % del
    alto, que es donde vive el texto, y se abre a un 10 % en el centro, donde
    se ve la app. Un velo plano lo bastante oscuro para el texto convierte una
    interfaz clara en una mancha gris.
- **Sin usar ahora mismo:** `assets/img/patron/plano-ks1.*` y `hoja-ks1.*` (el
  plano de montaje y una hoja A4 sueltos, ~800 KB). Estaban en la versión
  anterior de la sección `02`, que era una rejilla de datos + imágenes; el
  vídeo la sustituyó. Se conservan porque son material real y bueno: si vuelven
  a hacer falta, el cómo se generaron está en «Media». `trazo-ks1.svg` sí se
  usa: es el fondo del carrusel de la `01`.
- **El resto del producto sí va dibujado** (`kokin.css` §14–15), a la espera de
  material: los tres archivos que se descargan (sección `05`) y las cuatro
  siluetas de las prendas futuras (sección `06`). Son **SVG en línea en
  lenguaje de patronaje**: línea de corte llena, margen de costura a puntos,
  piquetes, hilo en rojo y anotaciones en mono. Todo hereda `currentColor`, así
  que un dibujo se invierte solo cuando su tarjeta pasa a tinta. Los que llevan
  `data-trace` se dibujan al entrar en pantalla (`pathLength="1"` +
  `stroke-dashoffset`); sin JS ya están hechos. **Cuando haya material real,
  estos seis dibujos son los que se sustituyen** — cada uno está aislado en su
  propio contenedor.
- **Movimiento** (`anima.js`, todo mejora progresiva): reveals al scroll,
  displays que entran por líneas dentro de su máscara, cabecera que pasa de
  transparente a papel al salir del héroe y se aparta al bajar, vídeos que se
  reproducen sólo en pantalla, y raíles con arrastre de ratón + botones (que
  se esconden solos si el raíl cabe entero). Todo se apaga con
  `prefers-reduced-motion` y la página se lee completa sin JS.
- **El diseño anterior** («hoja de patrón / ficha técnica») está guardado
  entero en `_v1-clasico/` por si hay que volver.

## Media

Fuentes reales de KS1 en `assets/img/portada/` (subidas por el cliente):
tres PNG de ~3 MB y dos MP4 verticales de ~23 MB. **Esos originales no se
despliegan.** Lo que sirve la web son los derivados generados con ffmpeg:

```
assets/video/ks1-a-web.mp4   1,1 MB   banda de vídeo (preload=none)
assets/video/ks1-b-web.mp4   1,4 MB   héroe (autoplay, mudo, en bucle)
assets/img/look/poster-*.jpg          pósters de los dos vídeos
assets/img/look/look-0{1,2,3}[-470].{jpg,webp}   las tres fotos, dos anchos
```

Para regenerarlos tras cambiar los originales, ver el bloque de comandos en el
historial de la sesión: `-crf 32 -preset veryslow` para los MP4 (760 px de
ancho, sin audio, `+faststart`) y `-q:v 9` / `libwebp -quality 58` para las
fotos a 940 px.

### El plano de patrón de la sección 02

`assets/img/patron/` sale de **`vestido (2).pdf`**, un PDF de KS1 generado por
la propia app (12 hojas A4: A1…C4). El plano de montaje se compone así:

- Cada hoja dibuja el MISMO patrón global, desplazado un paso fijo: **538,58 pt
  entre columnas y 768,19 pt entre filas**. El paso se mide sobre la línea larga
  «colocar al doblez», que las doce hojas dibujan en la misma posición. *No* se
  puede deducir de la caja de tinta de cada página: da 28 pt de menos.
- Se corta por la **línea de solape** (`x=566,93`, `y=796,54`), no por la de
  recorte. En esa banda las dos hojas repiten el contenido, así que cortar ahí
  no parte ningún trazo — y sobre todo no parte los rótulos que van a caballo
  («DELANTERO» sale como `DELAN` + `NTERO` en dos hojas).
- La primera columna y la primera fila no llevan recorte: aportan también su
  margen.
- Apilar las hojas enteras NO vale: llevan fondo blanco opaco y cada una borra
  el trozo de la anterior.

El script está en el historial de la sesión; usa **PyMuPDF** (`import pymupdf`),
que es lo único con lo que se puede rasterizar un PDF en esta máquina (no hay
Ghostscript, ImageMagick ni poppler). Salidas: `plano-ks1[-sm].{webp,png}` y
`hoja-ks1[-sm].{webp,png}`. Line art: **WebP con calidad 88 y PNG de respaldo**,
nunca JPG — el JPG emborrona los trazos finos. Pesa 61 KB el plano grande.

### El vídeo de la sección 02 y el trazado del carrusel

`assets/video/generador-web.mp4` sale de una grabación de pantalla de la app
(`video-seccion-3.mp4`, 1508x1022, 32 s, 26 MB). **Se recorta a los 20 primeros
segundos**: en el frame ~610 entra el panel de descargas del navegador
(«Téléchargements») y, después, un visor de PDF con su barra de herramientas.
Codificado a resolución nativa con `-crf 22 -preset slow`, sin audio: pesa
1,1 MB. Una grabación de interfaz comprime muy bien, así que aquí **no hace
falta reducir la resolución para que pese poco** — bajarla sólo emborronaría el
texto de la app, que es justo lo que se quiere enseñar.

`assets/img/patron/trazo-ks1.svg` es el contorno real de KS1, extraído del
mismo PDF con PyMuPDF: el corte va en el color `(0.07, 0.07, 0.07)` y el margen
de costura en `(0.61, 0.64, 0.69)`; los demás colores son guías (piquetes en
magenta, hilo en verde azulado, doblez en azul, cintura en naranja). Cada hoja
se recorta a su celda con un `clipPath` cuyo rectángulo va en coordenadas **de
la hoja ya trasladada**, no globales — el `clip-path` se aplica después del
`transform` del `<g>`. Encadenando los tramos que se tocan en una sola
polilínea y redondeando a entero baja de 88 KB a 33 KB.

Quedan como marcador las cuatro prendas de `06. En camino` (blusa, short,
pantalón, falda), con su silueta técnica dibujada a la espera de foto.

## Revisar el diseño

```bash
node scripts/serve.mjs .                       # http://localhost:8799/es/
node scripts/shot.mjs http://127.0.0.1:8811/es/ capturas 1440 1000
```

`scripts/shot.mjs` conduce Chrome headless por CDP y guarda una captura por
pantalla bajando de mil en mil. Sirve para revisar; no forma parte del sitio.

Tres trampas que ya están resueltas dentro y conviene no volver a pisar:

1. Un `--screenshot` de página completa **no** vale: alarga el viewport y las
   secciones con `100svh` (el héroe) salen deformadas.
2. `Emulation.setDeviceMetricsOverride` con **`mobile: true` ignora el ancho
   pedido** (390 → 716 px reales, que es ancho de tablet y esconde los fallos de
   móvil). Va con `mobile: false`.
3. El scroll suave del CSS sigue animando cuando dispara el
   `IntersectionObserver`: hay que saltarlo con `behavior: "instant"` y esperar
   más de 1,05 s (reveal 0,7 s + escalonado 0,35 s), o salen secciones en blanco
   que en el navegador sí se ven.

Y para desbordes horizontales, **`body { overflow-x: hidden }` los esconde**:
hay que recorrer los elementos y comparar su borde derecho con
`documentElement.clientWidth`, saltándose los contenedores que se recorren a
propósito (`.rail__track`, `.engine__sheet`, `.marquee`).

## Requisitos cumplidos

- HTML real prerenderizado (el contenido no depende de JS).
- 5 idiomas con ruta propia, `hreflang` recíproco + `x-default`, `sitemap.xml`.
- Sin cookies, sin rastreadores de terceros, sin CDN de scripts ni widgets.
- Mobile-first (diseñado a 390 px), imágenes `lazy` salvo el héroe
  (`fetchpriority=high`), dimensiones fijas para evitar CLS.
- A11y: contraste AA, foco visible, navegable con teclado, `alt` descriptivo,
  `prefers-reduced-motion` respetado, plegables y selector de idioma sin JS.

## Previsualizar en local

```bash
node scripts/serve.mjs .    # o cualquier servidor estático; abre http://localhost:8799/es/
```

(No abras los HTML con `file://`: las rutas absolutas `/assets/...` necesitan
servirse desde la raíz de un servidor.)
