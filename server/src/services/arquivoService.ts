import { arquivoRepository, type ArquivoDados } from '../repositories/arquivoRepository.js'

const MAX_BYTES = 10 * 1024 * 1024 // 10 MB
const MIMES_OK = [/^image\//, /^application\/pdf$/]

function idFor(nome: string): string {
  const safe = nome.replace(/[^a-zA-Z0-9.-]+/g, '_').slice(0, 40)
  return 'f_' + Date.now().toString(36) + '_' + Math.round(performance.now()).toString(36) + '_' + safe
}

export const arquivoService = {
  async upload(params: {
    id?: string
    nome: string
    mime: string
    dados: Buffer
  }): Promise<{ id: string; nome: string; mime: string; tamanho: number }> {
    const { nome, mime, dados } = params
    if (!dados?.length) throw new Error('Arquivo vazio.')
    if (dados.length > MAX_BYTES) throw new Error('Arquivo excede o limite de 10 MB.')
    if (!MIMES_OK.some((re) => re.test(mime)))
      throw new Error('Tipo de arquivo não permitido (apenas imagem ou PDF).')

    const id = params.id?.trim() || idFor(nome)
    await arquivoRepository.save(
      { id, nome, mime, tamanho: dados.length, dados },
      new Date().toISOString(),
    )
    return { id, nome, mime, tamanho: dados.length }
  },

  get: (id: string): Promise<ArquivoDados | null> => arquivoRepository.get(id),
  remove: (id: string): Promise<void> => arquivoRepository.remove(id),
}
