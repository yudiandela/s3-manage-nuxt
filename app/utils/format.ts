// utils/format.ts — File formatting helpers

export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '—'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let i = 0
  let val = bytes
  while (val >= 1024 && i < units.length - 1) {
    val /= 1024
    i++
  }
  return `${val.toFixed(decimals)} ${units[i]}`
}

export function formatDate(date: Date | string | undefined): string {
  if (!date) return '—'
  const d = new Date(date)
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function formatDateRelative(date: Date | string | undefined): string {
  if (!date) return '—'
  const d = new Date(date)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffSeconds = Math.floor(diffMs / 1000)
  if (diffSeconds < 60) return 'just now'
  const diffMinutes = Math.floor(diffSeconds / 60)
  if (diffMinutes < 60) return `${diffMinutes}m ago`
  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 30) return `${diffDays}d ago`
  return formatDate(d)
}

export function getFileExtension(name: string): string {
  const parts = name.split('.')
  return parts.length > 1 ? parts.pop()!.toLowerCase() : ''
}

export function getFileEmoji(name: string, isFolder: boolean): string {
  if (isFolder) return '📁'
  const ext = getFileExtension(name)
  const map: Record<string, string> = {
    html: '🌐', htm: '🌐',
    js: '⚡', ts: '⚡', jsx: '⚡', tsx: '⚡',
    css: '🎨', scss: '🎨', sass: '🎨',
    json: '📋', yaml: '📋', yml: '📋', toml: '📋',
    png: '🖼️', jpg: '🖼️', jpeg: '🖼️', gif: '🎞️',
    svg: '✏️', webp: '🖼️', ico: '🔷',
    zip: '📦', gz: '📦', tar: '📦', rar: '📦', '7z': '📦',
    txt: '📝', md: '📝', rst: '📝',
    xml: '📄', csv: '📊',
    sql: '🗄️', db: '🗄️',
    pdf: '📕',
    mp4: '🎬', mov: '🎬', avi: '🎬', webm: '🎬',
    mp3: '🎵', wav: '🎵', flac: '🎵', ogg: '🎵',
    py: '🐍', rb: '💎', php: '🐘', go: '🐹', rs: '🦀', java: '☕',
    sh: '💻', bash: '💻', ps1: '💻',
    env: '🔑', pem: '🔑', key: '🔑', cert: '🔑',
    wasm: '⚙️', exe: '⚙️', dll: '⚙️', bin: '⚙️',
    ttf: '🔤', woff: '🔤', woff2: '🔤', otf: '🔤',
    doc: '📘', docx: '📘', xls: '📗', xlsx: '📗', ppt: '📙', pptx: '📙',
  }
  return map[ext] || '📄'
}

export interface TypeStyle {
  bg: string
  color: string
  label: string
}

export function getTypeStyle(ext: string, isFolder: boolean): TypeStyle {
  if (isFolder) return { bg: 'rgba(0,212,255,0.1)', color: '#00d4ff', label: 'DIR' }
  const map: Record<string, TypeStyle> = {
    html: { bg: 'rgba(255,107,53,0.15)', color: '#ff6b35', label: 'HTML' },
    js:   { bg: 'rgba(241,196,15,0.15)', color: '#f1c40f', label: 'JS' },
    ts:   { bg: 'rgba(49,120,198,0.15)', color: '#3178c6', label: 'TS' },
    jsx:  { bg: 'rgba(97,218,251,0.15)', color: '#61dafb', label: 'JSX' },
    tsx:  { bg: 'rgba(97,218,251,0.15)', color: '#61dafb', label: 'TSX' },
    css:  { bg: 'rgba(52,152,219,0.15)', color: '#3498db', label: 'CSS' },
    json: { bg: 'rgba(155,89,182,0.15)', color: '#9b59b6', label: 'JSON' },
    png:  { bg: 'rgba(0,255,157,0.15)', color: '#00ff9d', label: 'PNG' },
    jpg:  { bg: 'rgba(0,255,157,0.15)', color: '#00ff9d', label: 'JPG' },
    jpeg: { bg: 'rgba(0,255,157,0.15)', color: '#00ff9d', label: 'JPEG' },
    gif:  { bg: 'rgba(0,255,157,0.15)', color: '#00ff9d', label: 'GIF' },
    svg:  { bg: 'rgba(0,255,157,0.15)', color: '#00ff9d', label: 'SVG' },
    webp: { bg: 'rgba(0,255,157,0.15)', color: '#00ff9d', label: 'WEBP' },
    zip:  { bg: 'rgba(255,165,2,0.15)', color: '#ffa502', label: 'ZIP' },
    gz:   { bg: 'rgba(255,165,2,0.15)', color: '#ffa502', label: 'GZ' },
    tar:  { bg: 'rgba(255,165,2,0.15)', color: '#ffa502', label: 'TAR' },
    txt:  { bg: 'rgba(100,100,120,0.15)', color: '#8a95a3', label: 'TXT' },
    md:   { bg: 'rgba(100,100,120,0.15)', color: '#8a95a3', label: 'MD' },
    xml:  { bg: 'rgba(255,107,53,0.15)', color: '#ff6b35', label: 'XML' },
    pdf:  { bg: 'rgba(255,71,87,0.15)', color: '#ff4757', label: 'PDF' },
    sql:  { bg: 'rgba(155,89,182,0.15)', color: '#9b59b6', label: 'SQL' },
    mp4:  { bg: 'rgba(255,71,87,0.12)', color: '#ff6b81', label: 'MP4' },
    mp3:  { bg: 'rgba(255,71,87,0.12)', color: '#ff6b81', label: 'MP3' },
    py:   { bg: 'rgba(55,118,171,0.15)', color: '#3776ab', label: 'PY' },
    go:   { bg: 'rgba(0,173,216,0.15)', color: '#00add8', label: 'GO' },
  }
  return map[ext] || { bg: 'rgba(100,100,120,0.12)', color: '#8a95a3', label: ext.toUpperCase() || 'FILE' }
}

export function generateId(): string {
  return Math.random().toString(36).slice(2, 10)
}

export function buildS3Key(prefix: string, filename: string): string {
  const clean = prefix.replace(/^\/+|\/+$/g, '')
  return clean ? `${clean}/${filename}` : filename
}

export function parsePrefixToBreadcrumbs(prefix: string) {
  if (!prefix) return []
  const parts = prefix.replace(/\/$/, '').split('/')
  return parts.map((label, i) => ({
    label,
    prefix: parts.slice(0, i + 1).join('/') + '/',
  }))
}
