# SPEC 02 — Home (landing) de Arcade Vault

> **Status:** Aprobado
> **Depends on:** SPEC 01
> **Date:** 2026-11-13
> **Objective:** Portar a Next.js la landing de `references/templates/home-about/home.jsx` como nueva ruta `/`, moviendo la biblioteca a `/games`, solo visual y con datos constantes temporales.

---

## Scope

**In:**

- Nueva `app/page.tsx` (`/`) con las secciones del template: hero con siluetas flotantes, "¿POR QUÉ ARCADE VAULT?", "JUEGOS DISPONIBLES AHORA", stats, "ACTIVIDAD EN VIVO", "PRECIOS" (+ FAQ) y CTA final.
- Mover la biblioteca de `/` a `/games` (`app/games/page.tsx`). Detalle y reproductor se quedan en `/juegos/[id]` y `/juegos/[id]/jugar`.
- Nav: nuevo link "Inicio" (activo solo en `/`), "Biblioteca" apunta a `/games` y queda activa en `/games` y `/juegos/*`, contador decorativo "CRÉDITOS · 03" (visible >840 px), "Inicio" también en el panel móvil con "CRÉDITOS · 03" al pie.
- Actualizar todos los enlaces que hoy apuntan a `/` como biblioteca: "VOLVER AL VAULT" (detalle, player), "VOLVER A LA BIBLIOTECA" (salón). `not-found` sigue apuntando a `/` (home).
- Datos constantes tipadas temporales en `lib/home.ts`; el rail usa `GAMES.slice(0, 6)`.
- Animación `reveal` al hacer scroll mediante hook cliente `useReveal` (IntersectionObserver).
- Copiar a `app/globals.css` solo las reglas del home de `references/templates/home-about/styles.css` (`.home*`, `.silo*`, `.hero-*`, `.section-*`, `.kicker`, `.feature-*`, `.ft-*`, `.mini-*`, `.stat-*`, `.activity-*`, `.tick*`, `.tk-*`, `.top-*`, `.tp-*`, `.price*`, `.pc-*`, `.pricing-*`, `.faq-*`, `.final-*`, `.reveal`, `.lb-link` y sus `@keyframes`/media queries).
- Texto de la UI en español, idéntico al template.

**Out of scope (for future specs):**

- Página "Acerca de" y formulario de contacto (`about.jsx`); el link "Acerca de" no se agrega al nav.
- Datos reales para stats, actividad y top de jugadores (hoy son constantes).
- Cambiar CTAs según sesión: "CREAR CUENTA" y "EMPEZAR GRATIS" siempre llevan a `/auth`.
- Renombrar `/juegos/[id]` a `/games/[id]`.
- Pasos de pago o planes reales (el plan "$0" es solo visual).
- Tests automatizados (sin runner configurado).

---

## Data model

```ts
// lib/home.ts — constantes temporales, idénticas a home.jsx
import type { Game } from "@/lib/games";

type Tone = "cyan" | "magenta" | "yellow" | "green";

export type Feature = { icon: "GAMEPAD" | "FREE" | "TROPHY" | "ROCKET"; title: string; desc: string; tone: Tone };
export type Stat = { n: string; u: string; s: string };
export type TickerRow = { player: string; game: string; score: number; when: string; tone: Tone };
export type TopRow = { rank: number; player: string; score: number };
export type Faq = { q: string; a: string };

export const FEATURES: Feature[];   // 4
export const STATS: Stat[];         // 3
export const TICKER: TickerRow[];   // 7
export const TOP_TODAY: TopRow[];   // 5
export const PRICE_ITEMS: string[]; // 6 bullets del plan
export const FAQS: Faq[];           // 3
```

Convenciones:

- Números con `toLocaleString("es-ES")`.
- Barras del top: ancho `100 - i * 16` %.
- Retardos escalonados: features `i * 80` ms, stats `i * 90` ms, ticker `i * 60` ms.
- Sin acceso a `localStorage` ni estado de sesión en el home.

