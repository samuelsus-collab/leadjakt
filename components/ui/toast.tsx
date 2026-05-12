'use client'

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { CheckCircle, AlertCircle, X } from 'lucide-react'

type ToastType = 'success' | 'error' | 'info'

interface Toast {
  id: number
  message: string
  type: ToastType
}

interface ToastCtx {
  toast: (message: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastCtx>({ toast: () => {} })

let counter = 0

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const timers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map())

  const dismiss = useCallback((id: number) => {
    clearTimeout(timers.current.get(id))
    timers.current.delete(id)
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const toast = useCallback((message: string, type: ToastType = 'success') => {
    const id = ++counter
    setToasts(prev => [...prev, { id, message, type }])
    const timer = setTimeout(() => dismiss(id), 3500)
    timers.current.set(id, timer)
  }, [dismiss])

  useEffect(() => () => { timers.current.forEach(clearTimeout) }, [])

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {toasts.length > 0 && (
        <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none">
          {toasts.map(t => (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-center gap-2.5 rounded-xl border px-4 py-2.5 shadow-lg text-sm font-medium animate-in slide-in-from-bottom-4 fade-in duration-200 ${
                t.type === 'success'
                  ? 'border-green-200 bg-green-50 text-green-800'
                  : t.type === 'error'
                  ? 'border-red-200 bg-red-50 text-red-800'
                  : 'border-zinc-200 bg-white text-zinc-800'
              }`}
            >
              {t.type === 'success' && <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />}
              {t.type === 'error' && <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />}
              <span>{t.message}</span>
              <button
                onClick={() => dismiss(t.id)}
                className="ml-1 rounded p-0.5 opacity-60 hover:opacity-100 transition-opacity"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </ToastContext.Provider>
  )
}

export function useToast() {
  return useContext(ToastContext)
}
