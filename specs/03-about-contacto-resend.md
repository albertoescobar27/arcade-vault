# SPEC 03 — Página "Acerca de" y formulario de contacto con Resend

> **Status:** Implementado
> **Depends on:** SPEC 01, SPEC 02
> **Date:** 2026-11-13
> **Objective:** Portar a Next.js la página de `references/templates/home-about/about.jsx` como ruta `/about` (con link "Acerca de" en el nav) y hacer que su formulario de contacto envíe un correo real con Resend mediante una Server Action.

---

## Scope

**In:**

- Nueva `app/about/page.tsx` (`/about`) idéntica al template: hero "ACERCA DE ARCADE VAULT" con misión y 3 highlights (iconos pixel SVG), divisor animado de 24 píxeles y sección "CONTÁCTANOS" con intro, 3 tips y formulario.
- Link "Acerca de" en `components/nav.tsx` (desktop y panel móvil), después de "Salón de la Fama", activo solo en `/about`.
- Formulario (nombre, correo, mensaje) con el comportamiento del template: shake si hay campos vacíos (sin llamar al servidor), estado de éxito tipo terminal "VAULT-OS // TERMINAL" con `GRACIAS, <NOMBRE>.` y botón "ENVIAR OTRO MENSAJE" que limpia el formulario.
- Envío real vía Resend (paquete `resend`) desde una Server Action `sendContactMessage` (`"use server"`) consumida con `useActionState`. La API key nunca llega al cliente.
- Validación en servidor (campos requeridos, correo válido, límites de largo) y estado de error en estilo terminal (`[ERROR] …`) con shake; el formulario conserva lo escrito.
- Variables de entorno preparadas en `.env.local` (vacías, el usuario pone la key después): `RESEND_API_KEY`, `RESEND_FROM_EMAIL=onboarding@resend.dev`, `CONTACT_TO_EMAIL`.
- Animación `reveal` reutilizando `useReveal`; `RevealRoot` pasa a aceptar `className` (por defecto `"home"`, el about usa `"about"`).
- Copiar a `app/globals.css` solo las reglas del about de `references/templates/home-about/styles.css` (`.about*`, `.highlight*`, `.hl-*`, `.div-*`, `.contact-*`, `.tip*`, `.terminal-success`, `.term-*`, `.shake` y sus `@keyframes`/media queries), más el estado de error.
- Texto de la UI en español, idéntico al template.

**Out of scope (for future specs):**

- Guardar mensajes en base de datos o bandeja en la app.
- Correo de confirmación / auto-respuesta al remitente.
- Rate limiting, captcha u honeypot anti-spam.
- Dominio propio verificado en Resend (se usa `onboarding@resend.dev`).
- Plantillas HTML de correo (se envía texto plano).
- Internacionalización.
- Tests automatizados (sin runner configurado).

---

## Data model

```ts
// lib/contact.ts — tipos y validación (importable por cliente y servidor)
export const CONTACT_LIMITS = { name: 80, email: 120, msg: 2000 } as const;

export type ContactFields = { name: string; email: string; msg: string };

export type ContactState =
  | { status: "idle" }
  | { status: "success"; name: string }
  | { status: "error"; message: string; fields: ContactFields };

export function validateContact(f: ContactFields): string | null; // mensaje de error o null

// app/about/actions.ts
"use server";
export async function sendContactMessage(prev: ContactState, formData: FormData): Promise<ContactState>;
```

Variables de entorno (`.env.local`, ignorado por git):

```
RESEND_API_KEY=            # la pone el usuario después
RESEND_FROM_EMAIL=onboarding@resend.dev
CONTACT_TO_EMAIL=          # correo del dueño de la cuenta Resend
```

Convenciones:

- Correo: `from` = `RESEND_FROM_EMAIL`, `to` = `CONTACT_TO_EMAIL`, `replyTo` = correo del visitante, `subject` = `[Arcade Vault] Mensaje de <nombre>` (nombre sin saltos de línea), cuerpo en texto plano (`text`, nunca HTML) con nombre, correo y mensaje.
- Si falta `RESEND_API_KEY` o `CONTACT_TO_EMAIL`, o Resend devuelve error, la action responde `status: "error"` con mensaje genérico; el detalle solo se registra con `console.error` en servidor. Nunca se lanza excepción al cliente.
- El cliente valida solo "campos vacíos" (igual que el template); el servidor valida todo.
- Retardos escalonados de highlights: `i * 80` ms; píxeles del divisor: `i * 80` ms.

