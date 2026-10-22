-- Protutal - Seed Data (dados fictícios para a POC)
-- Senha de todos os usuários: Protutal@123 (hash bcrypt, custo 10)
-- ATENÇÃO: apaga todos os dados existentes e reinicia os IDs em 1.

BEGIN;

TRUNCATE TABLE
  avaliacao_tutor, material, aviso, mensagem, feedback, contestacao_nota,
  nota, resposta, atividade_destinatario, atividade, sala_conteudo, conteudo, tutoria,
  tutor_sala, tutor, pedido_tutoria, matricula, sala, aluno, professor
RESTART IDENTITY CASCADE;

-- 1. professor (ids 1 a 3)
INSERT INTO professor (nome, email, senha, email_confirmado) VALUES
  ('Marcos Antônio Ribeiro', 'marcos.ribeiro@portalsesi.org.br', '$2b$10$TJE2nKkhvUqSahuLjKxFCuwBTMFKu352UABQw.eXOsuOsdDkIEU2S', true),  -- 1: salas 1 e 2
  ('Helena Duarte Campos',   'helena.campos@portalsesi.org.br',  '$2b$10$TJE2nKkhvUqSahuLjKxFCuwBTMFKu352UABQw.eXOsuOsdDkIEU2S', true),  -- 2: salas 3 e 5
  ('Ricardo Tavares Lopes',  'ricardo.lopes@portalsesi.org.br',  '$2b$10$TJE2nKkhvUqSahuLjKxFCuwBTMFKu352UABQw.eXOsuOsdDkIEU2S', true);  -- 3: sala 4

