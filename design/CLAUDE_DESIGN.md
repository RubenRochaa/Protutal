# Protutal — Front-end web (Sprint 4)

Instruções para o Claude Code ao trabalhar no front-end. Vale junto com o `CLAUDE.md` da raiz.
Em caso de conflito sobre o front-end, vale este arquivo. Regras de domínio, banco e Git continuam no `CLAUDE.md`.

## Escopo

- O projeto web fica na pasta `/design` (a raiz do projeto Next é `/design`).
- `design/exemplos` é o front da pizzaria, projeto anterior do grupo. Serve SOMENTE como modelo de padrão de código e organização. Nunca copie regras de negócio, textos, imagens ou rotas da pizzaria. Nunca altere nada dentro de `design/exemplos`.
- O front só consome a API que já existe em `/backend`. É proibido criar, alterar ou apagar qualquer arquivo em `/backend`, rotas, schema, migrations ou dados do banco.
- Se uma tela do Figma precisa de algo que a API não oferece, NÃO invente rota, campo ou dado. Siga a seção "Tela x API".

## Stack (igual ao `design/exemplos`)

- Next.js 16 (App Router), React 19, TypeScript
- SCSS Modules (`styles.module.scss` ao lado do componente)
- axios (`src/services/api.ts`)
- cookies-next / `cookies()` do Next para o token
- sonner (toast) e lucide-react (ícones)
- Não adicionar outras bibliotecas sem perguntar.

## Estrutura de pastas

```
design/
  exemplos/              referência, não alterar
  public/                imagens e logo do Protutal
  src/
    app/                 páginas (uma pasta por tela)
      page.tsx           login
      cadastro/
      professor/         telas do professor
      aluno/             telas do aluno (tutorado)
      tutor/             telas do tutor
    components/          componentes reutilizáveis (Button, Input, Modal, Header, estados de tela)
    services/api.ts      instância do axios
    lib/                 funções de apoio (cookies, sessão, tratamento de erro, tipos)
    middleware.ts        proteção de rotas
  .env.example           versionado, sem valores secretos
  .env.local             NÃO versionado
```

Os nomes das pastas de cada tela seguem o Figma. Não crie pastas fora desta estrutura sem perguntar.
O `tsconfig.json` de `/design` deve ter `"exclude": ["node_modules", "exemplos"]`, para o exemplo não entrar no build.

## Variáveis de ambiente

- `NEXT_PUBLIC_API_URL=http://localhost:3333` em `design/.env.local`.
- O `api.ts` usa `baseURL: process.env.NEXT_PUBLIC_API_URL`. Nenhuma URL, chave ou senha fixa no código.
- O `.gitignore` de `/design` precisa ignorar `.env*` e liberar `!.env.example`. Confira antes do primeiro commit.
- O `.env` do back-end já existe na máquina de cada integrante. Nunca leia, exiba, copie ou altere esse arquivo.

## Autenticação e sessão

A API tem dois logins. As duas respostas trazem o token JWT (validade de 30 dias):

| Perfil | Rota | Corpo | Resposta |
| --- | --- | --- | --- |
| Professor | `POST /sessao/professores` | `{ email, senha }` | `{ id_professor, nome, email, token }` |
| Aluno (e tutor) | `POST /sessao/alunos` | `{ email, senha }` | `{ id_aluno, nome, email, token }` |

Regras do front:

