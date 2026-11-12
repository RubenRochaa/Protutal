import { describe, it, expect } from "@jest/globals";
import { sign } from "jsonwebtoken";
import { prismaMock } from "../mocks/prisma";
import { mockRequest, mockResponse, mockNext } from "../mocks/express";
import { esperaAppErrorAsync } from "../utils";
import { isAuthenticated } from "../../middlewares/isAuthenticated";
import { isProfessor } from "../../middlewares/isProfessor";
import { isAluno } from "../../middlewares/isAluno";
import { isTutor } from "../../middlewares/isTutor";
import { isTutorAtivoSala, isProfessorDonoSala, isTutorAtivo } from "../../middlewares/isTutorAtivoSala";
import { isTutorCriadorOuProfessorAtividade } from "../../middlewares/isTutorCriadorOuProfessorAtividade";
import { MENSAGEM_SEM_PERMISSAO_SALA } from "../../helpers/buscarSalaDoProfessor";

const usuario = { user_id: "10", user_email: "carlos@portalsesi.org.br" } as any;

describe("isAuthenticated", () => {
    it("token válido: preenche user_id e user_email e chama next()", () => {
        const token = sign({ email: "ana@portalsesisp.org.br" }, process.env.JWT_SECRET!, { subject: "5" });
        const req = mockRequest({ headers: { authorization: `Bearer ${token}` } });
        const res = mockResponse();
        const next = mockNext();

        isAuthenticated(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(req.user_id).toBe("5");
        expect(req.user_email).toBe("ana@portalsesisp.org.br");
    });

    it.each([
        [undefined, "Token não informado"],
        ["Bearer", "Token mal formatado"],
        ["Bearer token.invalido.aqui", "Token inválido"],
        [`Bearer ${sign({ email: "a" }, "outro-segredo", { subject: "1" })}`, "Token inválido"],
    ])("header %p responde 401 (%s) sem chamar next()", (authorization, erro) => {
        const req = mockRequest({ headers: authorization ? { authorization } : {} });
        const res = mockResponse();
        const next = mockNext();

        isAuthenticated(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ error: erro });
        expect(next).not.toHaveBeenCalled();
    });
});

