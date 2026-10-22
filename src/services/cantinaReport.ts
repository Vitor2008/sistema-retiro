// ============================================================================
// Exportação do relatório de vendas da Cantina para Excel (.xlsx).
//
// Abas:
//  - "Resumo": totais (vendido, recebido, em aberto) e recebido por forma de
//    pagamento.
//  - "Vendas por item": quantidade e valor por produto.
//  - "Vendas por comprador": pago / em aberto por cliente (avulsas agrupadas).
//  - "Vendas": detalhamento de cada venda/conta.
// ============================================================================

import type ExcelJS from 'exceljs'
import type { AppState, Venda } from '../types'
import { cantinaTotais, periodo } from '../store/selectors'

const BRAND = 'FF3E7CB0'
const HEADER_TEXT = 'FFFFFFFF'
const MONEY = '"R$" #,##0.00'

function styleHeader(row: ExcelJS.Row) {
  row.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: HEADER_TEXT }, size: 11 }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND } }
    cell.alignment = { vertical: 'middle' }
  })
  row.height = 20
}

function styleTotalRow(row: ExcelJS.Row) {
  row.eachCell((cell) => {
    cell.font = { bold: true, size: 11 }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F3F5' } }
  })
}

const totalVenda = (v: Venda) => v.itens.reduce((a, i) => a + i.valor * i.qtd, 0)

/** 'R$ 1.234,56' → 1234.56 */
function numBR(s: string): number {
  return Number(s.replace(/\./g, '').replace(',', '.')) || 0
}

/** Quebra a forma de pagamento de uma venda paga em parcelas. A venda avulsa
 *  guarda só a forma ("Pix"); a conta recebida guarda um resumo combinado
 *  ("Pix R$ 20,00 + Dinheiro R$ 30,00 (troco R$ 5,00)") — o troco sai do
 *  dinheiro. */
function formasDaVenda(v: Venda): { forma: string; valor: number }[] {
  if (v.status !== 'pago') return []
  const total = totalVenda(v)
  let texto = (v.forma || '').trim()
  let troco = 0
  const mt = /\s*\(troco R\$\s*([\d.]+,\d{2})\)\s*$/.exec(texto)
  if (mt) {
    troco = numBR(mt[1])
    texto = texto.slice(0, mt.index)
  }
  const partes = texto.split(' + ').map((parte) => /^(.+?) R\$\s*([\d.]+,\d{2})$/.exec(parte.trim()))
  if (!texto || partes.some((m) => !m)) return [{ forma: texto || 'Não informada', valor: total }]
  const linhas = partes.map((m) => ({ forma: m![1], valor: numBR(m![2]) }))
  const din = linhas.find((l) => l.forma === 'Dinheiro')
  if (din) din.valor = Math.max(0, din.valor - troco)
  return linhas
}

