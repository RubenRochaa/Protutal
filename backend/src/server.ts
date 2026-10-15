import dotenv from "dotenv";
import express, { Request, Response, NextFunction } from 'express'
import 'express-async-errors'
import cors from 'cors'
import path from 'path'

import { router } from './routes'
import fileUpload from 'express-fileupload';
import { AppError } from './errors/AppError';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();
app.use(express.json());
app.use(cors());
app.use(fileUpload({
    limits: { fileSize: 50 * 1024 * 1024 } // Enviar imagem de no máximo 50mb
}))
app.use(router);

// Acessar url da Imagem ex: localhost:3333/files/nome-imagem.png
app.use(
    '/files',
    express.static(path.resolve(__dirname, '..', 'tmp'))
)

// nenhuma rota nem arquivo estático respondeu: 404 em JSON (em vez da página HTML do Express)
app.use((req: Request, res: Response) => {
    res.status(404).json({
        error: 'Rota não encontrada'
    })
})

// handler global de erros: precisa ter os 4 parâmetros para o Express reconhecê-lo
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    if (err instanceof AppError) {
        // erro lançado pela aplicação com status HTTP definido (ex.: 400, 401, 404, 409)
        return res.status(err.statusCode).json({
            error: err.message
        })
    }

    // corpo com JSON mal formado: o express.json() lança SyntaxError com a propriedade "body"
    if (err instanceof SyntaxError && 'body' in err) {
        return res.status(400).json({
            error: 'JSON inválido no corpo da requisição'
        })
    }

    // erro inesperado (ex.: falha no banco): loga no console para o grupo investigar
    // e responde mensagem genérica, sem vazar detalhes internos para o cliente
    console.error(err)

    return res.status(500).json({
        error: 'Erro interno do servidor'
    })
})

app.listen(3333, () => console.log('Servidor online!!!!!!!!!'))