-- 2. aluno (ids 1 a 20)
INSERT INTO aluno (nome, email, senha, email_confirmado, token_confirmacao, token_expiracao) VALUES
  ('Ana Beatriz Lima',        'ana.lima@portalsesisp.org.br',        '$2b$10$TJE2nKkhvUqSahuLjKxFCuwBTMFKu352UABQw.eXOsuOsdDkIEU2S', true,  NULL, NULL),  -- 1: tutora da sala 1
  ('Bruno Henrique Costa',    'bruno.costa@portalsesisp.org.br',     '$2b$10$TJE2nKkhvUqSahuLjKxFCuwBTMFKu352UABQw.eXOsuOsdDkIEU2S', true,  NULL, NULL),  -- 2: tutorado da Ana
  ('Camila Ferreira Nunes',   'camila.nunes@portalsesisp.org.br',    '$2b$10$TJE2nKkhvUqSahuLjKxFCuwBTMFKu352UABQw.eXOsuOsdDkIEU2S', true,  NULL, NULL),  -- 3: tutorada da Ana
  ('Diego Martins Alves',     'diego.alves@portalsesisp.org.br',     '$2b$10$TJE2nKkhvUqSahuLjKxFCuwBTMFKu352UABQw.eXOsuOsdDkIEU2S', true,  NULL, NULL),  -- 4: pedido pendente; tutorado da Ana
  ('Eduarda Souza Prado',     'eduarda.prado@portalsesisp.org.br',   '$2b$10$TJE2nKkhvUqSahuLjKxFCuwBTMFKu352UABQw.eXOsuOsdDkIEU2S', true,  NULL, NULL),  -- 5: tutora sem permissão de criar atividade
  ('Felipe Araújo Teixeira',  'felipe.teixeira@portalsesisp.org.br', '$2b$10$TJE2nKkhvUqSahuLjKxFCuwBTMFKu352UABQw.eXOsuOsdDkIEU2S', true,  NULL, NULL),  -- 6: tutorado da Eduarda
  ('Gabriela Mendes Pinto',   'gabriela.pinto@portalsesisp.org.br',  '$2b$10$TJE2nKkhvUqSahuLjKxFCuwBTMFKu352UABQw.eXOsuOsdDkIEU2S', true,  NULL, NULL),  -- 7: pedido recusado; tutorada da Eduarda
  ('Heitor Oliveira Santos',  'heitor.santos@portalsesisp.org.br',   '$2b$10$TJE2nKkhvUqSahuLjKxFCuwBTMFKu352UABQw.eXOsuOsdDkIEU2S', true,  NULL, NULL),  -- 8: tutor revogado
  ('Isabela Cardoso Moreira', 'isabela.moreira@portalsesisp.org.br', '$2b$10$TJE2nKkhvUqSahuLjKxFCuwBTMFKu352UABQw.eXOsuOsdDkIEU2S', true,  NULL, NULL),  -- 9: tutoria finalizada
  ('João Pedro Barros',       'joao.barros@portalsesisp.org.br',     '$2b$10$TJE2nKkhvUqSahuLjKxFCuwBTMFKu352UABQw.eXOsuOsdDkIEU2S', false, '4b8e2f1a-7c3d-4e9a-9b1f-2d6c8a0e5f31', '2026-10-17 12:00:00'),  -- 10: e-mail não confirmado
  ('Karina Rocha Silveira',   'karina.silveira@portalsesisp.org.br', '$2b$10$TJE2nKkhvUqSahuLjKxFCuwBTMFKu352UABQw.eXOsuOsdDkIEU2S', true,  NULL, NULL),  -- 11: sala 2, sem tutoria
  ('Lucas Gomes Ferraz',      'lucas.ferraz@portalsesisp.org.br',    '$2b$10$TJE2nKkhvUqSahuLjKxFCuwBTMFKu352UABQw.eXOsuOsdDkIEU2S', true,  NULL, NULL),  -- 12: tutoria finalizada com Heitor
  ('Mariana Castro Dias',     'mariana.dias@portalsesisp.org.br',    '$2b$10$TJE2nKkhvUqSahuLjKxFCuwBTMFKu352UABQw.eXOsuOsdDkIEU2S', true,  NULL, NULL),  -- 13: tutora da sala 4
  ('Nicolas Ramos Vieira',    'nicolas.vieira@portalsesisp.org.br',  '$2b$10$TJE2nKkhvUqSahuLjKxFCuwBTMFKu352UABQw.eXOsuOsdDkIEU2S', true,  NULL, NULL),  -- 14: pedido recusado; tutorado da Mariana
  ('Olívia Freitas Monteiro', 'olivia.monteiro@portalsesisp.org.br', '$2b$10$TJE2nKkhvUqSahuLjKxFCuwBTMFKu352UABQw.eXOsuOsdDkIEU2S', true,  NULL, NULL),  -- 15: tutorada da Mariana
  ('Pedro Henrique Azevedo',  'pedro.azevedo@portalsesisp.org.br',   '$2b$10$TJE2nKkhvUqSahuLjKxFCuwBTMFKu352UABQw.eXOsuOsdDkIEU2S', true,  NULL, NULL),  -- 16: tutorado da Mariana
  ('Rafaela Cunha Batista',   'rafaela.batista@portalsesisp.org.br', '$2b$10$TJE2nKkhvUqSahuLjKxFCuwBTMFKu352UABQw.eXOsuOsdDkIEU2S', true,  NULL, NULL),  -- 17: tutora da sala 5
  ('Samuel Lopes Rezende',    'samuel.rezende@portalsesisp.org.br',  '$2b$10$TJE2nKkhvUqSahuLjKxFCuwBTMFKu352UABQw.eXOsuOsdDkIEU2S', true,  NULL, NULL),  -- 18: pedido pendente; tutorado da Rafaela
  ('Tatiane Moura Fonseca',   'tatiane.fonseca@portalsesisp.org.br', '$2b$10$TJE2nKkhvUqSahuLjKxFCuwBTMFKu352UABQw.eXOsuOsdDkIEU2S', true,  NULL, NULL),  -- 19: tutorada da Rafaela
  ('Vinícius Correia Lima',   'vinicius.lima@portalsesisp.org.br',   '$2b$10$TJE2nKkhvUqSahuLjKxFCuwBTMFKu352UABQw.eXOsuOsdDkIEU2S', false, '9d2c7a4e-1f6b-4c8d-a3e5-7b0f9c2d1e84', '2026-10-17 12:00:00'); -- 20: e-mail não confirmado