---

## Implementation plan

> Antes de escribir código leer `node_modules/next/dist/docs/` (Server Actions / forms, `useActionState`, `"use client"`, `cacheComponents`, variables de entorno). Cada paso deja la app ejecutable.

1. Instalar `resend` (`npm install resend`) y crear `.env.local` con las 3 variables (key y destinatario vacíos). Verificación: `npm run build` pasa.
2. Copiar las reglas CSS del about a `app/globals.css` (bloque `/* ===== About ===== */`), revisando duplicados (`.field`, `.kicker`, `.pixel`, `shake`, `blink`) y conservando la definición existente si es idéntica. Añadir estilo de error terminal (`.term-body .error`, borde/rojo del tema). Verificación: `npm run build` sin errores.
3. Crear `lib/contact.ts` con `CONTACT_LIMITS`, tipos y `validateContact`.
4. Crear `app/about/actions.ts` (`sendContactMessage`): lee `FormData`, valida, envía con `new Resend(process.env.RESEND_API_KEY)`, devuelve `ContactState`.
5. Generalizar `components/home/reveal-root.tsx` para aceptar `className` (default `"home"`). Verificación: `/` sigue igual.
6. Crear componentes en `components/about/`: `highlight-icon.tsx` (HEART, BROWSER, PLANT; servidor) y `contact-form.tsx` (client: `useActionState`, shake por vacíos o error, terminal de éxito/error, "ENVIAR OTRO MENSAJE", botón deshabilitado/"ENVIANDO…" mientras `pending`).
7. Crear `app/about/page.tsx` (servidor): hero, highlights, divisor, contacto, todo dentro de `RevealRoot className="about"`. Verificación: `/about` se ve como el template.
8. Añadir "Acerca de" a `components/nav.tsx` (desktop y móvil) con `aboutActive = pathname === "/about"`. Verificación: activo solo en `/about`.
9. Probar el envío: sin key → estado de error terminal; con key real y `CONTACT_TO_EMAIL` (una vez el usuario los coloque) → correo recibido. Revisión final: comparar `/about` en desktop y móvil (<840 px) con `references/templates/home-about/arcade-vault-standalone.html`.

---

## Acceptance criteria

- [ ] `npm run build` y `npx tsc --noEmit` terminan sin errores.
- [ ] `/about` muestra "ACERCA DE ARCADE VAULT", el texto de misión y 3 highlights (HECHO CON ❤️ PARA JUGADORES, JUEGOS EN HTML — CORREN EN CUALQUIER NAVEGADOR, PROYECTO EN CONSTANTE CRECIMIENTO).
- [ ] El divisor renderiza 24 píxeles con `aria-hidden="true"`.
- [ ] La sección contacto muestra "CONTÁCTANOS", los 3 tips (RESPUESTA EN 24-48H, SUGERENCIAS BIENVENIDAS, SIN SPAM, JAMÁS) y el formulario con NOMBRE, CORREO ELECTRÓNICO, MENSAJE y "▶  ENVIAR MENSAJE".
- [ ] Enviar con algún campo vacío activa el shake (~400 ms) y no invoca la action (sin request al servidor).
- [ ] Con `RESEND_API_KEY` y `CONTACT_TO_EMAIL` válidos, enviar el formulario completo entrega un correo a `CONTACT_TO_EMAIL` con `replyTo` = correo del visitante y asunto `[Arcade Vault] Mensaje de <nombre>`, y la UI muestra la terminal con `> MENSAJE RECIBIDO. TE RESPONDEREMOS PRONTO. GRACIAS, <NOMBRE EN MAYÚSCULAS>.`
- [ ] "ENVIAR OTRO MENSAJE" vuelve al formulario con los campos vacíos.
- [ ] Sin `RESEND_API_KEY` (o con Resend rechazando), la UI muestra la terminal de error `[ERROR]…` con shake, los campos conservan lo escrito y no hay excepción no controlada.
- [ ] Un correo con formato inválido, o campos que superan `CONTACT_LIMITS`, son rechazados por el servidor con mensaje de error (verificable llamando la action sin validación de cliente).
- [ ] Mientras se envía, el botón queda deshabilitado y evita envíos dobles.
- [ ] `RESEND_API_KEY` no aparece en el bundle del cliente ni en el HTML (sin prefijo `NEXT_PUBLIC_`).
- [ ] `.env.local` existe con las 3 variables y no está trackeado por git.
- [ ] Nav: "Acerca de" aparece en desktop y en el panel móvil, activo solo en `/about`; los demás links no cambian su estado activo.
- [ ] Las secciones `.reveal` empiezan ocultas y reciben `in` al entrar en el viewport; `/` (home) mantiene su animación.
- [ ] A <900 px el grid de contacto pasa a una columna sin scroll horizontal.
- [ ] No hay errores de hidratación ni de consola en `/about`.

