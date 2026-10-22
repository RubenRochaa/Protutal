## Rotas já implementadas (referência)

### Professor (14)

* Cadastro de professor: `POST /professores`
* Login de professor: `POST /sessao/professores`
* Criar sala: `POST /salas`
* Listar salas: `GET /salas`
* Listar alunos: `GET /alunos`
* Matricular aluno na sala: `POST /salas/:id/matriculas`
* Listar alunos da sala: `GET /salas/:id/alunos`
* Listar tutores da sala: `GET /salas/:id/tutores`
* Criar conteúdo na sala: `POST /salas/:id/conteudos`
* Listar pedidos de tutoria: `GET /pedidos-tutoria`
* Aceitar pedido de tutoria: `PATCH /pedidos-tutoria/:id/aceitar`
* Recusar pedido de tutoria: `PATCH /pedidos-tutoria/:id/recusar`
* Dar ou tirar dos tutores da sala a permissão de criar atividades: `PATCH /salas/:id/permissao-atividades`
* Criar tutoria (ligar um tutor a um aluno): `POST /tutorias`

### Aluno (4)

* Cadastro de aluno: `POST /alunos`
* Login de aluno: `POST /sessao/alunos`
* Pedir para ser tutor: `POST /pedidos-tutoria`
* Responder atividade (aluno tutorado): `POST /atividades/:id/respostas`

### Tutor (1)

* Enviar atividade para o tutorado: `POST /atividades`

## Rotas faltantes

### Professor (16)

* Detalhar sala: `GET /salas/:id`
* Listar conteúdos da sala: `GET /salas/:id/conteudos` (também usada pelo tutor, para escolher o conteúdo da atividade)
* Publicar aviso na sala: `POST /salas/:id/avisos` (RF10)
* Listar tutorias da sala: `GET /salas/:id/tutorias` (RF3)
* Definir meta de aprendizagem da tutoria: `PATCH /tutorias/:id/meta` (RF16)
* Finalizar tutoria: `PATCH /tutorias/:id/finalizar` (RF3; bloqueada se houver contestação pendente, RN15)
* Reabrir tutoria: `PATCH /tutorias/:id/reabrir` (somente no mesmo ano letivo)
* Revogar tutor da sala: `PATCH /tutores-sala/:id/revogar` (RF18; preenche `data_revogacao`)
* Avaliar tutor: `POST /tutores-sala/:id/avaliacoes` (RF19; com nota e comentário)
* Listar avaliações do tutor: `GET /tutores-sala/:id/avaliacoes`
* Listar atividades da sala: `GET /salas/:id/atividades` (RF11 reescrito; ver ponto de atenção 3)
* Ver respostas, notas e comentários de uma atividade: `GET /atividades/:id/respostas` (RF12; também usada pelo tutor)
* Dashboard de desempenho dos tutores: `GET /salas/:id/desempenho-tutores` (RF13)
* Consultar notas lançadas na sala: `GET /salas/:id/notas` (RF15, agora apenas consulta)
* Exportar notas para Excel: `GET /salas/:id/notas/exportar` (RF14)
* Listar contestações de nota: `GET /contestacoes` (também usada pelo tutor)

### Tutor (8)

* Listar seus tutorados: `GET /tutores/me/tutorias`
* Listar atividades que criou: `GET /tutores/me/atividades`
* Lançar nota e comentário na resposta do aluno: `POST /atividades/:id/notas` (RF21; `id_aluno` no corpo)
* Resolver contestação de nota: `PATCH /contestacoes/:id/resolver` (RF29/UC06; mantém ou ajusta a nota)
* Anexar material de apoio: `POST /salas/:id/materiais` (RF25; upload no Cloudinary)
* Ver o próprio desempenho: `GET /tutores/me/desempenho` (RF23)
* Ver feedbacks recebidos dos alunos: `GET /tutores/me/feedbacks` (RF22 invertido)
* Listar tipos de atividade: `GET /tipos-atividade` (opcional: o enum é fixo, mas o front-end precisa da lista para o campo de seleção)

### Aluno (10)

* Listar atividades destinadas a ele: `GET /alunos/me/atividades` (RF30)
* Detalhar atividade: `GET /atividades/:id`
* Ver a própria tutoria (tutor e meta): `GET /alunos/me/tutorias`
* Listar avisos da sala: `GET /salas/:id/avisos`
* Listar materiais de apoio: `GET /salas/:id/materiais` (RF28)
* Ver dashboard de notas: `GET /alunos/me/desempenho` (RF26)
* Ver conteúdos dominados: `GET /alunos/me/conteudos-dominados` (RF27; usa `Faixa_desempenho`)
* Contestar nota: `POST /notas/:id/contestacoes` (RF29)
* Ver histórico de contestações: `GET /alunos/me/contestacoes` (UC06, passo 4)
* Enviar feedback ao tutor via rubrica: `POST /tutorias/:id/feedbacks` (RF22; por etapa, de 1 a 3)

### Tutor e aluno (2)

* Enviar mensagem ou comunicado: `POST /tutorias/:id/mensagens` (RF2 e RF24; o comunicado é a mensagem com `assunto` preenchido)
* Listar mensagens da tutoria: `GET /tutorias/:id/mensagens`

### Comum (1)

* Confirmar e-mail: `GET /confirmacao-email/:token` (RN20; vale para professor e aluno)

**Total de rotas faltantes: 37**

## Pontos de atenção

1. **Contagem:** a lista original indicava "Professor (13)", mas havia 14 rotas. Corrigido acima.
2. **Autorização do tutor:** o tutor não tem login próprio, pois entra pelo login de aluno. Todas as rotas de tutor devem verificar, no middleware, se existe um `Tutor_sala` ativo (sem `data_revogacao`).
3. **RF11 reescrito:** o texto final do RF11 não foi confirmado. Supôs-se "o professor visualiza as atividades da sala". Se o requisito for outro, a rota `GET /salas/:id/atividades` muda.
4. **Contestação de nota:**
   * O UC06 diz que a contestação é analisada pelo "Tutor ou Professor". O grupo precisa definir quem resolve, ou se ambos podem.
   * O dicionário de dados anexado ao projeto usa os status `pendente/resolvida`, enquanto a decisão mais recente é `pendente/aceita/recusada`.
5. **Documentos desatualizados no projeto:**
   * O RF18 ainda diz que o histórico passa ao novo tutor, o que contraria a decisão do grupo.
   * O dicionário mantém `Sala.ano_letivo` com CHECK de 1 a 3, quando a decisão é ter `serie` e `ano_letivo`.
   * Se o banco já está correto, a navegação por ano letivo e série (RF4/RF5) não exige rota nova, apenas filtros em `GET /salas?ano_letivo=&serie=`.
6. **Fluxo de revogação:** presume-se que a troca de tutor seja feita assim:
   1. revogar o tutor;
   2. finalizar as tutorias antigas;
   3. criar as novas tutorias com `POST /tutorias`.

   Falta confirmar se é esse o fluxo, ou se a rota de revogação já deve receber o novo tutor.
