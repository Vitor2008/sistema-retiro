import { useRetiro } from '../../store/RetiroContext'
import { useActions } from '../../store/useActions'
import type { FormaPagamento, Genero, ModalEditarInscricao, TipoInscricao, Vez } from '../../types'

const label: React.CSSProperties = { fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 5 }

export function EditarInscricaoModal({ modal }: { modal: ModalEditarInscricao }) {
  const { state, patchModal, closeModal } = useRetiro()
  const { salvarEdicaoInscricao } = useActions()

  const set = (partial: Partial<ModalEditarInscricao>) => patchModal(partial)
  const lideresDoPredio = state.lideres.filter(
    (l) => !modal.predio || l.predio === modal.predio || !l.predio,
  )

  return (
    <div style={{ padding: '22px 24px' }}>
      <h3 style={{ marginBottom: 16 }}>Editar inscrição</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div>
          <label style={label}>Nome completo</label>
          <input className="input" value={modal.nome} onChange={(e) => set({ nome: e.target.value })} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={label}>Telefone / WhatsApp</label>
            <input className="input" value={modal.tel} onChange={(e) => set({ tel: e.target.value })} />
          </div>
          <div>
            <label style={label}>Gênero</label>
            <select className="input" value={modal.genero} onChange={(e) => set({ genero: e.target.value as Genero | '' })}>
              <option value="">Selecione…</option>
              <option value="M">Homem</option>
              <option value="F">Mulher</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={label}>Idade</label>
            <input className="input" type="number" min="0" value={modal.idade} onChange={(e) => set({ idade: e.target.value })} />
          </div>
          <div>
            <label style={label}>Data de nascimento</label>
            <input className="input" type="date" value={modal.dataNascimento} onChange={(e) => set({ dataNascimento: e.target.value })} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={label}>Tipo</label>
            <select className="input" value={modal.tipo} onChange={(e) => set({ tipo: e.target.value as TipoInscricao })}>
              <option value="Encontrista">Convidado</option>
              <option value="Servo">Servo</option>
            </select>
          </div>
          {modal.tipo === 'Encontrista' && (
            <div>
              <label style={label}>Participação</label>
              <select className="input" value={modal.vez} onChange={(e) => set({ vez: e.target.value as Vez })}>
                <option value="">Selecione…</option>
                <option value="1ª Vez">1ª Vez</option>
                <option value="2ª Vez">2ª Vez</option>
                <option value="+ de 2">+ de 2</option>
              </select>
            </div>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={label}>Prédio</label>
            <select className="input" value={modal.predio} onChange={(e) => set({ predio: e.target.value })}>
              <option value="">Selecione…</option>
              {state.predios.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={label}>Condução</label>
            <select className="input" value={modal.conducao} onChange={(e) => set({ conducao: e.target.value })}>
              <option value="">Selecione…</option>
              {state.conducoes.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={label}>Quem convidou (líder)</label>
            <select className="input" value={modal.lider} onChange={(e) => set({ lider: e.target.value })}>
              <option value="">Selecione…</option>
              {lideresDoPredio.map((l) => (
                <option key={l.nome + '|' + l.predio} value={l.nome}>{l.nome}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={label}>Forma de pagamento</label>
            <select className="input" value={modal.forma} onChange={(e) => set({ forma: e.target.value as FormaPagamento })}>
              <option value="">Selecione…</option>
              <option value="Pix">Pix</option>
              <option value="Cartão">Cartão</option>
              <option value="Dinheiro">Dinheiro</option>
            </select>
          </div>
        </div>

        <div>
          <label style={label}>Valor da inscrição (R$)</label>
          <input
            className="input"
            type="number"
            min="0"
            step="0.01"
            value={modal.valor}
            onChange={(e) => set({ valor: e.target.value })}
          />
          <div style={{ fontSize: 11, color: 'var(--fg-muted)', marginTop: 4 }}>
            Valor travado nesta inscrição. Alterar o valor do evento não muda inscrições já feitas.
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 18 }}>
        <button className="btn btn-default" onClick={closeModal}>Fechar</button>
        <button className="btn btn-primary" onClick={salvarEdicaoInscricao}>Salvar alterações</button>
      </div>
    </div>
  )
}
