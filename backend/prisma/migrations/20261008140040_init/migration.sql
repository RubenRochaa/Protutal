-- CreateTable
CREATE TABLE "professor" (
    "id_professor" SERIAL NOT NULL,
    "nome" VARCHAR(150) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "senha" VARCHAR(255) NOT NULL,
    "email_confirmado" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "professor_pkey" PRIMARY KEY ("id_professor")
);

-- CreateTable
CREATE TABLE "aluno" (
    "id_aluno" SERIAL NOT NULL,
    "nome" VARCHAR(150) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "senha" VARCHAR(255) NOT NULL,
    "email_confirmado" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "aluno_pkey" PRIMARY KEY ("id_aluno")
);

-- CreateTable
CREATE TABLE "sala" (
    "id_sala" SERIAL NOT NULL,
    "nome" VARCHAR(100) NOT NULL,
    "ano_letivo" SMALLINT NOT NULL,
    "id_professor" INTEGER NOT NULL,

    CONSTRAINT "sala_pkey" PRIMARY KEY ("id_sala")
);

-- CreateTable
CREATE TABLE "matricula" (
    "id_matricula" SERIAL NOT NULL,
    "id_aluno" INTEGER NOT NULL,
    "id_sala" INTEGER NOT NULL,

    CONSTRAINT "matricula_pkey" PRIMARY KEY ("id_matricula")
);

-- CreateTable
CREATE TABLE "pedido_tutoria" (
    "id_pedido" SERIAL NOT NULL,
    "id_aluno" INTEGER NOT NULL,
    "status" VARCHAR(10) NOT NULL DEFAULT 'pendente',
    "data_solicitacao" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data_decisao" TIMESTAMP,
    "id_professor" INTEGER,

    CONSTRAINT "pedido_tutoria_pkey" PRIMARY KEY ("id_pedido")
);

-- CreateTable
CREATE TABLE "tutor" (
    "id_tutor" SERIAL NOT NULL,
    "id_aluno" INTEGER NOT NULL,
    "id_pedido" INTEGER NOT NULL,

    CONSTRAINT "tutor_pkey" PRIMARY KEY ("id_tutor")
);

-- CreateTable
CREATE TABLE "tutor_sala" (
    "id_tutor_sala" SERIAL NOT NULL,
    "id_tutor" INTEGER NOT NULL,
    "id_sala" INTEGER NOT NULL,
    "data_definicao" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pode_criar_ativ" BOOLEAN NOT NULL DEFAULT false,
    "data_revogacao" TIMESTAMP,

    CONSTRAINT "tutor_sala_pkey" PRIMARY KEY ("id_tutor_sala")
);

-- CreateTable
CREATE TABLE "tutoria" (
    "id_tutoria" SERIAL NOT NULL,
    "id_tutor_sala" INTEGER NOT NULL,
    "id_aluno" INTEGER NOT NULL,
    "meta_aprendizagem" TEXT,
    "status" VARCHAR(10) NOT NULL DEFAULT 'ativa',
    "data_inicio" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data_fim" TIMESTAMP,

    CONSTRAINT "tutoria_pkey" PRIMARY KEY ("id_tutoria")
);

-- CreateTable
CREATE TABLE "conteudo" (
    "id_conteudo" SERIAL NOT NULL,
    "id_sala" INTEGER NOT NULL,
    "nome" VARCHAR(100) NOT NULL,

    CONSTRAINT "conteudo_pkey" PRIMARY KEY ("id_conteudo")
);

-- CreateTable
CREATE TABLE "atividade" (
    "id_atividade" SERIAL NOT NULL,
    "id_tutor_sala" INTEGER NOT NULL,
    "id_conteudo" INTEGER NOT NULL,
    "titulo" VARCHAR(150) NOT NULL,
    "descricao" TEXT,
    "tipo" VARCHAR(50),
    "data_entrega" TIMESTAMP NOT NULL,

    CONSTRAINT "atividade_pkey" PRIMARY KEY ("id_atividade")
);

-- CreateTable
CREATE TABLE "atividade_destinatario" (
    "id_att_destinatario" SERIAL NOT NULL,
    "id_atividade" INTEGER NOT NULL,
    "id_tutoria" INTEGER NOT NULL,

    CONSTRAINT "atividade_destinatario_pkey" PRIMARY KEY ("id_att_destinatario")
);

