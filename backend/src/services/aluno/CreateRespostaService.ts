import prismaClient from "../../prisma";
import { Prisma } from "../../generated/prisma";
import { AppError } from "../../errors/AppError";
import { UploadedFile } from "express-fileupload";

import { v2 as cloudinary, UploadApiResponse } from "cloudinary";

interface RespostaRequest {
    id_aluno: number;
    id_atividade: number;
    texto?: string;
    file?: UploadedFile | UploadedFile[];
}

class CreateRespostaService {
    async execute({ id_aluno, id_atividade, texto, file }: RespostaRequest) {

        // o id da atividade vem da URL (já convertido com Number no controller):
        // "abc" vira NaN e "1.5" não é inteiro, então os dois caem aqui
        const idAtividade = id_atividade;

        if (!Number.isInteger(idAtividade) || idAtividade <= 0) {
            throw new AppError("O id da atividade deve ser um número inteiro", 400);
        }

        // o arquivo é obrigatório e deve vir em um único campo "file"
        // (se o mesmo campo vier repetido, o express-fileupload entrega um array)
        if (!file) {
            throw new AppError("O arquivo da resposta é obrigatório (campo file)", 400);
        }

        if (Array.isArray(file)) {
            throw new AppError("Envie apenas um arquivo no campo file", 400);
        }

        // texto é opcional, mas se vier precisa ser texto
        if (texto !== undefined && texto !== null && typeof texto !== "string") {
            throw new AppError("O campo texto deve ser um texto", 400);
        }

        const atividade = await prismaClient.atividade.findUnique({
            where: {
                id_atividade: idAtividade
            },
            select: {
                id_atividade: true
            }
        });

        if (!atividade) {
            throw new AppError("Atividade não encontrada", 404);
        }

        // o aluno logado precisa ser o aluno da tutoria que recebeu a atividade
        const destinatario = await prismaClient.atividade_destinatario.findFirst({
            where: {
                id_atividade: idAtividade,
                tutoria: {
                    id_aluno: id_aluno
                }
            },
            select: {
                tutoria: {
                    select: {
                        status: true
                    }
                }
            }
        });

        if (!destinatario) {
            throw new AppError("Esta atividade não foi direcionada a você", 403);
        }

        if (destinatario.tutoria.status !== "ativa") {
            throw new AppError("A tutoria desta atividade não está ativa", 403);
        }

        // cada aluno responde uma atividade uma única vez
        // (usa a chave composta gerada pelo @@unique([id_atividade, id_aluno]) de Resposta)
        const respostaExistente = await prismaClient.resposta.findUnique({
            where: {
                id_atividade_id_aluno: {
                    id_atividade: idAtividade,
                    id_aluno: id_aluno
                }
            },
            select: {
                id_resposta: true
            }
        });

        if (respostaExistente) {
            throw new AppError("Você já respondeu esta atividade", 409);
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
            const resposta = await prismaClient.resposta.create({
                data: {
                    id_atividade: idAtividade,
                    id_aluno: id_aluno,
                    texto: typeof texto === "string" && texto.trim() !== "" ? texto.trim() : null,
                    conteudo_file: resultFile.secure_url
                },
                select: {
                    id_resposta: true,
                    id_atividade: true,
                    id_aluno: true,
                    texto: true,
                    conteudo_file: true,
                    data_envio: true
                }
            });

            return resposta;
        } catch (err) {
            // P2002 = violação de UNIQUE: duas respostas iguais chegaram ao mesmo tempo
            if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
                throw new AppError("Você já respondeu esta atividade", 409);
            }

            throw err;
        }
    }
}

export { CreateRespostaService };
