// ============================================================================
// Exportação da Prestação de Contas para Excel (.xlsx).
//
// Gera uma pasta de trabalho com várias abas formatadas (Resumo, Entradas,
// Despesas, Check-in e Cantina). Fica isolado num service para não acoplar a
// tela à biblioteca de planilha.
// ============================================================================

import type ExcelJS from 'exceljs'
import type { AppConfig, AppState } from '../types'
import {
  ativos,
  cantinaTotais,
  linkPublico,
  ofertado,
  pago,
  periodo,
  statusPag,
} from '../store/selectors'

const BRAND = 'FF003D35' // verde Locks
const SAGE = 'FF89A86F'
const HEADER_TEXT = 'FFFFFFFF'
const MONEY = '"R$" #,##0.00'

const pagLabel: Record<string, string> = {
  confirmado: 'Pago',
  parcial: 'Parcial',
  pendente: 'Pendente',
}

function styleHeader(row: ExcelJS.Row, fill = BRAND) {
  row.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: HEADER_TEXT }, size: 11 }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fill } }
    cell.alignment = { vertical: 'middle' }
    cell.border = {
      top: { style: 'thin', color: { argb: 'FFCED4DA' } },
      bottom: { style: 'thin', color: { argb: 'FFCED4DA' } },
      left: { style: 'thin', color: { argb: 'FFCED4DA' } },
      right: { style: 'thin', color: { argb: 'FFCED4DA' } },
    }
  })
  row.height = 20
}

function styleTotalRow(row: ExcelJS.Row) {
  row.eachCell((cell) => {
    cell.font = { bold: true, size: 11 }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F3F5' } }
  })
}

