import path from "path";
import { UploadedFile } from "express-fileupload";
import { AppError } from "../errors/AppError";

// lista fechada de formatos aceitos para documentos (material de apoio e rubrica), conferida pela extensão
const EXTENSOES_DOCUMENTO = [".pdf", ".doc", ".docx", ".xls", ".xlsx", ".csv"];

// 10 MB; o limite global de 50 MB do server.ts continua valendo para as outras rotas
const TAMANHO_MAXIMO_ARQUIVO = 10 * 1024 * 1024;

// o arquivo deve vir em um único campo "file"
// (se o mesmo campo vier repetido, o express-fileupload entrega um array).
// o "asserts" avisa o TypeScript que, depois desta chamada, file é um arquivo só.
// a checagem de "arquivo obrigatório" fica em cada service, porque a mensagem muda.
function validarArquivoUnico(file: UploadedFile | UploadedFile[]): asserts file is UploadedFile {
    if (Array.isArray(file)) {
        throw new AppError("Envie apenas um arquivo no campo file", 400);
    }
}

// um arquivo só, com extensão aceita e até 10 MB, nessa ordem
function validarArquivoDocumento(file: UploadedFile | UploadedFile[]): asserts file is UploadedFile {
    validarArquivoUnico(file);

    // ".PDF" e ".pdf" valem igual
    const extensao = path.extname(file.name).toLowerCase();

    if (!EXTENSOES_DOCUMENTO.includes(extensao)) {
        throw new AppError("Formato não aceito. Envie um arquivo .pdf, .doc, .docx, .xls, .xlsx ou .csv", 400);
    }

    if (file.size > TAMANHO_MAXIMO_ARQUIVO) {
        throw new AppError("O arquivo deve ter no máximo 10 MB", 400);
    }
}

export { validarArquivoUnico, validarArquivoDocumento, EXTENSOES_DOCUMENTO, TAMANHO_MAXIMO_ARQUIVO };
