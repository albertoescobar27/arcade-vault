# SPEC 01 — MVP visual de Arcade Vault (5 pantallas)

> **Status:** Implementado
> **Depends on:** Ninguna (el tema global `app/globals.css` y las fuentes de `app/layout.tsx` ya existen)
> **Date:** 2026-11-11
> **Objective:** Portar a Next.js (App Router) las 5 pantallas de `references/templates/` — biblioteca, detalle, reproductor, auth y salón de la fama — solo la parte visual, con datos mock y sin ningún juego real.

---

## Scope

**In:**

- Rutas App Router: `/` (biblioteca), `/juegos/[id]` (detalle), `/juegos/[id]/jugar` (reproductor), `/auth`, `/salon`.
- Nav (con panel móvil) y footer compartidos desde `app/layout.tsx`.
- Datos mock estáticos: 8 juegos, categorías y `seededScores()` determinista (portados de `data.jsx`).
- Sesión simulada en `localStorage` (`av_user`): cualquier usuario/clave entra; "Jugar como invitado" no guarda usuario.
- Reproductor simulado: HUD, pantalla CRT con arena animada en CSS, score que sube aleatoriamente, pausa, FIN, modal de game over con guardado de puntuación en `localStorage` (`av_scores`).
- Búsqueda y filtro por categoría en biblioteca; tabs por juego en salón; fila "tu mejor marca" si hay usuario.
- Texto de la UI en español, idéntico al template.
- Mismo aspecto visual que el template (reutilizar clases de `app/globals.css`, sin rediseñar).

**Out of scope (for future specs):**

- Cualquier juego jugable real.
- Autenticación real (backend, OAuth, contraseñas, términos). Botones Google/GitHub son solo visuales.
- Base de datos o API de puntuaciones.
- Mostrar en detalle/salón las puntuaciones guardadas en `av_scores` (solo se guardan).
- Tests automatizados (no hay runner configurado).
- Internacionalización.

---

## Data model

```ts
// lib/games.ts
export type Category = "ARCADE" | "PUZZLE" | "SHOOTER" | "VERSUS";
export type Game = {
  id: string;            // slug: "bloque-buster", "caida", ...
  title: string;
  short: string;
  long: string;
  cat: Category;
  cover: string;         // clase CSS: "cover-bricks", "cover-tetro", ...
  color: "cyan" | "magenta" | "yellow" | "green";
  best: number;
  plays: string;         // "12.4K"
};
export const GAMES: Game[];                       // los 8 de data.jsx
export const CATS = ["TODOS", "ARCADE", "PUZZLE", "SHOOTER", "VERSUS"] as const;

// lib/scores.ts
export type ScoreRow = { rank: number; name: string; score: number; date: string }; // date "DD/MM/2026"
export function seededScores(seed: number, count?: number): ScoreRow[]; // misma fórmula que data.jsx

// lib/session.tsx (client)
export type User = { name: string };          // localStorage "av_user" (JSON | ausente)
// Context: { user: User | null; login(u: User | null): void; signOut(): void }

// localStorage "av_scores": { game: string; score: number; name: string; at: number }[]
```

Convenciones:

- Seeds idénticos al template: detalle `id.length * 17 + 3` (10 filas); salón `id.length * 23 + 7` (12 filas).
- Números con `toLocaleString("es-ES")`.
- Los accesos a `localStorage` van en `try/catch` y solo en cliente (tras montar), para no romper SSR ni hidratación.

---

## Implementation plan

> Antes de escribir código leer `node_modules/next/dist/docs/` (routing, `params` asíncrono, `cacheComponents`, `"use client"`). Cada paso deja la app ejecutable.

1. Crear `lib/games.ts` y `lib/scores.ts` portando `data.jsx` a TypeScript. Verificación: `npx tsc --noEmit` pasa.
2. Crear `lib/session.tsx` (`SessionProvider` + `useSession`, lee `av_user` en `useEffect`) y envolver `children` en `app/layout.tsx`.
3. Crear `components/nav.tsx` (client; `usePathname`, panel móvil, estado activo; "Biblioteca" activa también en `/juegos/*`) y `components/footer.tsx`. Montarlos en `app/layout.tsx` dentro de `#root` con `<main className="av-main">`. Verificación: nav visible en la página actual.
4. Biblioteca: reemplazar `app/page.tsx` por hero + filtros + grid. `components/game-card.tsx` (client, efecto tilt) y `components/library-view.tsx` (client, búsqueda + chips + estado vacío "NO HAY RESULTADOS").
5. Detalle: `app/juegos/[id]/page.tsx` con `generateStaticParams`, `notFound()` si el id no existe, leaderboard de 10 filas. Crear `app/not-found.tsx` con estilo del tema.
6. Auth: `app/auth/page.tsx` + `components/auth-form.tsx` (client): tabs entrar/crear, campo email solo en "crear", `login()` y `router.push("/")`, botón invitado.
7. Salón: `app/salon/page.tsx` + `components/hall-of-fame.tsx` (client): tabs por juego, podio 2-1-3, tabla animada, fila "tu mejor marca" si hay usuario (mismas fórmulas que `salon.jsx`).
8. Reproductor: `app/juegos/[id]/jugar/page.tsx` + `components/game-player.tsx` (client): HUD, CRT, intervalo de score cada 220 ms, pausa, FIN, modal de game over, guardado en `av_scores`, "Jugar de nuevo", "Volver al vault", "Salir" → detalle.
9. Revisión final: recorrer las 5 pantallas en desktop y móvil (<840 px) contra `references/templates/Arcade Vault.html`; ajustar diferencias.

