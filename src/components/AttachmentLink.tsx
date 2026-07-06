import type { CSSProperties } from 'react'
import { fileService } from '../services/fileService'

interface Props {
  fileId?: string | null
  label: string
  fallback?: string
  style?: CSSProperties
}

/** Renderiza um anexo. Se houver fileId, vira um link que abre o arquivo
 *  (do cache local ou baixando do backend). Sem fileId, mostra texto simples. */
export function AttachmentLink({ fileId, label, fallback, style }: Props) {
  const abrir = async () => {
    if (!fileId) return
    const url = await fileService.toObjectURL(fileId)
    if (url) window.open(url, '_blank', 'noopener')
  }

  if (!fileId) {
    return <span style={style}>{fallback ?? label}</span>
  }
  return (
    <a
      onClick={abrir}
      style={{ cursor: 'pointer', color: 'var(--color-primary)', textDecoration: 'underline', ...style }}
    >
      {label}
    </a>
  )
}
