// composables/useToast.ts

export type ToastType = 'success' | 'error' | 'info' | 'warn'

export interface Toast {
  id: string
  type: ToastType
  message: string
}

const toasts = ref<Toast[]>([])

export function useToast() {
  function show(type: ToastType, message: string, duration = 3000) {
    const id = Math.random().toString(36).slice(2, 8)
    toasts.value.push({ id, type, message })
    setTimeout(() => {
      toasts.value = toasts.value.filter((t) => t.id !== id)
    }, duration)
  }

  const success = (msg: string) => show('success', msg)
  const error   = (msg: string) => show('error',   msg, 4000)
  const info    = (msg: string) => show('info',    msg)
  const warn    = (msg: string) => show('warn',    msg)

  return { toasts: readonly(toasts), show, success, error, info, warn }
}
