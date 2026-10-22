-- Protutal - Seed Data (dados fictícios para a POC)
-- Senha de todos os usuários: 1234 (hash bcrypt, custo 10)
-- ATENÇÃO: apaga todos os dados existentes e reinicia os IDs em 1.

BEGIN;

TRUNCATE TABLE
  avaliacao_tutor, material, aviso, mensagem, feedback, contestacao_nota,
  nota, resposta, atividade_destinatario, atividade, conteudo, tutoria,
  tutor_sala, tutor, pedido_tutoria, matricula, sala, aluno, professor
RESTART IDENTITY CASCADE;

-- 1. professor (ids 1 e 2)
INSERT INTO professor (nome, email, senha, email_confirmado) VALUES
  ('Marcos Antônio Ribeiro', 'marcos.ribeiro@portalsesi.org.br', '$2b$10$S6dXU2xAOQqRgkIFWF0iMOA/V2IRWUEa1O.tqi1WNkCVAZ3q9NEu2', true),
  ('Helena Duarte Campos',   'helena.campos@portalsesi.org.br',  '$2b$10$S6dXU2xAOQqRgkIFWF0iMOA/V2IRWUEa1O.tqi1WNkCVAZ3q9NEu2', true);

-- 2. aluno (ids 1 a 10)
INSERT INTO aluno (nome, email, senha, email_confirmado) VALUES
  ('Ana Beatriz Lima',        'ana.lima@portalsesisp.org.br',        '$2b$10$S6dXU2xAOQqRgkIFWF0iMOA/V2IRWUEa1O.tqi1WNkCVAZ3q9NEu2', true),  -- 1: tutora da sala 1
  ('Bruno Henrique Costa',    'bruno.costa@portalsesisp.org.br',     '$2b$10$S6dXU2xAOQqRgkIFWF0iMOA/V2IRWUEa1O.tqi1WNkCVAZ3q9NEu2', true),  -- 2: tutorado da Ana
  ('Camila Ferreira Nunes',   'camila.nunes@portalsesisp.org.br',    '$2b$10$S6dXU2xAOQqRgkIFWF0iMOA/V2IRWUEa1O.tqi1WNkCVAZ3q9NEu2', true),  -- 3: tutorada da Ana
  ('Diego Martins Alves',     'diego.alves@portalsesisp.org.br',     '$2b$10$S6dXU2xAOQqRgkIFWF0iMOA/V2IRWUEa1O.tqi1WNkCVAZ3q9NEu2', true),  -- 4: pedido pendente
  ('Eduarda Souza Prado',     'eduarda.prado@portalsesisp.org.br',   '$2b$10$S6dXU2xAOQqRgkIFWF0iMOA/V2IRWUEa1O.tqi1WNkCVAZ3q9NEu2', true),  -- 5: tutora sem permissão de criar atividade
  ('Felipe Araújo Teixeira',  'felipe.teixeira@portalsesisp.org.br', '$2b$10$S6dXU2xAOQqRgkIFWF0iMOA/V2IRWUEa1O.tqi1WNkCVAZ3q9NEu2', true),  -- 6: tutorado da Eduarda
  ('Gabriela Mendes Pinto',   'gabriela.pinto@portalsesisp.org.br',  '$2b$10$S6dXU2xAOQqRgkIFWF0iMOA/V2IRWUEa1O.tqi1WNkCVAZ3q9NEu2', true),  -- 7: pedido recusado
  ('Heitor Oliveira Santos',  'heitor.santos@portalsesisp.org.br',   '$2b$10$S6dXU2xAOQqRgkIFWF0iMOA/V2IRWUEa1O.tqi1WNkCVAZ3q9NEu2', true),  -- 8: tutor revogado
  ('Isabela Cardoso Moreira', 'isabela.moreira@portalsesisp.org.br', '$2b$10$S6dXU2xAOQqRgkIFWF0iMOA/V2IRWUEa1O.tqi1WNkCVAZ3q9NEu2', true),  -- 9: tutoria finalizada
  ('João Pedro Barros',       'joao.barros@portalsesisp.org.br',     '$2b$10$S6dXU2xAOQqRgkIFWF0iMOA/V2IRWUEa1O.tqi1WNkCVAZ3q9NEu2', false); -- 10: e-mail não confirmado