1. O login roda em Server Action (como no exemplo). O token é gravado no cookie `session` com `httpOnly: true`, `sameSite: "lax"`, `path: "/"` e `secure` em produção. Isto é diferente do exemplo, que usa `httpOnly: false`: com `httpOnly: true`, um script injetado na página não consegue ler o token.
2. Junto, grave o cookie `perfil` com `professor` ou `aluno`. Ele só serve para escolher as telas. Quem garante a permissão é a API (403).
3. Como o token não pode ser lido no navegador, as chamadas autenticadas são feitas no servidor: Server Components para buscar dados e Server Actions para enviar formulários. O header é `Authorization: Bearer <token>`.
4. Tutor não tem login próprio. Ele entra como aluno. Para saber se o aluno é tutor, chame `GET /tutores/me/tutorias`: status 200 = é tutor (mesmo com lista vazia); status 403 = não é tutor. Só mostre o menu de tutor no caso 200.
5. Não existe rota `/me` na API. O `middleware.ts` NÃO deve validar o token chamando `/me` como no exemplo. Ele faz só:
   - sem cookie `session` em rota privada: redireciona para o login;
   - `perfil` diferente da área (ex.: aluno em `/professor`): redireciona para a área do próprio perfil.
6. Qualquer resposta 401 da API (token vencido ou inválido): apagar os cookies `session` e `perfil` e voltar para o login com toast "Sua sessão expirou. Entre novamente."
7. Logout: apagar os dois cookies e redirecionar para o login.

## Erros, carregamento e feedback

- Todo erro da API vem no formato `{ "error": "mensagem" }`, já em português. Mostre `error` no toast (sonner).
- Sem resposta do servidor (API desligada ou sem rede): toast "Não foi possível conectar ao servidor. Tente novamente." e estado de erro na tela com botão "Tentar novamente".
- Status 403: toast com a mensagem da API. Status 500: "Erro no servidor. Tente novamente mais tarde."
- Centralize esse tratamento em uma função em `src/lib` (ex.: `getErrorMessage(err)`). Não repita `try/catch` com mensagens diferentes em cada tela.
- Toda tela que lista dados tem três estados além do normal, usando componentes reutilizáveis de `src/components`:
  - carregando (`loading.tsx` da rota ou componente de carregamento);
  - lista vazia, com texto explicando o que fazer;
  - erro de conexão.
- Todo envio de formulário: botão desabilitado e com texto de carregamento enquanto envia; toast de sucesso ao terminar.

## Validação no cliente

Valide antes de enviar, com as mesmas regras do back-end (não invente regras novas):

- Campos obrigatórios conforme a tabela de rotas abaixo.
- E-mail de professor: domínio `@portalsesi.org.br`. E-mail de aluno: domínio `@portalsesisp.org.br`. Outro domínio: toast de erro.
- `serie`: 1, 2 ou 3. `etapa`: 1, 2 ou 3. `ano_letivo`: número inteiro.
- Nota (`valor`): de 0 a 10, no máximo 2 casas decimais.
- `prazo` da atividade: data futura.
- Títulos: no máximo 150 caracteres. Nome de conteúdo: no máximo 100.
- Arquivos (resposta e material): `.pdf .doc .docx .xls .xlsx .csv`, no máximo 10 MB, um arquivo por envio.

A validação do cliente só melhora a experiência. Mesmo validado, o erro da API sempre deve ser tratado.

## Componentização

- Antes de criar um componente, procure em `src/components` se já existe um parecido. Reaproveite.
- Componente usado por mais de uma tela vai para `src/components`. Componente de uma tela só fica na pasta da tela, em `components/`.
- Cores, fontes e espaçamentos do Figma ficam como variáveis em `src/app/globals.scss`. Não repita valores fixos nos módulos.
- Telas responsivas: testar em largura de celular (375 px), tablet (768 px) e desktop (1280 px).

## Rotas da API disponíveis

Base: `NEXT_PUBLIC_API_URL`. Todas, exceto cadastro, login e confirmação de e-mail, exigem `Authorization: Bearer <token>`.
A API tem 57 rotas, todas implementadas. A descrição completa de cada uma (respostas e erros) está em `docs/rotas_do_sistema.md`.

