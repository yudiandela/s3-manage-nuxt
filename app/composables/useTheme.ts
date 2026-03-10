export type ThemeMode = 'dark' | 'light'

const STORAGE_KEY = 'theme'

function normalizeTheme(v: string | null | undefined): ThemeMode | null {
  if (v === 'dark' || v === 'light') return v
  return null
}

export function useTheme() {
  const theme = useState<ThemeMode>('theme', () => 'dark')

  function apply(next: ThemeMode) {
    theme.value = next
    if (import.meta.client) {
      document.documentElement.dataset.theme = next
      localStorage.setItem(STORAGE_KEY, next)
    }
  }

  function toggle() {
    apply(theme.value === 'dark' ? 'light' : 'dark')
  }

  if (import.meta.client) {
    onMounted(() => {
      const saved = normalizeTheme(localStorage.getItem(STORAGE_KEY))
      if (saved) {
        apply(saved)
        return
      }
      const prefersLight = window.matchMedia?.('(prefers-color-scheme: light)')?.matches
      apply(prefersLight ? 'light' : 'dark')
    })
  }

  return { theme, setTheme: apply, toggle }
}
