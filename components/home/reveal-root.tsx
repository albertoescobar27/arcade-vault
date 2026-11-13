"use client";

import type { ReactNode } from "react";
import { useReveal } from "@/lib/use-reveal";

export function RevealRoot({ children }: { children: ReactNode }) {
  useReveal();
  return <div className="home fade-in">{children}</div>;
}
