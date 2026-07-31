import type { AppConfig } from './types'

/** Prédios (igrejas/edifícios) disponíveis. O admin seleciona quais participam
 *  de cada evento. Lista fixa — para incluir um novo prédio, adicione aqui. */
export const PREDIOS_DISPONIVEIS = [
  'IMEL - Areão',
  'IMEL - Imperial',
  'IMEL - Leverger',
  'IMEL - CPA',
  'IMEL - DR. FABIO',
  'IMEL - ALTOS DA GLORIA',
  'IMEL - VG',
]

/** Configuração do app — equivalente aos "props" editáveis do protótipo.
 *  Centralizado aqui para facilitar virar variáveis de ambiente/tela de
 *  ajustes no futuro. */
export const appConfig: AppConfig = {
  nomeIgreja: 'IMEL',
  nomeIgrejaCompleto: 'Igreja Metodista Livre — Cuiabá',
  logoUrl: '/logo.jpg',
  modoCompacto: false,
  // Conteúdo fixo do formulário público (texto institucional + pagamento).
  formulario: {
    subtitulo: 'Um Final de Semana para Ser Transformado!',
    descricao:
      'Serão dias de renovo, libertação e transformação espiritual. Um tempo para parar, silenciar o mundo à volta e permitir que Deus fale ao teu coração de forma pessoal e profunda. E você é nosso convidado especial! Faça sua inscrição agora mesmo.',
    incluidos: [
      'Traslado',
      'Hospedagem',
      'Alimentação completa',
      'Programação espiritual completa',
    ],
    versiculo:
      'Clama a mim, e responder-te-ei, e anunciar-te-ei coisas grandes e ocultas que não sabes.',
    versiculoRef: 'Jeremias 33:3',
    pixChave: '09.172.041/0001-30',
    pixInfo: 'CNPJ · SICREDI',
    // Salve a imagem do QR Code em public/qrcode-pix.png. Vazio = não exibe o QR.
    qrCodeUrl: '/qrcode-pix.png',
    // Link de pagamento por cartão (débito/crédito), se houver. Vazio = não exibe.
    linkPagamento: '',
  },
}
