import { useEffect, useRef, useState } from "react";

export type ToastItem = {
  id: number;
  message: string;
};

export type Toast = {
  toasts: ToastItem[];
  show: (message: string, durationMs?: number) => void;
};

const DEFAULT_DURATION_MS = 2000;
const MAX_TOASTS = 3;

export function useToast(durationMs: number = DEFAULT_DURATION_MS): Toast {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(0);
  const timeoutsRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  function clearTimeoutFor(id: number) {
    const timeout = timeoutsRef.current.get(id);
    if (timeout) {
      clearTimeout(timeout);
      timeoutsRef.current.delete(id);
    }
  }

  function dismiss(id: number) {
    clearTimeoutFor(id);
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }

  function show(message: string, toastDurationMs: number = durationMs) {
    const id = nextId.current++;
    setToasts((prev) => {
      const next = [...prev, { id, message }];
      if (next.length <= MAX_TOASTS) {
        return next;
      }
      const [oldest, ...rest] = next;
      clearTimeoutFor(oldest.id);
      return rest;
    });
    timeoutsRef.current.set(
      id,
      setTimeout(() => dismiss(id), toastDurationMs)
    );
  }

  useEffect(() => {
    const timeouts = timeoutsRef.current;
    return () => {
      timeouts.forEach(clearTimeout);
    };
  }, []);

  return { toasts, show };
}
