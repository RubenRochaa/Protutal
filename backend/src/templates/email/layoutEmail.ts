import path from "path";

// Cores do Protutal (mesmos valores do design/src/app/globals.scss).
// E-mail não aceita variável CSS nem arquivo .css: tudo vai inline
const COR_VERMELHO = "#C00000";     // --red-700: faixa, botão e links
const COR_VERMELHO_ESCURO = "#8B0000"; // --red-900
const COR_CINZA_CLARO = "#F5F5F5";  // --gray-100: fundo e rodapé
const COR_BORDA = "#D9D9D9";        // --gray-300
const COR_TEXTO = "#000000";        // --black
const COR_TEXTO_SECUNDARIO = "#5C5C5C"; // --gray-700
// Poppins não existe nos clientes de e-mail: Arial/Helvetica no lugar
const FONTE = "Arial, Helvetica, sans-serif";

// Imagens anexadas à mensagem (CID): aparecem sem servidor público, porque vão junto do e-mail
const PASTA_ASSETS = path.resolve(__dirname, "assets");

const ANEXOS = [
    { filename: "logo.png", path: path.join(PASTA_ASSETS, "logo.png"), cid: "logo" },
    { filename: "mascote_protutal_email.png", path: path.join(PASTA_ASSETS, "mascote_protutal_email.png"), cid: "mascote-email" }
];

// o nome vem do cadastro (digitado pelo usuário): escapa os caracteres especiais
// para ninguém conseguir injetar HTML no corpo do e-mail
function escaparHtml(texto: string) {
    return texto
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

interface DadosEmail {
    titulo: string;      // ex.: "Confirme seu e-mail"
    nome: string;        // nome do usuário (vai escapado)
    texto: string;       // parágrafo curto (texto fixo do sistema, sem dado do usuário)
    textoBotao: string;  // ex.: "Confirmar e-mail"
    link: string;        // link do botão e escrito por extenso
    validade: string;    // ex.: "Este link vale por 1 hora."
}

// Layout único dos e-mails do Protutal: faixa vermelha com o logo, mascote, título,
// texto com o nome, botão, link por extenso, validade e rodapé.
// Devolve o HTML, a versão em texto puro e os anexos das imagens (para o sendMail)
function montarEmail({ titulo, nome, texto, textoBotao, link, validade }: DadosEmail) {
    const nomeSeguro = escaparHtml(nome);
    const linkSeguro = escaparHtml(link);

    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${titulo}</title>
</head>
<body style="margin:0; padding:0; background-color:${COR_CINZA_CLARO};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${COR_CINZA_CLARO};">
<tr>
<td align="center" style="padding:24px 12px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px; background-color:#FFFFFF; border:1px solid ${COR_BORDA}; border-radius:16px; overflow:hidden;">
        <tr>
            <td align="center" style="background-color:${COR_VERMELHO}; padding:20px 24px;">
                <img src="cid:logo" width="180" alt="PROTUTAL" style="display:block; width:180px; max-width:100%; height:auto; border:0; color:#FFFFFF; font-family:${FONTE}; font-size:24px; font-weight:bold;">
            </td>
        </tr>
        <tr>
            <td align="center" style="padding:24px 24px 0;">
                <img src="cid:mascote-email" width="160" height="160" alt="Mascote do Protutal" style="display:block; width:160px; height:160px; border:0;">
            </td>
        </tr>
        <tr>
            <td style="padding:8px 32px 0; font-family:${FONTE}; color:${COR_TEXTO};">
                <h1 style="margin:0 0 16px; font-size:24px; line-height:1.3; text-align:center; color:${COR_VERMELHO};">${titulo}</h1>
                <p style="margin:0 0 12px; font-size:16px; line-height:1.5;">Olá, ${nomeSeguro}!</p>
                <p style="margin:0 0 24px; font-size:16px; line-height:1.5;">${texto}</p>
            </td>
        </tr>
        <tr>
            <td align="center" style="padding:0 32px 24px;">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                        <td align="center" bgcolor="${COR_VERMELHO}" style="border-radius:6px; background-color:${COR_VERMELHO};">
                            <a href="${linkSeguro}" target="_blank" style="display:inline-block; padding:14px 28px; font-family:${FONTE}; font-size:16px; font-weight:bold; color:#FFFFFF; text-decoration:none; border-radius:6px; border:1px solid ${COR_VERMELHO_ESCURO};">${textoBotao}</a>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
        <tr>
            <td style="padding:0 32px 24px; font-family:${FONTE}; font-size:13px; line-height:1.5; color:${COR_TEXTO_SECUNDARIO};">
                <p style="margin:0 0 8px;">Se o botão não funcionar, copie este link e cole no navegador:</p>
                <p style="margin:0 0 16px; word-break:break-all;"><a href="${linkSeguro}" target="_blank" style="color:${COR_VERMELHO};">${linkSeguro}</a></p>
                <p style="margin:0 0 4px;">${validade}</p>
                <p style="margin:0;">Se você não pediu isso, ignore este e-mail.</p>
            </td>
        </tr>
        <tr>
            <td align="center" style="background-color:${COR_CINZA_CLARO}; border-top:1px solid ${COR_BORDA}; padding:16px 24px; font-family:${FONTE}; font-size:12px; line-height:1.5; color:${COR_TEXTO_SECUNDARIO};">
                <p style="margin:0;"><strong>Protutal</strong> – Plataforma de tutoria da rede SESI</p>
                <p style="margin:4px 0 0;">Este é um e-mail automático. Não responda esta mensagem.</p>
            </td>
        </tr>
    </table>
</td>
</tr>
</table>
</body>
</html>`;

    // Versão em texto puro, para clientes que não mostram HTML (mesmo conteúdo e link)
    const text = [
        `PROTUTAL - ${titulo}`,
        "",
        `Olá, ${nome}!`,
        "",
        texto,
        "",
        `${textoBotao}: ${link}`,
        "",
        validade,
        "Se você não pediu isso, ignore este e-mail.",
        "",
        "--",
        "Protutal – Plataforma de tutoria da rede SESI",
        "Este é um e-mail automático. Não responda esta mensagem."
    ].join("\n");

    return { html, text, attachments: ANEXOS };
}

// cores, fonte e pasta das imagens também servem para a página de confirmação de e-mail
export { montarEmail, escaparHtml, COR_VERMELHO, COR_CINZA_CLARO, COR_BORDA, COR_TEXTO, COR_TEXTO_SECUNDARIO, FONTE, PASTA_ASSETS };