-- 3. sala (ids 1 a 5)
INSERT INTO sala (nome, serie, ano_letivo, id_professor) VALUES
  ('Geografia - 1º ano A', 1, 2026, 1),
  ('Geografia - 2º ano A', 2, 2026, 1),
  ('Geografia - 3º ano A', 3, 2026, 2),
  ('Geografia - 1º ano B', 1, 2026, 3),
  ('Geografia - 2º ano B', 2, 2026, 2);

-- 4. matricula (ids 1 a 20: 4 alunos por sala)
INSERT INTO matricula (id_aluno, id_sala) VALUES
  (1, 1), (2, 1), (3, 1), (4, 1),
  (5, 2), (6, 2), (7, 2), (11, 2),
  (8, 3), (9, 3), (10, 3), (12, 3),
  (13, 4), (14, 4), (15, 4), (16, 4),
  (17, 5), (18, 5), (19, 5), (20, 5);

-- 5. conteudo (ids 1 a 10; nome é único)
INSERT INTO conteudo (nome) VALUES
  ('Cartografia'), ('Climatologia'), ('Urbanização'), ('Geografia agrária'), ('Globalização'),
  ('Geopolítica'), ('Geomorfologia'), ('Hidrografia'), ('Demografia'), ('Fontes de energia');

-- 6. sala_conteudo (ids 1 a 14)
INSERT INTO sala_conteudo (id_sala, id_conteudo) VALUES
  (1, 1), (1, 2), (1, 7),
  (2, 3), (2, 4), (2, 9),
  (3, 5), (3, 6), (3, 10),
  (4, 1), (4, 7), (4, 8),
  (5, 3), (5, 9);

-- 7. pedido_tutoria (ids 1 a 9: 5 aceitos, 2 recusados, 2 pendentes; professor = da sala)
INSERT INTO pedido_tutoria (id_aluno, id_sala, status, data_solicitacao, data_decisao, id_professor) VALUES
  (1,  1, 'aceito',   '2026-02-10 10:00:00', '2026-02-12 14:00:00', 1),     -- 1
  (5,  2, 'aceito',   '2026-02-10 10:00:00', '2026-02-12 14:00:00', 1),     -- 2
  (8,  3, 'aceito',   '2026-02-10 10:00:00', '2026-02-12 14:00:00', 2),     -- 3
  (7,  2, 'recusado', '2026-02-11 09:00:00', '2026-02-13 11:00:00', 1),     -- 4
  (4,  1, 'pendente', '2026-10-05 16:30:00', NULL,                  NULL),  -- 5
  (13, 4, 'aceito',   '2026-02-16 10:00:00', '2026-02-18 15:00:00', 3),     -- 6
  (17, 5, 'aceito',   '2026-02-17 10:00:00', '2026-02-19 15:00:00', 2),     -- 7
  (14, 4, 'recusado', '2026-02-16 11:00:00', '2026-02-18 15:30:00', 3),     -- 8
  (18, 5, 'pendente', '2026-10-08 14:00:00', NULL,                  NULL);  -- 9

-- 8. tutor (ids 1 a 5: somente pedidos aceitos)
INSERT INTO tutor (id_aluno, id_pedido) VALUES
  (1, 1), (5, 2), (8, 3), (13, 6), (17, 7);

