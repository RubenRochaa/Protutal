import path from "path";
import prismaClient from "../../prisma";
import { Prisma } from "../../generated/prisma";
import { AppError } from "../../errors/AppError";
import { UploadedFile } from "express-fileupload";
import { buscarParticipanteTutoria } from "../../helpers/buscarParticipanteTutoria";

import { v2 as cloudinary, UploadApiResponse } from "cloudinary";

// mesmos formatos aceitos para material de apoio (conferidos pela extensão)
const EXTENSOES_ACEITAS = [".pdf", ".doc", ".docx", ".xls", ".xlsx", ".csv"];

// 10 MB, igual ao material de apoio; o limite global de 50 MB do server.ts continua valendo
const TAMANHO_MAXIMO = 10 * 1024 * 1024;

interface FeedbackRequest {
    id_tutoria: number;
    id_aluno: number;
    etapa?: unknown;
    nota?: unknown;
    comentario?: unknown;
    file?: UploadedFile | UploadedFile[];
}

class CreateFeedbackService {
    async execute({ id_tutoria, id_aluno, etapa, nota, comentario, file }: FeedbackRequest) {

        // 1) a 3) id inválido (400) -> tutoria não encontrada (404) -> não participa (403).
        // a verificação é compartilhada com as rotas de mensagem
        const { tutoria, papel } = await buscarParticipanteTutoria(id_tutoria, id_aluno);

        // só o aluno tutorado (Tutoria.id_aluno) avalia; o tutor não envia feedback para si mesmo
        if (papel !== "tutorado") {
            throw new AppError("Somente o aluno tutorado pode enviar feedback ao tutor", 403);
        }

        // 4) mesmo código de regra de negócio da rota de mensagens (409), cenário 02B do UC14
        if (tutoria.status !== "ativa") {
            throw new AppError("Esta tutoria está finalizada e não aceita novos feedbacks", 409);
        }

        // 5) no multipart todo campo chega como texto: "1" vira 1.
        // texto vazio é barrado antes, porque Number("") daria 0
        if (typeof etapa !== "string" || etapa.trim() === "") {
            throw new AppError("O campo etapa é obrigatório e deve ser 1, 2 ou 3", 400);
        }

        const etapaFeedback = Number(etapa);

        // etapa só aceita 1, 2 ou 3 (o banco também tem um CHECK para isso)
        if (!Number.isInteger(etapaFeedback) || ![1, 2, 3].includes(etapaFeedback)) {
            throw new AppError("O campo etapa é obrigatório e deve ser 1, 2 ou 3", 400);
        }

        // 6) nota é obrigatória; "9,5" (com vírgula) vira NaN e também cai aqui
        if (typeof nota !== "string" || nota.trim() === "") {
            throw new AppError("O campo nota é obrigatório e deve ser um número", 400);
        }

        const notaFeedback = Number(nota);

        if (!Number.isFinite(notaFeedback)) {
            throw new AppError("O campo nota é obrigatório e deve ser um número", 400);
        }

        if (notaFeedback < 0 || notaFeedback > 10) {
            throw new AppError("A nota deve estar entre 0 e 10", 400);
        }

        // a coluna é Decimal(4,2): com mais casas o banco arredondaria sem avisar
        if (Number(notaFeedback.toFixed(2)) !== notaFeedback) {
            throw new AppError("A nota deve ter no máximo 2 casas decimais", 400);
        }

        // 7) comentario é opcional, mas se vier não pode ser vazio nem só espaços
        let comentarioFeedback: string | null = null;

        if (comentario !== undefined && comentario !== null) {
            if (typeof comentario !== "string" || comentario.trim() === "") {
                throw new AppError("O campo comentario não pode ser vazio", 400);
            }

            comentarioFeedback = comentario.trim();
        }

        // 8) a rubrica é obrigatória nesta rota (no schema rubrica_file é opcional)
        // e deve vir em um único campo "file" (se vier repetido, o express-fileupload entrega um array)
        if (!file) {
            throw new AppError("O arquivo da rubrica é obrigatório (campo file)", 400);
        }

        if (Array.isArray(file)) {
            throw new AppError("Envie apenas um arquivo no campo file", 400);
        }

        // ".PDF" e ".pdf" valem igual
        const extensao = path.extname(file.name).toLowerCase();

        if (!EXTENSOES_ACEITAS.includes(extensao)) {
            throw new AppError("Formato não aceito. Envie um arquivo .pdf, .doc, .docx, .xls, .xlsx ou .csv", 400);
        }

        if (file.size > TAMANHO_MAXIMO) {
            throw new AppError("O arquivo deve ter no máximo 10 MB", 400);
        }

        // 9) um feedback por etapa em cada tutoria
        // (usa a chave composta gerada pelo @@unique([id_tutoria, etapa]) de Feedback)
        const mensagemEtapaRepetida = `Já foi enviado um feedback nesta tutoria para a ${etapaFeedback}ª etapa`;

        const feedbackExistente = await prismaClient.feedback.findUnique({
            where: {
                id_tutoria_etapa: {
                    id_tutoria: tutoria.id_tutoria,
                    etapa: etapaFeedback
                }
            },
            select: {
                id_feedback: true
            }
        });

        if (feedbackExistente) {
            throw new AppError(mensagemEtapaRepetida, 409);
        }

        // configura aqui (e não no topo do arquivo) porque o .env só é
        // carregado pelo server.ts depois que todos os imports já executaram
        cloudinary.config({
            cloud_name: process.env.CLOUDINARY_NAME,
            api_key: process.env.CLOUDINARY_KEY,
            api_secret: process.env.CLOUDINARY_SECRET,
        });

        // o upload só acontece depois de todas as validações,
        // para não deixar arquivo "órfão" no Cloudinary quando a requisição é recusada.
        // resource_type "auto" aceita PDF, DOCX etc. (o padrão aceita só imagem)
        const resultFile: UploadApiResponse = await new Promise((resolve, reject) => {
            cloudinary.uploader.upload_stream({ resource_type: "auto" }, function (error, result) {
                if (error || !result) {
                    reject(error);
                    return;
                }

                resolve(result);
            }).end(file.data);
        });

        try {
            // data fica com o default do banco (now())
            const feedback = await prismaClient.feedback.create({
                data: {
                    id_tutoria: tutoria.id_tutoria,
                    etapa: etapaFeedback,
                    nota: notaFeedback,
                    comentario: comentarioFeedback,
                    rubrica_file: resultFile.secure_url
                },
                select: {
                    id_feedback: true,
                    id_tutoria: true,
                    etapa: true,
                    nota: true,
                    comentario: true,
                    rubrica_file: true,
                    data: true
                }
            });

            // nota é Decimal no Prisma e iria para o JSON como texto ("8.5"); convertemos para número
            return { ...feedback, nota: Number(feedback.nota) };
        } catch (err) {
            // P2002 = violação de UNIQUE: dois feedbacks da mesma etapa chegaram ao mesmo tempo
            if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
                throw new AppError(mensagemEtapaRepetida, 409);
            }

            throw err;
        }
    }
}

export { CreateFeedbackService };
