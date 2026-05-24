import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Save, Sparkles } from 'lucide-react'
import { Button, Input, Textarea, Label, Card, CardContent, CardHeader, CardTitle, CardDescription } from '@neo-tavern/ui'
import { useSettingsStore } from '@/features/settings/settings.store'

function toast(type: 'success' | 'error' | 'info', message: string) {
  const fn = (window as any).__toast
  if (fn) fn(type, message)
}

export function PersonaPage() {
  const navigate = useNavigate()
  const personaName = useSettingsStore((s) => s.personaName)
  const personaDesc = useSettingsStore((s) => s.personaDesc)
  const loadPersona = useSettingsStore((s) => s.loadPersona)
  const savePersona = useSettingsStore((s) => s.savePersona)

  const [name, setName] = useState(personaName)
  const [desc, setDesc] = useState(personaDesc)

  useEffect(() => { loadPersona() }, [loadPersona])
  useEffect(() => { setName(personaName); setDesc(personaDesc) }, [personaName, personaDesc])

  const handleSave = () => {
    if (!name.trim()) { toast('error', 'Name is required'); return }
    savePersona(name.trim(), desc)
    toast('success', 'Persona saved')
  }

  return (
    <div className="flex h-full">
      <div className="w-56 border-r p-4 flex flex-col">
        <button onClick={() => navigate('/')} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
          <ArrowLeft className="h-4 w-4" />Back
        </button>
        <h2 className="text-lg font-semibold mb-1">Persona</h2>
        <p className="text-xs text-muted-foreground">Your identity in chats. <code>{'{{user}}'}</code> in character cards will be replaced with your name.</p>
      </div>
      <div className="flex-1 p-6 overflow-auto">
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5" />Your Persona</CardTitle>
            <CardDescription>This name replaces {'{{user}}'} in all character descriptions, scenarios, first messages, and dialogue examples.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Display Name *</Label>
              <Input value={name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)} placeholder="Your name" />
              <p className="text-xs text-muted-foreground mt-1">Default: User</p>
            </div>
            <div>
              <Label>Persona Description (optional)</Label>
              <Textarea value={desc} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDesc(e.target.value)} placeholder="Brief description of your persona... Will be injected into the system prompt." rows={4} />
            </div>
            <Button onClick={handleSave}><Save className="h-4 w-4 mr-2" />Save Persona</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
