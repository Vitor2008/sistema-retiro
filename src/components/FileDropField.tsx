import { fileService } from '../services/fileService'
import type { Attachment } from '../types'

interface Props {
  label: string
  onFile: (a: Attachment | null) => void
}

/** Campo de anexo estilo "dashed drop". Salva o arquivo no fileService
 *  (IndexedDB) e devolve a referência serializável via `onFile`. */
export function FileDropField({ label, onFile }: Props) {
  const handle = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) {
      onFile(null)
      return
    }
    const att = await fileService.save(file)
    onFile(att)
  }

  return (
    <label
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        border: '1px dashed var(--border-strong)',
        borderRadius: 8,
        padding: '10px 12px',
        cursor: 'pointer',
        background: 'var(--bg-app)',
      }}
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--color-sage)" strokeWidth="2" strokeLinecap="round">
        <path d="M15 7l-6.5 6.5a2.1 2.1 0 0 0 3 3L18 10a4.2 4.2 0 0 0-6-6L5.5 10.5"></path>
      </svg>
      <span style={{ fontSize: 12, color: 'var(--fg-default)' }}>{label}</span>
      <input
        type="file"
        accept="image/*,.pdf"
        style={{ display: 'none' }}
        onChange={handle}
      />
    </label>
  )
}
