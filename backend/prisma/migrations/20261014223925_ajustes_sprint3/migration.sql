/*
  Warnings:

  - The `status` column on the `contestacao_nota` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `id_aluno` on the `mensagem` table. All the data in the column will be lost.
  - The `status` column on the `pedido_tutoria` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `tutoria` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[token_confirmacao]` on the table `aluno` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[id_atividade,id_tutoria]` on the table `atividade_destinatario` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[id_tutoria,etapa]` on the table `feedback` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[id_aluno,id_sala]` on the table `matricula` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[id_atividade,id_aluno]` on the table `nota` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[token_confirmacao]` on the table `professor` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[id_atividade,id_aluno]` on the table `resposta` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `nota` to the `avaliacao_tutor` table without a default value. This is not possible if the table is not empty.
  - Added the required column `id_remetente` to the `mensagem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `id_sala` to the `pedido_tutoria` table without a default value. This is not possible if the table is not empty.
  - Added the required column `serie` to the `sala` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "StatusPedido" AS ENUM ('pendente', 'aceito', 'recusado');

-- CreateEnum
CREATE TYPE "StatusTutoria" AS ENUM ('ativa', 'finalizada');

-- CreateEnum
CREATE TYPE "StatusContestacao" AS ENUM ('pendente', 'aceita', 'recusada');

-- DropForeignKey
ALTER TABLE "mensagem" DROP CONSTRAINT "mensagem_id_aluno_fkey";

-- AlterTable
ALTER TABLE "aluno" ADD COLUMN     "token_confirmacao" VARCHAR(255),
ADD COLUMN     "token_expiracao" TIMESTAMP;

-- AlterTable
ALTER TABLE "avaliacao_tutor" ADD COLUMN     "nota" DECIMAL(4,2) NOT NULL;

-- AlterTable
ALTER TABLE "contestacao_nota" DROP COLUMN "status",
ADD COLUMN     "status" "StatusContestacao" NOT NULL DEFAULT 'pendente';

-- AlterTable
ALTER TABLE "mensagem" DROP COLUMN "id_aluno",
ADD COLUMN     "id_remetente" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "nota" ADD COLUMN     "data_lancamento" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "pedido_tutoria" ADD COLUMN     "id_sala" INTEGER NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "StatusPedido" NOT NULL DEFAULT 'pendente';

-- AlterTable
ALTER TABLE "professor" ADD COLUMN     "token_confirmacao" VARCHAR(255),
ADD COLUMN     "token_expiracao" TIMESTAMP;

-- AlterTable
ALTER TABLE "sala" ADD COLUMN     "serie" SMALLINT NOT NULL;

-- AlterTable
ALTER TABLE "tutoria" DROP COLUMN "status",
ADD COLUMN     "status" "StatusTutoria" NOT NULL DEFAULT 'ativa';

-- CreateIndex
CREATE UNIQUE INDEX "aluno_token_confirmacao_key" ON "aluno"("token_confirmacao");

-- CreateIndex
CREATE UNIQUE INDEX "atividade_destinatario_id_atividade_id_tutoria_key" ON "atividade_destinatario"("id_atividade", "id_tutoria");

-- CreateIndex
CREATE UNIQUE INDEX "feedback_id_tutoria_etapa_key" ON "feedback"("id_tutoria", "etapa");

-- CreateIndex
CREATE UNIQUE INDEX "matricula_id_aluno_id_sala_key" ON "matricula"("id_aluno", "id_sala");

-- CreateIndex
CREATE UNIQUE INDEX "nota_id_atividade_id_aluno_key" ON "nota"("id_atividade", "id_aluno");

-- CreateIndex
CREATE UNIQUE INDEX "professor_token_confirmacao_key" ON "professor"("token_confirmacao");

-- CreateIndex
CREATE UNIQUE INDEX "resposta_id_atividade_id_aluno_key" ON "resposta"("id_atividade", "id_aluno");

-- AddForeignKey
ALTER TABLE "pedido_tutoria" ADD CONSTRAINT "pedido_tutoria_id_sala_fkey" FOREIGN KEY ("id_sala") REFERENCES "sala"("id_sala") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mensagem" ADD CONSTRAINT "mensagem_id_remetente_fkey" FOREIGN KEY ("id_remetente") REFERENCES "aluno"("id_aluno") ON DELETE RESTRICT ON UPDATE CASCADE;
