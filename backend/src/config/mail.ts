import nodemailer from "nodemailer"

// transporte do Nodemailer pela conta Gmail do projeto (EMAIL_PASS é uma senha de app do Google,
// não a senha normal da conta). É uma função, e não o transporte pronto, porque o server.ts só roda
// o dotenv.config() depois dos imports: criado aqui no topo, EMAIL_USER e EMAIL_PASS ainda estariam vazios
export default {
    transporte() {
        return nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        })
    }
}
