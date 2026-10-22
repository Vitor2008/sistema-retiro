// Leitura da forma de pagamento gravada numa venda da cantina.

import type { Venda } from '../types'

export const totalVenda = (v: Venda) => v.itens.reduce((a, i) => a + i.valor * i.qtd, 0)

/** 'R$ 1.234,56' → 1234.56 */
function numBR(s: string): number {
  return Number(s.replace(/\./g, '').replace(',', '.')) || 0
}

/** Quebra a forma de pagamento de uma venda paga em parcelas. A venda avulsa
 *  guarda só a forma ("Pix"); a conta recebida guarda um resumo combinado
 *  ("Pix R$ 20,00 + Dinheiro R$ 30,00 (troco R$ 5,00)") — o troco sai do
 *  dinheiro. */
export function formasDaVenda(v: Venda): { forma: string; valor: number }[] {
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