-- 9. tutor_sala (ids 1 a 5: mesma sala do pedido)
INSERT INTO tutor_sala (id_tutor, id_sala, data_definicao, pode_criar_ativ, data_revogacao) VALUES
  (1, 1, '2026-02-12 14:00:00', true,  NULL),
  (2, 2, '2026-02-12 14:00:00', false, NULL),
  (3, 3, '2026-02-12 14:00:00', true,  '2026-06-30 17:00:00'),
  (4, 4, '2026-02-18 15:00:00', true,  NULL),
  (5, 5, '2026-02-19 15:00:00', true,  NULL);

-- 10. tutoria (ids 1 a 12: 10 ativas, 2 finalizadas)
INSERT INTO tutoria (id_tutor_sala, id_aluno, meta_aprendizagem, status, data_inicio, data_fim) VALUES
  (1, 2,  'Interpretar escalas e projeções cartográficas.', 'ativa',      '2026-03-02 08:00:00', NULL),                   -- 1
  (1, 3,  'Relacionar tipos climáticos e climogramas.',     'ativa',      '2026-03-02 08:00:00', NULL),                   -- 2
  (2, 6,  NULL,                                             'ativa',      '2026-03-02 08:00:00', NULL),                   -- 3
  (3, 9,  'Compreender a formação dos blocos econômicos.',  'finalizada', '2026-03-02 08:00:00', '2026-06-30 17:00:00'),  -- 4
  (1, 4,  'Reconhecer as formas de relevo brasileiras.',    'ativa',      '2026-08-10 08:00:00', NULL),                   -- 5
  (2, 7,  'Entender o processo de urbanização no Brasil.',  'ativa',      '2026-03-02 08:00:00', NULL),                   -- 6
  (3, 12, 'Analisar conflitos geopolíticos atuais.',        'finalizada', '2026-03-02 08:00:00', '2026-06-30 17:00:00'),  -- 7
  (4, 14, 'Localizar as bacias hidrográficas do Brasil.',   'ativa',      '2026-03-02 08:00:00', NULL),                   -- 8
  (4, 15, NULL,                                             'ativa',      '2026-03-02 08:00:00', NULL),                   -- 9
  (4, 16, 'Usar coordenadas geográficas.',                  'ativa',      '2026-03-02 08:00:00', NULL),                   -- 10
  (5, 18, 'Interpretar pirâmides etárias.',                 'ativa',      '2026-03-02 08:00:00', NULL),                   -- 11
  (5, 19, NULL,                                             'ativa',      '2026-03-02 08:00:00', NULL);                   -- 12

-- 11. atividade (ids 1 a 8; só tutores com pode_criar_ativ; conteúdo ligado à sala; "tipo" fica nulo)
INSERT INTO atividade (id_tutor_sala, id_conteudo, titulo, descricao, data_entrega) VALUES
  (1, 1, 'Leitura de mapas e escalas',     'Calcule as distâncias reais a partir das escalas indicadas em cada mapa.', '2026-09-15 23:59:00'),  -- 1
  (1, 2, 'Climogramas do Brasil',          'Identifique o tipo climático representado em cada climograma.',            '2026-10-30 23:59:00'),  -- 2
  (3, 5, 'Blocos econômicos',              'Compare os objetivos do Mercosul e da União Europeia.',                    '2026-05-20 23:59:00'),  -- 3
  (1, 7, 'Formas de relevo',               'Identifique planaltos, planícies e depressões no mapa do Brasil.',         '2026-11-10 23:59:00'),  -- 4
  (4, 8, 'Bacias hidrográficas do Brasil', 'Localize as principais bacias e cite um uso econômico de cada uma.',       '2026-09-25 23:59:00'),  -- 5
  (4, 1, 'Coordenadas geográficas',        'Determine a latitude e a longitude das cidades indicadas.',                '2026-10-20 23:59:00'),  -- 6
  (5, 9, 'Pirâmides etárias',              'Compare as pirâmides etárias do Brasil de 1980 e 2020.',                   '2026-09-30 23:59:00'),  -- 7
  (3, 6, 'Conflitos territoriais',         'Explique a origem de um conflito territorial atual.',                      '2026-06-10 23:59:00');  -- 8

