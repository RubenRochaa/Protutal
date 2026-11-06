import { describe, it, expect } from "@jest/globals";
import { calcularMedia } from "../../helpers/calcularMedia";

describe("calcularMedia", () => {
    it("retorna null quando a lista está vazia (sem nota não existe média)", () => {
        expect(calcularMedia([])).toBeNull();
    });

    it("retorna o próprio valor quando há uma nota só", () => {
        expect(calcularMedia([7.5])).toBe(7.5);
    });

    it("calcula a média simples de várias notas", () => {
        expect(calcularMedia([6, 8, 10])).toBe(8);
    });

    it("arredonda o resultado para 2 casas decimais", () => {
        // 10 / 3 = 3.3333...
        expect(calcularMedia([10, 0, 0])).toBe(3.33);
        // 20 / 3 = 6.6666...
        expect(calcularMedia([10, 10, 0])).toBe(6.67);
    });

    it("não acumula erro de ponto flutuante (0.1 + 0.2)", () => {
        // em JavaScript 0.1 + 0.2 = 0.30000000000000004
        expect(calcularMedia([0.1, 0.2])).toBe(0.15);
    });

    it("aceita notas nos limites 0 e 10", () => {
        expect(calcularMedia([0, 0])).toBe(0);
        expect(calcularMedia([10, 10])).toBe(10);
    });
});