### Públicas
| Método | Rota | Corpo / parâmetros |
| --- | --- | --- |
| POST | `/professores` | `{ nome, email, senha }` |
| POST | `/alunos` | `{ nome, email, senha }` |
| POST | `/sessao/professores` | `{ email, senha }` (403 se o e-mail ainda não foi confirmado) |
| POST | `/sessao/alunos` | `{ email, senha }` (403 se o e-mail ainda não foi confirmado) |
| GET | `/confirmacao-email/:token` | — (aberta pelo link do e-mail; responde uma página HTML, o front não chama) |
| POST | `/confirmacao-email/reenviar` | `{ email }` |

### Professor
| Método | Rota | Corpo / parâmetros |
| --- | --- | --- |
| POST | `/salas` | `{ nome, serie, ano_letivo }` |
| GET | `/salas` | — |
| GET | `/salas/:id` | dados básicos da sala (sem alunos, tutores e conteúdos) |
| GET | `/alunos` | `?busca=` opcional |
| POST | `/salas/:id/matriculas` | `{ id_aluno }` |
| GET | `/salas/:id/alunos` | — |
| GET | `/salas/:id/tutores` | — (traz `id_tutor_sala`) |
| GET | `/salas/:id/tutorias` | `?status=ativa\|finalizada` opcional |
| POST | `/salas/:id/conteudos` | `{ nome }` |
| GET | `/salas/:id/conteudos` | — (professor dono ou tutor ativo da sala) |
| GET | `/pedidos-tutoria` | — |
| PATCH | `/pedidos-tutoria/:id/aceitar` | `{ id_sala }` |
| PATCH | `/pedidos-tutoria/:id/recusar` | — |
| PATCH | `/salas/:id/permissao-atividades` | `{ pode_criar_ativ: true\|false }` (vale para todos os tutores ativos da sala) |
| POST | `/tutorias` | `{ id_tutor_sala, id_aluno, meta_aprendizagem }` |
| PATCH | `/tutorias/:id/meta` | `{ meta_aprendizagem }` |
| PATCH | `/tutorias/:id/finalizar` | — |
| PATCH | `/tutorias/:id/reabrir` | — |
| PATCH | `/tutores-sala/:id/revogar` | — (`:id` = `id_tutor_sala`; finaliza as tutorias ativas do tutor) |
| POST | `/tutores-sala/:id/avaliacoes` | `{ nota, comentario }` |
| GET | `/tutores-sala/:id/avaliacoes` | — |
| GET | `/salas/:id/atividades` | `?etapa=`, `?id_conteudo=`, `?id_tutor_sala=` opcionais |
| GET | `/atividades/:id/respostas` | — (também para o tutor criador) |
| GET | `/salas/:id/notas` | `?etapa=`, `?id_conteudo=`, `?id_aluno=`, `?id_tutor_sala=` opcionais |
| GET | `/salas/:id/notas/exportar` | mesmos filtros de `/salas/:id/notas`; responde um arquivo `.xlsx` |
| GET | `/salas/:id/desempenho-tutores` | — |
| POST | `/salas/:id/avisos` | `{ titulo, conteudo }` |

### Aluno (tutorado)
| Método | Rota | Corpo / parâmetros |
| --- | --- | --- |
| GET | `/alunos/me/atividades` | `?status=pendente\|entregue\|entregue_com_atraso` e `?etapa=1\|2\|3` opcionais |
| GET | `/atividades/:id` | — (também para o tutor criador) |
| POST | `/atividades/:id/respostas` | multipart/form-data: `file` (obrigatório), `texto` (opcional) |
| GET | `/alunos/me/tutorias` | `?status=ativa\|finalizada` opcional |
| POST | `/pedidos-tutoria` | `{ id_sala }` |
| POST | `/notas/:id/contestacoes` | `{ comentario }` |
| GET | `/alunos/me/contestacoes` | `?status=pendente\|aceita\|recusada` opcional |
| GET | `/alunos/me/desempenho` | `?id_sala=` e `?etapa=1\|2\|3` opcionais |
| GET | `/alunos/me/conteudos-dominados` | `?id_sala=` opcional |
| POST | `/tutorias/:id/feedbacks` | multipart/form-data: `file` (obrigatório, rubrica), `comentario` (opcional) |