-- 12. atividade_destinatario (ids 1 a 16; só tutorias do tutor que criou a atividade)
INSERT INTO atividade_destinatario (id_atividade, id_tutoria) VALUES
  (1, 1), (1, 2),
  (2, 1),
  (3, 4),
  (4, 1), (4, 2), (4, 5),
  (5, 8), (5, 9), (5, 10),
  (6, 8), (6, 9),
  (7, 11), (7, 12),
  (8, 4), (8, 7);

-- 13. resposta (ids 1 a 8; atividades 2, 4 e 6 ficam em aberto)
INSERT INTO resposta (id_atividade, id_aluno, texto, conteudo_file, data_envio) VALUES
  (1, 2,  'Na escala 1:50.000, 4 cm no mapa equivalem a 2 km.', NULL,                                 '2026-09-14 19:20:00'),
  (1, 3,  NULL,                                                 'uploads/respostas/atv1-camila.jpg',  '2026-09-15 08:05:00'),
  (3, 9,  'O Mercosul é uma união aduaneira; a União Europeia tem moeda única.', NULL,                '2026-05-19 21:10:00'),
  (5, 14, 'Bacia Amazônica: transporte fluvial; Bacia do Paraná: geração de energia.', NULL,          '2026-09-24 20:00:00'),
  (5, 15, NULL,                                                 'uploads/respostas/atv5-olivia.pdf',  '2026-09-25 10:30:00'),
  (7, 18, 'Em 2020 a base é mais estreita, mostrando queda da natalidade.', NULL,                     '2026-09-29 19:00:00'),
  (8, 9,  'O conflito na Caxemira começou com a partição da Índia em 1947.', NULL,                    '2026-06-09 18:00:00'),
  (8, 12, 'A disputa pelo Saara Ocidental envolve Marrocos e a Frente Polisário.', NULL,              '2026-06-10 21:00:00');

-- 14. nota (ids 1 a 8)
INSERT INTO nota (id_aluno, id_atividade, valor, comentario, data_lancamento) VALUES
  (2,  1, 6.50, 'Errou a conversão de unidades na questão 3.',         '2026-09-17 10:00:00'),  -- 1
  (3,  1, 9.00, 'Ótimo domínio de escalas.',                           '2026-09-17 10:05:00'),  -- 2
  (9,  3, 8.00, 'Boa comparação entre os blocos.',                     '2026-05-22 10:00:00'),  -- 3
  (14, 5, 7.50, 'Faltou citar a Bacia do São Francisco.',              '2026-09-27 14:00:00'),  -- 4
  (15, 5, 9.50, 'Mapa muito bem feito.',                               '2026-09-27 14:10:00'),  -- 5
  (18, 7, 6.50, 'Nota revisada após contestação.',                     '2026-10-02 10:00:00'),  -- 6
  (9,  8, 8.50, 'Boa contextualização histórica.',                     '2026-06-12 10:00:00'),  -- 7
  (12, 8, 6.00, 'Faltou explicar a posição da ONU.',                   '2026-06-12 10:10:00');  -- 8

-- 15. contestacao_nota (ids 1 a 3: pendente, recusada, aceita)
INSERT INTO contestacao_nota (id_nota, comentario, status, data_envio, decisao, data_resolucao) VALUES
  (1, 'Acredito que a questão 3 foi corrigida com a escala errada.', 'pendente', '2026-09-20 10:00:00', NULL, NULL),
  (3, 'Gostaria de revisão do critério de comparação.',              'recusada', '2026-05-25 09:00:00',
      'Nota mantida: a resposta não citou a livre circulação de pessoas.', '2026-05-27 15:00:00'),
  (6, 'A comparação da base das pirâmides está na questão 2.',       'aceita',   '2026-10-03 09:00:00',
      'Nota alterada de 5,00 para 6,50: a comparação estava na questão 2.', '2026-10-05 16:00:00');

