import type { AppConfig } from './types'

/** Configuração do app — equivalente aos "props" editáveis do protótipo.
 *  Centralizado aqui para facilitar virar variáveis de ambiente/tela de
 *  ajustes no futuro. */
export const appConfig: AppConfig = {
  nomeIgreja: 'IMEL Cuiabá',
  nomeIgrejaCompleto: 'Igreja Metodista Livre — Cuiabá',
  logoUrl: '/logo.jpg',
  modoCompacto: false,
}