### Tutor (login de aluno)
| Método | Rota | Corpo / parâmetros |
| --- | --- | --- |
| GET | `/tutores/me/tutorias` | `?status=ativa\|finalizada` opcional (traz `id_tutoria` e `sala.id_sala`) |
| GET | `/tutores/me/atividades` | `?id_sala=`, `?id_conteudo=`, `?etapa=` opcionais |
| GET | `/tutores/me/desempenho` | `?id_sala=` opcional |
| GET | `/salas/:id/conteudos` | — |
| POST | `/atividades` | `{ titulo, descricao, prazo, tipo, etapa, id_conteudo, id_tutoria }` |
| GET | `/atividades/:id/respostas` | — (traz os destinatários com `id_aluno`) |
| POST | `/atividades/:id/notas` | `{ id_aluno, valor, comentario }` |
| POST | `/salas/:id/materiais` | multipart/form-data: `titulo` (obrigatório), `descricao` (opcional), `file` (obrigatório) |

### Mais de um perfil
| Método | Rota | Perfis | Corpo / parâmetros |
| --- | --- | --- | --- |
| GET | `/tipos-atividade` | professor, aluno | — (lista os valores de `tipo` da atividade) |
| GET | `/contestacoes` | professor, tutor | `?status=pendente\|aceita\|recusada` e `?id_sala=` opcionais |
| PATCH | `/contestacoes/:id/resolver` | professor (dono), tutor (criador da atividade) | `{ status: "aceita"\|"recusada", decisao, valor }` (`valor` só com `aceita`) |
| GET | `/salas/:id/materiais` | professor, tutor, aluno | — |
| GET | `/salas/:id/avisos` | professor (dono), aluno (matriculado) | — |
| POST | `/tutorias/:id/mensagens` | tutor e aluno da tutoria | `{ texto, assunto }` (`assunto` opcional; com ele, vira comunicado) |
| GET | `/tutorias/:id/mensagens` | tutor e aluno da tutoria | `?tipo=comunicado` opcional |
| GET | `/feedbacks` | tutor, professor | `?etapa=`, `?ano=`, `?id_aluno=` opcionais; `?id_sala=` e `?id_tutor_sala=` só para o professor |

Valores aceitos em `tipo` (lista fixa do sistema, também devolvida por `GET /tipos-atividade`): `aula_invertida`, `prova_alternativa`, `prova_dissertativa`, `projeto`, `interpretacao_imagens`, `exercicios_livro`, `interpretacao_mapas`, `analise_graficos`, `mapa_mental`, `pesquisa`, `estudo_caso`, `trabalho_campo`, `teatro`, `atividade_extracurricular`, `autoavaliacao`. Mostre ao usuário com rótulo legível (ex.: "Aula invertida") e envie o valor técnico.

A collection do Insomnia em `docs/collections` tem exemplos de cada requisição. Em dúvida sobre um campo da resposta, consulte `docs/rotas_do_sistema.md`, leia o service correspondente em `backend/src/services` (somente leitura) ou pergunte.

## Tela x API (lacunas)

Ao receber o print de uma tela do Figma, antes de qualquer código, compare a tela com as rotas acima e entregue duas listas:

1. **Elemento da tela sem rota na API** (ex.: um dado que nenhuma rota devolve, como a lista de salas do aluno). Não invente dados nem rota. O elemento aparece desabilitado, com o texto "Em breve", e entra no relatório para o grupo do back-end.
2. **Rota da API sem elemento na tela** (funcionalidade faltando no Figma). Proponha o elemento que falta, seguindo o estilo visual da tela, e crie depois da aprovação.

Lacuna já conhecida (pendente no back-end):

- Não há rota para o aluno listar as próprias salas. A tela "pedir para ser tutor" (B4) precisa do `id_sala`.

