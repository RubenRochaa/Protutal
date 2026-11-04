// Perfil de login: o tutor entra como aluno (não existe login de tutor)
export type Perfil = "professor" | "aluno";

// Área mostrada para o aluno que é tutor: a troca é feita pelo ícone ao lado do selo
export type Area = "aluno" | "tutor";

// ---------- Área do aluno: respostas da API (mesmos tipos de design/src/lib/types.ts) ----------

export type StatusTutoria = "ativa" | "finalizada";

// Tutoria em que o aluno logado é o tutorado (rota A3 - GET /alunos/me/tutorias)
export interface TutoriaAluno {
    id_tutoria: number;
    status: StatusTutoria;
    meta_aprendizagem: string;
    // Datas em ISO (UTC); data_fim vem null enquanto a tutoria está ativa
    data_inicio: string;
    data_fim: string | null;
    tutor: { nome: string };
    sala: { id_sala: number; nome: string; serie: number };
}

// Sala em que o aluno está matriculado (GET /alunos/me/salas).
// "motivo" explica por que o aluno não pode pedir tutoria (null quando pode)
export interface SalaAluno {
    id_sala: number;
    nome: string;
    serie: number;
    ano_letivo: number;
    professor: { nome: string };
    pode_pedir_tutoria: boolean;
    motivo: { codigo: string; mensagem: string } | null;
    // Pedido recusado há menos de 2h: quando o aluno pode pedir de novo (ISO). Senão null
    liberado_em: string | null;
}

// Material de apoio da sala (rota A5 - GET /salas/:id/materiais)
export interface MaterialSala {
    id_material: number;
    titulo: string;
    descricao: string | null;
    // URL do arquivo (Cloudinary)
    arquivo: string;
    data_envio: string;
    tutor: { id_tutor_sala: number; nome: string };
}

// Aviso do professor para a sala (rota A4 - GET /salas/:id/avisos)
export interface AvisoSala {
    id_aviso: number;
    titulo: string;
    conteudo: string;
    data_publicacao: string;
    professor: { nome: string };
}

// Mensagem do chat da tutoria (rota O2 - GET /tutorias/:id/mensagens).
// Com "assunto" preenchido, é um comunicado (só o tutor envia)
export interface MensagemTutoria {
    id_mensagem: number;
    texto: string;
    assunto: string | null;
    data_envio: string;
    remetente: { tipo: "tutor" | "tutorado"; nome: string };
}

// Conteúdo com média, como as rotas A6 (por_conteudo) e A7 devolvem
export interface MediaConteudo {
    id_conteudo: number;
    nome: string;
    media: number;
    quantidade: number;
}

// Conteúdos classificados por faixa (rota A7 - GET /alunos/me/conteudos-dominados).
// A faixa vem da tabela Faixa_desempenho do back: a tela nunca calcula
export interface ConteudosDominados {
    dominado?: MediaConteudo[];
    com_dificuldade?: MediaConteudo[];
}

export type StatusContestacao = "pendente" | "aceita" | "recusada";

// Contestação de nota do aluno logado (rota A9 - GET /alunos/me/contestacoes)
export interface ContestacaoAluno {
    id_contestacao: number;
    comentario: string;
    status: StatusContestacao;
    data_envio: string;
    decisao: string | null;
    data_resolucao: string | null;
    nota: { id_nota: number; valor: number };
    atividade: { titulo: string; etapa: number; conteudo: { nome: string } };
    tutor: { nome: string };
}

// pendente = sem resposta; entregue = até o prazo; entregue_com_atraso = depois do prazo
export type StatusAtividadeAluno = "pendente" | "entregue" | "entregue_com_atraso";

// Atividade destinada ao aluno logado (rota A1 - GET /alunos/me/atividades)
export interface AtividadeAluno {
    id_atividade: number;
    titulo: string;
    etapa: number;
    // Data e hora em ISO (UTC). Mostrar no fuso America/Sao_Paulo
    data_entrega: string;
    conteudo: { nome: string } | null;
    status: StatusAtividadeAluno;
    // false quando a tutoria foi finalizada ou o aluno já respondeu
    pode_responder: boolean;
}

// Detalhe da atividade na visão do aluno (rota A2 - GET /atividades/:id, perfil "aluno").
// Sem resposta, "resposta" vem null; sem nota, "nota" vem null
export interface AtividadeDetalheAluno {
    perfil: "aluno";
    id_atividade: number;
    titulo: string;
    descricao: string;
    // Valor técnico (ex.: interpretacao_mapas). O rótulo vem da T8 (GET /tipos-atividade)
    tipo: string;
    etapa: number;
    data_entrega: string;
    conteudo: { id_conteudo: number; nome: string } | null;
    sala: { id_sala: number; nome: string };
    tutor: { nome: string };
    status: StatusAtividadeAluno;
    pode_responder: boolean;
    resposta: {
        id_resposta: number;
        texto: string | null;
        // URL do arquivo enviado (Cloudinary)
        conteudo_file: string;
        data_envio: string;
    } | null;
    nota: {
        id_nota: number;
        valor: number;
        comentario: string | null;
        data_lancamento: string;
    } | null;
}

