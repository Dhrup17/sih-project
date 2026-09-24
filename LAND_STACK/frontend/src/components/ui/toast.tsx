import * as React from 'react'
import { cn } from '@/lib/utils'

export interface ToastProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'destructive'
}

interface ToastContextType {
  toast: (props: { title?: string; description?: string; variant?: string }) => void
}

const ToastContext = React.createContext<ToastContextType>({
  toast: () => {}
})

export const useToast = () => React.useContext(ToastContext)

const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = React.useState<Array<{ id: string; title?: string; description?: string; variant: string }>>([])

  const addToast = React.useCallback((props: { title?: string; description?: string; variant?: string }) => {
    const id = Math.random().toString(36)
    setToasts((prev) => [...prev, { ...props, id, variant: props.variant || 'default' }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 3000)
  }, [])

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {children}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={cn(
              'rounded-lg border p-4 shadow-xl pointer-events-auto transition-all backdrop-blur-md animate-in slide-in-from-right fade-in-90 min-w-[280px]',
              toast.variant === 'destructive'
                ? 'border-red-500/50 bg-red-950/90 text-red-100'
                : 'border-cyan-500/40 bg-zinc-900/90 text-cyan-100'
            )}
          >
            {toast.title && <p className="font-semibold text-sm">{toast.title}</p>}
            {toast.description && <p className="text-xs text-zinc-300 mt-1">{toast.description}</p>}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export { ToastProvider }