/** Monta e dispara o download da planilha de prestação de contas. */
export async function exportPrestacaoContas(
  state: AppState,
  config: AppConfig,
): Promise<void> {
  const valor = state.retiro.valor
  const atv = ativos(state)
  const confirmados = atv.filter((p) => p.statusInscricao === 'confirmada')

  const arrecadado = state.inscritos.reduce((a, p) => a + pago(p), 0)
  const aReceber = atv.reduce(
    (a, p) => a + Math.max(0, valor - pago(p) - ofertado(p)),
    0,
  )
  const ofertas = state.inscritos.reduce((a, p) => a + ofertado(p), 0)
  const despesasTot = state.despesas.reduce((a, d) => a + d.valor, 0)
  const cantina = cantinaTotais(state)
  const totalEntradas = arrecadado + ofertas + cantina.vendido
  const saldo = totalEntradas - despesasTot

  // Carrega o exceljs sob demanda para não pesar o bundle inicial.
  const { default: ExcelJSRuntime } = await import('exceljs')
  const wb = new ExcelJSRuntime.Workbook()
  wb.creator = 'Sistema de Retiros'
  wb.created = new Date()

  // ---------------------------------------------------------------- Resumo ---
  const resumo = wb.addWorksheet('Resumo', {
    properties: { defaultColWidth: 22 },
  })
  resumo.columns = [{ width: 32 }, { width: 20 }]

  resumo.mergeCells('A1:B1')
  const title = resumo.getCell('A1')
  title.value = 'Prestação de Contas'
  title.font = { bold: true, size: 16, color: { argb: BRAND } }
  resumo.getRow(1).height = 26

  resumo.mergeCells('A2:B2')
  resumo.getCell('A2').value = config.nomeIgreja + ' · ' + state.retiro.nome
  resumo.getCell('A2').font = { size: 11, color: { argb: 'FF868E96' } }

  resumo.mergeCells('A3:B3')
  resumo.getCell('A3').value =
    'Período ' +
    periodo(state) +
    '  ·  ' +
    linkPublico(state, config.nomeIgreja)
  resumo.getCell('A3').font = { size: 10, color: { argb: 'FF868E96' } }

  const rh = resumo.addRow(['Indicador', 'Valor'])
  styleHeader(rh)

  const linhas: Array<[string, number, string?]> = [
    ['Total arrecadado (inscrições pagas)', arrecadado],
    ['A arrecadar (pendentes + parciais)', aReceber],
    ['Abatido como oferta', ofertas],
    ['Cantina — total vendido', cantina.vendido],
    ['Total de entradas', totalEntradas, 'entradas'],
    ['Total de despesas', despesasTot],
    ['Saldo do retiro (entradas − despesas)', saldo, 'saldo'],
  ]
  linhas.forEach(([label, v, tag]) => {
    const r = resumo.addRow([label, v])
    r.getCell(2).numFmt = MONEY
    if (tag === 'entradas' || tag === 'saldo') {
      r.getCell(1).font = { bold: true }
      r.getCell(2).font = { bold: true, color: { argb: saldo >= 0 ? BRAND : 'FFDC3545' } }
      r.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F3F5' } }
      r.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F3F5' } }
    }
  })

  // -------------------------------------------------------------- Entradas ---
  const entradas = wb.addWorksheet('Entradas')
  entradas.columns = [{ width: 18 }, { width: 44 }, { width: 18 }]
  const eh = entradas.addRow(['Origem', 'Descrição', 'Valor'])
  styleHeader(eh, SAGE)
  const entradasRows: Array<[string, string, number]> = [
    ['Inscrições', confirmados.length + ' inscrições confirmadas', arrecadado],
    [
      'Ofertas',
      state.inscritos.filter((p) => ofertado(p) > 0).length + ' inscrições abatidas',
      ofertas,
    ],
    ['Cantina', cantina.vendas + ' vendas (' + cantina.itens + ' itens)', cantina.vendido],
  ]
  entradasRows.forEach((row) => {
    const r = entradas.addRow(row)
    r.getCell(3).numFmt = MONEY
  })
  const et = entradas.addRow(['', 'Total de entradas', totalEntradas])
  et.getCell(3).numFmt = MONEY
  styleTotalRow(et)

  // -------------------------------------------------------------- Despesas ---
  const despesas = wb.addWorksheet('Despesas')
  despesas.columns = [{ width: 16 }, { width: 44 }, { width: 16 }, { width: 26 }]
  const dh = despesas.addRow(['Categoria', 'Descrição', 'Valor', 'Comprovante'])
  styleHeader(dh, 'FFDC3545')
  state.despesas.forEach((d) => {
    const r = despesas.addRow([d.categoria, d.descricao, d.valor, d.anexo || '—'])
    r.getCell(3).numFmt = MONEY
  })
  const dt = despesas.addRow(['', 'Total de despesas', despesasTot, ''])
  dt.getCell(3).numFmt = MONEY
  styleTotalRow(dt)

  // --------------------------------------------------------------- Check-in ---
  const checkin = wb.addWorksheet('Check-in')
  checkin.columns = [
    { width: 26 },
    { width: 12 },
    { width: 22 },
    { width: 18 },
    { width: 14 },
    { width: 14 },
    { width: 14 },
    { width: 14 },
  ]
  const ch = checkin.addRow([
    'Inscrito',
    'Tipo',
    'Líder',
    'Forma de pgto.',
    'Status pgto.',
    'Pago',
    'Oferta',
    'Saldo',
  ])
  styleHeader(ch)
  confirmados
    .slice()
    .sort((a, b) => a.nome.localeCompare(b.nome))
    .forEach((p) => {
      const sp = statusPag(state, p)
      const rest = Math.max(0, valor - pago(p) - ofertado(p))
      const r = checkin.addRow([
        p.nome,
        p.tipo,
        p.lider,
        p.forma + (p.parcelas ? ' (' + p.parcelas + 'x)' : ''),
        pagLabel[sp],
        pago(p),
        ofertado(p),
        rest,
      ])
      ;[6, 7, 8].forEach((c) => (r.getCell(c).numFmt = MONEY))
    })

  // ---------------------------------------------------------------- Cantina ---
  const cant = wb.addWorksheet('Cantina')
  cant.columns = [{ width: 30 }, { width: 14 }, { width: 18 }]
  const cih = cant.addRow(['Item', 'Quantidade', 'Valor total'])
  styleHeader(cih, SAGE)
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
    .forEach((n) => {
      const r = cant.addRow([n, porItem[n].qtd, porItem[n].total])
      r.getCell(3).numFmt = MONEY
    })
  cant.addRow([])
  const rowVendido = cant.addRow(['Total vendido', '', cantina.vendido])
  rowVendido.getCell(3).numFmt = MONEY
  styleTotalRow(rowVendido)
  const rowReceb = cant.addRow(['Recebido (vendas pagas)', '', cantina.recebido])
  rowReceb.getCell(3).numFmt = MONEY
  const rowAberto = cant.addRow([
    'Em contas abertas (' + cantina.contasAbertas + ')',
    '',
    cantina.emAberto,
  ])
  rowAberto.getCell(3).numFmt = MONEY

  // ------------------------------------------------------------- download ---
  const buffer = await wb.xlsx.writeBuffer()
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'prestacao-contas-' + state.retiro.slug + '.xlsx'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
