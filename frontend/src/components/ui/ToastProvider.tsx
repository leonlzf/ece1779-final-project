import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import { cn } from "../../utils/cn";

type Toast = {
  id: string;
  type?: "success" | "error" | "info";
  title?: string;
  message: string;
  ttl?: number;
};

type ToastCtx = {
  push: (t: Omit<Toast, "id">) => void;
  clear: (id: string) => void;
};

const Ctx = createContext<ToastCtx>(null as any);

const genId = () =>
  Math.random().toString(36).slice(2) + Date.now().toString(36);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);

  const clear = useCallback((id: string) => {
    setItems((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (t: Omit<Toast, "id">) => {
      const id = genId();
      const ttl = t.ttl ?? 2600;

      const toast: Toast = {
        id,
        type: t.type ?? "info",
        title: t.title,
        message: t.message,
        ttl,
      };

      setItems((prev) => [...prev, toast]);
      window.setTimeout(() => clear(id), ttl);
    },
    [clear]
  );

  const value = useMemo(() => ({ push, clear }), [push, clear]);

  return (
    <Ctx.Provider value={value}>
      {children}
      <div className="ui-toasts">
        {items.map((t) => (
          <div key={t.id} className={cn("ui-toast", `ui-toast--${t.type}`)}>
            {t.title && <div className="ui-toast__title">{t.title}</div>}
            <div className="ui-toast__msg">{t.message}</div>
            <button className="ui-toast__close" onClick={() => clear(t.id)}>
              ✕
            </button>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

export function useToast() {
  return useContext(Ctx);
}
