// ============================================================================
// Áreas de coordenação e suas obrigações — carga inicial do catálogo global.
//
// Estes dados são semeados UMA VEZ, quando a tabela está vazia (ver
// seedAreasCoordenacao no start do servidor). Depois disso o catálogo é
// gerenciado pela tela de Coordenadores: editar aqui NÃO altera o que já está
// no banco.
//
// O texto descreve só a obrigação: quem responde por ela é o coordenador
// cadastrado na tela, não um nome dentro do texto. Áreas sem texto ficam em
// branco de propósito — o documento de origem não as descrevia.
// ============================================================================

export interface AreaPadrao {
  nome: string
  obrigacoes: string
}

export const AREAS_PADRAO: AreaPadrao[] = [
  {
    nome: 'Secretaria/Financeiro',
    obrigacoes: `1. Criar link de inscrições com imagens, junto com o responsável pela mídia social
2. Coordenar e acompanhar as inscrições realizadas pelo link
3. Realizar toda a parte financeira (planilhas de entradas e saídas)
4. Realização de crachás para todos os participantes de 1ª vez
5. Identificação e organização dos quartos, numerando-os e colocando os respectivos líderes. Dividir os quartos por família de 6 pessoas, sendo 1 líder mais 5 — estes irão dormir no mesmo quarto, almoçar juntos e chegar ao auditório juntos; o líder é o responsável. Identificar a família no crachá.
6. Montar uma farmacinha com remédios`,
  },
  { nome: 'Quartos - Homens', obrigacoes: '' },
  { nome: 'Quartos - Mulheres', obrigacoes: '' },
  {
    nome: 'Cozinha',
    obrigacoes: `1. Compra dos alimentos com base na lista baseada no cardápio, além de água e gás
2. Verificar se a chácara possui todos os utensílios
3. Acompanhar as cozinheiras e ajudar com o relacionamento cozinha/encontristas
4. Organizar a compra de pães diariamente`,
  },
  { nome: 'Cantina', obrigacoes: '' },
  { nome: 'Escalas de serviço', obrigacoes: '' },
  {
    nome: 'Recepção',
    obrigacoes: `Boas impressões.

1. Definir equipe de limpeza e de atendimento aos convidados — fazer escala e supervisionar
2. Organizar o refeitório em cada refeição — fazer escala e supervisionar
3. Definir equipe para realizar a organização dos quartos — fazer escala e supervisionar
4. Definir equipe para a organização e limpeza do auditório — fazer escala e supervisionar
5. Orientar todos os SERVOS para ficarem atentos e responsáveis por retirar o prato da mesa dos convidados
6. Organizar o púlpito, água para os preletores, cadeiras do auditório e placa de tempo — ajudar a anunciar o início de cada reunião, chamando os retirantes para virem ao auditório na hora prevista no programa, e avisar o tempo restante em cada ministração`,
  },
  {
    nome: 'Correios',
    obrigacoes: `Correios e papéis.

1. Providenciar caixas para correios
2. Pegar a carta-padrão que será distribuída aos retirantes
3. Pegar as cartas no sábado ou domingo de manhã na igreja
4. Criar e conseguir lembranças
5. Coordenar a confecção/revelação das fotos que serão entregues aos retirantes. Ver alguém que está vindo para a cidade e vai voltar.
6. Checar a cópia de todos os papéis a serem entregues aos retirantes`,
  },
  {
    nome: 'Louvor',
    obrigacoes: `1. Criar a lista de músicas que serão tocadas nas ministrações e organizá-la em ordem por ministração, para facilitar com os irmãos da mídia
2. Levar equipamento de som, montar e testar antes do evento
3. Conduzir ou delegar (junto com o pastor) os períodos de louvor e quem vai ministrar
4. Escolher a melhor música para ensaio diário e apresentação no culto de domingo
5. Levar e trazer os equipamentos de som
6. Verificar pilhas
7. Confeccionar a escala da equipe que irá servir — se possível, alguém que se consagre para estes dias`,
  },
  {
    nome: 'Intercessão',
    obrigacoes: `1. Definir alvos de oração para antes, durante e depois do encontro
2. Se inspirar e inspirar a equipe a conectar-se com Deus em todo momento e interceder. Se possível, orar em pequenos grupos.
3. Definir em Deus e com a equipe as melhores dinâmicas de intercessão, conforme a necessidade do encontro
4. No início do encontro, na sexta à noite, junto com a coordenação, definir quem estará nesta equipe, com base nos líderes que forem ao retiro. Esta equipe é a que irá trabalhar com os convidados: precisa de maturidade.
5. Poderá coordenar um período maior de oração — pequena vigília com os intercessores, de sábado para domingo
6. Poderá, junto com o pastor, coordenar a intercessão antes do retiro, na semana de jejum, e outras ações como relógios de oração`,
  },
  { nome: 'Som e projeção', obrigacoes: '' },
  {
    nome: 'Comunicação social',
    obrigacoes: `1. Criar link de inscrições
2. Providenciar multimídia
3. Fazer algo criativo e bem legal lá e reportar no domingo
4. Convites para o culto especial de retorno
5. Criar o grupo oficial do Encontro e postar o link para que todos tenham acesso às fotos
6. Tirar fotos e vídeos e enviar no grupo oficial do Encontro; lembrar a todos de entrar no grupo
7. Criar e conseguir lembranças (fotos)
8. Coordenar a confecção/revelação das fotos que serão entregues aos retirantes, alinhando com a coordenação de Correios. Ver alguém que está vindo para a cidade e vai voltar.
9. Trazer e levar todos os equipamentos
10. Confeccionar a escala da equipe que irá servir — se possível, alguém que se consagre para estes dias`,
  },
  {
    nome: 'Decoração',
    obrigacoes: `1. Fazer recepção calorosa na igreja
2. Fazer a recepção no local do retiro
3. Confeccionar o material necessário para a decoração — tenha uma equipe, não faça sozinha`,
  },
  { nome: 'Direção/Organização', obrigacoes: '' },
  {
    nome: 'Limpeza',
    obrigacoes: `Equipe de zeladores.

1. Checar a estrutura do local
2. Extensões elétricas para os equipamentos (ar-condicionado, chuveiros...)
3. Organizar as cadeiras na capela em cada ministração
4. Montar a cruz para a ministração
5. Limpeza dos banheiros; auxiliar na limpeza do refeitório, auditório e cozinha
6. Manter os quartos organizados e verificar a segurança deles, evitando possíveis incidentes como roubo dos objetos das pessoas`,
  },
  {
    nome: 'Teatro',
    obrigacoes: `Teatro e dança.

1. Ensaiar as peças do retiro — não fazer isso no local (se consagre para estes dias)
2. Providenciar a sonoplastia necessária para cada peça e deixá-la pronta no notebook e na mídia
3. Roupas adequadas`,
  },
  {
    nome: 'Transporte',
    obrigacoes: `1. Transportar todos os objetos necessários para o encontro (alimentos, malas). Se houver necessidade de colchões e utensílios de cozinha, também providenciar transporte.
2. Providenciar o ônibus, contratando e certificando-se de que ele estará no local no horário combinado, tanto na ida quanto na volta. O ônibus deve estar na igreja no máximo às 19h para a saída para o Encontro, e às 15h45 para o retorno à igreja.
3. Acompanhar, junto com o responsável por acomodar as pessoas no ônibus, o transporte das pessoas até o local
4. Trazer todos os objetos levados ao retiro`,
  },
  { nome: 'Enfermaria', obrigacoes: '' },
]
