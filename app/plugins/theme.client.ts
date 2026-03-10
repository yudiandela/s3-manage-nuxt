export default defineNuxtPlugin(() => {
  const key = 'theme'
  const saved = localStorage.getItem(key)
  const next = (saved === 'dark' || saved === 'light')
    ? saved
    : (window.matchMedia?.('(prefers-color-scheme: light)')?.matches ? 'light' : 'dark')
  document.documentElement.dataset.theme = next
})
