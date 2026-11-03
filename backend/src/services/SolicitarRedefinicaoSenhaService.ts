import prismaClient from "../prisma";
import { AppError } from "../errors/AppError";
import { gerarTokenRedefinicao, TipoUsuario } from "../helpers/tokenRedefinicaoSenha";
import { enviarEmailRedefinicaoSenha } from "../helpers/enviarEmailRedefinicaoSenha";

// a resposta é sempre a mesma, para a rota não revelar quais e-mails estão cadastrados nem o estado deles
const MENSAGEM_SOLICITACAO = "Se o e-mail estiver cadastrado, enviaremos um link para redefinir a senha. Ele vale por 30 minutos.";

interface SolicitarRedefinicaoSenhaRequest {
    email: string;
}

interface UsuarioRedefinicao {
    tipo: TipoUsuario;
    id: number;
    nome: string;
    email: string;
    senha: string;
}

// gera o token e envia o e-mail sem esperar o envio terminar: assim a resposta demora o mesmo
// tempo com ou sem e-mail cadastrado. Se o envio falhar, o erro fica só no console
function enviarLink(usuario: UsuarioRedefinicao) {
    const token = gerarTokenRedefinicao(usuario);

    enviarEmailRedefinicaoSenha({ nome: usuario.nome, email: usuario.email, token })
        .catch((err) => console.error("Erro ao enviar e-mail de redefinição de senha:", err));
}

// O5: envia o link de redefinição de senha para o professor e/ou aluno com esse e-mail.
// Só para e-mail confirmado (quem não confirmou ainda não pode entrar: usa o reenvio do O4).
// Não encontrado ou não confirmado: não faz nada
class SolicitarRedefinicaoSenhaService {
    async execute({ email }: SolicitarRedefinicaoSenhaRequest) {

        // email precisa ser texto não vazio (um objeto viraria filtro no Prisma)
        if (typeof email !== "string" || email.trim() === "") {
            throw new AppError("Email é obrigatório", 400);
        }

        // busca pelo valor exato, igual aos cadastros e logins; o mesmo e-mail pode existir nas duas tabelas
        const professor = await prismaClient.professor.findUnique({
            where: { email: email },
            select: { id_professor: true, nome: true, email: true, senha: true, email_confirmado: true }
        });

        const aluno = await prismaClient.aluno.findUnique({
            where: { email: email },
            select: { id_aluno: true, nome: true, email: true, senha: true, email_confirmado: true }
        });

        if (professor && professor.email_confirmado) {
            enviarLink({ tipo: "professor", id: professor.id_professor, nome: professor.nome, email: professor.email, senha: professor.senha });
        }

        if (aluno && aluno.email_confirmado) {
            enviarLink({ tipo: "aluno", id: aluno.id_aluno, nome: aluno.nome, email: aluno.email, senha: aluno.senha });
        }

        return { mensagem: MENSAGEM_SOLICITACAO };
    }
}

export { SolicitarRedefinicaoSenhaService };
