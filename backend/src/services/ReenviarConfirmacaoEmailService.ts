import prismaClient from "../prisma";
import { AppError } from "../errors/AppError";
import { enviarEmailConfirmacao, gerarTokenConfirmacao, PRAZO_TOKEN_CONFIRMACAO_MS } from "../helpers/enviarEmailConfirmacao";

// O4: tempo mínimo entre dois envios do link para o mesmo e-mail (2 minutos)
const INTERVALO_MINIMO_REENVIO_MS = 2 * 60 * 1000;

// a resposta é sempre a mesma, para a rota não revelar quais e-mails estão cadastrados nem o estado deles
const MENSAGEM_REENVIO = "Se o e-mail estiver cadastrado e aguardando confirmação, um novo link foi enviado. Ele vale por 1 hora.";

interface ReenviarConfirmacaoEmailRequest {
    email: string;
}

interface UsuarioPendente {
    nome: string;
    email: string;
    token_expiracao: Date | null;
}

// true se o último link foi enviado há menos de INTERVALO_MINIMO_REENVIO_MS.
// o horário do último envio é a expiração menos o prazo do token (1 hora)
function dentroDoIntervalo(token_expiracao: Date | null) {
    if (!token_expiracao) {
        return false;
    }

    const ultimoEnvio = token_expiracao.getTime() - PRAZO_TOKEN_CONFIRMACAO_MS;

    return Date.now() - ultimoEnvio < INTERVALO_MINIMO_REENVIO_MS;
}

// envia o e-mail com o token novo. Se o envio falhar, o erro fica só no console
// (a resposta da rota não muda)
async function enviarLink(usuario: UsuarioPendente, token: string) {
    try {
        await enviarEmailConfirmacao({ nome: usuario.nome, email: usuario.email, token, reenvio: true });
    } catch (err) {
        console.error("Erro ao reenviar e-mail de confirmação:", err);
    }
}

// RN20 (O4): reenvia o link de confirmação com um token novo de 1 hora para professor e/ou aluno
// com e-mail ainda não confirmado. Não encontrado, já confirmado ou dentro do intervalo: não faz nada
class ReenviarConfirmacaoEmailService {
    async execute({ email }: ReenviarConfirmacaoEmailRequest) {

        // email precisa ser texto não vazio (um objeto viraria filtro no Prisma)
        if (typeof email !== "string" || email.trim() === "") {
            throw new AppError("Email é obrigatório", 400);
        }

        // busca pelo valor exato, igual aos cadastros e logins; o mesmo e-mail pode existir nas duas tabelas
        const professor = await prismaClient.professor.findUnique({
            where: { email: email },
            select: { id_professor: true, nome: true, email: true, email_confirmado: true, token_expiracao: true }
        });

        const aluno = await prismaClient.aluno.findUnique({
            where: { email: email },
            select: { id_aluno: true, nome: true, email: true, email_confirmado: true, token_expiracao: true }
        });

        if (professor && !professor.email_confirmado && !dentroDoIntervalo(professor.token_expiracao)) {
            // o token novo substitui o antigo, que deixa de valer
            const { token, expiracao } = gerarTokenConfirmacao();

            await prismaClient.professor.update({
                where: { id_professor: professor.id_professor },
                data: { token_confirmacao: token, token_expiracao: expiracao }
            });

            await enviarLink(professor, token);
        }

        if (aluno && !aluno.email_confirmado && !dentroDoIntervalo(aluno.token_expiracao)) {
            const { token, expiracao } = gerarTokenConfirmacao();

            await prismaClient.aluno.update({
                where: { id_aluno: aluno.id_aluno },
                data: { token_confirmacao: token, token_expiracao: expiracao }
            });

            await enviarLink(aluno, token);
        }

        return { mensagem: MENSAGEM_REENVIO };
    }
}

export { ReenviarConfirmacaoEmailService };
