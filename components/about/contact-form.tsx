"use client";

import { useActionState, useState } from "react";
import { sendContactMessage } from "@/app/about/actions";
import type { ContactState } from "@/lib/contact";

const INITIAL: ContactState = { status: "idle" };
const EMPTY = { name: "", email: "", msg: "" };

export function ContactForm() {
  // Cambiar la key remonta el formulario: estado idle y campos vacíos.
  const [instance, setInstance] = useState(0);
  return <ContactFormInner key={instance} onReset={() => setInstance((n) => n + 1)} />;
}

function ContactFormInner({ onReset }: { onReset: () => void }) {
  const [form, setForm] = useState(EMPTY);
  const [shake, setShake] = useState(false);

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 400);
  };

  const [state, formAction, pending] = useActionState(
    async (prev: ContactState, formData: FormData): Promise<ContactState> => {
      const next = await sendContactMessage(prev, formData);
      if (next.status === "error") {
        setForm(next.fields);
        triggerShake();
      }
      return next;
    },
    INITIAL,
  );

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    if (!form.name.trim() || !form.email.trim() || !form.msg.trim()) {
      e.preventDefault();
      triggerShake();
    }
  };

  const shakeCls = shake ? " shake" : "";

  if (state.status === "success") {
    return (
      <div className={"contact-form" + shakeCls}>
        <div className="terminal-success">
          <div className="term-bar">
            <span className="dot r"></span><span className="dot y"></span><span className="dot g"></span>
            <span className="term-title">VAULT-OS // TERMINAL</span>
          </div>
          <div className="term-body">
            <div className="line"><span className="prompt">vault@arcade:~$</span> ./send_message --to=team</div>
            <div className="line dim">[OK] Conectando con servidor…</div>
            <div className="line dim">[OK] Validando contenido…</div>
            <div className="line dim">[OK] Transmitiendo paquete…</div>
            <div className="line success">&gt; MENSAJE RECIBIDO. TE RESPONDEREMOS PRONTO. GRACIAS, {state.name.toUpperCase()}.<span className="caret">_</span></div>
            <div style={{ marginTop: 18 }}>
              <button className="btn ghost" type="button" onClick={onReset}>ENVIAR OTRO MENSAJE</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form className={"contact-form" + shakeCls} action={formAction} onSubmit={onSubmit} noValidate>
      {state.status === "error" && (
        <div className="terminal-success is-error" role="alert" style={{ marginBottom: 16 }}>
          <div className="term-bar">
            <span className="dot r"></span><span className="dot y"></span><span className="dot g"></span>
            <span className="term-title">VAULT-OS // TERMINAL</span>
          </div>
          <div className="term-body">
            <div className="error">[ERROR] {state.message}</div>
          </div>
        </div>
      )}
      <div className="field">
        <label htmlFor="c-name">NOMBRE</label>
        <input id="c-name" name="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="px_kai" />
      </div>
      <div className="field">
        <label htmlFor="c-email">CORREO ELECTRÓNICO</label>
        <input id="c-email" name="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="jugador@vault.gg" />
      </div>
      <div className="field">
        <label htmlFor="c-msg">MENSAJE</label>
        <textarea id="c-msg" name="msg" rows={5} value={form.msg} onChange={(e) => setForm({ ...form, msg: e.target.value })} placeholder="Cuéntanos qué tienes en mente…"></textarea>
      </div>
      <button className="btn xl press" type="submit" disabled={pending} style={{ width: "100%" }}>
        {pending ? "ENVIANDO…" : "▶  ENVIAR MENSAJE"}
      </button>
    </form>
  );
}
