import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Trash2, ArrowLeft, BookOpen, CheckCircle2 } from 'lucide-react'
import { Button, Input, Textarea, ScrollArea, Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@neo-tavern/ui'
import { useWorldbookStore } from '@/features/settings/worldbook.store'
import type { WorldbookEntry } from '@neo-tavern/shared'

function toast(type: 'success' | 'error' | 'info', message: string) {
  const fn = (window as any).__toast
  if (fn) fn(type, message)
}

export function WorldbookPage() {
  const navigate = useNavigate()
  const {
    worldbooks, activeWorldbookId, loading,
    loadWorldbooks, createWorldbook, updateWorldbook, deleteWorldbook,
    setActiveWorldbook, addEntry, updateEntry,
    deleteEntry, toggleEntry,
  } = useWorldbookStore()

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [wbName, setWbName] = useState('')
  const [wbDesc, setWbDesc] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<typeof worldbooks[0] | null>(null)

  const [entryTitle, setEntryTitle] = useState('')
  const [entryKeys, setEntryKeys] = useState('')
  const [entryContent, setEntryContent] = useState('')
  const [entryPriority, setEntryPriority] = useState('100')
  const [entryType, setEntryType] = useState<'always' | 'trigger'>('trigger')
  const [entryTriggerMode, setEntryTriggerMode] = useState<'and' | 'or'>('or')
  const [entryEnabled, setEntryEnabled] = useState(true)
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null)

  useEffect(() => { loadWorldbooks() }, [loadWorldbooks])

  const selected = worldbooks.find((w) => w.id === selectedId) ?? null
  const entries = selected ? [...selected.entries].sort((a, b) => b.priority - a.priority) : []

  const handleSelect = (id: string) => {
    setSelectedId(id)
    const wb = worldbooks.find((w) => w.id === id)
    if (wb) { setWbName(wb.name); setWbDesc(wb.description) }
    resetEntryForm()
  }

  const handleCreate = async () => {
    try {
      const wb = await createWorldbook({ name: 'New World Book', description: '' })
      setSelectedId(wb.id)
      setWbName(wb.name)
      setWbDesc('')
    } catch { toast('error', 'Failed') }
  }

  const handleSaveMeta = async () => {
    if (!selectedId) return
    try { await updateWorldbook(selectedId, { name: wbName, description: wbDesc }); toast('success', 'Saved') }
    catch { toast('error', 'Failed') }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteWorldbook(deleteTarget.id)
      if (selectedId === deleteTarget.id) { setSelectedId(null); setWbName(''); setWbDesc('') }
      setDeleteTarget(null)
      toast('info', `"${deleteTarget.name}" deleted`)
    } catch { toast('error', 'Failed') }
  }

  const handleActivate = async () => {
    if (!selectedId) return
    const newId = activeWorldbookId === selectedId ? null : selectedId
    await setActiveWorldbook(newId)
    toast('info', newId ? `Activated "${selected?.name}"` : 'Deactivated')
  }

  const resetEntryForm = () => {
    setEditingEntryId(null); setEntryTitle(''); setEntryKeys(''); setEntryContent('')
    setEntryPriority('100'); setEntryType('trigger'); setEntryTriggerMode('or'); setEntryEnabled(true)
  }

  const startEditEntry = (e: WorldbookEntry) => {
    setEditingEntryId(e.id); setEntryTitle(e.title); setEntryKeys(e.keys)
    setEntryContent(e.content); setEntryPriority(String(e.priority))
    setEntryType(e.type); setEntryTriggerMode(e.triggerMode); setEntryEnabled(e.enabled)
  }

  const handleSaveEntry = async () => {
    if (!selectedId || !entryTitle.trim()) { toast('error', 'Title required'); return }
    try {
      const data = { title: entryTitle.trim(), keys: entryKeys, content: entryContent, priority: parseInt(entryPriority) || 100, type: entryType, triggerMode: entryTriggerMode, enabled: entryEnabled }
      if (editingEntryId) { await updateEntry(selectedId, editingEntryId, data); toast('success', `"${entryTitle}" updated`) }
      else { await addEntry(selectedId, data); toast('success', `"${entryTitle}" added`) }
      resetEntryForm()
    } catch { toast('error', 'Failed') }
  }

  const handleDeleteEntry = (entryId: string) => {
    if (!selectedId) return
    const entry = entries.find((e) => e.id === entryId)
    deleteEntry(selectedId, entryId)
    if (editingEntryId === entryId) resetEntryForm()
    toast('info', `"${entry?.title || 'Entry'}" deleted`)
  }

  const handleToggleEntry = (entryId: string) => {
    if (!selectedId) return
    toggleEntry(selectedId, entryId)
  }

  return (
    <div className="flex h-full">
      <div className="w-56 border-r p-4 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <button onClick={() => navigate('/')} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />Back
          </button>
          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={handleCreate}><Plus className="h-3.5 w-3.5" /></Button>
        </div>
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-2">Books</h2>
        <ScrollArea className="flex-1 -mx-2 px-2">
          <div className="flex flex-col gap-0.5">
            {loading && <p className="text-xs text-muted-foreground p-2">Loading...</p>}
            {!loading && worldbooks.length === 0 && <p className="text-xs text-muted-foreground p-2">No world books</p>}
            {worldbooks.map((wb) => (
              <button key={wb.id} onClick={() => handleSelect(wb.id)}
                className={`text-left px-2 py-1.5 rounded text-sm transition-colors flex items-center justify-between gap-1
                  ${selectedId === wb.id ? 'bg-accent text-foreground font-medium' : 'hover:bg-accent/50 text-muted-foreground hover:text-foreground'}`}>
                <span className="truncate text-xs">{wb.name}</span>
                <div className="flex items-center gap-0.5 shrink-0">
                  <span className="text-[10px] text-muted-foreground">{wb.entries.length}</span>
                  {activeWorldbookId === wb.id && <CheckCircle2 className="h-3 w-3 text-green-500" />}
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        {!selected ? (
          <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
            <div className="text-center space-y-2">
              <BookOpen className="h-8 w-8 mx-auto opacity-30" />
              <p>Select a world book or create one</p>
              <Button variant="outline" size="sm" onClick={handleCreate}><Plus className="h-3.5 w-3.5 mr-1" />New Book</Button>
            </div>
          </div>
        ) : (
          <>
            <div className="p-4 pb-2 shrink-0 border-b">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-1 space-y-1.5">
                  <Input value={wbName} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setWbName(e.target.value)} className="border-0 border-b rounded-none px-0 h-auto text-lg font-bold focus-visible:ring-0" placeholder="Book name" />
                  <Input value={wbDesc} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setWbDesc(e.target.value)} className="border-0 border-b rounded-none px-0 h-auto text-xs text-muted-foreground focus-visible:ring-0" placeholder="Description" />
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button size="sm" variant="outline" onClick={handleSaveMeta}>Save</Button>
                  <Button size="sm" variant={activeWorldbookId === selectedId ? 'default' : 'outline'} onClick={handleActivate}>
                    {activeWorldbookId === selectedId ? 'Active' : 'Activate'}
                  </Button>
                  <Button size="sm" variant="ghost" className="text-destructive" onClick={() => setDeleteTarget(selected)}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
            </div>

            <div className="p-4 shrink-0 border-b">
              <h3 className="text-sm font-semibold mb-3">{editingEntryId ? 'Edit Entry' : 'Add Entry'}</h3>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <Input value={entryTitle} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEntryTitle(e.target.value)} placeholder="Entry title" className="text-xs" />
                <div className="flex items-center gap-2">
                  <select value={entryType} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setEntryType(e.target.value as 'always' | 'trigger')}
                    className="h-7 rounded border border-input bg-transparent px-2 text-xs">
                    <option value="always">Always</option>
                    <option value="trigger">Trigger</option>
                  </select>
                  {entryType === 'trigger' && (
                    <select value={entryTriggerMode} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setEntryTriggerMode(e.target.value as 'and' | 'or')}
                      className="h-7 rounded border border-input bg-transparent px-2 text-xs">
                      <option value="and">🔵 蓝灯 AND</option>
                      <option value="or">🟢 绿灯 OR</option>
                    </select>
                  )}
                  <label className="flex items-center gap-1.5 cursor-pointer shrink-0">
                    <button type="button" role="switch" aria-checked={entryEnabled} onClick={() => setEntryEnabled(!entryEnabled)}
                      className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors ${entryEnabled ? 'bg-primary' : 'bg-muted-foreground/30'}`}>
                      <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${entryEnabled ? 'translate-x-[14px]' : 'translate-x-[2px]'}`} />
                    </button>
                    <span className="text-[10px]">On</span>
                  </label>
                </div>
              </div>
              <div className="mb-3">
                <Input value={entryKeys} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEntryKeys(e.target.value)} placeholder="Keywords (comma-separated)" className="text-xs" />
              </div>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <Textarea value={entryContent} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEntryContent(e.target.value)} placeholder="Entry content..." rows={3} className="text-xs" />
                <div>
                  <Input value={entryPriority} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEntryPriority(e.target.value)} placeholder="Priority" type="number" className="text-xs w-20 mb-2" />
                  <p className="text-[10px] text-muted-foreground">Higher = closer to top</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSaveEntry}>{editingEntryId ? 'Update' : 'Add'} Entry</Button>
                {editingEntryId && <Button size="sm" variant="outline" onClick={resetEntryForm}>Cancel</Button>}
              </div>
            </div>

            <ScrollArea className="flex-1 p-4">
              <div className="space-y-1.5">
                {entries.length === 0 && <p className="text-xs text-muted-foreground p-2">No entries yet</p>}
                {entries.map((e) => (
                  <div key={e.id} className={`flex items-start gap-2 p-2 rounded-lg ${!e.enabled ? 'opacity-40' : 'hover:bg-accent/50'}`}>
                    <button type="button" role="switch" aria-checked={e.enabled} onClick={() => handleToggleEntry(e.id)}
                      className={`mt-0.5 shrink-0 relative inline-flex h-4 w-7 items-center rounded-full transition-colors ${e.enabled ? 'bg-primary' : 'bg-muted-foreground/30'}`}>
                      <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${e.enabled ? 'translate-x-[14px]' : 'translate-x-[2px]'}`} />
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-medium truncate">{e.title}</span>
                        {e.type === 'always'
                          ? <span className="text-[8px] bg-blue-500/10 text-blue-600 px-1 py-0.5 rounded shrink-0">常驻</span>
                          : <span className={`text-[8px] px-1 py-0.5 rounded shrink-0 ${e.triggerMode === 'and' ? 'bg-blue-500/10 text-blue-600' : 'bg-emerald-500/10 text-emerald-600'}`}>
                            {e.triggerMode === 'and' ? '🔵 蓝灯' : '🟢 绿灯'}</span>
                        }
                        <span className="text-[8px] text-muted-foreground">P{e.priority}</span>
                      </div>
                      {e.keys && <p className="text-[10px] text-muted-foreground truncate mt-0.5">{e.keys}</p>}
                      <p className="text-[10px] text-muted-foreground line-clamp-2 mt-0.5">{e.content.slice(0, 120)}</p>
                    </div>
                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => startEditEntry(e)}><span className="text-[10px]">✎</span></Button>
                    <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={() => handleDeleteEntry(e.id)}><Trash2 className="h-3 w-3" /></Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </>
        )}
      </div>

      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete World Book</DialogTitle>
            <DialogDescription>Delete "{deleteTarget?.name}" and all entries? This cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
