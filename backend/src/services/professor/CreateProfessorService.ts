import prismaClient from "../../prisma";
import { hash } from "bcryptjs"
import { AppError } from "../../errors/AppError";

interface ProfessorRequest {
    nome: string;
    email: string;
    senha: string;
}

class CreateProfessorService {
    async execute({ nome, email, senha }: ProfessorRequest) {

        if (!nome || !email || !senha) {
            throw new AppError("Nome, email e senha são obrigatórios", 400);
        }

        const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

        if (!emailValido) {
            throw new AppError("Email em formato inválido", 400);
        }

        // Domínios aceitos vêm da variável de ambiente, separados por vírgula
        const dominiosPermitidos = (process.env.DOMINIOS_PERMITIDOS || "")
            .split(",")
            .map((dominio) => dominio.trim().toLowerCase())
            .filter((dominio) => dominio !== "");

        const dominioEmail = email.split("@")[1].toLowerCase();

        if (!dominiosPermitidos.includes(dominioEmail)) {
            throw new AppError("Domínio de email não permitido", 400);
        }

        const professorAlreadyExists = await prismaClient.professor.findFirst({
            where: {
                email: email
            }
        })

        if (professorAlreadyExists) {
            throw new AppError("Email já cadastrado", 409);
        }

        const senhaHash = await hash(senha, 8)

        const professor = await prismaClient.professor.create({
            data: {
                nome: nome,
                email: email,
                senha: senhaHash,
                email_confirmado: false,
            },
            select: {
                id_professor: true,
                nome: true,
                email: true,
                email_confirmado: true,
            }
        })

        return professor;
    }
}

export { CreateProfessorService }
