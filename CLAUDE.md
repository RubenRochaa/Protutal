# Protutal

Plataforma web de tutoria entre alunos da rede SESI, com foco na matéria de Geografia. TCC do curso de Desenvolvimento de Sistemas (SENAI). Este arquivo é lido pelo Claude Code no início de toda sessão.

## Stack

- Monorepo: frontend e backend no mesmo repositório
- Frontend: React
- Backend: Node.js com Express
- Linguagem: TypeScript
- Banco de dados: PostgreSQL, acessado via Prisma na versão 6.8.2
- NÃO atualizar a versão do Prisma: versões mais novas deram erro no projeto

## Estrutura e arquitetura

- Arquitetura do backend: MVC
- Pasta do backend: /backend
- Pasta do frontend: /frontend
- Siga a estrutura de pastas que já existe. Não crie pastas ou camadas novas sem perguntar.

## Comandos

- Instalar dependências: [DEFINIR]
- Subir o backend em desenvolvimento: [DEFINIR]
- Rodar testes: [DEFINIR, ou "ainda não há testes"]
- Gerar o client do Prisma: `npx prisma generate`
- Criar migration (somente com autorização, ver "Banco de dados"): `npx prisma migrate dev --name <nome>`

## Como trabalhar

- Responda e explique sempre em português.
- Antes de alterar qualquer arquivo, apresente o plano: o que será feito, em quais arquivos e por quê. Aguarde a confirmação.
- Implemente uma rota por vez. Não crie rotas, tabelas ou funcionalidades além do que foi pedido.
- Depois de cada passo, explique o que foi feito em linguagem clara. O grupo precisa entender o código.
- Ao terminar uma rota, teste com uma requisição válida e uma inválida e mostre a saída real. Não afirme que funciona sem mostrar a evidência.
- Se faltar informação ou houver conflito com as regras abaixo, pare e pergunte. Não invente requisitos, campos ou regras de negócio.

## Banco de dados

IMPORTANTE: o banco PostgreSQL é compartilhado por todo o grupo. Um comando errado afeta todos.

- Nunca execute `prisma migrate reset`, `prisma db push --force-reset`, `DROP` ou `TRUNCATE`.
- Nunca crie ou aplique uma migration sem pedir autorização antes, mostrando o que ela altera.
- Nomes de tabelas e colunas seguem o MER e o dicionário de dados do projeto (em português, ex.: `id_sala`, `data_definicao`). Não renomeie nem traduza.
- O projeto não tem acesso ao banco de dados do SESI. Todos os dados são próprios do Protutal.

## Regras de domínio

- Não existe tabela Usuário. Existem apenas Professor e Aluno.
- Tutor não é um tipo de usuário. É um Aluno que teve o pedido de tutoria aceito por um professor.
- O registro em Tutor só é criado depois do aceite do professor. Antes disso existe apenas o Pedido_tutoria.
- O vínculo entre tutor e sala é feito pela tabela Tutor_sala. O mesmo aluno pode ser tutor em uma sala e tutorado em outra.
- A relação aluno-sala é feita pela tabela Matricula.
- Tutoria tem apenas dois status: ativa e finalizada.
- O professor não envia atividade para a sala inteira. Quem direciona atividade ao aluno é o tutor.
- Cadastro de professor e de aluno valida o domínio do e-mail contra uma lista de domínios institucionais do SESI.

## Segurança

- Senhas sempre armazenadas com hash. Nunca retorne a senha (nem o hash) em nenhuma resposta da API.
- Nunca faça commit do arquivo `.env`. Ao criar uma variável de ambiente nova, atualize o `.env.example`.

## Escopo atual (Sprint 2)

Somente estas rotas. O restante (pedido de tutoria, atividades, notas, chat, dashboards) fica para sprints futuras.

1. `POST /professores`: cadastro de professor com validação do domínio do e-mail
2. `POST /alunos`: cadastro de aluno (sem gerar pedido de tutoria nesta sprint)
3. `POST /salas`: professor cria uma sala
4. `GET /salas`: lista as salas de um professor

Nesta sprint não há login nem confirmação de e-mail por mensagem.

## Git

- Estratégia de branches: main/develop/feature-x
- Regras de Pull Request: Não dar push direto na main
- Não faça commit nem push sem que eu peça.

## Domínios aceito

- Para professor: xxxxxxx.xxx@portalsesi.org.br
- Para aluno: xxxxxxxx.xxx@portalsesisp.org.br
- Nenhum outro domínio é aceito. emitir toast de erro.