// Detalhe da atividade na visão do tutor que a criou (rota A2 - GET /atividades/:id, perfil "tutor")
export interface AtividadeDetalheTutor {
    perfil: "tutor";
    id_atividade: number;
    titulo: string;
    descricao: string | null;
    tipo: string;
    etapa: number;
    data_entrega: string;
    conteudo: { id_conteudo: number; nome: string } | null;
    sala: { id_sala: number; nome: string; serie: number; ano_letivo: number };
    destinatarios: { id_aluno: number; nome: string }[];
}

// A A2 responde conforme quem pede: o aluno destinatário ou o tutor que criou a atividade
export type AtividadeDetalhe = AtividadeDetalheAluno | AtividadeDetalheTutor;

// Tipo de atividade com o rótulo em português (rota T8 - GET /tipos-atividade)
export interface TipoAtividadeOpcao {
    valor: string;
    rotulo: string;
}

// Nota do aluno, como a A6 devolve (campo notas[])
export interface NotaAluno {
    id_nota: number;
    valor: number;
    comentario: string | null;
    data_lancamento: string;
    atividade: { id_atividade: number; titulo: string; tipo: string; etapa: number };
    conteudo: { nome: string };
    contestacao_status: StatusContestacao | null;
}

// Média de uma etapa (A6 por_etapa). media null = etapa sem nota (nunca tratar como 0)
export interface MediaEtapa {
    etapa: number;
    media: number | null;
    quantidade: number;
}

// Dashboard de notas do aluno logado (rota A6 - GET /alunos/me/desempenho)
export interface DesempenhoAluno {
    media_geral: { media: number | null; total_notas: number };
    por_etapa: MediaEtapa[];
    por_conteudo: MediaConteudo[];
    notas: NotaAluno[];
}

// ---------- Área do tutor: respostas da API (mesmos tipos de design/src/lib/types.ts) ----------

// Tutoria em que o aluno logado é o tutor (rota T1 - GET /tutores/me/tutorias).
// A T1 não devolve o id_aluno do tutorado
export interface TutoriaTutor {
    id_tutoria: number;
    status: StatusTutoria;
    meta_aprendizagem: string | null;
    data_inicio: string;
    data_fim: string | null;
    aluno: { nome: string };
    sala: { id_sala: number; nome: string; serie: number };
}

// Atividade criada pelo tutor, com as contagens (rota T2 - GET /tutores/me/atividades)
export interface AtividadeTutor {
    id_atividade: number;
    titulo: string;
    tipo: string;
    etapa: number;
    data_entrega: string;
    conteudo: { id_conteudo: number; nome: string } | null;
    sala: { id_sala: number; nome: string };
    total_destinatarios: number;
    total_entregues: number;
    total_com_nota: number;
}

// Conteúdo cadastrado pelo professor na sala (rota P2 - GET /salas/:id/conteudos)
export interface ConteudoSala {
    id_conteudo: number;
    nome: string;
}

// Situação da entrega, calculada pela API comparando o envio com o prazo
export type StatusEntrega = "pendente" | "entregue" | "entregue_com_atraso";

// Entregas e notas de uma atividade (rota P12 - GET /atividades/:id/respostas)
export interface RespostaAlunoAtividade {
    aluno: { id_aluno: number; nome: string };
    resposta: {
        id_resposta: number;
        texto: string | null;
        conteudo_file: string | null;
        data_envio: string;
    } | null;
    nota: { id_nota: number; valor: number; comentario: string | null } | null;
    status: StatusEntrega;
}

export interface RespostasAtividade {
    id_atividade: number;
    titulo: string;
    tipo: string;
    data_entrega: string;
    alunos: RespostaAlunoAtividade[];
}

// Contestação de nota nas atividades do tutor (rota P16 - GET /contestacoes)
export interface ContestacaoTutor {
    id_contestacao: number;
    comentario: string;
    status: StatusContestacao;
    data_envio: string;
    decisao: string | null;
    data_resolucao: string | null;
    nota: { id_nota: number; valor: number };
    aluno: { id_aluno: number; nome: string };
    atividade: { id_atividade: number; titulo: string; etapa: number; conteudo: { nome: string } | null };
    sala: { id_sala: number; nome: string };
    tutor: { id_tutor_sala: number; nome: string };
}

// Feedback (com rubrica) que o tutorado deu ao tutor
export interface FeedbackRecebido {
    id_feedback: number;
    etapa: number;
    nota: number;
    comentario: string | null;
    // URL da rubrica (Cloudinary)
    rubrica_file: string | null;
    data: string;
}

// Lista de feedbacks recebidos (rota T7 - GET /feedbacks)
export interface FeedbacksTutor {
    resumo: { total_feedbacks: number; media_notas: number | null };
    feedbacks: (FeedbackRecebido & {
        id_tutoria: number;
        aluno: { id_aluno: number; nome: string };
        tutor: { id_tutor_sala: number; nome: string };
        sala: { id_sala: number; nome: string; serie: number; ano_letivo: number };
    })[];
}

