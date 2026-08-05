// ============================================================================
// Exportação de pedidos da loja para Excel (.xlsx).
//
// Abas:
//  - "Resumo por produto": total vendido por produto (quantidade e valor).
//  - "Camisetas (tipo/tamanho)": para vestimentas, total por tipo + tamanho
//    (lista de produção das camisas).
//  - "Pedidos": detalhamento de todos os pedidos.
// Pedidos cancelados não entram nos totais/agrupamentos (só na aba de detalhe).
// ============================================================================

import type ExcelJS from 'exceljs'
import type { LojaPedido } from '../types'

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

function dataHoraBR(iso: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  return isNaN(d.getTime()) ? iso : d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const STATUS_LABEL: Record<string, string> = {
  pendente: 'Pendente', pago: 'Pago', entregue: 'Entregue', cancelado: 'Cancelado',
}

export async function exportPedidosLoja(
  pedidos: LojaPedido[],
  eventoNome: string,
  slug: string,
): Promise<void> {
  const validos = pedidos.filter((p) => p.status !== 'cancelado')

  const { default: ExcelJSRuntime } = await import('exceljs')
  const wb = new ExcelJSRuntime.Workbook()
  wb.creator = 'Sistema de Eventos'
  wb.created = new Date()

  // ---------------------------------------------------- Resumo por produto ---
  const resumo = wb.addWorksheet('Resumo por produto')
  resumo.columns = [{ width: 36 }, { width: 16 }, { width: 18 }]
  resumo.mergeCells('A1:C1')
  resumo.getCell('A1').value = 'Loja — Resumo por produto'
  resumo.getCell('A1').font = { bold: true, size: 16, color: { argb: BRAND } }
  resumo.getRow(1).height = 26
  resumo.mergeCells('A2:C2')
  resumo.getCell('A2').value = eventoNome + ' · pedidos ativos (exclui cancelados)'
  resumo.getCell('A2').font = { size: 11, color: { argb: 'FF868E96' } }

  styleHeader(resumo.addRow(['Produto', 'Quantidade', 'Total (R$)']))

  const porProduto = new Map<string, { qtd: number; valor: number }>()
  for (const p of validos) {
    const a = porProduto.get(p.produtoNome) ?? { qtd: 0, valor: 0 }
    a.qtd += p.quantidade
    a.valor += p.valorTotal
    porProduto.set(p.produtoNome, a)
  }
  let totQtd = 0
  let totValor = 0
  Array.from(porProduto.keys())
    .sort((a, b) => a.localeCompare(b))
    .forEach((nome) => {
      const a = porProduto.get(nome)!
      totQtd += a.qtd
      totValor += a.valor
      const r = resumo.addRow([nome, a.qtd, a.valor])
      r.getCell(3).numFmt = MONEY
    })
  const rTot = resumo.addRow(['TOTAL', totQtd, totValor])
  rTot.getCell(3).numFmt = MONEY
  styleTotalRow(rTot)

  // ---------------------------------------- Camisetas por tipo e tamanho ---
  const camisetas = wb.addWorksheet('Camisetas (tipo-tamanho)')
  camisetas.columns = [{ width: 36 }, { width: 16 }, { width: 14 }, { width: 14 }, { width: 16 }]
  camisetas.mergeCells('A1:E1')
  camisetas.getCell('A1').value = 'Camisetas — total por tipo e tamanho'
  camisetas.getCell('A1').font = { bold: true, size: 16, color: { argb: BRAND } }
  camisetas.getRow(1).height = 26
  camisetas.mergeCells('A2:E2')
  camisetas.getCell('A2').value = 'Lista para confecção (somente produtos de vestimenta)'
  camisetas.getCell('A2').font = { size: 11, color: { argb: 'FF868E96' } }

  styleHeader(camisetas.addRow(['Produto', 'Tipo', 'Tamanho', 'Quantidade', 'Total (R$)']))

  const vest = validos.filter((p) => p.categoria === 'vestimenta')
  const porTam = new Map<string, { produto: string; tipo: string; tamanho: string; qtd: number; valor: number }>()
  for (const p of vest) {
    const chave = p.produtoNome + '||' + p.tipoCamiseta + '||' + p.tamanho
    const a = porTam.get(chave) ?? { produto: p.produtoNome, tipo: p.tipoCamiseta, tamanho: p.tamanho, qtd: 0, valor: 0 }
    a.qtd += p.quantidade
    a.valor += p.valorTotal
    porTam.set(chave, a)
  }
  if (porTam.size === 0) {
    camisetas.addRow(['Nenhum pedido de vestimenta.', '', '', '', ''])
  } else {
    let vTotQtd = 0
    let vTotValor = 0
    Array.from(porTam.values())
      .sort((a, b) => a.produto.localeCompare(b.produto) || a.tipo.localeCompare(b.tipo) || a.tamanho.localeCompare(b.tamanho))
      .forEach((a) => {
        vTotQtd += a.qtd
        vTotValor += a.valor
        const r = camisetas.addRow([a.produto, a.tipo, a.tamanho, a.qtd, a.valor])
        r.getCell(5).numFmt = MONEY
      })
    const rv = camisetas.addRow(['TOTAL', '', '', vTotQtd, vTotValor])
    rv.getCell(5).numFmt = MONEY
    styleTotalRow(rv)
  }

  // ------------------------------------------------------------- Pedidos ---
  const det = wb.addWorksheet('Pedidos')
  det.columns = [
    { width: 18 }, { width: 30 }, { width: 26 }, { width: 10 },
    { width: 12 }, { width: 12 }, { width: 8 }, { width: 14 }, { width: 12 }, { width: 12 },
  ]
  det.mergeCells('A1:J1')
  det.getCell('A1').value = 'Loja — Pedidos'
  det.getCell('A1').font = { bold: true, size: 16, color: { argb: BRAND } }
  det.getRow(1).height = 26

  styleHeader(det.addRow(['Data', 'Produto', 'Comprador', 'Gênero', 'Tipo', 'Tamanho', 'Qtd', 'Total (R$)', 'Forma', 'Status']))
  pedidos
    .slice()
    .sort((a, b) => (a.criadoEm < b.criadoEm ? 1 : -1))
    .forEach((p) => {
      const r = det.addRow([
        dataHoraBR(p.criadoEm),
        p.produtoNome,
        p.nome || '—',
        p.genero === 'M' ? 'Homem' : p.genero === 'F' ? 'Mulher' : '—',
        p.tipoCamiseta || '—',
        p.tamanho || '—',
        p.quantidade,
        p.valorTotal,
        p.forma,
        STATUS_LABEL[p.status] ?? p.status,
      ])
      r.getCell(8).numFmt = MONEY
      if (p.status === 'cancelado') r.eachCell((c) => (c.font = { color: { argb: 'FFADB5BD' }, strike: true }))
    })

  // ------------------------------------------------------------ download ---
  const buffer = await wb.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'pedidos-loja-' + (slug || 'evento') + '.xlsx'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
