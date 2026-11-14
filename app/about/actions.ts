"use server";

import { Resend } from "resend";
import { validateContact, type ContactFields, type ContactState } from "@/lib/contact";

const GENERIC_ERROR = "NO SE PUDO ENVIAR EL MENSAJE. INTÉNTALO DE NUEVO MÁS TARDE.";

function field(formData: FormData, key: string): string {
  const v = formData.get(key);
  return typeof v === "string" ? v : "";
}

export async function sendContactMessage(
  _prev: ContactState,
  formData: FormData,
): Promise<ContactState> {
  const fields: ContactFields = {
    name: field(formData, "name"),
    email: field(formData, "email"),
    msg: field(formData, "msg"),
  };

  const invalid = validateContact(fields);
  if (invalid) return { status: "error", message: invalid, fields };

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO_EMAIL;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !to || !from) {
    console.error("[contact] Falta RESEND_API_KEY, CONTACT_TO_EMAIL o RESEND_FROM_EMAIL");
    return { status: "error", message: GENERIC_ERROR, fields };
  }

  const name = fields.name.replace(/[\r\n]+/g, " ").trim();
  const email = fields.email.trim();

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from,
      to,
      replyTo: email,
      subject: `[Arcade Vault] Mensaje de ${name}`,
      text: `Nombre: ${name}\nCorreo: ${email}\n\n${fields.msg.trim()}`,
    });
    if (error) {
      console.error(`[contact] Resend devolvió error: ${error.name} (${error.statusCode}) ${error.message}`);
      return { status: "error", message: GENERIC_ERROR, fields };
    }
  } catch (err) {
    console.error("[contact] Fallo al enviar:", err);
    return { status: "error", message: GENERIC_ERROR, fields };
  }

  return { status: "success", name };
}