-- 3. sala (ids 1 a 3)
INSERT INTO sala (nome, ano_letivo, id_professor) VALUES
  ('Geografia - 1º ano A', 2026, 1),
  ('Geografia - 2º ano A', 2026, 1),
  ('Geografia - 3º ano A', 2026, 2);

-- 4. matricula
INSERT INTO matricula (id_aluno, id_sala) VALUES
  (1, 1), (2, 1), (3, 1), (4, 1),
  (5, 2), (6, 2), (7, 2),
  (8, 3), (9, 3), (10, 3);

-- 5. conteudo (ids 1 a 6)
INSERT INTO conteudo (id_sala, nome) VALUES
  (1, 'Cartografia'),
  (1, 'Climatologia'),
  (2, 'Urbanização'),
  (2, 'Geografia agrária'),
  (3, 'Globalização'),
  (3, 'Geopolítica');

-- 6. pedido_tutoria (ids 1 a 5: três aceitos, um recusado, um pendente)
INSERT INTO pedido_tutoria (id_aluno, status, data_solicitacao, data_decisao, id_professor) VALUES
  (1, 'aceito',   '2026-02-10 10:00:00', '2026-02-12 14:00:00', 1),
  (5, 'aceito',   '2026-02-10 10:00:00', '2026-02-12 14:00:00', 1),
  (8, 'aceito',   '2026-02-10 10:00:00', '2026-02-12 14:00:00', 2),
  (7, 'recusado', '2026-02-11 09:00:00', '2026-02-13 11:00:00', 1),
  (4, 'pendente', '2026-10-05 16:30:00', NULL,                  NULL);

-- 7. tutor (ids 1 a 3: somente pedidos aceitos)
INSERT INTO tutor (id_aluno, id_pedido) VALUES
  (1, 1),
  (5, 2),
  (8, 3);

-- 8. tutor_sala (ids 1 a 3)
INSERT INTO tutor_sala (id_tutor, id_sala, data_definicao, pode_criar_ativ, data_revogacao) VALUES
  (1, 1, '2026-02-12 14:00:00', true,  NULL),
  (2, 2, '2026-02-12 14:00:00', false, NULL),
  (3, 3, '2026-02-12 14:00:00', true,  '2026-06-30 17:00:00');

-- 9. tutoria (ids 1 a 4: três ativas, uma finalizada)
INSERT INTO tutoria (id_tutor_sala, id_aluno, meta_aprendizagem, status, data_inicio, data_fim) VALUES
  (1, 2, 'Interpretar escalas e projeções cartográficas.', 'ativa',      '2026-03-02 08:00:00', NULL),
  (1, 3, 'Relacionar tipos climáticos e climogramas.',     'ativa',      '2026-03-02 08:00:00', NULL),
  (2, 6, NULL,                                             'ativa',      '2026-03-02 08:00:00', NULL),
  (3, 9, 'Compreender a formação dos blocos econômicos.',  'finalizada', '2026-03-02 08:00:00', '2026-06-30 17:00:00');

-- 10. atividade (ids 1 a 3)
-- etapa: 1, 2 ou 3 | tipo: um dos valores do enum TipoAtividade
INSERT INTO atividade (id_tutor_sala, id_conteudo, titulo, descricao, tipo, etapa, data_entrega) VALUES
  (1, 1, 'Leitura de mapas e escalas', 'Calcule as distâncias reais a partir das escalas indicadas em cada mapa.', 'interpretacao_mapas', 3, '2026-09-15 23:59:00'),
  (1, 2, 'Climogramas do Brasil',      'Identifique o tipo climático representado em cada climograma.',            'analise_graficos',    3, '2026-10-30 23:59:00'),
  (3, 5, 'Blocos econômicos',          'Compare os objetivos do Mercosul e da União Europeia.',                    'pesquisa',            2, '2026-05-20 23:59:00');

-- 11. atividade_destinatario (a atividade 2 vai só para o Bruno)
INSERT INTO atividade_destinatario (id_atividade, id_tutoria) VALUES
  (1, 1),
  (1, 2),
  (2, 1),
  (3, 4);

