import { StatusTutoria } from "../generated/prisma";

// o aluno ainda pode responder a atividade?
// mesmo critério do POST /atividades/:id/respostas: tutoria ativa e ainda sem resposta
// (o prazo não bloqueia: depois dele a entrega fica como entregue_com_atraso).
// usado na listagem (A1) e no detalhe (A2) da atividade, para a regra ficar num lugar só
function podeResponderAtividade(statusTutoria: StatusTutoria | undefined, temResposta: boolean): boolean {
    return statusTutoria === "ativa" && !temResposta;
}

export { podeResponderAtividade };
