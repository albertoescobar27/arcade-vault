import Link from "next/link";

export default function NotFound() {
  return (
    <div className="fade-in" style={{ textAlign: "center", padding: "120px 24px" }}>
      <h1 className="pixel neon-magenta flicker" style={{ fontSize: 40, marginBottom: 20 }}>404</h1>
      <div className="pixel neon-cyan" style={{ fontSize: 14, marginBottom: 12 }}>PÁGINA NO ENCONTRADA</div>
      <p style={{ color: "var(--ink-faint)", marginBottom: 32 }}>Esta pantalla no existe en el vault.</p>
      <Link href="/" className="btn lg">VOLVER AL VAULT</Link>
    </div>
  );
}
