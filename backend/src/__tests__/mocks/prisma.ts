import { mockDeep, DeepMockProxy } from "jest-mock-extended";
// "import type": só o tipo é usado, o client real do Prisma nunca é carregado nos testes
import type { PrismaClient } from "../../generated/prisma";

// Prisma falso usado em todos os testes. Cada método (ex.: prismaMock.aluno.findFirst)
// é um jest.fn() e o teste define o que ele devolve:
//   prismaMock.aluno.findFirst.mockResolvedValue({ id_aluno: 1, ... })
// O src/__tests__/setup.ts troca o "src/prisma" por este objeto e o zera antes de cada teste.
export const prismaMock: DeepMockProxy<PrismaClient> = mockDeep<PrismaClient>();