As demais lacunas que constavam aqui (atividades do tutor e da sala, listagem de materiais, revogação e avaliação do tutor, mensagens, avisos, feedback, contestação de nota, desempenho e confirmação de e-mail) já foram implementadas. As rotas estão nas tabelas acima.

## Divisão das telas (dois blocos)

A Etapa 0 é feita primeiro, por um integrante, e entra na `develop` antes dos blocos. Depois, cada integrante pega um bloco, uma tela por vez, uma branch por tela.

### Etapa 0 — Base do projeto (`feature-base-front`)
1. Projeto Next em `/design` com as dependências do exemplo, `tsconfig` excluindo `exemplos`, `.gitignore` e `.env.example`.
2. `api.ts`, funções de cookie, tratamento de erro, `middleware.ts` e `Toaster` no `layout.tsx`.
3. Componentes base: Button, Input, Select, Modal, Header, Loading, EmptyState, ErrorState.
4. Telas de login e cadastro (professor e aluno), com redirecionamento por perfil.

### Bloco A — Professor
| Tela | Rotas |
| --- | --- |
| A1. Minhas salas (listar e criar) | `GET /salas`, `POST /salas` |
| A2. Detalhe da sala e alunos matriculados | `GET /salas/:id`, `GET /salas/:id/alunos` |
| A3. Matricular aluno (busca) | `GET /alunos?busca=`, `POST /salas/:id/matriculas` |
| A4. Conteúdos da sala | `GET /salas/:id/conteudos`, `POST /salas/:id/conteudos` |
| A5. Pedidos de tutoria | `GET /pedidos-tutoria`, `PATCH .../aceitar`, `PATCH .../recusar` |
| A6. Tutores da sala e permissão de criar atividades | `GET /salas/:id/tutores`, `PATCH /salas/:id/permissao-atividades` |
| A7. Tutorias da sala (criar, meta, finalizar, reabrir) | `GET /salas/:id/tutorias`, `POST /tutorias`, `PATCH /tutorias/:id/meta`, `.../finalizar`, `.../reabrir` |

### Bloco B — Aluno e tutor
| Tela | Rotas |
| --- | --- |
| B1. Minhas atividades (filtros de status e etapa) | `GET /alunos/me/atividades` |
| B2. Enviar resposta (upload) | `POST /atividades/:id/respostas` |
| B3. Minhas tutorias (como tutorado) | `GET /alunos/me/tutorias` |
| B4. Pedir para ser tutor | `POST /pedidos-tutoria` (ver lacuna do `id_sala`) |
| B5. Área do tutor: meus tutorados | `GET /tutores/me/tutorias` |
| B6. Criar atividade | `GET /salas/:id/conteudos`, `POST /atividades` |
| B7. Respostas e lançamento de nota | `GET /atividades/:id/respostas`, `POST /atividades/:id/notas` |
| B8. Anexar material de apoio (upload) | `POST /salas/:id/materiais` |

## Como trabalhar em cada tela

1. Confirme a branch atual (`git branch --show-current`). Ela deve ser `feature-<tela>`, criada a partir da `develop` atualizada. Se for `develop` ou `main`, pare e avise.
2. Leia o print do Figma, a seção "Tela x API" e o arquivo equivalente em `design/exemplos`.
3. Apresente o plano: lacunas da tela, arquivos que serão criados ou alterados, componentes reaproveitados, rotas usadas. Aguarde a confirmação.
4. Implemente só a tela pedida.
5. Explique o que foi feito em linguagem simples. O grupo precisa entender o código.
6. Mostre como testar: dados reais, lista vazia, API desligada (erro de conexão), erro de validação e erro da API.
7. Não faça commit nem push sem o integrante pedir. Ao final, sugira a mensagem de commit no padrão do grupo: `:emoji: tipo: Descrição` (ex.: `:sparkles: feat: Tela de salas do professor`, `:lipstick: style: Ajuste responsivo do login`, `:bug: fix: ...`, `:recycle: refactor: ...`).
