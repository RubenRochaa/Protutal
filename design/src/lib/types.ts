// Perfis que fazem login na API. Tutor não é perfil: ele entra como aluno.
export type Perfil = "professor" | "aluno"

// Sala do professor, como as rotas P19 (POST /salas) e P20 (GET /salas) devolvem
export interface Sala {
    id_sala: number;
    nome: string;
    serie: number;
    ano_letivo: number;
    id_professor: number;
}

// Detalhe da sala, como a rota P1 (GET /salas/:id) devolve.
// Alunos, tutores e conteúdos não vêm aqui: cada um tem a sua rota (P23, P24 e P2)
export interface SalaDetalhe {
    id_sala: number;
    nome: string;
    serie: number;
    ano_letivo: number;
    professor: {
        id_professor: number;
        nome: string;
    };
}

// Tutoria em que o aluno logado é o tutorado (rota A3 - GET /alunos/me/tutorias).
// Só os campos usados nas telas
export interface TutoriaAluno {
    id_tutoria: number;
    status: "ativa" | "finalizada";
    meta_aprendizagem: string;
    // Datas em ISO (UTC); data_fim vem null enquanto a tutoria está ativa
    data_inicio: string;
    data_fim: string | null;
    tutor: { nome: string };
    sala: { id_sala: number; nome: string; serie: number };
}

// Sala em que o aluno logado está matriculado (GET /alunos/me/salas).
// "motivo" explica por que o aluno não pode pedir tutoria (null quando pode)
export interface SalaAluno {
    id_sala: number;
    nome: string;
    serie: number;
    ano_letivo: number;
    professor: { nome: string };
    pode_pedir_tutoria: boolean;
    motivo: { codigo: string; mensagem: string } | null;
}

