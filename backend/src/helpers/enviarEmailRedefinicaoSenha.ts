import mailConfig from "../config/mail";
import { montarEmail } from "../templates/email/layoutEmail";

interface EmailRedefinicaoRequest {
    nome: string;
    email: string;
    token: string;
}

// envia o e-mail com o link de redefinição de senha, que abre a página do front
// (FRONT_URL/redefinir-senha?token=...). Não trata o erro de envio: quem chama decide
async function enviarEmailRedefinicaoSenha({ nome, email, token }: EmailRedefinicaoRequest) {
    // tira a barra do fim do FRONT_URL, se houver, para o link não ficar com "//"
    const frontUrl = (process.env.FRONT_URL || "").replace(/\/+$/, "");
    const link = `${frontUrl}/redefinir-senha?token=${encodeURIComponent(token)}`;

    // layout do Protutal (o nome é escapado lá dentro). Validade = PRAZO_TOKEN_REDEFINICAO (30m)
    const { html, text, attachments } = montarEmail({
        titulo: "Redefina sua senha",
        nome,
        texto: "Recebemos um pedido para redefinir a sua senha no Protutal. Para criar uma nova senha, clique no botão abaixo. Enquanto você não fizer isso, a sua senha continua a mesma.",
        textoBotao: "Criar nova senha",
        link,
        validade: "Este link vale por 30 minutos e só pode ser usado uma vez."
    });

    await mailConfig.transporte().sendMail({
        from: `"Protutal" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "Redefinição de senha do Protutal",
        html,
        text,
        attachments
    });
}

export { enviarEmailRedefinicaoSenha };
