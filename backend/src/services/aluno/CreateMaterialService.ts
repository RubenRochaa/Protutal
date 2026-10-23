import path from "path";
import prismaClient from "../../prisma";
import { AppError } from "../../errors/AppError";
import { UploadedFile } from "express-fileupload";

import { v2 as cloudinary, UploadApiResponse } from "cloudinary";

// lista fechada de formatos aceitos para material de apoio (conferida pela extensão)
const EXTENSOES_ACEITAS = [".pdf", ".doc", ".docx", ".xls", ".xlsx", ".csv"];

// 10 MB; o limite global de 50 MB do server.ts continua valendo para as outras rotas
const TAMANHO_MAXIMO = 10 * 1024 * 1024;

interface MaterialRequest {
    id_aluno: number;
    email: string;
    id_sala: number;
    titulo?: string;
    descricao?: string;
    file?: UploadedFile | UploadedFile[];
}

class CreateMaterialService {
    async execute({ id_aluno, email, id_sala, titulo, descricao, file }: MaterialRequest) {

        // id da sala, sala inexistente e "é tutor ativo da sala" já foram conferidos
        // pelo isTutorAtivoSala; aqui começam as validações do corpo (400)

        // titulo é obrigatório e cabe no VARCHAR(150) da tabela material
        if (typeof titulo !== "string" || titulo.trim() === "") {
            throw new AppError("O título do material é obrigatório", 400);
        }

        if (titulo.trim().length > 150) {
            throw new AppError("O título do material deve ter no máximo 150 caracteres", 400);
        }

        // descricao é opcional, mas se vier precisa ser texto
        if (descricao !== undefined && descricao !== null && typeof descricao !== "string") {
            throw new AppError("O campo descricao deve ser um texto", 400);
        }

        // o arquivo é obrigatório e deve vir em um único campo "file"
        // (se o mesmo campo vier repetido, o express-fileupload entrega um array)
        if (!file) {
            throw new AppError("O arquivo do material é obrigatório (campo file)", 400);
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

        // vínculo de tutor ativo do aluno logado nesta sala (mesma consulta do isTutorAtivo,
        // mas aqui precisamos do id_tutor_sala para gravar o material).
        // par id + email porque os ids de Professor e Aluno podem se repetir
        const tutorSala = await prismaClient.tutor_sala.findFirst({
            where: {
                id_sala: id_sala,
                data_revogacao: null,
                tutor: {
                    aluno: {
                        id_aluno: id_aluno,
                        email: email
                    }
                }
            },
            select: {
                id_tutor_sala: true
            }
        });

        // o middleware já barrou quem não é tutor ativo; fica aqui por segurança
        if (!tutorSala) {
            throw new AppError("Você não tem permissão para acessar esta sala", 403);
        }

        // RN14 / UC17 02A: só anexa quem tem pelo menos uma tutoria ativa nesta sala
        const tutoriaAtiva = await prismaClient.tutoria.findFirst({
            where: {
                id_tutor_sala: tutorSala.id_tutor_sala,
                status: "ativa"
            },
            select: {
                id_tutoria: true
            }
        });

        if (!tutoriaAtiva) {
            throw new AppError("Você precisa ter pelo menos uma tutoria ativa nesta sala para anexar material", 403);
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

        // a notificação aos tutorados (passo 08 do UC17) entra quando existir a tabela de notificação
        const material = await prismaClient.material.create({
            data: {
                id_tutor_sala: tutorSala.id_tutor_sala,
                titulo: titulo.trim(),
                descricao: typeof descricao === "string" && descricao.trim() !== "" ? descricao.trim() : null,
                arquivo: resultFile.secure_url
            },
            select: {
                id_material: true,
                id_tutor_sala: true,
                titulo: true,
                descricao: true,
                arquivo: true,
                data_envio: true
            }
        });

        return material;
    }
}

export { CreateMaterialService };
