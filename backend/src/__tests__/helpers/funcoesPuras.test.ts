import { describe, it, expect } from "@jest/globals";
import { validarId, validarIdObrigatorio } from "../../helpers/validarId";
import { parseIdOpcional } from "../../helpers/parseIdOpcional";
import { parseEtapaOpcional } from "../../helpers/validarEtapa";
import { validarFaixaNota } from "../../helpers/validarNota";
import { calcularStatusEntrega, STATUS_ENTREGA } from "../../helpers/calcularStatusEntrega";
import { podeResponderAtividade } from "../../helpers/podeResponderAtividade";
import { ROTULOS_TIPO_ATIVIDADE } from "../../helpers/rotulosTipoAtividade";
import { camposAtividadeResumo, contagensAtividade, selectAtividadeResumo } from "../../helpers/atividadeResumo";
import { calcularDesempenhoTutor } from "../../helpers/calcularDesempenhoTutor";
import { esperaAppError } from "../utils";

describe("validarId", () => {
    it("aceita inteiro positivo", () => {
        expect(() => validarId(1, "msg")).not.toThrow();
        expect(() => validarId(999, "msg")).not.toThrow();
    });

    it.each([0, -1, 1.5, NaN, Infinity])("recusa %p com 400 e a mensagem de quem chamou", (valor) => {
        esperaAppError(() => validarId(valor, "O id da sala deve ser um número inteiro"), "O id da sala deve ser um número inteiro", 400);
    });
});

describe("validarIdObrigatorio", () => {
    it("aceita número e texto numérico", () => {
        expect(() => validarIdObrigatorio(5, "msg")).not.toThrow();
        expect(() => validarIdObrigatorio("5", "msg")).not.toThrow();
    });

    it.each([undefined, null, "abc", 0, -3, 2.5, "1.5"])("recusa %p", (valor) => {
        esperaAppError(() => validarIdObrigatorio(valor, "id obrigatório"), "id obrigatório", 400);
    });
});

describe("parseIdOpcional", () => {
    it("devolve undefined quando o filtro não vem", () => {
        expect(parseIdOpcional(undefined, "msg")).toBeUndefined();
    });

    it("converte texto numérico em número", () => {
        expect(parseIdOpcional("7", "msg")).toBe(7);
    });

    it.each(["abc", "0", "-1", "1.5"])("recusa %p com 400", (valor) => {
        esperaAppError(() => parseIdOpcional(valor, "id inválido"), "id inválido", 400);
    });
});

describe("parseEtapaOpcional", () => {
    it("devolve undefined sem filtro", () => {
        expect(parseEtapaOpcional(undefined)).toBeUndefined();
    });

    it.each([["1", 1], ["2", 2], ["3", 3]])("aceita etapa %p", (valor, esperado) => {
        expect(parseEtapaOpcional(valor)).toBe(esperado);
    });

    it.each(["0", "4", "abc", "1.5"])("recusa %p", (valor) => {
        esperaAppError(() => parseEtapaOpcional(valor), "A etapa deve ser 1, 2 ou 3", 400);
    });
});

describe("validarFaixaNota", () => {
    it.each([0, 10, 7.5, 8.25])("aceita %p", (valor) => {
        expect(() => validarFaixaNota(valor, "A nota")).not.toThrow();
    });

    it.each([-0.01, 10.01, 11, -1])("recusa %p fora da faixa", (valor) => {
        esperaAppError(() => validarFaixaNota(valor, "A nota"), "A nota deve estar entre 0 e 10", 400);
    });

    it("recusa mais de 2 casas decimais, usando o rótulo informado", () => {
        esperaAppError(() => validarFaixaNota(7.555, "O valor"), "O valor deve ter no máximo 2 casas decimais", 400);
    });
});