---

## Acceptance criteria

- [ ] `npm run build` y `npx tsc --noEmit` terminan sin errores.
- [ ] `/` muestra el título "ARCADE VAULT", el buscador, 5 chips (TODOS, ARCADE, PUZZLE, SHOOTER, VERSUS) y 8 cards.
- [ ] Filtrar por categoría SHOOTER muestra exactamente 2 cards (INVASORES, ROCAS).
- [ ] Buscar "zzz" muestra "NO HAY RESULTADOS".
- [ ] Click en una card o en JUGAR navega a `/juegos/<id>` y muestra descripción, 4 tags, stat-strip y 10 filas de puntuaciones.
- [ ] `/juegos/no-existe` muestra la página not-found.
- [ ] "▶ JUGAR AHORA" navega a `/juegos/<id>/jugar`; el score sube solo y PAUSA lo detiene hasta REANUDAR.
- [ ] FIN abre el modal con la puntuación final; GUARDAR PUNTUACIÓN muestra "PUNTUACIÓN GUARDADA_" y añade una entrada a `localStorage["av_scores"]`.
- [ ] "JUGAR DE NUEVO" reinicia score, vidas y nivel; "VOLVER AL VAULT" navega a `/`.
- [ ] En `/auth`, entrar con usuario "kai" guarda `{"name":"KAI"}` en `av_user`, redirige a `/` y el nav muestra "KAI ▾".
- [ ] "JUGAR COMO INVITADO" redirige a `/` sin usuario y el nav muestra "Iniciar Sesión".
- [ ] Recargar la página con sesión iniciada mantiene el usuario en el nav sin errores de hidratación en consola.
- [ ] Clicar "KAI ▾" cierra sesión y elimina `av_user`.
- [ ] En la pestaña "CREAR CUENTA" aparece el campo de correo; en "INICIAR SESIÓN" no.
- [ ] `/salon` muestra podio (02 plata, 01 oro "CAMPEÓN", 03 bronce) y 12 filas; cambiar de chip cambia las filas.
- [ ] Con sesión iniciada, `/salon` muestra la fila "▸ TU MEJOR MARCA EN <JUEGO>"; sin sesión no aparece.
- [ ] A <840 px el nav oculta links y muestra el botón ≡ que abre/cierra el panel lateral.
- [ ] "Biblioteca" aparece activa en `/`, `/juegos/<id>` y `/juegos/<id>/jugar`; "Salón de la Fama" activa en `/salon`.
- [ ] El footer "© 2026 ARCADE VAULT · HECHO CON PIXELES Y NEÓN · v2.6.0" aparece en todas las pantallas.

---

## Decisions

- **Yes:** App Router con URLs reales (`/juegos/[id]`, etc.). Enlaces compartibles y uso idiomático de Next; el hash de `app.jsx` queda descartado.
- **No:** una sola ruta con estado + `location.hash`. Va contra el modelo de Next y rompe SSR/metadata.
- **Yes:** URLs en español (`/juegos`, `/jugar`, `/salon`) para coincidir con el idioma de la UI.
- **Yes:** sesión simulada en `localStorage` (`av_user`), igual que el template. Es suficiente para mostrar los estados con/sin usuario.
- **No:** auth real o solo-UI sin sesión. Auth real merece spec propio; sin sesión se perdería la fila "tu mejor marca" y el nombre en el nav.
- **Yes:** datos mock en `lib/` con `seededScores` determinista. Rankings estables entre recargas y hidratación sin diferencias.
- **No:** base de datos. No aporta a un MVP visual.
- **Yes:** guardar puntuaciones en `av_scores` pero no mostrarlas; deja el contrato listo para el spec de puntuaciones reales.
- **Yes:** reproductor simulado como en `reproductor.jsx`, para validar HUD, CRT y modal.
- **Yes:** componentes `"use client"` solo donde hay estado/efectos (nav, filtros, auth, salón, player); páginas como componentes de servidor.
- **Yes:** reutilizar las clases de `app/globals.css` sin Tailwind utilitario para estas pantallas, para garantizar fidelidad al template.

---

## Risks

| Risk | Mitigation |
| ---- | ---------- |
| Hidratación: `localStorage` no existe en el servidor y el nav cambiaría entre SSR y cliente | Leer `av_user` en `useEffect`; render inicial siempre como "sin usuario". |
| `Math.random` en el score del player causa diferencias SSR/cliente | El intervalo corre solo en cliente tras montar; el estado inicial es 0. |
| Semántica de `cacheComponents` / `params` asíncrono de Next 16 distinta a lo conocido | Leer los docs en `node_modules/next/dist/docs/` antes del paso 4; `generateStaticParams` en detalle y jugar. |
| `localStorage` bloqueado (modo privado) | `try/catch` en todo acceso; la app funciona sin persistir. |
| Clases del template (`.card`, `.btn`) chocan con el preflight de Tailwind | Ya resuelto en `globals.css` (`@layer base` para resets); verificar visualmente en el paso 9. |

---

## What is **not** in this spec

- Ningún juego jugable (Bloque Buster, Caída, etc.).
- Autenticación real, OAuth o backend.
- Base de datos, API o rankings con puntuaciones reales.
- Mostrar puntuaciones guardadas del jugador en detalle o salón.
- Tests automatizados.
- Internacionalización.

Cada uno, si llega, va en su propio spec.