-- CreateTable
CREATE TABLE "resposta" (
    "id_resposta" SERIAL NOT NULL,
    "id_atividade" INTEGER NOT NULL,
    "id_aluno" INTEGER NOT NULL,
    "texto" TEXT,
    "conteudo_file" VARCHAR(500),
    "data_envio" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "resposta_pkey" PRIMARY KEY ("id_resposta")
);

-- CreateTable
CREATE TABLE "nota" (
    "id_nota" SERIAL NOT NULL,
    "id_aluno" INTEGER NOT NULL,
    "id_atividade" INTEGER NOT NULL,
    "valor" DECIMAL(4,2) NOT NULL,
    "comentario" TEXT,

    CONSTRAINT "nota_pkey" PRIMARY KEY ("id_nota")
);

-- CreateTable
CREATE TABLE "contestacao_nota" (
    "id_contestacao" SERIAL NOT NULL,
    "id_nota" INTEGER NOT NULL,
    "comentario" TEXT NOT NULL,
    "status" VARCHAR(10) NOT NULL DEFAULT 'pendente',
    "data_envio" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decisao" TEXT,
    "data_resolucao" TIMESTAMP,

    CONSTRAINT "contestacao_nota_pkey" PRIMARY KEY ("id_contestacao")
);

-- CreateTable
CREATE TABLE "feedback" (
    "id_feedback" SERIAL NOT NULL,
    "id_tutoria" INTEGER NOT NULL,
    "etapa" SMALLINT NOT NULL,
    "nota" DECIMAL(4,2) NOT NULL,
    "comentario" TEXT,
    "rubrica_file" VARCHAR(500),
    "data" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "feedback_pkey" PRIMARY KEY ("id_feedback")
);

-- CreateTable
CREATE TABLE "mensagem" (
    "id_mensagem" SERIAL NOT NULL,
    "id_tutoria" INTEGER NOT NULL,
    "id_aluno" INTEGER NOT NULL,
    "assunto" VARCHAR(150),
    "texto" TEXT NOT NULL,
    "data_envio" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mensagem_pkey" PRIMARY KEY ("id_mensagem")
);

-- CreateTable
CREATE TABLE "aviso" (
    "id_aviso" SERIAL NOT NULL,
    "id_sala" INTEGER NOT NULL,
    "id_professor" INTEGER NOT NULL,
    "titulo" VARCHAR(150) NOT NULL,
    "conteudo" TEXT NOT NULL,
    "data_publicacao" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "aviso_pkey" PRIMARY KEY ("id_aviso")
);

-- CreateTable
CREATE TABLE "material" (
    "id_material" SERIAL NOT NULL,
    "id_tutor_sala" INTEGER NOT NULL,
    "titulo" VARCHAR(150) NOT NULL,
    "descricao" TEXT,
    "arquivo" VARCHAR(500) NOT NULL,
    "data_envio" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "material_pkey" PRIMARY KEY ("id_material")
);

-- CreateTable
CREATE TABLE "avaliacao_tutor" (
    "id_avaliacao" SERIAL NOT NULL,
    "id_tutor_sala" INTEGER NOT NULL,
    "id_professor" INTEGER NOT NULL,
    "comentario" TEXT NOT NULL,
    "data" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "avaliacao_tutor_pkey" PRIMARY KEY ("id_avaliacao")
);

-- CreateIndex
CREATE UNIQUE INDEX "professor_email_key" ON "professor"("email");

-- CreateIndex
CREATE UNIQUE INDEX "aluno_email_key" ON "aluno"("email");

-- CreateIndex
CREATE UNIQUE INDEX "tutor_id_aluno_key" ON "tutor"("id_aluno");

-- CreateIndex
CREATE UNIQUE INDEX "tutor_id_pedido_key" ON "tutor"("id_pedido");

