import type { Config } from "jest";

// Configuração dos testes unitários do backend (Jest + ts-jest).
// Os testes ficam em src/__tests__ e nunca acessam o banco: o Prisma é mockado em src/__tests__/setup.ts
const config: Config = {
    preset: "ts-jest",
    testEnvironment: "node",
    roots: ["<rootDir>/src"],
    testMatch: ["**/__tests__/**/*.test.ts"],
    // limpa as chamadas registradas nos mocks entre um teste e outro
    clearMocks: true,
    setupFilesAfterEnv: ["<rootDir>/src/__tests__/setup.ts"],
    // o que entra no relatório de cobertura (npm run test:coverage)
    collectCoverageFrom: [
        "src/**/*.ts",
        "!src/__tests__/**",
        "!src/generated/**",
        "!src/@types/**",
        "!src/prisma/**",
        "!src/server.ts",
        "!src/routes.ts",
    ],
};

export default config;