describe("calcularStatusEntrega", () => {
    const prazo = new Date("2026-11-10T23:59:00Z");

    it("pendente quando não há envio", () => {
        expect(calcularStatusEntrega(prazo, null)).toBe("pendente");
    });

    it("entregue quando enviado antes ou exatamente no prazo", () => {
        expect(calcularStatusEntrega(prazo, new Date("2026-11-09T10:00:00Z"))).toBe("entregue");
        expect(calcularStatusEntrega(prazo, new Date(prazo))).toBe("entregue");
    });

    it("entregue_com_atraso quando enviado depois do prazo", () => {
        expect(calcularStatusEntrega(prazo, new Date("2026-11-11T00:00:00Z"))).toBe("entregue_com_atraso");
    });

    it("STATUS_ENTREGA lista os três status", () => {
        expect(STATUS_ENTREGA).toEqual(["pendente", "entregue", "entregue_com_atraso"]);
    });
});

describe("podeResponderAtividade", () => {
    it("pode responder com tutoria ativa e sem resposta", () => {
        expect(podeResponderAtividade("ativa", false)).toBe(true);
    });

    it("não pode quando já respondeu", () => {
        expect(podeResponderAtividade("ativa", true)).toBe(false);
    });

    it("não pode com tutoria finalizada ou inexistente", () => {
        expect(podeResponderAtividade("finalizada", false)).toBe(false);
        expect(podeResponderAtividade(undefined, false)).toBe(false);
    });
});

describe("ROTULOS_TIPO_ATIVIDADE", () => {
    it("tem os 15 tipos do enum TipoAtividade, todos com rótulo", () => {
        expect(Object.keys(ROTULOS_TIPO_ATIVIDADE)).toHaveLength(15);
        Object.values(ROTULOS_TIPO_ATIVIDADE).forEach((rotulo) => expect(rotulo.trim()).not.toBe(""));
        expect(ROTULOS_TIPO_ATIVIDADE.interpretacao_mapas).toBe("Interpretação de mapas");
    });
});

describe("atividadeResumo", () => {
    const atividade = {
        id_atividade: 1,
        titulo: "Relevo",
        tipo: "projeto",
        etapa: 2,
        data_entrega: new Date("2026-11-10T00:00:00Z"),
        conteudo: { id_conteudo: 3, nome: "Relevo brasileiro" },
        _count: { destinatarios: 5, respostas: 3, notas: 1 }
    } as any;

    it("camposAtividadeResumo devolve os campos comuns sem o _count", () => {
        expect(camposAtividadeResumo(atividade)).toEqual({
            id_atividade: 1,
            titulo: "Relevo",
            tipo: "projeto",
            etapa: 2,
            data_entrega: atividade.data_entrega,
            conteudo: { id_conteudo: 3, nome: "Relevo brasileiro" }
        });
    });

    it("contagensAtividade achata o _count", () => {
        expect(contagensAtividade(atividade)).toEqual({
            total_destinatarios: 5,
            total_entregues: 3,
            total_com_nota: 1
        });
    });

    it("selectAtividadeResumo pede as contagens no _count", () => {
        expect(selectAtividadeResumo._count.select).toEqual({ destinatarios: true, respostas: true, notas: true });
    });
});

describe("calcularDesempenhoTutor", () => {
    it("sem feedback e sem avaliação: médias null e quantidades 0 nas 3 etapas", () => {
        expect(calcularDesempenhoTutor([], [])).toEqual({
            feedback: {
                media_geral: null,
                quantidade: 0,
                por_etapa: [
                    { etapa: 1, media: null, quantidade: 0 },
                    { etapa: 2, media: null, quantidade: 0 },
                    { etapa: 3, media: null, quantidade: 0 }
                ]
            },
            avaliacoes_professor: { media_geral: null, quantidade: 0 }
        });
    });

    it("separa o feedback por etapa e calcula as médias", () => {
        const resultado = calcularDesempenhoTutor(
            [{ etapa: 1, nota: 8 }, { etapa: 1, nota: 6 }, { etapa: 3, nota: 10 }],
            [9, 7]
        );

        expect(resultado.feedback.media_geral).toBe(8);
        expect(resultado.feedback.quantidade).toBe(3);
        expect(resultado.feedback.por_etapa).toEqual([
            { etapa: 1, media: 7, quantidade: 2 },
            { etapa: 2, media: null, quantidade: 0 },
            { etapa: 3, media: 10, quantidade: 1 }
        ]);
        expect(resultado.avaliacoes_professor).toEqual({ media_geral: 8, quantidade: 2 });
    });
});
