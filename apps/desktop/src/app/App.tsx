import { useEffect } from 'react'
import { RouterProvider } from 'react-router-dom'
import { router } from './router'
import { seedTestCharacter, seedBuiltinRegex, seedLunaWorldbook, seedWritingPreset } from './seed'
import { ToastContainer, useToast } from '@neo-tavern/ui'
import { useSettingsStore } from '@/features/settings/settings.store'
import { useWorldbookStore } from '@/features/settings/worldbook.store'
import { ThemeProvider } from './theme'

function AppContent() {
  const { toasts, addToast, removeToast } = useToast()
  ;(window as any).__toast = addToast

  useEffect(() => {
    seedTestCharacter()
    seedBuiltinRegex()
    seedLunaWorldbook()
    seedWritingPreset()
    useSettingsStore.getState().loadAllConfigs()
    useSettingsStore.getState().loadContextTokens()
    useSettingsStore.getState().loadRegexRules()
    useSettingsStore.getState().loadPersona()
    useWorldbookStore.getState().loadWorldbooks()
  }, [])

  return (
    <>
      <RouterProvider router={router} />
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </>
  )
}

export function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  )
}