---

## Decisions

- **Yes:** ruta `/about` + link "Acerca de" en el nav. Fiel a `nav.jsx` y consistente con `/games` (en inglés).
- **No:** `/acerca-de` o dejar la ruta sin link. La primera rompe la consistencia con `/games`; la segunda deja una página inaccesible.
- **Yes:** Server Action con `useActionState`. La API key queda en servidor, sin endpoint público que mantener, y es lo idiomático en Next 16. (El usuario no eligió mecanismo explícitamente; se adopta la opción recomendada.)
- **No:** Route Handler `/api/contact`. Solo aporta si el formulario se consumiera desde fuera de la app.
- **Yes:** remitente `onboarding@resend.dev` y destinatario en `CONTACT_TO_EMAIL`. Sin dominio propio por ahora; ambos son variables de entorno para cambiarlos sin tocar código. El correo del dueño no se escribe en el repo.
- **Yes:** API key vía `.env.local` que el usuario completa después; la app degrada a estado de error si falta, en vez de romper.
- **Yes:** validación completa en servidor + estado de error en estilo terminal que conserva los campos. Un fallo de envío no debe verse como éxito.
- **No:** solo shake sin mensaje. El visitante no sabría que su mensaje no salió.
- **Yes:** cuerpo del correo en texto plano. Evita inyección de HTML con contenido del visitante.
- **No:** honeypot, rate limit, auto-respuesta. Quedan fuera para mantener el spec pequeño.
- **Yes:** reutilizar `useReveal` generalizando `RevealRoot` con `className`. Evita duplicar el hook del template.
- **Yes:** bloque CSS del about dentro de `app/globals.css`, misma convención que SPEC 01 y 02.

---

## Risks

| Risk | Mitigation |
| ---- | ---------- |
| `onboarding@resend.dev` solo entrega al correo dueño de la cuenta Resend | `CONTACT_TO_EMAIL` debe ser ese correo; documentarlo en `.env.local` con comentario. |
| Sin `RESEND_API_KEY` el formulario no puede probarse de punta a punta | Verificar el estado de error ahora; la prueba real queda al colocar la key (paso 9). |
| Spam / abuso del formulario sin rate limit | Aceptado por ahora; spec futuro (honeypot / rate limit). |
| Inyección de cabeceras en `subject` o `replyTo` | Quitar saltos de línea del nombre y validar el correo en servidor. |
| Colisión de nombres CSS (`.field`, `.kicker`, `shake`) con reglas existentes | Revisar duplicados antes de pegar; conservar la existente si es idéntica. |
| Next 16 (`cacheComponents`) afecta Server Actions o lectura de `process.env` | Leer docs antes del paso 4; la lectura de env ocurre solo dentro de la action. |
| `.reveal` deja secciones invisibles si el observer no dispara | Mismo hook ya validado en SPEC 02; verificar scroll completo en el paso 9. |

---

## What is **not** in this spec

- Persistencia de mensajes (base de datos / panel de administración).
- Correo de confirmación al visitante.
- Anti-spam (honeypot, captcha, rate limit).
- Dominio propio verificado en Resend y plantillas HTML de correo.
- Tests automatizados.

Cada uno, si llega, va en su propio spec.
