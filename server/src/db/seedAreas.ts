// Carga inicial do catálogo de áreas de coordenação. Roda no start do servidor
// e só age quando a tabela está vazia — depois disso o catálogo pertence a quem
// usa a tela de Coordenadores, e o seed não sobrescreve nada.
import { coordenacaoAreaRepository } from '../repositories/coordenacaoAreaRepository.js'
import { AREAS_PADRAO } from './areasPadrao.js'

export async function seedAreasCoordenacao(): Promise<void> {
  if ((await coordenacaoAreaRepository.contar()) > 0) return
  await coordenacaoAreaRepository.inserirLote(
    AREAS_PADRAO.map((a, i) => ({ nome: a.nome, obrigacoes: a.obrigacoes, ordem: i + 1 })),
  )
  console.log(`[seed] ${AREAS_PADRAO.length} áreas de coordenação criadas.`)
}
