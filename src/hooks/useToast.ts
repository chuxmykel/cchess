import { useCallback, useEffect, useRef, useState } from 'react';

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
  const timeoutsRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(
    new Map(),
  );

  // The same function every render, so a memoised list's items can be
  // handed callbacks that show one.
  const show = useCallback(
    (message: string, toastDurationMs: number = durationMs) => {
      const timeouts = timeoutsRef.current;
      function clearTimeoutFor(id: number) {
        const timeout = timeouts.get(id);
        if (timeout) {
          clearTimeout(timeout);
          timeouts.delete(id);
        }
      }
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
      timeouts.set(
        id,
        setTimeout(() => {
          clearTimeoutFor(id);
          setToasts((prev) => prev.filter((toast) => toast.id !== id));
        }, toastDurationMs),
      );
    },
    [durationMs],
  );

  useEffect(() => {
    const timeouts = timeoutsRef.current;
    return () => {
      timeouts.forEach(clearTimeout);
    };
  }, []);

  return { toasts, show };
}
