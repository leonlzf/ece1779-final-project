import React, { createContext, useContext, useEffect, useMemo } from "react";
import { useLocalStorage } from "../hooks/useLocalStorage";

export type ThemeMode = "system" | "light" | "dark";

type ThemeCtx = {
  mode: ThemeMode;
  setMode: (m: ThemeMode) => void;
  resolved: "light" | "dark";
};

const Ctx = createContext<ThemeCtx>(null as any);

function resolve(mode: ThemeMode) {
  if (mode === "light" || mode === "dark") return mode;
  const mq = window.matchMedia?.("(prefers-color-scheme: dark)");
  return mq?.matches ? "dark" : "light";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useLocalStorage<ThemeMode>("ui:theme", "system");
  const resolved = resolve(mode);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-theme", resolved);

    if (mode !== "system") return;

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      root.setAttribute("data-theme", mq.matches ? "dark" : "light");
    };

    mq.addEventListener?.("change", handler);

    return () => {
      mq.removeEventListener?.("change", handler);
    };
  }, [mode, resolved]);

  const value = useMemo(
    () => ({ mode, setMode, resolved }),
    [mode, setMode, resolved]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTheme() {
  return useContext(Ctx);
}