/** Monta e dispara o download do relatório de vendas da cantina. */
export async function exportVendasCantina(state: AppState): Promise<void> {
  const tot = cantinaTotais(state)

  const { default: ExcelJSRuntime } = await import('exceljs')
  const wb = new ExcelJSRuntime.Workbook()
  wb.creator = 'Sistema de Eventos'
  wb.created = new Date()

  // ---------------------------------------------------------------- Resumo ---
  const resumo = wb.addWorksheet('Resumo')
  resumo.columns = [{ width: 34 }, { width: 18 }]
  const titulo = resumo.addRow(['Relatório de vendas — Cantina'])
  titulo.font = { bold: true, size: 14 }
  resumo.addRow(['Evento', state.retiro.nome])
  resumo.addRow(['Período', periodo(state)])
  resumo.addRow(['Gerado em', new Date().toLocaleString('pt-BR')])
  resumo.addRow([])
  styleHeader(resumo.addRow(['Indicador', 'Valor']))
  ;(
    [
      ['Total vendido', tot.vendido, true],
      ['Recebido (vendas pagas)', tot.recebido, true],
      ['Em contas abertas (' + tot.contasAbertas + ')', tot.emAberto, true],
      ['Quantidade de vendas', tot.vendas, false],
      ['Itens vendidos (unidades)', tot.itens, false],
    ] as [string, number, boolean][]
  ).forEach(([k, v, money]) => {
    const r = resumo.addRow([k, v])
    if (money) r.getCell(2).numFmt = MONEY
  })

  const porForma: Record<string, number> = {}
  state.vendas.forEach((v) =>
    formasDaVenda(v).forEach((l) => (porForma[l.forma] = (porForma[l.forma] || 0) + l.valor)),
  )
  resumo.addRow([])
  styleHeader(resumo.addRow(['Recebido por forma de pagamento', 'Valor']))
  Object.keys(porForma)
    .sort((a, b) => porForma[b] - porForma[a])
    .forEach((f) => (resumo.addRow([f, porForma[f]]).getCell(2).numFmt = MONEY))
  const rf = resumo.addRow(['Total recebido', Object.values(porForma).reduce((a, x) => a + x, 0)])
  rf.getCell(2).numFmt = MONEY
  styleTotalRow(rf)

  // ------------------------------------------------------- Vendas por item ---
  const itens = wb.addWorksheet('Vendas por item')
  itens.columns = [{ width: 30 }, { width: 14 }, { width: 18 }]
  styleHeader(itens.addRow(['Item', 'Quantidade', 'Valor total']))
  const porItem: Record<string, { qtd: number; total: number }> = {}
  state.vendas.forEach((v) =>
    v.itens.forEach((i) => {
      porItem[i.nome] = porItem[i.nome] || { qtd: 0, total: 0 }
      porItem[i.nome].qtd += i.qtd
      porItem[i.nome].total += i.valor * i.qtd
    }),
  )
  Object.keys(porItem)
    .sort((a, b) => porItem[b].total - porItem[a].total)
    .forEach((n) => (itens.addRow([n, porItem[n].qtd, porItem[n].total]).getCell(3).numFmt = MONEY))
  const ti = itens.addRow(['Total', tot.itens, tot.vendido])
  ti.getCell(3).numFmt = MONEY
  styleTotalRow(ti)

  // -------------------------------------------------- Vendas por comprador ---
  const comp = wb.addWorksheet('Vendas por comprador')
  comp.columns = [{ width: 30 }, { width: 10 }, { width: 10 }, { width: 16 }, { width: 16 }, { width: 16 }]
  styleHeader(comp.addRow(['Comprador', 'Vendas', 'Itens', 'Pago', 'Em aberto', 'Total']))
  const porComprador: Record<string, { vendas: number; itens: number; pago: number; pendente: number }> = {}
  state.vendas.forEach((v) => {
    const nome = v.cliente.trim() || 'Vendas avulsas'
    const c = (porComprador[nome] = porComprador[nome] || { vendas: 0, itens: 0, pago: 0, pendente: 0 })
    const t = totalVenda(v)
    c.vendas += 1
    c.itens += v.itens.reduce((a, i) => a + i.qtd, 0)
    if (v.status === 'pago') c.pago += t
    else c.pendente += t
  })
  Object.keys(porComprador)
    .sort((a, b) => {
      if (a === 'Vendas avulsas') return 1
      if (b === 'Vendas avulsas') return -1
      return a.localeCompare(b)
    })
    .forEach((n) => {
      const c = porComprador[n]
      const r = comp.addRow([n, c.vendas, c.itens, c.pago, c.pendente, c.pago + c.pendente])
      ;[4, 5, 6].forEach((i) => (r.getCell(i).numFmt = MONEY))
    })

  // ---------------------------------------------------------------- Vendas ---
  const det = wb.addWorksheet('Vendas')
  det.columns = [{ width: 14 }, { width: 10 }, { width: 26 }, { width: 50 }, { width: 40 }, { width: 12 }, { width: 14 }]
  styleHeader(det.addRow(['Data', 'Tipo', 'Cliente', 'Itens', 'Forma de pagamento', 'Status', 'Total']))
  state.vendas.forEach((v) => {
    const r = det.addRow([
      v.data,
      v.tipo === 'anotada' ? 'Conta' : 'Avulsa',
      v.cliente,
      v.itens.map((i) => i.qtd + '× ' + i.nome).join(', '),
      v.status === 'pago' ? v.forma : '—',
      v.status === 'pago' ? 'Pago' : 'Em aberto',
      totalVenda(v),
    ])
    r.getCell(7).numFmt = MONEY
  })
  const td = det.addRow(['Total', '', '', '', '', '', tot.vendido])
  td.getCell(7).numFmt = MONEY
  styleTotalRow(td)

  // ------------------------------------------------------------- download ---
  const buffer = await wb.xlsx.writeBuffer()
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'vendas-cantina-' + state.retiro.slug + '.xlsx'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
