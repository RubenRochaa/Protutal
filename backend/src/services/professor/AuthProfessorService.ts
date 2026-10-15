import prismaClient from "../../prisma";
import { compare } from "bcryptjs";
import { sign } from "jsonwebtoken";
import { AppError } from "../../errors/AppError";

interface AuthProfessorRequest {
    email: string;
    senha: string;
}

class AuthProfessorService {
    async execute({ email, senha }: AuthProfessorRequest) {

        const professor = await prismaClient.professor.findFirst({
            where: {
                email: email
            }
        });

        if (!professor) {
            throw new AppError("Email ou senha incorretos", 401);
        }

        const senhaCorreta = await compare(senha, professor.senha);

        if (!senhaCorreta) {
            throw new AppError("Email ou senha incorretos", 401);
        }

        const token = sign(
            {
                nome: professor.nome,
                email: professor.email
            },
            process.env.JWT_SECRET,
            {
                subject: String(professor.id_professor),
                expiresIn: '30d'
            }
        );

        return {
            id_professor: professor.id_professor,
            nome: professor.nome,
            email: professor.email,
            token: token
        };
    }
}

export { AuthProfessorService };
