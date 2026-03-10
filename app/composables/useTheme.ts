export type ThemeMode = 'dark' | 'one-dark' | 'dracula' | 'nord' | 'tokyo-night' | 'light'

const STORAGE_KEY = 'theme'

export const THEME_OPTIONS: Array<{ value: ThemeMode; label: string }> = [
  { value: 'dark', label: 'Dark' },
  { value: 'one-dark', label: 'One Dark' },
  { value: 'dracula', label: 'Dracula' },
  { value: 'nord', label: 'Nord' },
  { value: 'tokyo-night', label: 'Tokyo Night' },
  { value: 'light', label: 'Light' },
]

function normalizeTheme(v: string | null | undefined): ThemeMode | null {
  if (v === 'dark' || v === 'one-dark' || v === 'dracula' || v === 'nord' || v === 'tokyo-night' || v === 'light') return v
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
    const list = THEME_OPTIONS.map(o => o.value)
    const idx = list.indexOf(theme.value)
    apply(list[(idx + 1) % list.length] ?? 'dark')
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
