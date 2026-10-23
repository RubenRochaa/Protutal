import prismaClient from "../../prisma";
import { AppError } from "../../errors/AppError";
import { buscarParticipanteTutoria } from "../../helpers/buscarParticipanteTutoria";

interface ListMensagensTutoriaRequest {
    id_tutoria: number;
    id_aluno: number;
    tipo?: string;
}

class ListMensagensTutoriaService {
    async execute({ id_tutoria, id_aluno, tipo }: ListMensagensTutoriaRequest) {

        // 1) id inválido (400) -> tutoria não encontrada (404) -> não participa (403).
        // mesma verificação da rota de envio (POST /tutorias/:id/mensagens)
        const { tutoria, papel } = await buscarParticipanteTutoria(id_tutoria, id_aluno);

        // 2) tutor com o vínculo Tutor_sala revogado perde o acesso ao chat.
        // o tutorado continua vendo o histórico mesmo depois da revogação
        if (papel === "tutor" && tutoria.tutor_sala.data_revogacao !== null) {
            throw new AppError("Seu vínculo de tutor nesta sala foi revogado", 403);
        }

        // 3) ?tipo= é opcional; o único valor aceito é "comunicado" (mensagem com assunto)
        if (tipo !== undefined && tipo !== "comunicado") {
            throw new AppError("O tipo deve ser comunicado", 400);
        }

        // tutoria finalizada não é bloqueada: o histórico continua visível.
        // select explícito: do remetente sai só o nome (sem email, senha ou tokens);
        // se ainda não houver mensagens, volta lista vazia e isso não é erro
        const mensagens = await prismaClient.mensagem.findMany({
            where: {
                id_tutoria: tutoria.id_tutoria,
                // comunicado = mensagem com assunto preenchido
                ...(tipo === "comunicado" && { assunto: { not: null } })
            },
            select: {
                id_mensagem: true,
                texto: true,
                assunto: true,
                data_envio: true,
                id_remetente: true,
                remetente: {
                    select: {
                        nome: true
                    }
                }
            },
            // da mais antiga para a mais recente, como num chat;
            // o id desempata mensagens enviadas no mesmo instante
            orderBy: [
                { data_envio: "asc" },
                { id_mensagem: "asc" }
            ]
        });

        // o remetente é o tutorado quando o id dele é o Tutoria.id_aluno; senão é o tutor
        return mensagens.map((mensagem) => ({
            id_mensagem: mensagem.id_mensagem,
            texto: mensagem.texto,
            assunto: mensagem.assunto,
            data_envio: mensagem.data_envio,
            remetente: {
                tipo: mensagem.id_remetente === tutoria.id_aluno ? "tutorado" : "tutor",
                nome: mensagem.remetente.nome
            }
        }));
    }
}

export { ListMensagensTutoriaService };