-- AddForeignKey
ALTER TABLE "sala" ADD CONSTRAINT "sala_id_professor_fkey" FOREIGN KEY ("id_professor") REFERENCES "professor"("id_professor") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matricula" ADD CONSTRAINT "matricula_id_aluno_fkey" FOREIGN KEY ("id_aluno") REFERENCES "aluno"("id_aluno") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matricula" ADD CONSTRAINT "matricula_id_sala_fkey" FOREIGN KEY ("id_sala") REFERENCES "sala"("id_sala") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedido_tutoria" ADD CONSTRAINT "pedido_tutoria_id_aluno_fkey" FOREIGN KEY ("id_aluno") REFERENCES "aluno"("id_aluno") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedido_tutoria" ADD CONSTRAINT "pedido_tutoria_id_professor_fkey" FOREIGN KEY ("id_professor") REFERENCES "professor"("id_professor") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tutor" ADD CONSTRAINT "tutor_id_aluno_fkey" FOREIGN KEY ("id_aluno") REFERENCES "aluno"("id_aluno") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tutor" ADD CONSTRAINT "tutor_id_pedido_fkey" FOREIGN KEY ("id_pedido") REFERENCES "pedido_tutoria"("id_pedido") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tutor_sala" ADD CONSTRAINT "tutor_sala_id_tutor_fkey" FOREIGN KEY ("id_tutor") REFERENCES "tutor"("id_tutor") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tutor_sala" ADD CONSTRAINT "tutor_sala_id_sala_fkey" FOREIGN KEY ("id_sala") REFERENCES "sala"("id_sala") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tutoria" ADD CONSTRAINT "tutoria_id_tutor_sala_fkey" FOREIGN KEY ("id_tutor_sala") REFERENCES "tutor_sala"("id_tutor_sala") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tutoria" ADD CONSTRAINT "tutoria_id_aluno_fkey" FOREIGN KEY ("id_aluno") REFERENCES "aluno"("id_aluno") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conteudo" ADD CONSTRAINT "conteudo_id_sala_fkey" FOREIGN KEY ("id_sala") REFERENCES "sala"("id_sala") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "atividade" ADD CONSTRAINT "atividade_id_tutor_sala_fkey" FOREIGN KEY ("id_tutor_sala") REFERENCES "tutor_sala"("id_tutor_sala") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "atividade" ADD CONSTRAINT "atividade_id_conteudo_fkey" FOREIGN KEY ("id_conteudo") REFERENCES "conteudo"("id_conteudo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "atividade_destinatario" ADD CONSTRAINT "atividade_destinatario_id_atividade_fkey" FOREIGN KEY ("id_atividade") REFERENCES "atividade"("id_atividade") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "atividade_destinatario" ADD CONSTRAINT "atividade_destinatario_id_tutoria_fkey" FOREIGN KEY ("id_tutoria") REFERENCES "tutoria"("id_tutoria") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resposta" ADD CONSTRAINT "resposta_id_atividade_fkey" FOREIGN KEY ("id_atividade") REFERENCES "atividade"("id_atividade") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resposta" ADD CONSTRAINT "resposta_id_aluno_fkey" FOREIGN KEY ("id_aluno") REFERENCES "aluno"("id_aluno") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nota" ADD CONSTRAINT "nota_id_aluno_fkey" FOREIGN KEY ("id_aluno") REFERENCES "aluno"("id_aluno") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nota" ADD CONSTRAINT "nota_id_atividade_fkey" FOREIGN KEY ("id_atividade") REFERENCES "atividade"("id_atividade") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contestacao_nota" ADD CONSTRAINT "contestacao_nota_id_nota_fkey" FOREIGN KEY ("id_nota") REFERENCES "nota"("id_nota") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_id_tutoria_fkey" FOREIGN KEY ("id_tutoria") REFERENCES "tutoria"("id_tutoria") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mensagem" ADD CONSTRAINT "mensagem_id_tutoria_fkey" FOREIGN KEY ("id_tutoria") REFERENCES "tutoria"("id_tutoria") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mensagem" ADD CONSTRAINT "mensagem_id_aluno_fkey" FOREIGN KEY ("id_aluno") REFERENCES "aluno"("id_aluno") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aviso" ADD CONSTRAINT "aviso_id_sala_fkey" FOREIGN KEY ("id_sala") REFERENCES "sala"("id_sala") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aviso" ADD CONSTRAINT "aviso_id_professor_fkey" FOREIGN KEY ("id_professor") REFERENCES "professor"("id_professor") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material" ADD CONSTRAINT "material_id_tutor_sala_fkey" FOREIGN KEY ("id_tutor_sala") REFERENCES "tutor_sala"("id_tutor_sala") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "avaliacao_tutor" ADD CONSTRAINT "avaliacao_tutor_id_tutor_sala_fkey" FOREIGN KEY ("id_tutor_sala") REFERENCES "tutor_sala"("id_tutor_sala") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "avaliacao_tutor" ADD CONSTRAINT "avaliacao_tutor_id_professor_fkey" FOREIGN KEY ("id_professor") REFERENCES "professor"("id_professor") ON DELETE RESTRICT ON UPDATE CASCADE;
