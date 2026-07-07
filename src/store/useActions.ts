// ============================================================================
// Ações de negócio que envolvem mais do que um patch trivial. Ficam fora das
// views para mantê-las declarativas. Cada função fecha sobre o `state` atual
// (o hook roda no render, então o estado está sempre fresco).
// ============================================================================

import { appConfig } from '../config'
import { seedForm } from '../data/seed'
import { DIAS_ESCALA } from '../escalaConfig'
import { fmt, stampAgora, stampDia } from '../lib/format'
import { exportPrestacaoContas } from '../services/reportExport'
import type {
  Escala,
  Inscrito,
  ItemVenda,
  ModalFecharConta,
  ModalPagamento,
  ModalProduto,
  ModalQuarto,
  ModalRetiro,
  Produto,
  Venda,
} from '../types'
import { useRetiro } from './RetiroContext'
import { escalaVazia, ofertado, pago, porId, servosServico } from './selectors'

export function useActions() {
  const { state, patch, setModal, toast } = useRetiro()

  const gerarEscala = () => {
    const escala: Escala = escalaVazia()
    // No fim de semana os servos servem os 3 dias; balanceamos a carga de todos
    // ao longo de sexta, sábado e domingo (o `load` é compartilhado).
    const servos = servosServico(state)
    const load: Record<string, number> = {}
    servos.forEach((s) => (load[s.id] = 0))
    const pick = (
      n: number,
      filtro: ((s: Inscrito) => boolean) | null,
      excluir: string[],
    ): string[] => {
      const pool = servos
        .filter((s) => !excluir.includes(s.id) && (!filtro || filtro(s)))
        .sort((a, b) => load[a.id] - load[b.id] || Math.random() - 0.5)
      const sel = pool.slice(0, n)
      sel.forEach((s) => load[s.id]++)
      return sel.map((s) => s.id)
    }
    DIAS_ESCALA.forEach((dia) => {
      dia.turnos.forEach((t) => {
        const cel = escala[dia.key][t.key]
        if (t.frentes.includes('limp')) {
          // Limpeza de almoço/jantar exige no mínimo 2 homens.
          if (t.key !== 'cafe') {
            const homens = pick(2, (s) => s.genero === 'M', [])
            cel.limp = homens.concat(pick(2, null, homens))
          } else {
            cel.limp = pick(3, null, [])
          }
        }
        if (t.frentes.includes('prep')) {
          cel.prep = pick(t.key === 'cafe' ? 3 : 4, null, cel.limp)
        }
      })
    })
    patch({ escala })
    toast('Escala gerada com carga equilibrada entre os servos.')
  }

  const finalizarVenda = () => {
    const s = state
    if (!s.carrinho.length) return
    if (s.vendaTipo === 'anotada' && !s.vCliente.trim()) {
      toast('Informe o nome do cliente da conta.')
      return
    }
    const itens: ItemVenda[] = s.carrinho.map((i) => ({
      id: i.id,
      nome: i.nome,
      valor: i.valor,
      qtd: i.qtd,
    }))
    const produtos = s.produtos.map((p) => {
      const it = itens.find((i) => i.id === p.id)
      return it ? { ...p, estoque: Math.max(0, p.estoque - it.qtd) } : p
    })
    const vendas = s.vendas.slice()
    if (s.vendaTipo === 'anotada') {
      const idx = vendas.findIndex(
        (v) =>
          v.status === 'pendente' &&
          v.cliente.toLowerCase() === s.vCliente.trim().toLowerCase(),
      )
      if (idx >= 0) {
        const v = vendas[idx]
        const novos = v.itens.slice()
        itens.forEach((it) => {
          const j = novos.findIndex((x) => x.id === it.id)
          if (j >= 0) novos[j] = { ...novos[j], qtd: novos[j].qtd + it.qtd }
          else novos.push(it)
        })
        vendas[idx] = { ...v, itens: novos }
        toast('Itens lançados na conta de ' + v.cliente + '.')
      } else {
        vendas.push({
          id: 'v' + Date.now(),
          tipo: 'anotada',
          cliente: s.vCliente.trim(),
          forma: '',
          status: 'pendente',
          data: 'hoje',
          itens,
        })
        toast('Conta aberta para ' + s.vCliente.trim() + '.')
      }
    } else {
      vendas.push({
        id: 'v' + Date.now(),
        tipo: 'avulsa',
        cliente: '',
        forma: s.vendaForma,
        status: 'pago',
        data: 'hoje',
        itens,
      })
      toast(
        'Venda registrada — ' +
          fmt(itens.reduce((a, i) => a + i.valor * i.qtd, 0)) +
          ' em ' +
          s.vendaForma +
          '.',
      )
    }
    patch({ vendas, produtos, carrinho: [], vCliente: '' })
  }

  const addCart = (p: Produto) => {
    const cart = state.carrinho
    if (p.estoque <= 0) {
      toast('Sem estoque de ' + p.nome + '.')
      return
    }
    const j = cart.findIndex((i) => i.id === p.id)
    const emCarrinho = j >= 0 ? cart[j].qtd : 0
    if (emCarrinho >= p.estoque) {
      toast('Estoque insuficiente de ' + p.nome + '.')
      return
    }
    const c =
      j >= 0
        ? cart.map((i, k) => (k === j ? { ...i, qtd: i.qtd + 1 } : i))
        : cart.concat([{ id: p.id, nome: p.nome, valor: p.valor, qtd: 1 }])
    patch({ carrinho: c })
  }

  const atribuirQuarto = (pid: string, qid: string) => {
    const s = state
    const byId = porId(s)
    const p = byId[pid]
    const q = s.quartos.find((x) => x.id === qid)
    if (!p || !q) return
    if (p.genero !== q.genero) {
      toast('Quartos não podem misturar gêneros.')
      return
    }
    const membros = s.inscritos.filter(
      (x) => x.statusInscricao !== 'cancelada' && x.quarto === qid,
    ).length
    if (membros >= q.cap) {
      toast(q.nome + ' está lotado (' + q.cap + ' camas).')
      return
    }
    patch({
      inscritos: s.inscritos.map((x) =>
        x.id === pid ? { ...x, quarto: qid } : x,
      ),
      dragId: null,
      selId: null,
    })
    toast(p.nome.split(' ')[0] + ' alocado em ' + q.nome + '.')
  }

  const salvarPagamento = () => {
    const s = state
    const m = s.modal as ModalPagamento
    if (!m || m.type !== 'pagamento') return
    const byId = porId(s)
    const mp = byId[m.pid]
    if (!mp) return
    const mRestanteV = Math.max(0, s.retiro.valor - pago(mp) - ofertado(mp))
    const vp = Number(m.valorPago) || 0
    const ofertaV = m.oferta ? Math.max(0, mRestanteV - vp) : 0
    if (vp <= 0 && ofertaV <= 0) {
      toast('Informe um valor pago ou marque como oferta.')
      return
    }
    const lanc = {
      valor: vp,
      oferta: ofertaV,
      forma: m.forma,
      obs: m.obs,
      data: stampAgora(),
      usuario: 'Admin',
      dataPrevista: m.dataPrevista || null,
    }
    patch({
      inscritos: s.inscritos.map((x) =>
        x.id === m.pid
          ? {
              ...x,
              pagamentos: x.pagamentos.concat([lanc]),
              statusInscricao: 'confirmada',
              comprovante: x.comprovante || !!m.comprovante,
              comprovanteId: m.comprovante ? m.comprovante.fileId : x.comprovanteId,
            }
          : x,
      ),
      modal: null,
    })
    const quitado = vp + ofertaV >= mRestanteV
    toast(
      quitado
        ? 'Pagamento de ' + mp.nome.split(' ')[0] + ' confirmado.'
        : 'Pagamento parcial registrado — resta ' +
            fmt(mRestanteV - vp - ofertaV) +
            '.',
    )
  }

  const confirmarCancelamento = () => {
    const s = state
    const m = s.modal
    if (!m || (m.type !== 'cancelar' && m.type !== 'pagamento')) return
    const pid = m.pid
    const obs = 'obs' in m ? m.obs : ''
    patch({
      inscritos: s.inscritos.map((x) =>
        x.id === pid
          ? {
              ...x,
              statusInscricao: 'cancelada',
              quarto: null,
              cancelInfo:
                'Cancelada em ' +
                stampDia() +
                ' por Admin' +
                (obs ? ' — ' + obs : ''),
            }
          : x,
      ),
      modal: null,
    })
    toast('Inscrição cancelada. Vaga liberada.')
  }

  const salvarRetiro = () => {
    const s = state
    const m = s.modal as ModalRetiro
    if (!m || m.type !== 'retiro') return
    if (!m.nome || !m.nome.trim()) {
      toast('Informe o nome do retiro.')
      return
    }
    patch({
      retiro: {
        ...s.retiro,
        nome: m.nome.trim(),
        inicio: m.inicio || s.retiro.inicio,
        fim: m.fim || s.retiro.fim,
        valor: Number(m.valor) || s.retiro.valor,
        max: Number(m.max) || s.retiro.max,
        slug: m.novo
          ? m.nome
              .trim()
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, '-')
              .slice(0, 24)
          : s.retiro.slug,
      },
      modal: null,
    })
    toast(m.novo ? 'Retiro criado — link público gerado.' : 'Retiro atualizado.')
  }

  const salvarQuarto = () => {
    const s = state
    const m = s.modal as ModalQuarto
    if (!m || m.type !== 'quarto') return
    if (!m.nome || !m.nome.trim()) {
      toast('Informe o nome do quarto.')
      return
    }
    patch({
      quartos: s.quartos.concat([
        {
          id: 'q' + Date.now(),
          nome: m.nome.trim(),
          genero: m.genero || 'M',
          cap: Number(m.cap) || 8,
          lideres: [],
        },
      ]),
      modal: null,
    })
    toast('Quarto criado.')
  }

  const salvarProduto = () => {
    const s = state
    const m = s.modal as ModalProduto
    if (!m || m.type !== 'produto') return
    if (!m.nome || !m.nome.trim()) {
      toast('Informe o nome do produto.')
      return
    }
    const novo = {
      nome: m.nome.trim(),
      valor: Number(m.valor) || 0,
      estoque: Number(m.estoque) || 0,
    }
    if (m.pid) {
      patch({
        produtos: s.produtos.map((x) =>
          x.id === m.pid ? { ...x, ...novo } : x,
        ),
        modal: null,
      })
    } else {
      patch({
        produtos: s.produtos.concat([{ id: 'pr' + Date.now(), ...novo }]),
        modal: null,
      })
    }
    toast('Produto salvo.')
  }

  const salvarDespesa = () => {
    const s = state
    const m = s.modal
    if (!m || m.type !== 'despesa') return
    if (!m.descricao || !(Number(m.valor) > 0)) {
      toast('Informe descrição e valor.')
      return
    }
    patch({
      despesas: s.despesas.concat([
        {
          id: 'd' + Date.now(),
          categoria: m.categoria,
          descricao: m.descricao,
          valor: Number(m.valor),
          anexo: m.comprovante ? m.comprovante.name : '',
          anexoId: m.comprovante ? m.comprovante.fileId : '',
        },
      ]),
      modal: null,
    })
    toast('Despesa lançada.')
  }

  const confirmarFecharConta = () => {
    const s = state
    const m = s.modal as ModalFecharConta
    if (!m || m.type !== 'fecharConta') return
    const v = s.vendas.find((x) => x.id === m.vid)
    if (!v) return
    const total = v.itens.reduce((a, i) => a + i.valor * i.qtd, 0)
    const linhas = m.pagamentos
      .map((l) => ({ forma: l.forma, valor: Number(l.valor) || 0 }))
      .filter((l) => l.valor > 0 && l.forma)
    if (!linhas.length) {
      toast('Informe ao menos uma forma de pagamento.')
      return
    }
    const soma = linhas.reduce((a, l) => a + l.valor, 0)
    const naoDinheiro = linhas
      .filter((l) => l.forma !== 'Dinheiro')
      .reduce((a, l) => a + l.valor, 0)
    if (naoDinheiro > total + 0.005) {
      toast('Pagamentos que não são dinheiro não podem passar do total.')
      return
    }
    if (soma + 0.005 < total) {
      toast('Valor insuficiente — falta ' + fmt(total - soma) + '.')
      return
    }
    const troco = Math.max(0, soma - total)
    const resumo =
      linhas.map((l) => l.forma + ' ' + fmt(l.valor)).join(' + ') +
      (troco > 0.005 ? ' (troco ' + fmt(troco) + ')' : '')
    patch({
      vendas: s.vendas.map((x) =>
        x.id === m.vid ? { ...x, status: 'pago', forma: resumo } : x,
      ) as Venda[],
      modal: null,
    })
    toast(
      'Conta de ' +
        v.cliente +
        ' recebida.' +
        (troco > 0.005 ? ' Troco ' + fmt(troco) + '.' : ''),
    )
  }

  /** Salva a edição dos itens de uma conta aberta, reconciliando o estoque. */
  const salvarEdicaoConta = () => {
    const s = state
    const m = s.modal
    if (!m || m.type !== 'editarConta') return
    const v = s.vendas.find((x) => x.id === m.vid)
    if (!v) return
    const novos = m.itens.filter((i) => i.qtd > 0)
    // quantidade antiga x nova por produto → ajuste de estoque
    const oldQ: Record<string, number> = {}
    v.itens.forEach((i) => (oldQ[i.id] = (oldQ[i.id] || 0) + i.qtd))
    const newQ: Record<string, number> = {}
    novos.forEach((i) => (newQ[i.id] = (newQ[i.id] || 0) + i.qtd))
    const produtos = s.produtos.map((p) => {
      const delta = (newQ[p.id] || 0) - (oldQ[p.id] || 0) // >0 = sai mais do estoque
      return delta !== 0 ? { ...p, estoque: Math.max(0, p.estoque - delta) } : p
    })
    patch({
      vendas: s.vendas.map((x) => (x.id === m.vid ? { ...x, itens: novos } : x)),
      produtos,
      modal: null,
    })
    toast('Conta atualizada.')
  }

  const enviarInscricao = () => {
    const s = state
    const f = s.form
    const erros: Record<string, number> = {}
    if (!f.nome.trim() || f.nome.trim().split(/\s+/).length < 2) erros.nome = 1
    if (!f.tel.trim()) erros.tel = 1
    if (!f.genero) erros.genero = 1
    if (f.tipo === 'Servo' && !f.dia) erros.dia = 1
    if (!f.lider) erros.lider = 1
    if (!f.forma) erros.forma = 1
    if (Object.keys(erros).length) {
      patch({ form: { ...f, erros } })
      toast('Revise os campos destacados.')
      return
    }
    const novo: Inscrito = {
      id: 'p' + Date.now(),
      nome: f.nome.trim(),
      genero: f.genero as Inscrito['genero'],
      tipo: f.tipo,
      diaServir: f.tipo === 'Servo' ? f.dia : '',
      lider: f.lider,
      forma: f.forma,
      parcelas: f.forma === 'Crédito parcelado' ? Number(f.parcelas) : null,
      tel: f.tel,
      statusInscricao: 'pendente',
      cancelInfo: '',
      pagamentos: [],
      comprovante: !!f.comprovante,
      comprovanteId: f.comprovante?.fileId ?? null,
      quarto: null,
    }
    patch({
      inscritos: s.inscritos.concat([novo]),
      form: { ...seedForm(), enviado: true },
    })
    toast('Inscrição de ' + novo.nome + ' recebida.')
  }

  const toggleLink = () => {
    const s = state
    patch({ retiro: { ...s.retiro, aberto: !s.retiro.aberto } })
    toast(
      s.retiro.aberto
        ? 'Link de inscrição fechado.'
        : 'Link de inscrição reaberto.',
    )
  }

  const exportarRelatorio = async () => {
    toast('Gerando relatório em Excel…')
    try {
      await exportPrestacaoContas(state, appConfig)
    } catch {
      toast('Não foi possível gerar o relatório.')
    }
  }

  return {
    gerarEscala,
    finalizarVenda,
    addCart,
    atribuirQuarto,
    salvarPagamento,
    confirmarCancelamento,
    salvarRetiro,
    salvarQuarto,
    salvarProduto,
    salvarDespesa,
    confirmarFecharConta,
    salvarEdicaoConta,
    enviarInscricao,
    toggleLink,
    exportarRelatorio,
    setModal,
  }
}
