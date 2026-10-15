-- DropForeignKey
ALTER TABLE "conteudo" DROP CONSTRAINT "conteudo_id_sala_fkey";

-- AlterTable
ALTER TABLE "conteudo" DROP COLUMN "id_sala";

-- CreateTable
CREATE TABLE "sala_conteudo" (
    "id_sala_conteudo" SERIAL NOT NULL,
    "id_sala" INTEGER NOT NULL,
    "id_conteudo" INTEGER NOT NULL,

    CONSTRAINT "sala_conteudo_pkey" PRIMARY KEY ("id_sala_conteudo")
);

-- CreateIndex
CREATE UNIQUE INDEX "sala_conteudo_id_sala_id_conteudo_key" ON "sala_conteudo"("id_sala", "id_conteudo");

-- CreateIndex
CREATE UNIQUE INDEX "conteudo_nome_key" ON "conteudo"("nome");

-- AddForeignKey
ALTER TABLE "sala_conteudo" ADD CONSTRAINT "sala_conteudo_id_sala_fkey" FOREIGN KEY ("id_sala") REFERENCES "sala"("id_sala") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sala_conteudo" ADD CONSTRAINT "sala_conteudo_id_conteudo_fkey" FOREIGN KEY ("id_conteudo") REFERENCES "conteudo"("id_conteudo") ON DELETE RESTRICT ON UPDATE CASCADE;

