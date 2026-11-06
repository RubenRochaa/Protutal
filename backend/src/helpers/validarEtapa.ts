import { AppError } from "../errors/AppError";

// converte o filtro ?etapa= da query string.
// sem filtro devolve undefined (o Prisma ignora o campo); se vier, precisa ser 1, 2 ou 3.
function parseEtapaOpcional(etapa: string | undefined): number | undefined {
    if (etapa === undefined) {
        return undefined;
    }

    const etapaFiltro = Number(etapa);

    if (![1, 2, 3].includes(etapaFiltro)) {
        throw new AppError("A etapa deve ser 1, 2 ou 3", 400);
    }

    return etapaFiltro;
}

export { parseEtapaOpcional };
