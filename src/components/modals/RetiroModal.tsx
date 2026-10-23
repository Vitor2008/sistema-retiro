import { useEffect, useState } from 'react'
import { FileDropField } from '../FileDropField'
import { ConteudoEvento, Hero } from '../FormularioTopo'
import { appConfig } from '../../config'
import { useViewport } from '../../hooks/useViewport'
import { fmtData } from '../../lib/format'
import { fileService } from '../../services/fileService'
import { useRetiro } from '../../store/RetiroContext'
import { useRetiroSelection } from '../../store/RetiroSelection'
import { ativos } from '../../store/selectors'
import { useActions } from '../../store/useActions'
import type { ModalRetiro } from '../../types'

const label: React.CSSProperties = { fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 5 }

/** Campos do formulário público que podem ser ocultados em evento avulso. */
const CAMPOS_FORM: { key: keyof ModalRetiro; label: string }[] = [
  { key: 'mostrarIdade', label: 'Idade' },
  { key: 'mostrarGenero', label: 'Gênero' },
  { key: 'mostrarTelefone', label: 'Telefone / WhatsApp' },
  { key: 'mostrarNascimento', label: 'Data de nascimento' },
  { key: 'mostrarPredio', label: 'Qual prédio?' },
  { key: 'mostrarConducao', label: 'Como pretende ir?' },
  { key: 'mostrarLider', label: 'Quem lhe convidou? (líder)' },
]

/** URL local (object URL) do banner — resolve o blob local/servidor. */
function useBannerUrl(bannerId: string | null): string | null {
  const [url, setUrl] = useState<string | null>(null)
  useEffect(() => {
    setUrl(null)
    if (!bannerId) return
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
  return url
}

/** Miniatura do banner atual. */
function BannerPreview({ bannerId }: { bannerId: string }) {
  const url = useBannerUrl(bannerId)
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
  const { state, patchModal, closeModal, toast } = useRetiro()
  const { salvarRetiro } = useActions()
  const { criarRetiro } = useRetiroSelection()
  const [salvando, setSalvando] = useState(false)
  const { narrow } = useViewport()
  const bannerUrl = useBannerUrl(modal.bannerId)

  // Pré-visualização do topo do formulário público com o que está sendo editado.
  const max = Number(modal.max) || 0
  const vagasRestantes = Math.max(0, max - (modal.novo ? 0 : ativos(state).length))
  const periodo = modal.inicio || modal.fim ? fmtData(modal.inicio) + ' a ' + fmtData(modal.fim) : '—'
  const preview = (
    <div>
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--fg-muted)', marginBottom: 8 }}>
        Pré-visualização do formulário de inscrição
      </div>
      <div className="form-inscricao" style={{ background: 'var(--bg-app)', borderRadius: 10, padding: 16, border: '1px solid var(--border-default)' }}>
        <Hero bannerUrl={bannerUrl} igreja={appConfig.nomeIgreja} nome={modal.nome.trim()} />
        <ConteudoEvento
          evento={{
            nome: modal.nome,
            tipo: modal.tipoEvento,
            descricao: modal.descricao,
            local: modal.local,
            saida: modal.saida,
            formTitulo: modal.formTitulo.trim(),
            formDescricao: modal.formDescricao.trim(),
            formVersiculo: modal.formVersiculo.trim(),
            formVersiculoRef: modal.formVersiculoRef.trim(),
          }}
          periodo={periodo}
          vagasRestantes={vagasRestantes}
        />
      </div>
    </div>
  )

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
        formTitulo: modal.formTitulo.trim(),
        formDescricao: modal.formDescricao.trim(),
        formVersiculo: modal.formVersiculo.trim(),
        formVersiculoRef: modal.formVersiculoRef.trim(),
        mostrarIdade: modal.mostrarIdade,
        mostrarGenero: modal.mostrarGenero,
        mostrarTelefone: modal.mostrarTelefone,
        mostrarNascimento: modal.mostrarNascimento,
        mostrarLider: modal.mostrarLider,
        mostrarPredio: modal.mostrarPredio,
        mostrarConducao: modal.mostrarConducao,
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
      <div style={{ display: 'grid', gridTemplateColumns: narrow ? '1fr' : 'minmax(0, 1fr) minmax(0, 1fr)', gap: 20, alignItems: 'start' }}>
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

        {modal.tipoEvento !== 'avulso' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, border: '1px solid var(--border-default)', borderRadius: 8, padding: 12 }}>
            <div style={{ fontSize: 12, color: 'var(--fg-muted)' }}>
              Textos do formulário público (mesmo layout do template). Deixe um campo vazio para usar o texto padrão.
            </div>
            <div>
              <label style={label}>Título</label>
              <input className="input" value={modal.formTitulo} onChange={(e) => patchModal({ formTitulo: e.target.value })} />
            </div>
            <div>
              <label style={label}>Texto de apresentação</label>
              <textarea
                className="input"
                style={{ minHeight: 100, resize: 'vertical', fontFamily: 'inherit' }}
                value={modal.formDescricao}
                onChange={(e) => patchModal({ formDescricao: e.target.value })}
              />
            </div>
            <div>
              <label style={label}>Versículo</label>
              <textarea
                className="input"
                style={{ minHeight: 60, resize: 'vertical', fontFamily: 'inherit' }}
                value={modal.formVersiculo}
                onChange={(e) => patchModal({ formVersiculo: e.target.value })}
              />
            </div>
            <div>
              <label style={label}>Referência do versículo</label>
              <input className="input" value={modal.formVersiculoRef} onChange={(e) => patchModal({ formVersiculoRef: e.target.value })} placeholder="Ex.: Jeremias 33:3" />
            </div>
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

        {modal.tipoEvento === 'avulso' && (
          <div>
            <label style={label}>Campos do formulário de inscrição</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--fg-muted)' }}>
                <input type="checkbox" checked disabled style={{ width: 16, height: 16 }} />
                Nome completo (sempre)
              </label>
              {CAMPOS_FORM.map((c) => (
                <label key={c.key} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={!!modal[c.key]}
                    onChange={(e) => patchModal({ [c.key]: e.target.checked })}
                    style={{ width: 16, height: 16, accentColor: 'var(--color-primary)' }}
                  />
                  {c.label}
                </label>
              ))}
            </div>
            <div style={{ fontSize: 11, color: 'var(--fg-muted)', marginTop: 4 }}>
              Campos marcados aparecem no formulário e são obrigatórios.
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
      {/* Fica visível enquanto o formulário rola (o modal rola por inteiro). */}
      <div style={narrow ? undefined : { position: 'sticky', top: 0 }}>{preview}</div>
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
