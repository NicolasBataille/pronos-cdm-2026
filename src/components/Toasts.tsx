"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";

interface Toast {
  id: number;
  emoji: string;
  message: string;
}

const ToastCtx = createContext<(emoji: string, message: string) => void>(() => {});

export function useToast() {
  return useContext(ToastCtx);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useRef(0);

  const push = useCallback((emoji: string, message: string) => {
    const id = ++idRef.current;
    setToasts((t) => [...t, { id, emoji, message }]);
    setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id));
    }, 5000);
  }, []);

  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="fixed top-3 inset-x-0 z-50 flex flex-col items-center gap-2 px-4 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="glass-strong rounded-2xl px-4 py-3 shadow-2xl max-w-sm w-full flex items-center gap-3 animate-[slide-up_0.3s_ease-out] pointer-events-auto"
          >
            <span className="text-2xl shrink-0">{t.emoji}</span>
            <span className="text-sm font-medium text-white/90 leading-snug">{t.message}</span>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
