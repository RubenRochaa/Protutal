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

// Tutoria em que o aluno logado é o tutorado (rota A3 - GET /alunos/me/tutorias).
// Só os campos usados nas telas
export interface TutoriaAluno {
    id_tutoria: number;
    status: "ativa" | "finalizada";
    tutor: { nome: string };
    sala: { id_sala: number; nome: string };
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

// Dashboard de notas do aluno logado (rota A6 - GET /alunos/me/desempenho).
// Etapa sem nota vem com media: null
export interface DesempenhoAluno {
    por_etapa: { etapa: number; media: number | null }[];
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
