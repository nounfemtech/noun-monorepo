'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { createSupabaseBrowser } from '@/lib/supabase'

export function AvatarUpload({ userId, userName, initialUrl }: {
  userId: string
  userName: string
  initialUrl: string | null
}) {
  const router = useRouter()
  const [avatarUrl, setAvatarUrl] = React.useState<string | null>(initialUrl)
  const [uploading, setUploading] = React.useState(false)
  const [removing, setRemoving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)

  const initials = userName
    .split(/\s+/)
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || '?'

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      setError('Arquivo muito grande. Maximo 2MB.')
      return
    }
    setError(null)
    setUploading(true)
    try {
      const sb = createSupabaseBrowser()
      const ext = file.name.split('.').pop() ?? 'jpg'
      const path = `${userId}/avatar.${ext}`
      const { error: upErr } = await sb.storage
        .from('avatares')
        .upload(path, file, { upsert: true })
      if (upErr) throw upErr
      const { data: { publicUrl } } = sb.storage.from('avatares').getPublicUrl(path)
      await sb.from('profiles').update({ avatar_url: publicUrl }).eq('id', userId)
      setAvatarUrl(`${publicUrl}?t=${Date.now()}`)
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar imagem.')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  async function handleRemove() {
    setError(null)
    setRemoving(true)
    try {
      const sb = createSupabaseBrowser()
      const path = avatarUrl?.match(/\/avatares\/(.+?)(\?|$)/)?.[1]
      if (path) {
        await sb.storage.from('avatares').remove([path])
      }
      await sb.from('profiles').update({ avatar_url: null }).eq('id', userId)
      setAvatarUrl(null)
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao remover imagem.')
    } finally {
      setRemoving(false)
    }
  }

  const busy = uploading || removing

  return (
    <div className="flex items-center gap-4">
      <Avatar className="h-16 w-16 rounded-xl shrink-0">
        <AvatarImage src={avatarUrl ?? undefined} className="object-cover" />
        <AvatarFallback className="rounded-xl text-base bg-muted">{initials}</AvatarFallback>
      </Avatar>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/gif,image/webp"
        className="hidden"
        onChange={handleFile}
      />
      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
          >
            {uploading ? 'Enviando...' : 'Alterar foto'}
          </Button>
          {avatarUrl && (
            <Button
              type="button"
              variant="ghost"
              disabled={busy}
              onClick={handleRemove}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              {removing ? 'Removendo...' : 'Remover'}
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">JPG, PNG, GIF ou WebP. Maximo 2MB.</p>
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    </div>
  )
}
