import { describe, it, expect, jest } from "@jest/globals";
import nodemailer from "nodemailer";
import mailConfig from "../../config/mail";
import multerConfig from "../../config/multer";

jest.mock("nodemailer", () => ({
    __esModule: true,
    default: { createTransport: jest.fn(() => ({ sendMail: jest.fn() })) }
}));

describe("config/mail", () => {
    it("transporte() cria o transporte do Gmail com as variáveis de ambiente", () => {
        mailConfig.transporte();

        expect(nodemailer.createTransport).toHaveBeenCalledWith({
            service: "gmail",
            auth: { user: "teste@gmail.com", pass: "senha-de-app-teste" }
        });
    });
});

describe("config/multer", () => {
    it("upload() devolve um storage em disco", () => {
        const config = multerConfig.upload("tmp");
        expect(config.storage).toBeDefined();
    });

    it("o nome do arquivo recebe um hash aleatório antes do nome original", () => {
        const storage = multerConfig.upload("tmp").storage as any;
        const callback = jest.fn();

        storage.getFilename({}, { originalname: "mapa.png" }, callback);

        expect(callback).toHaveBeenCalledWith(null, expect.stringMatching(/^[0-9a-f]{32}-mapa\.png$/));
    });
});
