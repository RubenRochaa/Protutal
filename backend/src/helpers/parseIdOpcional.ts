import { validarId } from "./validarId";

// converte um id opcional da query string; se vier, precisa ser um inteiro positivo.
// usado nos filtros de listagem da sala (P11 atividades, P14 notas)
function parseIdOpcional(valor: string | undefined, mensagem: string) {
    if (valor === undefined) {
        return undefined;
    }

    const id = Number(valor);

    validarId(id, mensagem);

    return id;
}

export { parseIdOpcional };