-- 16. feedback (ids 1 a 8; do tutorado para o tutor, por etapa)
INSERT INTO feedback (id_tutoria, etapa, nota, comentario, rubrica_file, data) VALUES
  (1,  1, 9.00, 'Explica com paciência e usa exemplos do dia a dia.', NULL,                                   '2026-05-29 12:00:00'),
  (2,  1, 8.50, 'Ajudou bastante com os mapas.',                      NULL,                                   '2026-05-29 12:30:00'),
  (4,  1, 7.00, 'Poderia responder mais rápido.',                     NULL,                                   '2026-04-30 12:00:00'),
  (4,  2, 8.00, NULL,                                                 NULL,                                   '2026-06-26 12:00:00'),
  (8,  1, 9.50, 'Os exemplos com mapas da cidade ajudaram muito.',    'uploads/rubricas/tutoria8-etapa1.pdf', '2026-05-29 13:00:00'),
  (9,  1, 8.00, NULL,                                                 NULL,                                   '2026-05-29 13:10:00'),
  (11, 1, 7.50, 'Gostaria de mais encontros antes das provas.',       NULL,                                   '2026-05-29 14:00:00'),
  (7,  1, 8.50, 'Explicou bem a geopolítica atual.',                  NULL,                                   '2026-04-30 12:30:00');

-- 17. mensagem (ids 1 a 7; id_remetente = aluno que enviou, tutor ou tutorado)
INSERT INTO mensagem (id_tutoria, id_remetente, assunto, texto, data_envio) VALUES
  (1,  2,  NULL, 'Ana, não entendi como converter cm para km.',          '2026-09-10 18:00:00'),
  (1,  1,  NULL, 'Divide por 100.000. Amanhã te mostro com um exemplo.', '2026-09-10 18:12:00'),
  (3,  5,  'Encontro da semana', 'Nosso encontro passa para quinta-feira, no mesmo horário.', '2026-10-01 09:00:00'),
  (8,  13, 'Atividade de hidrografia', 'Nicolas, lembra de entregar a atividade das bacias até quinta.', '2026-09-22 17:00:00'),
  (8,  14, NULL, 'Combinado, Mariana! Vou mandar amanhã.',               '2026-09-22 17:20:00'),
  (11, 18, NULL, 'Rafaela, pode me explicar de novo a pirâmide etária?', '2026-09-27 19:00:00'),
  (11, 17, NULL, 'Claro! A base larga indica alta natalidade.',          '2026-09-27 19:15:00');

-- 18. aviso (ids 1 a 5; professor da própria sala)
INSERT INTO aviso (id_sala, id_professor, titulo, conteudo, data_publicacao) VALUES
  (1, 1, 'Início da 3ª etapa',               'As tutorias da 3ª etapa começam na próxima segunda-feira.',  '2026-08-03 08:00:00'),
  (3, 2, 'Encerramento das tutorias',        'As tutorias do 1º semestre foram finalizadas.',              '2026-06-30 17:30:00'),
  (4, 3, 'Boas-vindas à tutoria',            'A tutora da turma já foi definida. Procurem a Mariana.',     '2026-02-20 08:00:00'),
  (5, 2, 'Prazo da atividade de demografia', 'A atividade sobre pirâmides etárias vence no dia 30/09.',    '2026-09-15 08:00:00'),
  (2, 1, 'Reunião de tutores',               'Tutores do 2º ano: reunião na sexta-feira, após a aula.',    '2026-09-01 08:00:00');