// Material de apoio da sala (rota A5 - GET /salas/:id/materiais)
export interface MaterialSala {
    id_material: number;
    titulo: string;
    descricao: string | null;
    // URL do arquivo (Cloudinary)
    arquivo: string;
    data_envio: string;
    // id_tutor_sala: usado pelo professor para filtrar os materiais por tutor
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
// A chave é o nome da faixa cadastrada no banco; usamos as duas do seed
export interface ConteudosDominados {
    dominado?: MediaConteudo[];
    com_dificuldade?: MediaConteudo[];
}

export type StatusContestacao = "pendente" | "aceita" | "recusada"

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

// Status de entrega calculado pela A1: pendente = sem resposta;
// entregue = respondeu até o prazo; entregue_com_atraso = respondeu depois do prazo
export type StatusAtividadeAluno = "pendente" | "entregue" | "entregue_com_atraso"

// Atividade destinada ao aluno logado (rota A1 - GET /alunos/me/atividades).
// Só os campos usados nas telas
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

// Detalhe da atividade na visão do aluno destinatário (rota A2 - GET /atividades/:id, perfil "aluno").
// Sem resposta, "resposta" vem null; sem nota, "nota" vem null
export interface AtividadeDetalheAluno {
    perfil: "aluno";
    id_atividade: number;
    titulo: string;
    descricao: string;
    // Valor técnico (ex.: interpretacao_mapas). O rótulo vem da T8 (GET /tipos-atividade)
    tipo: string;
    etapa: number;
    // Data e hora em ISO (UTC). Mostrar no fuso America/Sao_Paulo
    data_entrega: string;
    conteudo: { id_conteudo: number; nome: string } | null;
    sala: { id_sala: number; nome: string };
    tutor: { nome: string };
    status: StatusAtividadeAluno;
    // false quando a tutoria foi finalizada ou o aluno já respondeu
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

// A A2 também responde ao tutor que criou a atividade, em outro formato
// (AtividadeDetalheTutor, declarado no fim do arquivo, na área do tutor)
export type AtividadeDetalhe = AtividadeDetalheAluno | AtividadeDetalheTutor

// Tipo de atividade com o rótulo em português (rota T8 - GET /tipos-atividade)
export interface TipoAtividadeOpcao {
    valor: string;
    rotulo: string;
}

// Dashboard de notas do aluno logado (rota A6 - GET /alunos/me/desempenho).
// Etapa sem nota vem com media: null (nunca tratar como 0)
export interface DesempenhoAluno {
    media_geral: { media: number | null; total_notas: number };
    por_etapa: { etapa: number; media: number | null; quantidade: number }[];
    por_conteudo: MediaConteudo[];
    notas: {
        id_nota: number;
        valor: number;
        comentario: string | null;
        data_lancamento: string;
        atividade: { id_atividade: number; titulo: string; tipo: string; etapa: number };
        conteudo: { nome: string };
        contestacao_status: StatusContestacao | null;
    }[];
}

// Retorno das Server Actions de formulário: ou uma mensagem de erro, ou de sucesso.
// O componente de formulário (no navegador) lê este objeto, mostra o toast
// e, se houver "redirecionar", leva o usuário para essa página.
export interface ActionState {
    error?: string;
    sucesso?: string;
    redirecionar?: string;
    // O React limpa o formulário depois da action; estes valores preenchem os campos de novo
    // (nunca devolva a senha aqui)
    valores?: Record<string, string>;
}

// Aluno como as rotas P21 (GET /alunos) e P23 (GET /salas/:id/alunos) devolvem.
// A API não devolve foto: a tela usa o avatar com as iniciais
export interface AlunoSala {
    id_aluno: number;
    nome: string;
    email: string;
    // false = o aluno ainda não clicou no link de confirmação do e-mail
    email_confirmado: boolean;
}

// ---------- Área do professor (lotes A2 a A6). Só os campos usados nas telas ----------

// Conteúdo da sala (rota P2 - GET /salas/:id/conteudos)
export interface ConteudoSala {
    id_conteudo: number;
    nome: string;
}

// Aviso publicado na sala (rotas P3 e A4 - /salas/:id/avisos)
export interface Aviso {
    id_aviso: number;
    titulo: string;
    conteudo: string;
    data_publicacao: string;
    professor: { id_professor: number; nome: string };
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

export type StatusTutoria = "ativa" | "finalizada"

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

// Destinatários da atividade com resposta e nota (rota P12 - GET /atividades/:id/respostas)
export interface RespostasAtividade {
    id_atividade: number;
    titulo: string;
    tipo: string;
    data_entrega: string;
    alunos: {
        aluno: { id_aluno: number; nome: string };
        resposta: {
            id_resposta: number;
            texto: string | null;
            // URL pública do arquivo (Cloudinary): o download não precisa do token
            conteudo_file: string;
            data_envio: string;
        } | null;
        nota: { id_nota: number; valor: number; comentario: string | null } | null;
        status: StatusAtividadeAluno;
    }[];
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

// StatusContestacao: declarado mais acima (usado também pelas telas do aluno)

// Contestação de nota (rota P16 - GET /contestacoes)
export interface Contestacao {
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

// Feedbacks dos alunos aos tutores (rota T7 - GET /feedbacks)
export interface FeedbacksResposta {
    resumo: { total_feedbacks: number; media_notas: number | null };
    feedbacks: {
        id_feedback: number;
        id_tutoria: number;
        etapa: number;
        nota: number;
        comentario: string | null;
        // URL pública da rubrica (Cloudinary): o download não precisa do token
        rubrica_file: string;
        data: string;
        aluno: { id_aluno: number; nome: string };
        tutor: { id_tutor_sala: number; nome: string };
        sala: { id_sala: number; nome: string; serie: number; ano_letivo: number };
    }[];
}

// Indicadores de cada tutor da sala (rota P13 - GET /salas/:id/desempenho-tutores).
// Média null = sem nota (nunca 0)
export interface DesempenhoTutor {
    id_tutor_sala: number;
    nome: string;
    revogado: boolean;
    data_revogacao: string | null;
    feedback: {
        media_geral: number | null;
        quantidade: number;
        por_etapa: { etapa: number; media: number | null; quantidade: number }[];
    };
    avaliacoes_professor: { media_geral: number | null; quantidade: number };
}

// ---------- Área do tutor ----------

// Tutoria que o aluno logado conduz como tutor (rota T1 - GET /tutores/me/tutorias).
// Só vínculos ativos. A API não devolve o id do aluno tutorado
export interface TutoriaTutor {
    id_tutoria: number;
    status: StatusTutoria;
    meta_aprendizagem: string | null;
    data_inicio: string;
    data_fim: string | null;
    aluno: { nome: string };
    sala: { id_sala: number; nome: string; serie: number };
}

// Atividade criada pelo tutor logado (rota T2 - GET /tutores/me/atividades).
// Formato da P11, com "sala" no lugar de "tutor"
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

// Detalhe da atividade na visão do tutor que a criou (rota A2 - GET /atividades/:id, perfil "tutor").
// As respostas e notas de cada aluno ficam na P12 (RespostasAtividade)
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
    tutor: { nome: string };
    destinatarios: { id_aluno: number; nome: string }[];
}

// Atividade criada (rota T9 - POST /atividades). Só o id é usado (para abrir o detalhe)
export interface AtividadeCriada {
    id_atividade: number;
}

// Desempenho do tutor logado, um item por vínculo (rota T6 - GET /tutores/me/desempenho).
// Inclui vínculos revogados (ativos primeiro). Média null = sem nota (nunca 0)
export interface DesempenhoTutorVinculo {
    id_tutor_sala: number;
    sala: { id_sala: number; nome: string; serie: number; ano_letivo: number };
    revogado: boolean;
    data_revogacao: string | null;
    feedback: {
        media_geral: number | null;
        quantidade: number;
        por_etapa: { etapa: number; media: number | null; quantidade: number }[];
        feedbacks: {
            id_feedback: number;
            etapa: number;
            nota: number;
            comentario: string | null;
            // URL pública da rubrica (Cloudinary)
            rubrica_file: string;
            data: string;
            aluno: { nome: string };
        }[];
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
