import { jest } from "@jest/globals";
import { Request, Response, NextFunction } from "express";

// Fábricas de req/res/next falsos para testar controllers e middlewares sem subir o servidor.

// cria um Request só com os campos que o teste precisar (body, params, query, headers, user_id...)
export function mockRequest(dados: Partial<Request> = {}): Request {
    return {
        body: {},
        params: {},
        query: {},
        headers: {},
        ...dados,
    } as Request;
}

// Response em que status() devolve o próprio res, para funcionar o encadeamento res.status(201).json(...)
export function mockResponse() {
    const res = {} as Response;
    res.status = jest.fn().mockReturnValue(res) as unknown as Response["status"];
    res.json = jest.fn().mockReturnValue(res) as unknown as Response["json"];
    res.send = jest.fn().mockReturnValue(res) as unknown as Response["send"];
    res.setHeader = jest.fn().mockReturnValue(res) as unknown as Response["setHeader"];
    return res;
}

export function mockNext() {
    return jest.fn() as unknown as NextFunction & jest.Mock;
}
