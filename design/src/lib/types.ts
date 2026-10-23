// Perfis que fazem login na API. Tutor não é perfil: ele entra como aluno.
export type Perfil = "professor" | "aluno"

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
