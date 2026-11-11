"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type User = { name: string };

type SessionContextValue = {
  user: User | null;
  login: (u: User | null) => void;
  signOut: () => void;
};

const SessionContext = createContext<SessionContextValue>({
  user: null,
  login: () => {},
  signOut: () => {},
});

const KEY = "av_user";

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- leer localStorage solo tras montar (evita mismatch de hidratación)
      if (raw) setUser(JSON.parse(raw) as User);
    } catch {}
  }, []);

  const login = useCallback((u: User | null) => {
    setUser(u);
    try {
      if (u) localStorage.setItem(KEY, JSON.stringify(u));
    } catch {}
  }, []);

  const signOut = useCallback(() => {
    setUser(null);
    try {
      localStorage.removeItem(KEY);
    } catch {}
  }, []);

  const value = useMemo(() => ({ user, login, signOut }), [user, login, signOut]);
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  return useContext(SessionContext);
}
