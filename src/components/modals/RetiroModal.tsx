import { useEffect, useState } from 'react'
import { FileDropField } from '../FileDropField'
import { fileService } from '../../services/fileService'
import { useRetiro } from '../../store/RetiroContext'
import { useRetiroSelection } from '../../store/RetiroSelection'
import { useActions } from '../../store/useActions'
import type { ModalRetiro } from '../../types'

const label: React.CSSProperties = { fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 5 }

/** Miniatura do banner atual (resolve o blob local/servidor). */
function BannerPreview({ bannerId }: { bannerId: string }) {
  const [url, setUrl] = useState<string | null>(null)
  useEffect(() => {
    let vivo = true
    let objeto: string | null = null
    void fileService.toObjectURL(bannerId).then((u) => {
      if (vivo) {
        objeto = u
        setUrl(u)
      } else if (u) {
        URL.revokeObjectURL(u)
      }
    })
    return () => {
      vivo = false
      if (objeto) URL.revokeObjectURL(objeto)
    }
  }, [bannerId])

  if (!url) return null
  return (
    <img
      src={url}
      alt="Banner do formulário"
      style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--border-default)' }}
    />
  )
}

export function RetiroModal({ modal }: { modal: ModalRetiro }) {
  const { patchModal, closeModal, toast } = useRetiro()
  const { salvarRetiro } = useActions()
  const { criarRetiro } = useRetiroSelection()
  const [salvando, setSalvando] = useState(false)

  const onSalvar = async () => {
    if (!modal.nome.trim()) {
      toast('Informe o nome do evento.')
      return
    }
    if (!modal.novo) {
      salvarRetiro()
      return
    }
    // Novo retiro: cria via API (isso troca o retiro selecionado e remonta o app).
    setSalvando(true)
    try {
      await criarRetiro({
        nome: modal.nome.trim(),
        inicio: modal.inicio,
        fim: modal.fim,
        valor: Number(modal.valor) || 0,
        max: Number(modal.max) || 0,
        local: modal.local,
        saida: modal.saida,
        tipo: modal.tipoEvento,
        descricao: modal.descricao,
        linkPagamento: modal.linkPagamento,
        bannerId: modal.bannerId,
      })
      closeModal()
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Erro ao criar evento.')
      setSalvando(false)
    }
  }

  return (
    <div style={{ padding: '22px 24px' }}>
      <h3 style={{ marginBottom: 16 }}>{modal.novo ? 'Criar evento' : 'Editar evento'}</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div>
          <label style={label}>Nome / edição do evento</label>
          <input className="input" value={modal.nome} onChange={(e) => patchModal({ nome: e.target.value })} placeholder="Ex.: nome do evento" />
        </div>
        <div>
          <label style={label}>Tipo de evento</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              className={'btn btn-sm ' + (modal.tipoEvento === 'retiro' ? 'btn-primary' : 'btn-default')}
              style={{ flex: 1, justifyContent: 'center' }}
              onClick={() => patchModal({ tipoEvento: 'retiro' })}
            >
              Retiro (template fixo)
            </button>
            <button
              type="button"
              className={'btn btn-sm ' + (modal.tipoEvento === 'avulso' ? 'btn-primary' : 'btn-default')}
              style={{ flex: 1, justifyContent: 'center' }}
              onClick={() => patchModal({ tipoEvento: 'avulso' })}
            >
              Avulso (descrição livre)
            </button>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={label}>Data de início</label>
            <input className="input" type="date" value={modal.inicio} onChange={(e) => patchModal({ inicio: e.target.value })} />
          </div>
          <div>
            <label style={label}>Data de fim</label>
            <input className="input" type="date" value={modal.fim} onChange={(e) => patchModal({ fim: e.target.value })} />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={label}>Valor da inscrição (R$)</label>
            <input className="input" type="number" min="0" value={modal.valor} onChange={(e) => patchModal({ valor: e.target.value })} />
          </div>
          <div>
            <label style={label}>Máximo de inscrições</label>
            <input className="input" type="number" min="1" value={modal.max} onChange={(e) => patchModal({ max: e.target.value })} />
          </div>
        </div>
        <div>
          <label style={label}>Local (exibido no formulário público)</label>
          <input className="input" value={modal.local} onChange={(e) => patchModal({ local: e.target.value })} placeholder="Ex.: Chácara da Igreja (detalhes enviados após a inscrição)" />
        </div>
        {modal.tipoEvento !== 'avulso' && (
          <div>
            <label style={label}>Ponto e horário de saída</label>
            <input className="input" value={modal.saida} onChange={(e) => patchModal({ saida: e.target.value })} placeholder="Ex.: Sexta-feira, 20h, no Prédio do Areão" />
          </div>
        )}

        {modal.tipoEvento === 'avulso' && (
          <div>
            <label style={label}>Descrição do evento (exibida no formulário público)</label>
            <textarea
              className="input"
              style={{ minHeight: 130, resize: 'vertical', fontFamily: 'inherit' }}
              value={modal.descricao}
              onChange={(e) => patchModal({ descricao: e.target.value })}
              placeholder={'Escreva a descrição do evento.\nPode usar várias linhas — o que inclui, horários, orientações, etc.'}
            />
            <div style={{ fontSize: 11, color: 'var(--fg-muted)', marginTop: 4 }}>
              Para eventos avulsos, este texto substitui o template fixo do retiro no formulário.
            </div>
          </div>
        )}

        <div>
          <label style={label}>Banner do formulário público (imagem)</label>
          {modal.bannerId && (
            <div style={{ marginBottom: 8 }}>
              <BannerPreview bannerId={modal.bannerId} />
            </div>
          )}
          <FileDropField
            accept="image/*"
            label={modal.bannerId ? 'Trocar imagem do banner' : 'Anexar imagem de banner (opcional)'}
            onFile={(a) => patchModal({ bannerId: a?.fileId ?? modal.bannerId })}
          />
          {modal.bannerId && (
            <button
              className="btn btn-default btn-xs"
              style={{ marginTop: 8 }}
              onClick={() => patchModal({ bannerId: null })}
            >
              Remover banner
            </button>
          )}
        </div>

        <div>
          <label style={label}>Link de pagamento (cartão/checkout) — opcional</label>
          <input
            className="input"
            type="url"
            value={modal.linkPagamento}
            onChange={(e) => patchModal({ linkPagamento: e.target.value })}
            placeholder="https://..."
          />
          <div style={{ fontSize: 11, color: 'var(--fg-muted)', marginTop: 4 }}>
            Se preenchido, aparece como botão “Pagar com cartão” no formulário público.
          </div>
        </div>

        <div style={{ fontSize: 12, color: 'var(--fg-muted)' }}>
          {modal.novo
            ? 'Ao criar, um link público único de inscrição é gerado automaticamente e categorias/conduções padrão são preparadas.'
            : 'As alterações são sincronizadas automaticamente.'}
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 18 }}>
        <button className="btn btn-default" onClick={closeModal} disabled={salvando}>Fechar</button>
        <button className="btn btn-primary" onClick={onSalvar} disabled={salvando}>
          {salvando ? 'Criando…' : modal.novo ? 'Criar evento' : 'Salvar evento'}
        </button>
      </div>
    </div>
  )
}
