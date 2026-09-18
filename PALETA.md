# Kokïn — Paleta de colores

Sistema de color de la web pública, listo para reutilizar en la plataforma de
miembros. Universo visual: **la mesa de corte** — papel de patrón écru, tinta,
y **un solo color vivo, el hilo rojo**, reservado a la acción y al guiado.

Regla que sostiene todo: **el rojo no decora, señala**. Si algo no es una
acción, un dato clave o un guía de lectura, va en tinta o en papel.

---

## Tokens

### Superficies
| Token | Hex | Uso |
|---|---|---|
| `--bg` | `#f7f2ea` | Fondo general (papel de patrón) |
| `--surface` | `#fffdf8` | Tarjetas, paneles, tablas |
| `--surface-2` | `#efe7d9` | Kraft: secciones alternas, huecos de imagen |
| `--surface-deep` | `#16150f` | «Pantallas» oscuras (bloques destacados, cierres) |
| `--on-deep` | `#f7f2ea` | Texto sobre `--surface-deep` |

### Tinta
| Token | Hex | Uso |
|---|---|---|
| `--text` | `#16150f` | Titulares y texto principal |
| `--text-soft` | `#46423a` | Texto corrido |
| `--text-faint` | `#6d675c` | Metadatos, leyendas, etiquetas |

### El hilo rojo (acento)
| Token | Hex | Uso |
|---|---|---|
| `--accent` | `#c2402d` | Rellenos, botones, iconos, barras |
| `--accent-ink` | `#9d3121` | El acento **como texto sobre fondo claro** |
| `--accent-bright` | `#d9614f` | El acento **como texto sobre fondo oscuro** |
| `--on-accent` | `#fbf6ee` | Texto sobre un relleno de acento |
| `--accent-line` | `rgba(194,64,45,.5)` | Filos y punteados de acento |
| `--accent-soft` | `rgba(194,64,45,.1)` | Fondos de realce, filas activas |

### Filos
| Token | Hex | Uso |
|---|---|---|
| `--line` | `#e0d6c6` | Filo ligero, separadores |
| `--line-strong` | `#c3b7a2` | Filo marcado, bordes de control |
| `--deep-line` | `rgba(247,242,234,.14)` | Filos sobre superficie oscura |

### Semánticos (solo estados, nunca decoración)
| Token | Hex | Uso |
|---|---|---|
| `--denim` | `#33465f` | Información, apuntes técnicos |
| `--sauge` | `#536c47` | Validado, correcto |
| `--safran` | `#8f5c10` | Aviso, error típico |

---

## Las tres reglas que hay que respetar

1. **El acento cambia de tono según el fondo.** `#c2402d` como TEXTO se queda
   en 4,21 sobre kraft y 3,54 sobre oscuro: no llega a AA. Por eso hay tres
   variantes y no una:
   - sobre claro (papel, tarjeta, kraft) → `--accent-ink` `#9d3121`
   - sobre oscuro → `--accent-bright` `#d9614f`
   - como relleno (botón, chip) → `--accent` con `--on-accent` encima

2. **Un solo color vivo.** Nada de una segunda familia decorativa. Los
   semánticos existen solo para comunicar estado, y son de uso escaso.

3. **Los grises son cálidos, no neutros.** Toda la tinta tiene base cálida
   (`#16150f`, `#46423a`, `#6d675c`). Un gris neutro rompe el conjunto.

---

## Contrastes verificados (sobre `--bg` `#f7f2ea`)

- `--text` `#16150f` → ~15:1 · AAA
- `--text-soft` `#46423a` → ~8:1 · AAA
- `--text-faint` `#6d675c` → ~4,8:1 · AA
- `--accent-ink` `#9d3121` → ~5,9:1 · AA (también sobre kraft)
- `--on-accent` sobre `--accent` → ~5,4:1 · AA

---

## Bloque listo para pegar

```css
:root {
  /* Superficies */
  --bg:            #f7f2ea;
  --surface:       #fffdf8;
  --surface-2:     #efe7d9;
  --surface-deep:  #16150f;
  --on-deep:       #f7f2ea;

  /* Tinta */
  --text:          #16150f;
  --text-soft:     #46423a;
  --text-faint:    #6d675c;

  /* Hilo rojo */
  --accent:        #c2402d;
  --accent-ink:    #9d3121;  /* acento como texto sobre claro  */
  --accent-bright: #d9614f;  /* acento como texto sobre oscuro */
  --on-accent:     #fbf6ee;
  --accent-line:   rgba(194,64,45,.5);
  --accent-soft:   rgba(194,64,45,.1);

  /* Filos */
  --line:          #e0d6c6;
  --line-strong:   #c3b7a2;
  --deep-line:     rgba(247,242,234,.14);

  /* Semánticos: solo estados */
  --denim:         #33465f;
  --sauge:         #536c47;
  --safran:        #8f5c10;

  /* Acción */
  --cta-bg:        var(--accent);
  --cta-bg-hover:  #a9331f;
  --cta-fg:        var(--on-accent);
  --focus:         var(--accent);
}
```

---

## Tipografía (por si hace falta la coherencia completa)

- **Display:** Fraunces (600, con `font-optical-sizing: auto`; itálica real
  para el énfasis)
- **Texto:** Inter (400/500/600)
- **Datos y etiquetas:** JetBrains Mono (400/500), en versalitas con
  `letter-spacing` amplio

```
https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..900;1,9..144,300..900&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap
```
