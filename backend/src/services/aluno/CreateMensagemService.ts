import prismaClient from "../../prisma";
import { AppError } from "../../errors/AppError";

interface MensagemRequest {
    id_tutoria: number;
    id_aluno: number;
    texto?: unknown;
    assunto?: unknown;
}

class CreateMensagemService {
    async execute({ id_tutoria, id_aluno, texto, assunto }: MensagemRequest) {

        // 1) o id da tutoria vem da URL (/tutorias/:id/mensagens) e precisa ser um inteiro positivo
        if (!Number.isInteger(id_tutoria) || id_tutoria <= 0) {
            throw new AppError("O id da tutoria deve ser um número inteiro", 400);
        }

        // o tutor é descoberto pelo caminho Tutoria -> Tutor_sala -> Tutor -> Aluno
        const tutoria = await prismaClient.tutoria.findUnique({
            where: {
                id_tutoria: id_tutoria
            },
            select: {
                id_tutoria: true,
                id_aluno: true,
                status: true,
                tutor_sala: {
                    select: {
                        tutor: {
                            select: {
                                id_aluno: true
                            }
                        }
                    }
                }
            }
        });

        if (!tutoria) {
            throw new AppError("Tutoria não encontrada", 404);
        }

        // 2) só os dois participantes da tutoria: o aluno tutorado (Tutoria.id_aluno)
        // ou o aluno que é o tutor (Tutor.id_aluno). o isAluno da rota já garantiu
        // que o id do token é de um aluno
        let remetente: "tutor" | "tutorado";

        if (tutoria.id_aluno === id_aluno) {
            remetente = "tutorado";
        } else if (tutoria.tutor_sala.tutor.id_aluno === id_aluno) {
            remetente = "tutor";
        } else {
            throw new AppError("Você não participa desta tutoria", 403);
        }

        // 3) mesmo código de regra de negócio das rotas de finalizar e reabrir (409).
        // não é preciso conferir data_revogacao do Tutor_sala: a revogação finaliza
        // as tutorias ativas, então tutoria ativa sempre tem tutor válido
        if (tutoria.status !== "ativa") {
            throw new AppError("Esta tutoria está finalizada e não aceita novas mensagens", 409);
        }

        // 4) texto é obrigatório no schema: não aceita vazio nem só espaços.
        // a coluna é TEXT, então não há tamanho máximo
        if (typeof texto !== "string" || texto.trim() === "") {
            throw new AppError("O campo texto é obrigatório e não pode ser vazio", 400);
        }

        // 5) assunto é opcional (sem assunto é mensagem comum; com assunto é comunicado),
        // mas se vier precisa ser texto não vazio e caber no VARCHAR(150) da tabela mensagem
        let assuntoMensagem: string | null = null;

        if (assunto !== undefined && assunto !== null) {
            if (typeof assunto !== "string" || assunto.trim() === "") {
                throw new AppError("O campo assunto não pode ser vazio", 400);
            }

            if (assunto.trim().length > 150) {
                throw new AppError("O assunto deve ter no máximo 150 caracteres", 400);
            }

            assuntoMensagem = assunto.trim();
        }

        // 6) comunicado (mensagem com assunto) é exclusivo do tutor
        if (assuntoMensagem !== null && remetente === "tutorado") {
            throw new AppError("Somente o tutor pode enviar comunicados", 403);
        }

        // data_envio fica com o default do banco (now())
        const mensagem = await prismaClient.mensagem.create({
            data: {
                id_tutoria: tutoria.id_tutoria,
                id_remetente: id_aluno,
                assunto: assuntoMensagem,
                texto: texto.trim()
            },
            select: {
                id_mensagem: true,
                id_tutoria: true,
                texto: true,
                assunto: true,
                data_envio: true
            }
        });

        return { ...mensagem, remetente };
    }
}

export { CreateMensagemService };
