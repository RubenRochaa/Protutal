import { jest } from "@jest/globals";
import { v2 as cloudinary } from "cloudinary";

// Upload falso do Cloudinary (nenhum arquivo sai da máquina nos testes).
// Cada arquivo de teste que usa upload precisa ter, no topo:
//   jest.mock("cloudinary", () => ({ v2: { config: jest.fn(), uploader: { upload_stream: jest.fn() } } }));
// e então chamar simularUpload(...) antes de executar o service.

// faz o upload_stream "responder" com sucesso (secure_url) ou com erro
export function simularUpload(resultado: { secure_url: string } | { erro: Error }) {
    (cloudinary.uploader.upload_stream as unknown as jest.Mock).mockImplementation((_opcoes: any, callback: any) => ({
        end: () => "erro" in resultado ? callback(resultado.erro, undefined) : callback(undefined, resultado)
    }));
}
