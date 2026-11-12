// Erro "esperado" da aplicação: lançado nos services/middlewares com o status HTTP certo
// e convertido em resposta { error: mensagem } pelo handler global em server.ts.
// Códigos usados no projeto:
//   400 - dados de entrada inválidos (payload)
//   401 - não autenticado (token ausente/inválido, login incorreto)
//   403 - autenticado, mas sem permissão
//   404 - recurso não encontrado
//   409 - conflito com dado existente ou regra de negócio (ex.: email já cadastrado,
//         pedido de tutoria bloqueado por 2h depois de uma recusa)
//   410 - recurso expirado (ex.: link de confirmação de e-mail vencido)
// Qualquer erro que NÃO seja AppError é tratado como 500 (erro interno).
// "dados" (opcional) são campos extras que vão junto no corpo, ex.: { liberado_em: "..." }
class AppError extends Error {
    statusCode: number;
    dados?: Record<string, unknown>;

    constructor(message: string, statusCode = 400, dados?: Record<string, unknown>) {
        super(message);
        this.name = "AppError";
        this.statusCode = statusCode;
        this.dados = dados;
    }
}

export { AppError }