-- 19. material (ids 1 a 5)
INSERT INTO material (id_tutor_sala, titulo, descricao, arquivo, data_envio) VALUES
  (1, 'Resumo de cartografia',         'Escalas, projeções e coordenadas.',                   'uploads/materiais/resumo-cartografia.pdf',      '2026-03-10 14:00:00'),
  (2, 'Mapa mental de urbanização',    NULL,                                                  'uploads/materiais/mapa-mental-urbanizacao.pdf', '2026-03-12 14:00:00'),
  (4, 'Lista de bacias hidrográficas', 'Principais bacias e seus rios.',                      'uploads/materiais/bacias-hidrograficas.pdf',    '2026-09-05 14:00:00'),
  (5, 'Exemplos de pirâmides etárias', NULL,                                                  'uploads/materiais/piramides-etarias.pdf',       '2026-09-10 14:00:00'),
  (3, 'Resumo de geopolítica',         'Principais conflitos e organizações internacionais.', 'uploads/materiais/resumo-geopolitica.pdf',      '2026-04-15 14:00:00');

-- 20. avaliacao_tutor (ids 1 a 4; professor da sala do tutor)
INSERT INTO avaliacao_tutor (id_tutor_sala, id_professor, nota, comentario, data) VALUES
  (1, 1, 9.00, 'Tutora organizada; os tutorados evoluíram em cartografia.',         '2026-06-05 10:00:00'),
  (3, 2, 7.00, 'Bom domínio do conteúdo, mas demorou a corrigir as atividades.',    '2026-06-30 16:00:00'),
  (4, 3, 9.50, 'Tutora muito presente; tutorados com ótimas notas em hidrografia.', '2026-10-01 10:00:00'),
  (2, 1, 8.00, 'Tutora atenciosa; poderia propor mais materiais.',                  '2026-06-05 10:30:00');

COMMIT;

-- Conferência: total real x esperado
SELECT t.tabela, t.total, t.esperado, (t.total = t.esperado) AS ok FROM (
  SELECT 'professor' AS tabela, (SELECT COUNT(*) FROM professor) AS total, 3 AS esperado
  UNION ALL SELECT 'aluno',                  (SELECT COUNT(*) FROM aluno),                  20
  UNION ALL SELECT 'sala',                   (SELECT COUNT(*) FROM sala),                   5
  UNION ALL SELECT 'matricula',              (SELECT COUNT(*) FROM matricula),              20
  UNION ALL SELECT 'conteudo',               (SELECT COUNT(*) FROM conteudo),               10
  UNION ALL SELECT 'sala_conteudo',          (SELECT COUNT(*) FROM sala_conteudo),          14
  UNION ALL SELECT 'pedido_tutoria',         (SELECT COUNT(*) FROM pedido_tutoria),         9
  UNION ALL SELECT 'tutor',                  (SELECT COUNT(*) FROM tutor),                  5
  UNION ALL SELECT 'tutor_sala',             (SELECT COUNT(*) FROM tutor_sala),             5
  UNION ALL SELECT 'tutoria',                (SELECT COUNT(*) FROM tutoria),                12
  UNION ALL SELECT 'atividade',              (SELECT COUNT(*) FROM atividade),              8
  UNION ALL SELECT 'atividade_destinatario', (SELECT COUNT(*) FROM atividade_destinatario), 16
  UNION ALL SELECT 'resposta',               (SELECT COUNT(*) FROM resposta),               8
  UNION ALL SELECT 'nota',                   (SELECT COUNT(*) FROM nota),                   8
  UNION ALL SELECT 'contestacao_nota',       (SELECT COUNT(*) FROM contestacao_nota),       3
  UNION ALL SELECT 'feedback',               (SELECT COUNT(*) FROM feedback),               8
  UNION ALL SELECT 'mensagem',               (SELECT COUNT(*) FROM mensagem),               7
  UNION ALL SELECT 'aviso',                  (SELECT COUNT(*) FROM aviso),                  5
  UNION ALL SELECT 'material',               (SELECT COUNT(*) FROM material),               5
  UNION ALL SELECT 'avaliacao_tutor',        (SELECT COUNT(*) FROM avaliacao_tutor),        4
) t;