// Desempenho do tutor por vínculo/sala (rota T6 - GET /tutores/me/desempenho).
// Médias null = sem nota (nunca tratar como 0)
export interface DesempenhoVinculo {
    id_tutor_sala: number;
    sala: { id_sala: number; nome: string; serie: number; ano_letivo: number };
    revogado: boolean;
    data_revogacao: string | null;
    feedback: {
        media_geral: number | null;
        quantidade: number;
        por_etapa: MediaEtapa[];
        feedbacks: (FeedbackRecebido & { aluno: { nome: string } })[];
    };
    avaliacoes_professor: {
        media_geral: number | null;
        quantidade: number;
        avaliacoes: {
            id_avaliacao: number;
            nota: number;
            comentario: string;
            data: string;
            professor: { nome: string };
        }[];
    };
}

// ---------- Área do professor: respostas da API (mesmos tipos de design/src/lib/types.ts) ----------
// Reaproveitados das outras áreas: AvisoSala (P3), MaterialSala (A5), ConteudoSala (P2),
// RespostasAtividade (P12), ContestacaoTutor (P16) e FeedbacksTutor (T7), que são as mesmas rotas

// Sala do professor (rotas P19 - POST /salas e P20 - GET /salas)
export interface Sala {
    id_sala: number;
    nome: string;
    serie: number;
    ano_letivo: number;
    id_professor: number;
}

// Detalhe da sala (rota P1 - GET /salas/:id). Alunos, tutores e conteúdos têm rota própria
export interface SalaDetalhe {
    id_sala: number;
    nome: string;
    serie: number;
    ano_letivo: number;
    professor: { id_professor: number; nome: string };
}

// Aluno como as rotas P21 (GET /alunos) e P23 (GET /salas/:id/alunos) devolvem
export interface AlunoSala {
    id_aluno: number;
    nome: string;
    email: string;
    // false = o aluno ainda não clicou no link de confirmação do e-mail
    email_confirmado: boolean;
}

// Pedido pendente para ser tutor (rota P26 - GET /pedidos-tutoria), de todas as salas do professor
export interface PedidoTutoria {
    id_pedido: number;
    data_solicitacao: string;
    sala_pedido: { id_sala: number; nome: string };
    aluno: { id_aluno: number; nome: string };
    salas_matriculado: { id_sala: number; nome: string }[];
}

// Tutor ativo da sala (rota P24 - GET /salas/:id/tutores)
export interface TutorSala {
    id_tutor_sala: number;
    id_tutor: number;
    pode_criar_ativ: boolean;
    data_definicao: string;
    aluno: { id_aluno: number; nome: string; email: string };
}

// Avaliações do professor sobre um tutor (rota P10 - GET /tutores-sala/:id/avaliacoes).
// Sem avaliações: media_notas null e lista vazia
export interface AvaliacoesTutor {
    tutor: { id_tutor_sala: number; nome: string; revogado: boolean };
    resumo: { total_avaliacoes: number; media_notas: number | null };
    avaliacoes: {
        id_avaliacao: number;
        nota: number;
        comentario: string;
        data: string;
        professor: { nome: string };
    }[];
}

// Tutoria da sala (rota P4 - GET /salas/:id/tutorias). Inclui as de tutores revogados
export interface TutoriaSala {
    id_tutoria: number;
    status: StatusTutoria;
    meta_aprendizagem: string | null;
    data_inicio: string;
    data_fim: string | null;
    tutor: { nome: string };
    aluno: { nome: string };
}

// Atividade lançada pelos tutores na sala (rota P11 - GET /salas/:id/atividades)
export interface AtividadeSala {
    id_atividade: number;
    titulo: string;
    tipo: string;
    etapa: number;
    data_entrega: string;
    conteudo: { id_conteudo: number; nome: string } | null;
    tutor: { id_tutor_sala: number; nome: string };
    total_destinatarios: number;
    total_entregues: number;
    total_com_nota: number;
}

// Uma linha por nota lançada na sala (rota P14 - GET /salas/:id/notas)
export interface NotaSala {
    id_nota: number;
    valor: number;
    comentario: string | null;
    data_lancamento: string;
    aluno: { id_aluno: number; nome: string };
    atividade: { id_atividade: number; titulo: string; tipo: string; etapa: number; data_entrega: string };
    conteudo: { id_conteudo: number; nome: string } | null;
    tutor: { id_tutor_sala: number; nome: string };
    contestacao_pendente: boolean;
}

// Indicadores de cada tutor da sala (rota P13 - GET /salas/:id/desempenho-tutores).
// Média null = sem nota (nunca 0)
export interface DesempenhoTutorSala {
    id_tutor_sala: number;
    nome: string;
    revogado: boolean;
    data_revogacao: string | null;
    feedback: {
        media_geral: number | null;
        quantidade: number;
        por_etapa: MediaEtapa[];
    };
    avaliacoes_professor: { media_geral: number | null; quantidade: number };
}