---

## Implementation plan

> Antes de escribir código leer `node_modules/next/dist/docs/` (routing, `"use client"`, `cacheComponents`). Cada paso deja la app ejecutable.

1. Mover biblioteca: crear `app/games/page.tsx` con el contenido actual de `app/page.tsx`; dejar `app/page.tsx` temporalmente con `redirect("/games")`. Verificación: `/games` muestra la biblioteca.
2. Actualizar enlaces a biblioteca (`components/game-player.tsx`, `app/juegos/[id]/page.tsx`, `components/hall-of-fame.tsx`) a `/games`, y `components/nav.tsx`: link "Inicio" (`/`), "Biblioteca" → `/games`, `libraryActive = pathname === "/games" || startsWith("/juegos")`, `homeActive = pathname === "/"`, contador de créditos y entrada "Inicio" en el panel móvil. Verificación: nav correcto en `/games` y `/juegos/<id>`.
3. Copiar las reglas CSS del home a `app/globals.css` (bloque comentado `/* ===== Home ===== */`). Verificación: `npm run build` sin errores.
4. Crear `lib/home.ts` con las constantes tipadas.
5. Crear componentes servidor: `components/home/silhouettes.tsx` (8 SVG), `components/home/feature-icon.tsx`, `components/home/mini-card.tsx` (`Link` a `/juegos/<id>`).
6. Crear `lib/use-reveal.ts` (hook `useReveal`) y `components/home/reveal-root.tsx` (client; llama al hook una vez y renderiza `children` dentro de `<div className="home fade-in">`).
7. Reemplazar `app/page.tsx` por el home: hero, "01 POR QUÉ", "02 JUEGOS" (rail + `VER TODOS LOS JUEGOS →` a `/games`), stats, "03 ACTIVIDAD EN VIVO" (`VER SALÓN →` a `/salon`), "04 PRECIOS" (`/auth`) y CTA final (`INSERTAR MONEDA →` a `/games`). Botones del hero: `EXPLORAR JUEGOS` → `/games`, `CREAR CUENTA` → `/auth`.
8. Ajustar `components/auth-form.tsx` solo si hace falta: tras entrar o jugar como invitado se mantiene `router.push("/")` (ahora el home).
9. Revisión final: comparar `/` en desktop y móvil (<840 px) con `references/templates/home-about/arcade-vault-standalone.html`; ajustar diferencias.

---

## Acceptance criteria

- [ ] `npm run build` y `npx tsc --noEmit` terminan sin errores.
- [ ] `/` muestra "EL ARCADE", "CLÁSICO ESTÁ" y "DE VUELTA", y los botones "▶ EXPLORAR JUEGOS" y "✦ CREAR CUENTA".
- [ ] El hero renderiza 8 siluetas decorativas con `aria-hidden="true"`.
- [ ] Sección "¿POR QUÉ ARCADE VAULT?" muestra 4 feature-cards (JUEGOS CLÁSICOS, 100% GRATIS, LADDER BOARDS, SIEMPRE CRECIENDO).
- [ ] "JUEGOS DISPONIBLES AHORA" muestra exactamente 6 mini-cards (los 6 primeros de `GAMES`); click en una navega a `/juegos/<id>`.
- [ ] "VER TODOS LOS JUEGOS →" y "INSERTAR MONEDA →" navegan a `/games`.
- [ ] El bloque de stats muestra "12+", "MILES" y "GLOBAL".
- [ ] "ACTIVIDAD EN VIVO" muestra 7 filas de últimas puntuaciones y 5 del top; la fila 1 es `#01 NEONFOX 312.840`.
- [ ] "VER SALÓN →" navega a `/salon`.
- [ ] "CREAR CUENTA" y "EMPEZAR GRATIS →" navegan a `/auth`, con o sin sesión.
- [ ] Sección de precios muestra "$0 / SIEMPRE", 6 bullets y 3 preguntas de FAQ.
- [ ] Las secciones con `.reveal` empiezan ocultas y reciben la clase `in` al entrar en el viewport.
- [ ] `/games` muestra la biblioteca de SPEC 01 (8 cards, buscador, 5 chips).
- [ ] "Inicio" activo solo en `/`; "Biblioteca" activa en `/games`, `/juegos/<id>` y `/juegos/<id>/jugar`; "Salón de la Fama" activa en `/salon`.
- [ ] El nav muestra "CRÉDITOS · 03" a ≥840 px y lo oculta por debajo; el panel móvil incluye "Inicio".
- [ ] "VOLVER AL VAULT" (detalle y player) y "VOLVER A LA BIBLIOTECA" (salón) navegan a `/games`.
- [ ] Entrar o "JUGAR COMO INVITADO" en `/auth` redirige a `/` (home).
- [ ] No hay errores de hidratación ni de consola en `/`.
- [ ] A <900 px el grid de precios pasa a una columna y el hero no produce scroll horizontal.