-- 12. resposta (a atividade 2 fica sem resposta: em aberto)
INSERT INTO resposta (id_atividade, id_aluno, texto, conteudo_file, data_envio) VALUES
  (1, 2, 'Na escala 1:50.000, 4 cm no mapa equivalem a 2 km.', NULL, '2026-09-14 19:20:00'),
  (1, 3, NULL, 'uploads/respostas/atv1-camila.jpg',                  '2026-09-15 08:05:00'),
  (3, 9, 'O Mercosul é uma união aduaneira; a União Europeia tem moeda única.', NULL, '2026-05-19 21:10:00');

-- 13. nota (ids 1 a 3)
INSERT INTO nota (id_aluno, id_atividade, valor, comentario) VALUES
  (2, 1, 6.50, 'Errou a conversão de unidades na questão 3.'),
  (3, 1, 9.00, 'Ótimo domínio de escalas.'),
  (9, 3, 8.00, 'Boa comparação entre os blocos.');

-- 14. contestacao_nota (uma pendente em tutoria ativa, uma resolvida em tutoria finalizada)
INSERT INTO contestacao_nota (id_nota, comentario, status, data_envio, decisao, data_resolucao) VALUES
  (1, 'Acredito que a questão 3 foi corrigida com a escala errada.', 'pendente',  '2026-09-20 10:00:00', NULL, NULL),
  (3, 'Gostaria de revisão do critério de comparação.',              'resolvida', '2026-05-25 09:00:00',
      'Nota mantida: a resposta não citou a livre circulação de pessoas.', '2026-05-27 15:00:00');

-- 15. feedback (do tutorado para o tutor, por etapa)
INSERT INTO feedback (id_tutoria, etapa, nota, comentario, data) VALUES
  (1, 1, 9.00, 'Explica com paciência e usa exemplos do dia a dia.', '2026-05-29 12:00:00'),
  (2, 1, 8.50, 'Ajudou bastante com os mapas.',                      '2026-05-29 12:30:00'),
  (4, 1, 7.00, 'Poderia responder mais rápido.',                     '2026-04-30 12:00:00'),
  (4, 2, 8.00, NULL,                                                 '2026-06-26 12:00:00');

-- 16. mensagem (id_aluno = remetente; o tutor também é aluno)
INSERT INTO mensagem (id_tutoria, id_aluno, assunto, texto, data_envio) VALUES
  (1, 2, NULL, 'Ana, não entendi como converter cm para km.',          '2026-09-10 18:00:00'),
  (1, 1, NULL, 'Divide por 100.000. Amanhã te mostro com um exemplo.', '2026-09-10 18:12:00'),
  (3, 5, 'Encontro da semana', 'Nosso encontro passa para quinta-feira, no mesmo horário.', '2026-10-01 09:00:00');

-- 17. aviso
INSERT INTO aviso (id_sala, id_professor, titulo, conteudo, data_publicacao) VALUES
  (1, 1, 'Início da 3ª etapa',        'As tutorias da 3ª etapa começam na próxima segunda-feira.', '2026-08-03 08:00:00'),
  (3, 2, 'Encerramento das tutorias', 'As tutorias do 1º semestre foram finalizadas.',             '2026-06-30 17:30:00');

-- 18. material
INSERT INTO material (id_tutor_sala, titulo, descricao, arquivo, data_envio) VALUES
  (1, 'Resumo de cartografia',       'Escalas, projeções e coordenadas.', 'uploads/materiais/resumo-cartografia.pdf',       '2026-03-10 14:00:00'),
  (2, 'Mapa mental de urbanização',  NULL,                                'uploads/materiais/mapa-mental-urbanizacao.pdf',  '2026-03-12 14:00:00');

-- 19. avaliacao_tutor
INSERT INTO avaliacao_tutor (id_tutor_sala, id_professor, comentario, data) VALUES
  (1, 1, 'Tutora organizada; os tutorados evoluíram em cartografia.',        '2026-06-05 10:00:00'),
  (3, 2, 'Bom domínio do conteúdo, mas demorou a corrigir as atividades.',   '2026-06-30 16:00:00');

COMMIT;