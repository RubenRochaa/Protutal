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
