import prismaClient from "../../prisma";
import { hash } from "bcryptjs"
import { AppError } from "../../errors/AppError";

interface AlunoRequest {
    nome: string;
    email: string;
    senha: string;
}

class CreateAlunoService {
    async execute({ nome, email, senha }: AlunoRequest) {

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

        const alunoAlreadyExists = await prismaClient.aluno.findFirst({
            where: {
                email: email
            }
        })

        if (alunoAlreadyExists) {
            throw new AppError("Email já cadastrado", 409);
        }

        const senhaHash = await hash(senha, 8)

        const aluno = await prismaClient.aluno.create({
            data: {
                nome: nome,
                email: email,
                senha: senhaHash,
                email_confirmado: false,
            },
            select: {
                id_aluno: true,
                nome: true,
                email: true,
                email_confirmado: true,
            }
        })

        return aluno;
    }
}

export { CreateAlunoService }
