import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";

type Toast = { id: number; text: string; error?: boolean };
const ToastContext = createContext<(text: string, error?: boolean) => void>(() => {});

/** Avisos pequeños abajo a la derecha ("Guardado", "No se ha podido…"). */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const show = useCallback((text: string, error = false) => {
    const id = Date.now() + Math.random();
    setToasts(list => [...list, { id, text, error }]);
    window.setTimeout(() => setToasts(list => list.filter(t => t.id !== id)), 3200);
  }, []);
  return <ToastContext.Provider value={show}>
    {children}
    <div className="toast-stack" role="status" aria-live="polite">
      <AnimatePresence>{toasts.map(t => <motion.div key={t.id} className={`toast ${t.error ? "error" : ""}`} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 30 }} transition={{ duration: .35, ease: [.22, 1, .36, 1] }}>{t.text}</motion.div>)}</AnimatePresence>
    </div>
  </ToastContext.Provider>;
}

export const useToast = () => useContext(ToastContext);
