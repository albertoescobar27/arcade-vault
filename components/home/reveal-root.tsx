"use client";

import type { ReactNode } from "react";
import { useReveal } from "@/lib/use-reveal";

export function RevealRoot({ children, className = "home" }: { children: ReactNode; className?: string }) {
  useReveal();
  return <div className={`${className} fade-in`}>{children}</div>;
}
