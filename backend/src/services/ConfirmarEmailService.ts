import prismaClient from "../prisma";
import { AppError } from "../errors/AppError";

interface ConfirmarEmailRequest {
    token: string;
}

// RN20 (O3): confirma o e-mail de professor ou aluno pelo token do link enviado no cadastro.
// ordem: token inexistente ou já usado (400) -> expirado (410) -> confirma e limpa o token
class ConfirmarEmailService {
    async execute({ token }: ConfirmarEmailRequest) {

        if (typeof token !== "string" || token.trim() === "") {
            throw new AppError("Link de confirmação inválido ou já utilizado", 400);
        }

        // token_confirmacao é único em cada tabela; o token pode ser de um professor ou de um aluno
        const professor = await prismaClient.professor.findUnique({
            where: { token_confirmacao: token },
            select: { id_professor: true, token_expiracao: true }
        });

        const aluno = professor ? null : await prismaClient.aluno.findUnique({
            where: { token_confirmacao: token },
            select: { id_aluno: true, token_expiracao: true }
        });

        const usuario = professor || aluno;

        // depois de confirmado o token vira null, então um link já usado também cai aqui
        if (!usuario) {
            throw new AppError("Link de confirmação inválido ou já utilizado", 400);
        }

        // expirado: o token não é apagado
        if (!usuario.token_expiracao || usuario.token_expiracao < new Date()) {
            throw new AppError("Link de confirmação expirado", 410);
        }

        // confirma e limpa o token numa única atualização
        const dadosConfirmacao = {
            email_confirmado: true,
            token_confirmacao: null,
            token_expiracao: null
        };

        if (professor) {
            await prismaClient.professor.update({
                where: { id_professor: professor.id_professor },
                data: dadosConfirmacao
            });
        } else {
            await prismaClient.aluno.update({
                where: { id_aluno: aluno!.id_aluno },
                data: dadosConfirmacao
            });
        }

        return { mensagem: "E-mail confirmado! Você já pode entrar no Protutal." };
    }
}

export { ConfirmarEmailService };
