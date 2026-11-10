import { useCallback, useEffect, useState } from 'react'
import { DEFAULT_SETTINGS, sanitizeSettings, type Settings } from '../lib/theory'

const STORAGE_KEY = 'guitar:settings'

function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return sanitizeSettings(JSON.parse(raw) as Partial<Settings>)
  } catch {
    // ignore malformed storage
  }
  return DEFAULT_SETTINGS
}

export interface SettingsStore {
  settings: Settings
  updateSettings: (patch: Partial<Settings>) => void
  resetSettings: () => void
}

// Settings state, clamped on every change and persisted to localStorage.
export function useSettings(): SettingsStore {
  const [settings, setSettings] = useState<Settings>(loadSettings)

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setSettings((prev) => sanitizeSettings({ ...prev, ...patch }))
  }, [])

  const resetSettings = useCallback(() => setSettings(DEFAULT_SETTINGS), [])

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
    } catch {
      // storage may be unavailable (private mode) — non-fatal
    }
  }, [settings])

  return { settings, updateSettings, resetSettings }
}