---

## Decisions

- **Yes:** home en `/` y biblioteca en `/games`. Es el comportamiento del template (route `home` vs `biblioteca`) y deja `/` como landing real.
- **No:** biblioteca en `/` + home en `/inicio`. La landing no sería la entrada del sitio.
- **Yes:** dejar `/juegos/[id]` y `/juegos/[id]/jugar` como están. Cambio mínimo; unificar bajo `/games` queda para otro spec si se desea.
- **Yes:** solo home; "Acerca de" en spec propio. Mantiene el spec pequeño y evita un link roto en el nav.
- **Yes:** "Inicio" + "CRÉDITOS · 03" en el nav, fiel a `nav.jsx`. El contador es solo decorativo.
- **Yes:** bloque CSS del home dentro de `app/globals.css`. Misma convención y fidelidad que SPEC 01.
- **No:** archivo CSS aparte. Rompería la convención del proyecto sin beneficio hoy.
- **Yes:** datos como constantes tipadas en `lib/home.ts`, marcadas como temporales. Fácil de reemplazar por datos reales.
- **No:** datos inline en la página. Mezcla contenido y marcado.
- **Yes:** hook cliente `useReveal` con un único `RevealRoot`; la página sigue siendo componente de servidor.
- **No:** quitar la animación de scroll. Pierde fidelidad con el template.
- **Yes:** CTAs siempre a `/auth`, sin lógica de sesión. Por ahora solo se crean los diseños.
- **Yes:** tras auth se redirige a `/` (home), como el template.

---

## Risks

| Risk | Mitigation |
| ---- | ---------- |
| `.reveal` deja secciones invisibles si JS falla o el observer no dispara | Hook limpia el observer al desmontar; verificar scroll completo en el paso 9. |
| Colisión de nombres CSS con reglas existentes (`.kicker`, `.section-title`, `.pulse`) | Revisar duplicados en `globals.css` antes de pegar; conservar la definición existente si es idéntica. |
| Quedan enlaces a `/` pensando en biblioteca tras el movimiento | Paso 2 los enumera; buscar `"/"` con grep al terminar. |
| Next 16 (`cacheComponents`) afecta una página sin datos dinámicos | La página es estática; leer docs antes del paso 7. |
| `.hero-scroll` / siluetas animadas causan overflow horizontal en móvil | Verificar a <840 px en el paso 9; el contenedor `.home-hero` ya usa `overflow: hidden` en el template. |

---

## What is **not** in this spec

- Página "Acerca de" y formulario de contacto.
- Estadísticas, actividad y ranking reales (backend/API).
- CTAs que cambian según sesión.
- Mover `/juegos/[id]` a `/games/[id]`.
- Tests automatizados.

Cada uno, si llega, va en su propio spec.
