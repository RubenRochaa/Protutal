// prisma/seed.ts
// Protutal - Seed Data (dados fictícios para a POC)
// Senha de todos os usuários: Protutal@123
// ATENÇÃO: apaga todos os dados existentes e reinicia os IDs em 1.

import { PrismaClient } from "../src/generated/prisma/client";

const prisma = new PrismaClient();

// Mesmo hash bcrypt do script SQL (senha: Protutal@123, custo 10)
const SENHA = "$2b$10$TJE2nKkhvUqSahuLjKxFCuwBTMFKu352UABQw.eXOsuOsdDkIEU2S";

// O "Z" faz a data ser gravada exatamente como escrita, igual ao SQL
const dt = (data: string) => new Date(`${data.replace(" ", "T")}Z`);

async function main() {
  await prisma.$transaction(async (tx) => {
    // 0. Limpeza: apaga tudo e reinicia os IDs em 1
    await tx.$executeRawUnsafe(`
      TRUNCATE TABLE
        avaliacao_tutor, material, aviso, mensagem, feedback, contestacao_nota,
        nota, resposta, atividade_destinatario, atividade, conteudo, tutoria,
        tutor_sala, tutor, pedido_tutoria, matricula, sala, aluno, professor
      RESTART IDENTITY CASCADE
    `);

    // 1. professor (ids 1 e 2)
    await tx.professor.createMany({
      data: [
        { nome: "Marcos Antônio Ribeiro", email: "marcos.ribeiro@portalsesi.org.br", senha: SENHA, email_confirmado: true },
        { nome: "Helena Duarte Campos", email: "helena.campos@portalsesi.org.br", senha: SENHA, email_confirmado: true },
      ],
    });

    // 2. aluno (ids 1 a 10)
    await tx.aluno.createMany({
      data: [
        { nome: "Ana Beatriz Lima", email: "ana.lima@portalsesisp.org.br", senha: SENHA, email_confirmado: true },               // 1: tutora da sala 1
        { nome: "Bruno Henrique Costa", email: "bruno.costa@portalsesisp.org.br", senha: SENHA, email_confirmado: true },        // 2: tutorado da Ana
        { nome: "Camila Ferreira Nunes", email: "camila.nunes@portalsesisp.org.br", senha: SENHA, email_confirmado: true },      // 3: tutorada da Ana
        { nome: "Diego Martins Alves", email: "diego.alves@portalsesisp.org.br", senha: SENHA, email_confirmado: true },         // 4: pedido pendente
        { nome: "Eduarda Souza Prado", email: "eduarda.prado@portalsesisp.org.br", senha: SENHA, email_confirmado: true },       // 5: tutora sem permissão de criar atividade
        { nome: "Felipe Araújo Teixeira", email: "felipe.teixeira@portalsesisp.org.br", senha: SENHA, email_confirmado: true },  // 6: tutorado da Eduarda
        { nome: "Gabriela Mendes Pinto", email: "gabriela.pinto@portalsesisp.org.br", senha: SENHA, email_confirmado: true },    // 7: pedido recusado
        { nome: "Heitor Oliveira Santos", email: "heitor.santos@portalsesisp.org.br", senha: SENHA, email_confirmado: true },    // 8: tutor revogado
        { nome: "Isabela Cardoso Moreira", email: "isabela.moreira@portalsesisp.org.br", senha: SENHA, email_confirmado: true }, // 9: tutoria finalizada
        { nome: "João Pedro Barros", email: "joao.barros@portalsesisp.org.br", senha: SENHA, email_confirmado: false },          // 10: e-mail não confirmado
      ],
    });

    // 3. sala (ids 1 a 3)
    await tx.sala.createMany({
      data: [
        { nome: "Geografia - 1º ano A", ano_letivo: 2026, id_professor: 1 },
        { nome: "Geografia - 2º ano A", ano_letivo: 2026, id_professor: 1 },
        { nome: "Geografia - 3º ano A", ano_letivo: 2026, id_professor: 2 },
      ],
    });

    // 4. matricula
    await tx.matricula.createMany({
      data: [
        { id_aluno: 1, id_sala: 1 }, { id_aluno: 2, id_sala: 1 }, { id_aluno: 3, id_sala: 1 }, { id_aluno: 4, id_sala: 1 },
        { id_aluno: 5, id_sala: 2 }, { id_aluno: 6, id_sala: 2 }, { id_aluno: 7, id_sala: 2 },
        { id_aluno: 8, id_sala: 3 }, { id_aluno: 9, id_sala: 3 }, { id_aluno: 10, id_sala: 3 },
      ],
    });

    // 5. conteudo (ids 1 a 6)
    await tx.conteudo.createMany({
      data: [
        { id_sala: 1, nome: "Cartografia" },
        { id_sala: 1, nome: "Climatologia" },
        { id_sala: 2, nome: "Urbanização" },
        { id_sala: 2, nome: "Geografia agrária" },
        { id_sala: 3, nome: "Globalização" },
        { id_sala: 3, nome: "Geopolítica" },
      ],
    });

    // 6. pedido_tutoria (ids 1 a 5: três aceitos, um recusado, um pendente)
    await tx.pedido_tutoria.createMany({
      data: [
        { id_aluno: 1, status: "aceito", data_solicitacao: dt("2026-02-10 10:00:00"), data_decisao: dt("2026-02-12 14:00:00"), id_professor: 1 },
        { id_aluno: 5, status: "aceito", data_solicitacao: dt("2026-02-10 10:00:00"), data_decisao: dt("2026-02-12 14:00:00"), id_professor: 1 },
        { id_aluno: 8, status: "aceito", data_solicitacao: dt("2026-02-10 10:00:00"), data_decisao: dt("2026-02-12 14:00:00"), id_professor: 2 },
        { id_aluno: 7, status: "recusado", data_solicitacao: dt("2026-02-11 09:00:00"), data_decisao: dt("2026-02-13 11:00:00"), id_professor: 1 },
        { id_aluno: 4, status: "pendente", data_solicitacao: dt("2026-10-05 16:30:00"), data_decisao: null, id_professor: null },
      ],
    });

    // 7. tutor (ids 1 a 3: somente pedidos aceitos)
    await tx.tutor.createMany({
      data: [
        { id_aluno: 1, id_pedido: 1 },
        { id_aluno: 5, id_pedido: 2 },
        { id_aluno: 8, id_pedido: 3 },
      ],
    });

    // 8. tutor_sala (ids 1 a 3)
    await tx.tutor_sala.createMany({
      data: [
        { id_tutor: 1, id_sala: 1, data_definicao: dt("2026-02-12 14:00:00"), pode_criar_ativ: true, data_revogacao: null },
        { id_tutor: 2, id_sala: 2, data_definicao: dt("2026-02-12 14:00:00"), pode_criar_ativ: false, data_revogacao: null },
        { id_tutor: 3, id_sala: 3, data_definicao: dt("2026-02-12 14:00:00"), pode_criar_ativ: true, data_revogacao: dt("2026-06-30 17:00:00") },
      ],
    });

    // 9. tutoria (ids 1 a 4: três ativas, uma finalizada)
    await tx.tutoria.createMany({
      data: [
        { id_tutor_sala: 1, id_aluno: 2, meta_aprendizagem: "Interpretar escalas e projeções cartográficas.", status: "ativa", data_inicio: dt("2026-03-02 08:00:00"), data_fim: null },
        { id_tutor_sala: 1, id_aluno: 3, meta_aprendizagem: "Relacionar tipos climáticos e climogramas.", status: "ativa", data_inicio: dt("2026-03-02 08:00:00"), data_fim: null },
        { id_tutor_sala: 2, id_aluno: 6, meta_aprendizagem: null, status: "ativa", data_inicio: dt("2026-03-02 08:00:00"), data_fim: null },
        { id_tutor_sala: 3, id_aluno: 9, meta_aprendizagem: "Compreender a formação dos blocos econômicos.", status: "finalizada", data_inicio: dt("2026-03-02 08:00:00"), data_fim: dt("2026-06-30 17:00:00") },
      ],
    });

    // 10. atividade (ids 1 a 3; coluna "tipo" fica nula)
    await tx.atividade.createMany({
      data: [
        { id_tutor_sala: 1, id_conteudo: 1, titulo: "Leitura de mapas e escalas", descricao: "Calcule as distâncias reais a partir das escalas indicadas em cada mapa.", data_entrega: dt("2026-09-15 23:59:00") },
        { id_tutor_sala: 1, id_conteudo: 2, titulo: "Climogramas do Brasil", descricao: "Identifique o tipo climático representado em cada climograma.", data_entrega: dt("2026-10-30 23:59:00") },
        { id_tutor_sala: 3, id_conteudo: 5, titulo: "Blocos econômicos", descricao: "Compare os objetivos do Mercosul e da União Europeia.", data_entrega: dt("2026-05-20 23:59:00") },
      ],
    });

    // 11. atividade_destinatario (a atividade 2 vai só para o Bruno)
    await tx.atividade_destinatario.createMany({
      data: [
        { id_atividade: 1, id_tutoria: 1 },
        { id_atividade: 1, id_tutoria: 2 },
        { id_atividade: 2, id_tutoria: 1 },
        { id_atividade: 3, id_tutoria: 4 },
      ],
    });

    // 12. resposta (a atividade 2 fica sem resposta: em aberto)
    await tx.resposta.createMany({
      data: [
        { id_atividade: 1, id_aluno: 2, texto: "Na escala 1:50.000, 4 cm no mapa equivalem a 2 km.", conteudo_file: null, data_envio: dt("2026-09-14 19:20:00") },
        { id_atividade: 1, id_aluno: 3, texto: null, conteudo_file: "uploads/respostas/atv1-camila.jpg", data_envio: dt("2026-09-15 08:05:00") },
        { id_atividade: 3, id_aluno: 9, texto: "O Mercosul é uma união aduaneira; a União Europeia tem moeda única.", conteudo_file: null, data_envio: dt("2026-05-19 21:10:00") },
      ],
    });

    // 13. nota (ids 1 a 3)
    await tx.nota.createMany({
      data: [
        { id_aluno: 2, id_atividade: 1, valor: "6.50", comentario: "Errou a conversão de unidades na questão 3." },
        { id_aluno: 3, id_atividade: 1, valor: "9.00", comentario: "Ótimo domínio de escalas." },
        { id_aluno: 9, id_atividade: 3, valor: "8.00", comentario: "Boa comparação entre os blocos." },
      ],
    });

    // 14. contestacao_nota (uma pendente em tutoria ativa, uma resolvida em tutoria finalizada)
    await tx.contestacao_nota.createMany({
      data: [
        { id_nota: 1, comentario: "Acredito que a questão 3 foi corrigida com a escala errada.", status: "pendente", data_envio: dt("2026-09-20 10:00:00"), decisao: null, data_resolucao: null },
        { id_nota: 3, comentario: "Gostaria de revisão do critério de comparação.", status: "resolvida", data_envio: dt("2026-05-25 09:00:00"), decisao: "Nota mantida: a resposta não citou a livre circulação de pessoas.", data_resolucao: dt("2026-05-27 15:00:00") },
      ],
    });

    // 15. feedback (do tutorado para o tutor, por etapa)
    await tx.feedback.createMany({
      data: [
        { id_tutoria: 1, etapa: 1, nota: "9.00", comentario: "Explica com paciência e usa exemplos do dia a dia.", data: dt("2026-05-29 12:00:00") },
        { id_tutoria: 2, etapa: 1, nota: "8.50", comentario: "Ajudou bastante com os mapas.", data: dt("2026-05-29 12:30:00") },
        { id_tutoria: 4, etapa: 1, nota: "7.00", comentario: "Poderia responder mais rápido.", data: dt("2026-04-30 12:00:00") },
        { id_tutoria: 4, etapa: 2, nota: "8.00", comentario: null, data: dt("2026-06-26 12:00:00") },
      ],
    });

    // 16. mensagem (id_aluno = remetente; o tutor também é aluno)
    await tx.mensagem.createMany({
      data: [
        { id_tutoria: 1, id_aluno: 2, assunto: null, texto: "Ana, não entendi como converter cm para km.", data_envio: dt("2026-09-10 18:00:00") },
        { id_tutoria: 1, id_aluno: 1, assunto: null, texto: "Divide por 100.000. Amanhã te mostro com um exemplo.", data_envio: dt("2026-09-10 18:12:00") },
        { id_tutoria: 3, id_aluno: 5, assunto: "Encontro da semana", texto: "Nosso encontro passa para quinta-feira, no mesmo horário.", data_envio: dt("2026-10-01 09:00:00") },
      ],
    });

    // 17. aviso
    await tx.aviso.createMany({
      data: [
        { id_sala: 1, id_professor: 1, titulo: "Início da 3ª etapa", conteudo: "As tutorias da 3ª etapa começam na próxima segunda-feira.", data_publicacao: dt("2026-08-03 08:00:00") },
        { id_sala: 3, id_professor: 2, titulo: "Encerramento das tutorias", conteudo: "As tutorias do 1º semestre foram finalizadas.", data_publicacao: dt("2026-06-30 17:30:00") },
      ],
    });

    // 18. material
    await tx.material.createMany({
      data: [
        { id_tutor_sala: 1, titulo: "Resumo de cartografia", descricao: "Escalas, projeções e coordenadas.", arquivo: "uploads/materiais/resumo-cartografia.pdf", data_envio: dt("2026-03-10 14:00:00") },
        { id_tutor_sala: 2, titulo: "Mapa mental de urbanização", descricao: null, arquivo: "uploads/materiais/mapa-mental-urbanizacao.pdf", data_envio: dt("2026-03-12 14:00:00") },
      ],
    });

    // 19. avaliacao_tutor
    await tx.avaliacao_tutor.createMany({
      data: [
        { id_tutor_sala: 1, id_professor: 1, comentario: "Tutora organizada; os tutorados evoluíram em cartografia.", data: dt("2026-06-05 10:00:00") },
        { id_tutor_sala: 3, id_professor: 2, comentario: "Bom domínio do conteúdo, mas demorou a corrigir as atividades.", data: dt("2026-06-30 16:00:00") },
      ],
    });
  });

  console.log("Seed concluído. Senha de todos os usuários: Protutal@123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());