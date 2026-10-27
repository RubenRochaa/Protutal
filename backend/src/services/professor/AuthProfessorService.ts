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

        // os dois campos precisam ser texto não vazio: sem isso o Prisma ignoraria
        // email undefined (pegando o primeiro professor) ou aceitaria um objeto como filtro
        if (typeof email !== "string" || email.trim() === "" || typeof senha !== "string" || senha === "") {
            throw new AppError("Email e senha são obrigatórios", 400);
        }

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

        // RN20: só confere a confirmação depois de email e senha corretos,
        // para a mensagem não revelar se o email está cadastrado
        if (!professor.email_confirmado) {
            throw new AppError("Confirme seu e-mail antes de entrar. Verifique sua caixa de entrada.", 403);
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
