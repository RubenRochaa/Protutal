import prismaClient from "../../prisma";
import { compare } from "bcryptjs";
import { sign } from "jsonwebtoken";
import { AppError } from "../../errors/AppError";

interface AuthAlunoRequest {
    email: string;
    senha: string;
}

class AuthAlunoService {
    async execute({ email, senha }: AuthAlunoRequest) {

        const aluno = await prismaClient.aluno.findFirst({
            where: {
                email: email
            }
        });

        if (!aluno) {
            throw new AppError("Email ou senha incorretos", 401);
        }

        const senhaCorreta = await compare(senha, aluno.senha);

        if (!senhaCorreta) {
            throw new AppError("Email ou senha incorretos", 401);
        }

        const token = sign(
            {
                nome: aluno.nome,
                email: aluno.email
            },
            process.env.JWT_SECRET,
            {
                subject: String(aluno.id_aluno),
                expiresIn: '30d'
            }
        );

        return {
            id_aluno: aluno.id_aluno,
            nome: aluno.nome,
            email: aluno.email,
            token: token
        };
    }
}

export { AuthAlunoService };
