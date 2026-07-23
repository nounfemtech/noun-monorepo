'use client'

import * as React from 'react'
import { IconFileText, IconDownload, IconTrash, IconUpload } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createSupabaseBrowser } from '@/lib/supabase'

// Bucket privado `documentos`, path por dono: <user_id>/<tipo>-<timestamp>-<nome>.
// RLS: dono le/escreve/remove os proprios arquivos; admin Noun le tudo
// (migration storage_documentos_rls_policies).

const DOC_TYPES = [
  { value: 'diploma', label: 'Diploma' },
  { value: 'registro', label: 'Registro profissional' },
  { value: 'certificacao', label: 'Certificacao' },
] as const

const MAX_SIZE = 10 * 1024 * 1024

interface StoredDoc {
  name: string
  createdAt: string | null
}

function docTypeLabel(fileName: string): string {
  const prefix = fileName.split('-')[0]
  return DOC_TYPES.find((t) => t.value === prefix)?.label ?? 'Documento'
}

function docDisplayName(fileName: string): string {
  const parts = fileName.split('-')
  return parts.length > 2 ? parts.slice(2).join('-') : fileName
}

export function DocumentosCard({ userId }: { userId: string }) {
  const [docs, setDocs] = React.useState<StoredDoc[]>([])
  const [docType, setDocType] = React.useState<string>('diploma')
  const [uploading, setUploading] = React.useState(false)
  const [busyDoc, setBusyDoc] = React.useState<string | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)

  const loadDocs = React.useCallback(async () => {
    const sb = createSupabaseBrowser()
    const { data, error: listErr } = await sb.storage
      .from('documentos')
      .list(userId, { sortBy: { column: 'created_at', order: 'desc' } })
    if (listErr) {
      setError(listErr.message)
      return
    }
    setDocs((data ?? []).map((f) => ({ name: f.name, createdAt: f.created_at ?? null })))
  }, [userId])

  React.useEffect(() => {
    loadDocs()
  }, [loadDocs])

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > MAX_SIZE) {
      setError('Arquivo muito grande. Maximo 10MB.')
      return
    }
    setError(null)
    setUploading(true)
    try {
      const sb = createSupabaseBrowser()
      const safeName = file.name.replace(/[^\w.\-]+/g, '_')
      const path = `${userId}/${docType}-${Date.now()}-${safeName}`
      const { error: upErr } = await sb.storage.from('documentos').upload(path, file)
      if (upErr) throw upErr
      await loadDocs()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar documento.')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  async function handleDownload(name: string) {
    setBusyDoc(name)
    setError(null)
    try {
      const sb = createSupabaseBrowser()
      const { data, error: urlErr } = await sb.storage
        .from('documentos')
        .createSignedUrl(`${userId}/${name}`, 60)
      if (urlErr || !data) throw urlErr ?? new Error('Falha ao gerar link')
      window.open(data.signedUrl, '_blank', 'noopener')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao baixar documento.')
    } finally {
      setBusyDoc(null)
    }
  }

  async function handleRemove(name: string) {
    setBusyDoc(name)
    setError(null)
    try {
      const sb = createSupabaseBrowser()
      const { error: rmErr } = await sb.storage.from('documentos').remove([`${userId}/${name}`])
      if (rmErr) throw rmErr
      await loadDocs()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao remover documento.')
    } finally {
      setBusyDoc(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Select value={docType} onValueChange={setDocType}>
          <SelectTrigger className="w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DOC_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,image/png,image/jpeg"
          className="hidden"
          onChange={handleFile}
        />
        <Button
          type="button"
          variant="outline"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          <IconUpload size={16} />
          {uploading ? 'Enviando...' : 'Enviar documento'}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">PDF, PNG ou JPG. Maximo 10MB. Visivel apenas para voce e o time Noun.</p>
      {error && <p className="text-xs text-destructive">{error}</p>}

      {docs.length === 0 ? (
        <p className="text-sm text-muted-foreground py-2">Nenhum documento enviado ainda.</p>
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border">
          {docs.map((doc) => (
            <li key={doc.name} className="flex items-center gap-3 px-4 py-3">
              <IconFileText size={18} className="text-muted-foreground shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm truncate">{docDisplayName(doc.name)}</p>
              </div>
              <Badge variant="outline">{docTypeLabel(doc.name)}</Badge>
              <div className="flex gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  disabled={busyDoc === doc.name}
                  onClick={() => handleDownload(doc.name)}
                  aria-label="Baixar documento"
                >
                  <IconDownload size={16} />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  disabled={busyDoc === doc.name}
                  onClick={() => handleRemove(doc.name)}
                  aria-label="Remover documento"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <IconTrash size={16} />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
