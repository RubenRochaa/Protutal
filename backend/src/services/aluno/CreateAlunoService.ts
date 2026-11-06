import prismaClient from "../../prisma";
import { hash } from "bcryptjs"
import { AppError } from "../../errors/AppError";
import { validarDadosCadastro } from "../../helpers/validarCadastro";
import { enviarEmailConfirmacao, gerarTokenConfirmacao } from "../../helpers/enviarEmailConfirmacao";

interface AlunoRequest {
    nome: string;
    email: string;
    senha: string;
}

class CreateAlunoService {
    async execute({ nome, email, senha }: AlunoRequest) {

        validarDadosCadastro({ nome, email, senha }, "DOMINIOS_PERMITIDOS_ALUNO");

        const alunoAlreadyExists = await prismaClient.aluno.findFirst({
            where: {
                email: email
            }
        })

        if (alunoAlreadyExists) {
            throw new AppError("Email já cadastrado", 409);
        }

        const senhaHash = await hash(senha, 8)

        // RN20: token aleatório do link de confirmação, válido por PRAZO_TOKEN_CONFIRMACAO_MS (1 hora)
        const { token, expiracao } = gerarTokenConfirmacao();

        const aluno = await prismaClient.aluno.create({
            data: {
                nome: nome,
                email: email,
                senha: senhaHash,
                email_confirmado: false,
                token_confirmacao: token,
                token_expiracao: expiracao,
            },
            select: {
                id_aluno: true,
                nome: true,
                email: true,
                email_confirmado: true,
            }
        })

        // envia o link de confirmação. Se o envio falhar, o cadastro é mantido (201)
        // e a mensagem avisa; o erro fica no console para o grupo investigar
        let mensagem = "Cadastro realizado. Enviamos um link de confirmação para o seu e-mail.";

        try {
            await enviarEmailConfirmacao({ nome: aluno.nome, email: aluno.email, token });
        } catch (err) {
            console.error("Erro ao enviar e-mail de confirmação:", err);
            mensagem = "Cadastro realizado, mas não foi possível enviar o e-mail de confirmação.";
        }

        // token e expiração não voltam na resposta (o select acima não os inclui)
        return { ...aluno, mensagem };
    }
}

export { CreateAlunoService }