describe("isProfessor", () => {
    it("professor encontrado: next()", async () => {
        prismaMock.professor.findFirst.mockResolvedValue({ id_professor: 10 } as any);
        const next = mockNext();

        await isProfessor(mockRequest(usuario), mockResponse(), next);

        expect(next).toHaveBeenCalled();
        expect(prismaMock.professor.findFirst).toHaveBeenCalledWith(expect.objectContaining({
            where: { id_professor: 10, email: "carlos@portalsesi.org.br" }
        }));
    });

    it("não é professor: 403", async () => {
        prismaMock.professor.findFirst.mockResolvedValue(null);
        const res = mockResponse();
        const next = mockNext();

        await isProfessor(mockRequest(usuario), res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(next).not.toHaveBeenCalled();
    });

    it("sem e-mail no token: 403 sem consultar o banco", async () => {
        const res = mockResponse();
        await isProfessor(mockRequest({ user_id: "10" } as any), res, mockNext());
        expect(res.status).toHaveBeenCalledWith(403);
        expect(prismaMock.professor.findFirst).not.toHaveBeenCalled();
    });
});

describe("isAluno", () => {
    it("aluno encontrado: next()", async () => {
        prismaMock.aluno.findFirst.mockResolvedValue({ id_aluno: 10 } as any);
        const next = mockNext();
        await isAluno(mockRequest(usuario), mockResponse(), next);
        expect(next).toHaveBeenCalled();
    });

    it("não é aluno: 403", async () => {
        prismaMock.aluno.findFirst.mockResolvedValue(null);
        await esperaAppErrorAsync(isAluno(mockRequest(usuario), mockResponse(), mockNext()), "Acesso permitido somente para alunos", 403);
    });

    it("sem e-mail: 403", async () => {
        await esperaAppErrorAsync(isAluno(mockRequest({ user_id: "1" } as any), mockResponse(), mockNext()), "Acesso permitido somente para alunos", 403);
    });
});

describe("isTutor", () => {
    const msg = "Acesso permitido somente para tutores com vínculo ativo";

    it("com vínculo ativo: next()", async () => {
        prismaMock.tutor_sala.findFirst.mockResolvedValue({ id_tutor_sala: 1 } as any);
        const next = mockNext();
        await isTutor(mockRequest(usuario), mockResponse(), next);
        expect(next).toHaveBeenCalled();
        expect(prismaMock.tutor_sala.findFirst).toHaveBeenCalledWith(expect.objectContaining({
            where: expect.objectContaining({ data_revogacao: null })
        }));
    });

    it("sem vínculo ativo: 403", async () => {
        prismaMock.tutor_sala.findFirst.mockResolvedValue(null);
        await esperaAppErrorAsync(isTutor(mockRequest(usuario), mockResponse(), mockNext()), msg, 403);
    });

    it("sem e-mail: 403", async () => {
        await esperaAppErrorAsync(isTutor(mockRequest({} as any), mockResponse(), mockNext()), msg, 403);
    });
});

describe("isProfessorDonoSala / isTutorAtivo", () => {
    it("isProfessorDonoSala: true só quando o professor é o dono", async () => {
        prismaMock.professor.findFirst.mockResolvedValue({ id_professor: 10 } as any);
        await expect(isProfessorDonoSala(10, 10, "c@x")).resolves.toBe(true);
        await expect(isProfessorDonoSala(11, 10, "c@x")).resolves.toBe(false);

        prismaMock.professor.findFirst.mockResolvedValue(null);
        await expect(isProfessorDonoSala(10, 10, "c@x")).resolves.toBe(false);
    });

    it("isTutorAtivo: false sem id_sala e sem id_tutor_sala, sem consultar o banco", async () => {
        await expect(isTutorAtivo({ id_usuario: 1, email: "a@x" })).resolves.toBe(false);
        expect(prismaMock.tutor_sala.findFirst).not.toHaveBeenCalled();
    });

    it("isTutorAtivo: true quando há vínculo ativo", async () => {
        prismaMock.tutor_sala.findFirst.mockResolvedValue({ id_tutor_sala: 3 } as any);
        await expect(isTutorAtivo({ id_usuario: 1, email: "a@x", id_sala: 2 })).resolves.toBe(true);

        prismaMock.tutor_sala.findFirst.mockResolvedValue(null);
        await expect(isTutorAtivo({ id_usuario: 1, email: "a@x", id_tutor_sala: 3 })).resolves.toBe(false);
    });
});

describe("isTutorAtivoSala", () => {
    const req = () => mockRequest({ params: { id: "2" }, ...usuario });

    it("400 com id inválido", async () => {
        await esperaAppErrorAsync(isTutorAtivoSala(mockRequest({ params: { id: "abc" }, ...usuario }), mockResponse(), mockNext()), "O id da sala deve ser um número inteiro", 400);
    });

    it("404 quando a sala não existe", async () => {
        prismaMock.sala.findUnique.mockResolvedValue(null);
        await esperaAppErrorAsync(isTutorAtivoSala(req(), mockResponse(), mockNext()), "Sala não encontrada", 404);
    });

    it("403 sem e-mail no token", async () => {
        prismaMock.sala.findUnique.mockResolvedValue({ id_sala: 2, id_professor: 10 } as any);
        await esperaAppErrorAsync(isTutorAtivoSala(mockRequest({ params: { id: "2" } }), mockResponse(), mockNext()), MENSAGEM_SEM_PERMISSAO_SALA, 403);
    });

    it("professor dono: next()", async () => {
        prismaMock.sala.findUnique.mockResolvedValue({ id_sala: 2, id_professor: 10 } as any);
        prismaMock.professor.findFirst.mockResolvedValue({ id_professor: 10 } as any);
        const next = mockNext();
        await isTutorAtivoSala(req(), mockResponse(), next);
        expect(next).toHaveBeenCalled();
    });

    it("tutor ativo da sala: next()", async () => {
        prismaMock.sala.findUnique.mockResolvedValue({ id_sala: 2, id_professor: 99 } as any);
        prismaMock.professor.findFirst.mockResolvedValue(null);
        prismaMock.tutor_sala.findFirst.mockResolvedValue({ id_tutor_sala: 1 } as any);
        const next = mockNext();
        await isTutorAtivoSala(req(), mockResponse(), next);
        expect(next).toHaveBeenCalled();
    });

    it("nem dono nem tutor: 403", async () => {
        prismaMock.sala.findUnique.mockResolvedValue({ id_sala: 2, id_professor: 99 } as any);
        prismaMock.professor.findFirst.mockResolvedValue(null);
        prismaMock.tutor_sala.findFirst.mockResolvedValue(null);
        await esperaAppErrorAsync(isTutorAtivoSala(req(), mockResponse(), mockNext()), MENSAGEM_SEM_PERMISSAO_SALA, 403);
    });
});

describe("isTutorCriadorOuProfessorAtividade", () => {
    const msg = "Você não tem permissão para acessar esta atividade";
    const atividade = { id_tutor_sala: 4, tutor_sala: { sala: { id_professor: 10 } } };
    const req = () => mockRequest({ params: { id: "8" }, ...usuario });

    it("400 com id inválido", async () => {
        await esperaAppErrorAsync(isTutorCriadorOuProfessorAtividade(mockRequest({ params: { id: "0" } }), mockResponse(), mockNext()), "O id da atividade deve ser um número inteiro", 400);
    });

    it("404 quando a atividade não existe", async () => {
        prismaMock.atividade.findUnique.mockResolvedValue(null);
        await esperaAppErrorAsync(isTutorCriadorOuProfessorAtividade(req(), mockResponse(), mockNext()), "Atividade não encontrada", 404);
    });

    it("403 sem e-mail", async () => {
        prismaMock.atividade.findUnique.mockResolvedValue(atividade as any);
        await esperaAppErrorAsync(isTutorCriadorOuProfessorAtividade(mockRequest({ params: { id: "8" } }), mockResponse(), mockNext()), msg, 403);
    });

    it("professor dono da sala: next()", async () => {
        prismaMock.atividade.findUnique.mockResolvedValue(atividade as any);
        prismaMock.professor.findFirst.mockResolvedValue({ id_professor: 10 } as any);
        const next = mockNext();
        await isTutorCriadorOuProfessorAtividade(req(), mockResponse(), next);
        expect(next).toHaveBeenCalled();
    });

    it("tutor criador com vínculo ativo: next() (confere pelo id_tutor_sala da atividade)", async () => {
        prismaMock.atividade.findUnique.mockResolvedValue(atividade as any);
        prismaMock.professor.findFirst.mockResolvedValue(null);
        prismaMock.tutor_sala.findFirst.mockResolvedValue({ id_tutor_sala: 4 } as any);
        const next = mockNext();
        await isTutorCriadorOuProfessorAtividade(req(), mockResponse(), next);
        expect(next).toHaveBeenCalled();
        expect(prismaMock.tutor_sala.findFirst).toHaveBeenCalledWith(expect.objectContaining({
            where: expect.objectContaining({ id_tutor_sala: 4, data_revogacao: null })
        }));
    });

    it("sem permissão: 403", async () => {
        prismaMock.atividade.findUnique.mockResolvedValue(atividade as any);
        prismaMock.professor.findFirst.mockResolvedValue(null);
        prismaMock.tutor_sala.findFirst.mockResolvedValue(null);
        await esperaAppErrorAsync(isTutorCriadorOuProfessorAtividade(req(), mockResponse(), mockNext()), msg, 403);
    });
});
