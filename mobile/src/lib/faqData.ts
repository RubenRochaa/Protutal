// Espelho de design/src/app/ajuda/faqData.ts (página de Ajuda do site).
// Os dois arquivos devem ser atualizados juntos: mesmos textos e mesma regra de seções por perfil.

import { Perfil } from './types'

// Perguntas e respostas da página de Ajuda.
// Para editar o texto, mexa só neste arquivo: a página monta tudo a partir daqui.

export type IdSecaoFaq = "geral" | "professor" | "aluno" | "tutor"

export interface PerguntaFaq {
    pergunta: string;
    resposta: string;
}

export interface SecaoFaq {
    id: IdSecaoFaq;
    titulo: string;
    perguntas: PerguntaFaq[];
}

export const SECOES_FAQ: SecaoFaq[] = [
    {
        id: "geral",
        titulo: "Geral",
        perguntas: [
            {
                pergunta: "Não recebi o e-mail de confirmação. O que faço?",
                resposta: "Verifique a caixa de spam. Se não encontrar, use a opção de reenviar o link na tela de confirmação. O link vale por 1 hora e é possível pedir um novo a cada 2 minutos.",
            },
            {
                pergunta: "Esqueci minha senha. Como recupero?",
                resposta: "Na tela de login, clique em \"Esqueci minha senha\" e siga as instruções enviadas para o seu e-mail.",
            },
            {
                pergunta: "Como entro em contato com o suporte?",
                resposta: "Pelo e-mail protutal.sistema@gmail.com ou pelo WhatsApp (11) 94581-1799.",
            },
        ],
    },
    {
        id: "professor",
        titulo: "Professor",
        perguntas: [
            {
                pergunta: "Como coloco alunos na minha sala?",
                resposta: "Pela tela da sala, o professor associa os alunos à sala. O aluno não escolhe a sala no cadastro.",
            },
            {
                pergunta: "Como um aluno se torna tutor?",
                resposta: "O aluno matriculado na sala envia um pedido de tutoria. O pedido aparece nas Notificações (ícone do sino) e na aba \"Pedidos\" da sala, onde o professor aceita ou recusa.",
            },
            {
                pergunta: "Como permito que os tutores criem atividades?",
                resposta: "No topo da tela da sala, ative a permissão. Ela vale para todos os tutores da sala.",
            },
            {
                pergunta: "Posso encerrar uma tutoria?",
                resposta: "Sim, desde que não haja pendências. Ela pode ser reaberta durante o mesmo ano letivo.",
            },
        ],
    },
    {
        id: "aluno",
        titulo: "Aluno",
        perguntas: [
            {
                pergunta: "Como me torno tutor?",
                resposta: "Envie um pedido de tutoria ao professor da sua sala. Cada aluno pode ser tutor em apenas uma sala por ano letivo.",
            },
            {
                pergunta: "Como respondo uma atividade?",
                resposta: "Abra a atividade e envie sua resposta. São aceitos arquivos PDF, Word e Excel.",
            },
            {
                pergunta: "Posso contestar uma nota?",
                resposta: "Sim. Cada nota pode ser contestada uma única vez, com justificativa obrigatória, enquanto a tutoria estiver ativa.",
            },
            {
                pergunta: "Como acompanho meu desempenho?",
                resposta: "No painel de desempenho você vê suas médias geral, por etapa e por conteúdo. Notas de 7 a 10 indicam conteúdo dominado; de 0 a 6, conteúdo com dificuldade.",
            },
            {
                pergunta: "Por que preciso avaliar meu tutor?",
                resposta: "O feedback, feito pela rubrica, ajuda o professor a acompanhar e avaliar o trabalho do tutor.",
            },
        ],
    },
    {
        id: "tutor",
        titulo: "Tutor",
        perguntas: [
            {
                pergunta: "Como envio atividades aos meus tutorados?",
                resposta: "Se o professor tiver liberado a permissão, crie a atividade, escolha o tipo na lista do sistema e direcione aos seus tutorados.",
            },
            {
                pergunta: "Quais materiais de apoio posso anexar?",
                resposta: "Arquivos PDF, DOC, DOCX, XLS, XLSX e CSV de até 10 MB. É preciso ter tutoria ativa na sala.",
            },
            {
                pergunta: "Onde vejo os feedbacks dos meus tutorados?",
                resposta: "No item \"Feedbacks\" do menu do tutor. Lá é possível filtrar por etapa (\"Todas as etapas\", \"1ª etapa\", \"2ª etapa\", \"3ª etapa\"), por \"Ano letivo\" e por \"Tutorado\".",
            },
        ],
    },
]

// Seções que cada perfil vê. Tutor entra como aluno, e todo aluno pode virar tutor:
// por isso o aluno vê também a seção "Tutor"
export const SECOES_POR_PERFIL: Record<Perfil, IdSecaoFaq[]> = {
    professor: ["geral", "professor"],
    aluno: ["geral", "aluno", "tutor"],
}
