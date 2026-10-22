/*
  Warnings:

  - Added the required column `etapa` to the `atividade` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tipo` to the `atividade` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "TipoAtividade" AS ENUM ('aula_invertida', 'prova_alternativa', 'prova_dissertativa', 'projeto', 'interpretacao_imagens', 'exercicios_livro', 'interpretacao_mapas', 'analise_graficos', 'mapa_mental', 'pesquisa', 'estudo_caso', 'trabalho_campo', 'teatro', 'atividade_extracurricular', 'autoavaliacao');

-- AlterTable
ALTER TABLE "atividade" ADD COLUMN     "etapa" SMALLINT NOT NULL,
DROP COLUMN "tipo",
ADD COLUMN     "tipo" "TipoAtividade" NOT NULL;

-- CreateTable
CREATE TABLE "faixa_desempenho" (
    "id_faixa" SERIAL NOT NULL,
    "nome" VARCHAR(50) NOT NULL,
    "nota_min" DECIMAL(4,2) NOT NULL,
    "nota_max" DECIMAL(4,2) NOT NULL,

    CONSTRAINT "faixa_desempenho_pkey" PRIMARY KEY ("id_faixa")
);

-- CreateIndex
CREATE UNIQUE INDEX "faixa_desempenho_nome_key" ON "faixa_desempenho"("nome");

-- AddCheck
ALTER TABLE "atividade"
  ADD CONSTRAINT "atividade_etapa_check" CHECK ("etapa" BETWEEN 1 AND 3);

ALTER TABLE "faixa_desempenho"
  ADD CONSTRAINT "faixa_desempenho_nota_min_check" CHECK ("nota_min" BETWEEN 0 AND 10),
  ADD CONSTRAINT "faixa_desempenho_nota_max_check" CHECK ("nota_max" BETWEEN 0 AND 10),
  ADD CONSTRAINT "faixa_desempenho_intervalo_check" CHECK ("nota_min" <= "nota_max");
