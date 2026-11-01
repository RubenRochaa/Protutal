import mailConfig from "../config/mail";
import crypto from "crypto";
import { montarEmail } from "../templates/email/layoutEmail";

// RN20: prazo de validade do link de confirmação (1 hora), único para os cadastros de professor e aluno
const PRAZO_TOKEN_CONFIRMACAO_MS = 60 * 60 * 1000;

// gera o token aleatório do link e a expiração (agora + PRAZO_TOKEN_CONFIRMACAO_MS);
// usado nos cadastros e no reenvio do link
function gerarTokenConfirmacao() {
    const token = crypto.randomBytes(32).toString("hex");
    const expiracao = new Date(Date.now() + PRAZO_TOKEN_CONFIRMACAO_MS);

    return { token, expiracao };
}

interface EmailConfirmacaoRequest {
    nome: string;
    email: string;
    token: string;
    // true no reenvio do link (O4): muda só o assunto e o texto
    reenvio?: boolean;
}

// envia o e-mail com o link de confirmação. Não trata o erro de envio:
// quem chama (os services de cadastro e o reenvio) decide o que fazer se falhar
async function enviarEmailConfirmacao({ nome, email, token, reenvio = false }: EmailConfirmacaoRequest) {
    // tira a barra do fim do APP_URL, se houver, para o link não ficar com "//"
    const appUrl = (process.env.APP_URL || "").replace(/\/+$/, "");
    const link = `${appUrl}/confirmacao-email/${token}`;

    // layout do Protutal (o nome é escapado lá dentro). Validade = PRAZO_TOKEN_CONFIRMACAO_MS
    const { html, text, attachments } = montarEmail({
        titulo: reenvio ? "Seu novo link de confirmação" : "Confirme seu e-mail",
        nome,
        texto: reenvio
            ? "Você pediu um novo link para confirmar seu e-mail no Protutal. O link enviado antes deixou de valer."
            : "Para concluir seu cadastro no Protutal, confirme seu e-mail clicando no botão abaixo.",
        textoBotao: "Confirmar e-mail",
        link,
        validade: "Este link vale por 1 hora."
    });

    await mailConfig.transporte().sendMail({
        from: `"Protutal" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: reenvio ? "Novo link de confirmação do Protutal" : "Confirme seu e-mail no Protutal",
        html,
        text,
        attachments
    });
}

export { enviarEmailConfirmacao, gerarTokenConfirmacao, PRAZO_TOKEN_CONFIRMACAO_MS };
