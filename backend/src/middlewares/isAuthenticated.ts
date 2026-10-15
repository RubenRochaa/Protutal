import { NextFunction, Request, Response } from "express";
import { verify } from "jsonwebtoken"

interface Payload {
    sub: string;
    email: string;
}

export function isAuthenticated(
    req: Request,
    res: Response,
    next: NextFunction
){

    // Receber o token
    const authToken = req.headers.authorization;

    if(!authToken) {
        // o return interrompe a função aqui; sem ele o código seguia e quebrava no split
        res.status(401).json({ error: "Token não informado" });
        return;
    }

    // formato esperado do header: "Bearer <token>"
    const [, token] = authToken.split(" ")

    if(!token) {
        res.status(401).json({ error: "Token mal formatado" });
        return;
    }

    try{
        // validar o token
        const { sub, email } = verify(
            token,
            process.env.JWT_SECRET
        ) as Payload;

        // recuperar o id e o email do token e colocar dentro do Request
        req.user_id = sub;
        req.user_email = email;

        next();

    } catch(err) {
        res.status(401).json({ error: "Token inválido" });
        return;
    }
}
