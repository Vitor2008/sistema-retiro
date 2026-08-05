// ============================================================================
// Ações de negócio que envolvem mais do que um patch trivial. Ficam fora das
// views para mantê-las declarativas. Cada função fecha sobre o `state` atual
// (o hook roda no render, então o estado está sempre fresco).
// ============================================================================

import { appConfig } from '../config'
import { DIAS_ESCALA, FRENTE_INFO } from '../escalaConfig'
import { fmt, stampAgora, stampDia, uid } from '../lib/format'
import { exportPrestacaoContas } from '../services/reportExport'
import type {
  Attachment,
  Escala,
  Inscrito,
  ItemVenda,
  ModalEditarInscricao,
  ModalEditarPagamento,
  ModalFecharConta,
  ModalPagamento,
  ModalOferta,
  ModalProduto,
  ModalQuarto,
  ModalRetiro,
  Produto,
  Venda,
} from '../types'
import { useRetiro } from './RetiroContext'
import { escalaVazia, ofertado, pago, porId, servosServico, valorInscricao } from './selectors'

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
        // Uma pessoa não repete frente dentro da mesma refeição.
        const usados: string[] = []
        t.frentes.forEach((fr) => {
          const cfg = FRENTE_INFO[fr]
          const sel = pick(cfg.qtd, cfg.soHomens ? (s) => s.genero === 'M' : null, usados)
          cel[fr] = sel
          usados.push(...sel)
        })
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
          id: uid('v'),
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
        id: uid('v'),
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

  /** Pré-definição de quartos: agrupa cada célula (líder + seus liderados),
   *  separando por gênero, e distribui SÓ quem ainda está sem quarto,
   *  respeitando a capacidade. Não mexe em quem já está alocado. */
  const preDefinirQuartos = () => {
    const s = state
    if (!s.quartos.length) {
      toast('Cadastre ao menos um quarto antes de gerar a pré-definição.')
      return
    }
    const ativosList = s.inscritos.filter((p) => p.statusInscricao !== 'cancelada')
    const ocup: Record<string, number> = {}
    s.quartos.forEach((q) => (ocup[q.id] = 0))
    ativosList.forEach((p) => {
      if (p.quarto && ocup[p.quarto] != null) ocup[p.quarto]++
    })

    const nomesLideres = new Set(ativosList.map((p) => p.lider).filter(Boolean))
    const atrib: Record<string, string> = {}

    ;(['M', 'F'] as const).forEach((g) => {
      const semQuarto = ativosList.filter((p) => p.genero === g && !p.quarto)
      const usados = new Set<string>()
      const grupos: Inscrito[][] = []
      // Um grupo por célula: o líder (se inscrito deste gênero) + seus liderados.
      nomesLideres.forEach((nomeLider) => {
        const grupo = semQuarto.filter(
          (p) => !usados.has(p.id) && (p.lider === nomeLider || p.nome === nomeLider),
        )
        if (grupo.length) {
          grupo.forEach((p) => usados.add(p.id))
          grupos.push(grupo)
        }
      })
      const resto = semQuarto.filter((p) => !usados.has(p.id))
      if (resto.length) grupos.push(resto)
      grupos.sort((a, b) => b.length - a.length)

      const quartosG = s.quartos.filter((q) => q.genero === g)
      const free = (qid: string) => {
        const q = quartosG.find((x) => x.id === qid)
        return q ? q.cap - ocup[q.id] : 0
      }
      grupos.forEach((grupo) => {
        let restantes = grupo.slice()
        while (restantes.length) {
          const cand = quartosG.filter((q) => free(q.id) > 0).sort((a, b) => free(b.id) - free(a.id))
          if (!cand.length) break // sem vaga para este gênero
          // Prefere um quarto que caiba o grupo inteiro; senão, o de mais espaço.
          const q = cand.find((x) => free(x.id) >= restantes.length) || cand[0]
          const cabe = Math.min(free(q.id), restantes.length)
          restantes.slice(0, cabe).forEach((p) => {
            atrib[p.id] = q.id
            ocup[q.id]++
          })
          restantes = restantes.slice(cabe)
        }
      })
    })

    const nAtrib = Object.keys(atrib).length
    if (!nAtrib) {
      toast('Nada a alocar — todos já têm quarto ou não há vagas suficientes.')
      return
    }

    const inscritos = s.inscritos.map((x) => (atrib[x.id] ? { ...x, quarto: atrib[x.id] } : x))
    // Marca como líder de quarto os servos que são líderes de célula presentes (até 2).
    const quartos = s.quartos.map((q) => {
      const membros = inscritos.filter((p) => p.statusInscricao !== 'cancelada' && p.quarto === q.id)
      const lideres = q.lideres.slice()
      membros
        .filter((m) => m.tipo === 'Servo' && nomesLideres.has(m.nome))
        .forEach((m) => {
          if (!lideres.includes(m.id) && lideres.length < 2) lideres.push(m.id)
        })
      return { ...q, lideres }
    })
    patch({ inscritos, quartos })
    toast(nAtrib + ' pessoa(s) alocada(s) na pré-definição.')
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
    const mRestanteV = Math.max(0, valorInscricao(s, mp) - pago(mp) - ofertado(mp))
    const vp = Number(m.valorPago) || 0
    const ofertaV = m.oferta ? Math.max(0, mRestanteV - vp) : 0
    // Permite confirmar a inscrição SEM pagamento, desde que informe a data
    // prevista para pagar o restante.
    if (vp <= 0 && ofertaV <= 0 && !m.dataPrevista) {
      toast('Informe um valor pago, marque como oferta ou defina a data prevista para pagar.')
      return
    }
    // Ao registrar um pagamento em dinheiro, o comprovante é obrigatório (novo
    // anexo ou já existente na inscrição).
    if (vp > 0 && !m.comprovante && !mp.comprovanteId) {
      toast('Anexe o comprovante do pagamento.')
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
    const primeiroNome = mp.nome.split(' ')[0]
    const quitado = vp + ofertaV >= mRestanteV
    toast(
      vp <= 0 && ofertaV <= 0
        ? 'Inscrição de ' + primeiroNome + ' confirmada — pagamento pendente.'
        : quitado
          ? 'Pagamento de ' + primeiroNome + ' confirmado.'
          : 'Pagamento parcial registrado — resta ' + fmt(mRestanteV - vp - ofertaV) + '.',
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

  /** Edição do retiro atual (a criação de novos vai por API — RetiroSelection).
   *  Os campos editáveis sincronizam via snapshot; slug e id não mudam aqui. */
  const salvarRetiro = () => {
    const s = state
    const m = s.modal as ModalRetiro
    if (!m || m.type !== 'retiro') return
    if (!m.nome || !m.nome.trim()) {
      toast('Informe o nome do evento.')
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
        local: m.local,
        saida: m.saida,
        tipo: m.tipoEvento,
        descricao: m.descricao,
        linkPagamento: m.linkPagamento,
        bannerId: m.bannerId,
      },
      modal: null,
    })
    toast('Evento atualizado.')
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
          id: uid('q'),
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
        produtos: s.produtos.concat([{ id: uid('pr'), ...novo }]),
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
    if (!m.comprovante) {
      toast('Anexe o comprovante da compra.')
      return
    }
    patch({
      despesas: s.despesas.concat([
        {
          id: uid('d'),
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

  const salvarOferta = () => {
    const s = state
    const m = s.modal as ModalOferta
    if (!m || m.type !== 'oferta') return
    const total = Math.max(0, Number(m.valor) || 0)
    patch({ retiro: { ...s.retiro, oferta: total }, modal: null })
    toast('Oferta cadastrada: ' + fmt(total) + '.')
  }

  /** Anexa/atualiza o comprovante de um inscrito (usado no modal de detalhes,
   *  inclusive após a inscrição já estar confirmada e paga). */
  const anexarComprovante = (pid: string, att: Attachment) => {
    patch({
      inscritos: state.inscritos.map((x) =>
        x.id === pid ? { ...x, comprovante: true, comprovanteId: att.fileId } : x,
      ),
    })
    toast('Comprovante anexado.')
  }

  /** Edição dos dados da inscrição (usado no check-in). Não mexe em pagamentos,
   *  status, quarto nem comprovante. */
  const salvarEdicaoInscricao = () => {
    const s = state
    const m = s.modal as ModalEditarInscricao
    if (!m || m.type !== 'editarInscricao') return
    if (!m.nome.trim() || m.nome.trim().split(/\s+/).length < 2) {
      toast('Informe o nome completo.')
      return
    }
    if (!m.genero) {
      toast('Selecione o gênero.')
      return
    }
    patch({
      inscritos: s.inscritos.map((x) =>
        x.id === m.pid
          ? {
              ...x,
              nome: m.nome.trim(),
              tel: m.tel.trim(),
              genero: m.genero as Inscrito['genero'],
              idade: Number(m.idade) > 0 ? Math.floor(Number(m.idade)) : null,
              dataNascimento: m.dataNascimento,
              valor: m.valor.trim() !== '' && Number(m.valor) >= 0 ? Number(m.valor) : x.valor ?? null,
              tipo: m.tipo,
              vez: m.tipo === 'Encontrista' ? m.vez : '',
              lider: m.lider,
              predio: m.predio,
              conducao: m.conducao,
              forma: m.forma,
            }
          : x,
      ),
      modal: null,
    })
    toast('Inscrição atualizada.')
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

  /** Salva a edição dos lançamentos de pagamento de uma inscrição (ADM).
   *  Substitui o histórico pelo conjunto editado; pago/oferta/status são
   *  recalculados a partir dos lançamentos. */
  const salvarEdicaoPagamento = () => {
    const s = state
    const m = s.modal as ModalEditarPagamento
    if (!m || m.type !== 'editarPagamento') return
    const linhas = m.linhas
      .map((l) => ({
        ...l,
        valor: Math.max(0, Number(l.valor) || 0),
        oferta: Math.max(0, Number(l.oferta) || 0),
      }))
      // Descarta linhas zeradas (valor e oferta = 0), tratando-as como removidas.
      .filter((l) => l.valor > 0 || l.oferta > 0)
    patch({
      inscritos: s.inscritos.map((x) =>
        x.id === m.pid ? { ...x, pagamentos: linhas } : x,
      ),
      modal: null,
    })
    toast('Pagamento atualizado.')
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
    preDefinirQuartos,
    salvarPagamento,
    confirmarCancelamento,
    salvarRetiro,
    salvarQuarto,
    salvarProduto,
    salvarDespesa,
    salvarOferta,
    anexarComprovante,
    salvarEdicaoInscricao,
    salvarEdicaoPagamento,
    confirmarFecharConta,
    salvarEdicaoConta,
    toggleLink,
    exportarRelatorio,
    setModal,
  }
}
