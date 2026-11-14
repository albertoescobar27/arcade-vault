export const CONTACT_LIMITS = { name: 80, email: 120, msg: 2000 } as const;

export type ContactFields = { name: string; email: string; msg: string };

export type ContactState =
  | { status: "idle" }
  | { status: "success"; name: string }
  | { status: "error"; message: string; fields: ContactFields };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Devuelve un mensaje de error, o null si los campos son válidos. */
export function validateContact(f: ContactFields): string | null {
  const name = f.name.trim();
  const email = f.email.trim();
  const msg = f.msg.trim();

  if (!name || !email || !msg) return "TODOS LOS CAMPOS SON OBLIGATORIOS.";
  if (name.length > CONTACT_LIMITS.name) return `EL NOMBRE NO PUEDE SUPERAR ${CONTACT_LIMITS.name} CARACTERES.`;
  if (email.length > CONTACT_LIMITS.email) return `EL CORREO NO PUEDE SUPERAR ${CONTACT_LIMITS.email} CARACTERES.`;
  if (msg.length > CONTACT_LIMITS.msg) return `EL MENSAJE NO PUEDE SUPERAR ${CONTACT_LIMITS.msg} CARACTERES.`;
  if (/[\r\n]/.test(email) || !EMAIL_RE.test(email)) return "CORREO ELECTRÓNICO INVÁLIDO.";
  return null;
}
