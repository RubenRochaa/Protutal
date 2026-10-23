import prismaClient from "../../prisma";
import { AppError } from "../../errors/AppError";
import { buscarParticipanteTutoria } from "../../helpers/buscarParticipanteTutoria";

interface MensagemRequest {
    id_tutoria: number;
    id_aluno: number;
    texto?: unknown;
    assunto?: unknown;
}

class CreateMensagemService {
    async execute({ id_tutoria, id_aluno, texto, assunto }: MensagemRequest) {

        // 1) e 2) id inválido (400) -> tutoria não encontrada (404) -> não participa (403).
        // a verificação é compartilhada com a rota de listagem (GET /tutorias/:id/mensagens)
        const { tutoria, papel: remetente } = await buscarParticipanteTutoria(id_tutoria, id_aluno);

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
