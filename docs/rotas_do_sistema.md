# Rotas do sistema — API do Protutal

## 1. Introdução

### Objetivo
Este documento descreve todas as rotas da API do Protutal: o que cada uma faz, quem pode acessá-la, o que recebe e o que devolve. Todo o conteúdo foi tirado do código do back-end (`backend/src`).

Cada rota mantém o código que recebeu no antigo arquivo de controle de rotas (`P` = professor, `T` = tutor, `A` = aluno, `O` = outras), porque esses códigos já são citados em outros documentos do projeto. As rotas que existiam antes desse controle receberam códigos novos, na sequência de cada perfil: P17 a P30, A11 a A14 e T9.

### URL base
```
http://localhost:3333
```
A porta é fixa em `backend/src/server.ts` (`app.listen(3333)`). A variável `APP_URL` do `.env.example` só é usada para montar o link enviado no e-mail de confirmação de cadastro.

### Formato dos dados
- Requisições e respostas usam **JSON** (`Content-Type: application/json`).
- Exceções:
  - **O3** (`GET /confirmacao-email/:token`) responde uma **página HTML**, porque o link é aberto pelo navegador a partir do e-mail.
  - **P15** (`GET /salas/:id/notas/exportar`) responde um **arquivo `.xlsx`** para download.

### Autenticação
As rotas protegidas exigem o token JWT devolvido pelo login (P18 para professor, A12 para aluno), enviado no cabeçalho `Authorization`:

```
Authorization: Bearer <token>
```

- O token guarda o id (`sub`), o nome e o e-mail do usuário e vale por 30 dias. A API sempre identifica o usuário pelo token, nunca por um id enviado no corpo ou na URL.
- Professor e aluno usam o mesmo formato de token. O perfil é conferido no banco pelo par id + e-mail (middlewares `isProfessor` e `isAluno`).
- **Tutor não tem login próprio:** o tutor entra com o login de aluno. O acesso às rotas de tutor depende de um vínculo `Tutor_sala` ativo, isto é, sem `data_revogacao`.

### Envio de arquivos (`multipart/form-data`)
Três rotas recebem arquivo. Nelas a requisição deve ser `multipart/form-data`, e o arquivo vai no campo `file`:

| Nº | Rota | Formatos aceitos | Tamanho máximo |
|---|---|---|---|
| A14 | `POST /atividades/:id/respostas` | sem restrição de formato no código | 50 MB (limite global) |
| T5 | `POST /salas/:id/materiais` | .pdf, .doc, .docx, .xls, .xlsx, .csv | 10 MB |
| A10 | `POST /tutorias/:id/feedbacks` | .pdf, .doc, .docx, .xls, .xlsx, .csv | 10 MB |

Os arquivos são enviados ao Cloudinary, e a API grava apenas a URL devolvida. O limite global de 50 MB vem do `express-fileupload`, configurado em `server.ts`.

---

## 2. Tratamento de Erros e Validação

### 2.1 Tratamento global de exceções
O tratamento fica no fim de `backend/src/server.ts`. O pacote `express-async-errors` faz com que erros lançados dentro de funções `async` (controllers, services e middlewares) cheguem a esse tratamento sem precisar de `try/catch` em cada rota.

Todo erro é devolvido no mesmo formato:

```json
{
  "error": "Sala não encontrada"
}
```

O tratamento funciona em duas partes, nesta ordem:

1. **Rota inexistente:** se nenhuma rota nem arquivo estático respondeu, a API devolve `404` com `{ "error": "Rota não encontrada" }`.
2. **Handler de erros** (middleware com 4 parâmetros):

| Tipo de erro | Status | Corpo |
|---|---|---|
| `AppError` (`backend/src/errors/AppError.ts`), lançado pelos services e middlewares | o `statusCode` do erro (padrão 400) | `{ "error": "<mensagem do erro>" }` |
| `SyntaxError` do `express.json()` (JSON mal formado no corpo) | 400 | `{ "error": "JSON inválido no corpo da requisição" }` |
| Qualquer outro erro (ex.: falha no banco ou no Cloudinary) | 500 | `{ "error": "Erro interno do servidor" }` |

No caso do 500, o erro completo é registrado no console do servidor, e o cliente recebe só a mensagem genérica, sem detalhes internos.

Exceções ao fluxo acima:
- Os middlewares `isAuthenticated` (401) e `isProfessor` (403) respondem direto com `res.status(...).json({ error })`, sem passar pelo handler. O formato do corpo é o mesmo.
- A O3 trata os próprios `AppError` (400 e 410) e responde uma página HTML com a mensagem, em vez de JSON. Outros erros seguem para o handler global (500).

### 2.2 Códigos HTTP padronizados

| Código | Significado no sistema | Exemplo |
|---|---|---|
| 200 | Requisição atendida: consulta, alteração ou ação sem criação de registro | `GET /salas` devolve a lista de salas do professor |
| 201 | Registro criado | `POST /salas` devolve a sala criada |
| 400 | Dados de entrada inválidos: campo obrigatório ausente, tipo errado, id da URL que não é inteiro, filtro de query inválido, JSON mal formado ou regra de negócio violada | `{ "error": "O campo nome é obrigatório" }` |
| 401 | Não autenticado: token ausente, mal formatado ou inválido, ou login com e-mail ou senha incorretos | `{ "error": "Token não informado" }` |
| 404 | Recurso não encontrado (sala, tutoria, atividade, nota etc.) ou rota inexistente | `{ "error": "Sala não encontrada" }` |
| 500 | Erro inesperado no servidor | `{ "error": "Erro interno do servidor" }` |

**Códigos fora da lista padrão que o código usa** (declarados no comentário de `AppError.ts`):

| Código | Significado no sistema | Exemplo |
|---|---|---|
| 403 | Autenticado, mas sem permissão: perfil errado, usuário que não é dono do recurso ou não participa dele, ou e-mail ainda não confirmado no login | `{ "error": "Acesso permitido somente para professores" }` |
| 409 | Conflito com o estado atual dos dados: registro duplicado, pedido já decidido, tutoria já finalizada etc. | `{ "error": "Email já cadastrado" }` |
| 410 | Recurso expirado | O3: link de confirmação de e-mail vencido |

> ⚠️ Divergência: os códigos 403, 409 e 410 não fazem parte da lista padrão (200, 201, 400, 401, 404, 500), mas são devolvidos pelo código. Cada rota mostra, na sua tabela de erros, os códigos que realmente devolve.

### 2.3 Validação
- **Onde:** toda a validação de entrada é **manual**, feita dentro dos **services**, antes de qualquer gravação. O projeto não usa biblioteca de validação (zod, yup, joi etc.). Os controllers só leem `req.params`, `req.query`, `req.body` e `req.files` e repassam os valores ao service.
- **Ids na URL** (`:id`): o controller converte com `Number(...)`, e o service (ou o middleware) exige número inteiro positivo. `"abc"`, `"1.5"`, `"0"` e `"-1"` caem em 400 (ex.: `"O id da sala deve ser um número inteiro"`).
- **Filtros de query:** ids opcionais são validados pelo helper `parseIdOpcional` (`backend/src/helpers/parseIdOpcional.ts`), que devolve 400 se o valor não for inteiro positivo. Valores de enum (`status`, `etapa`, `tipo`) são comparados com a lista de valores aceitos. Filtro repetido (ex.: `?etapa=1&etapa=2`) é recusado com 400. A exceção é o `?busca=` da P21: repetido, ele é ignorado.
- **Corpo:** tipo, obrigatoriedade e limites de cada campo (ex.: título até 150 caracteres, nota de 0 a 10 com até 2 casas decimais, etapa 1, 2 ou 3).
- **Arquivos:** campo `file` obrigatório, um único arquivo, e extensão e tamanho conferidos no service (T5 e A10). O upload ao Cloudinary só acontece depois de todas as validações.
- **Ordem das verificações:** em geral, id inválido (400) → recurso não encontrado (404) → sem permissão (403) → corpo inválido (400) → conflito (409). A ordem exata de cada rota aparece na sua tabela de erros.
- **Cadastro:** o domínio do e-mail é conferido contra as listas `DOMINIOS_PERMITIDOS_PROFESSOR` e `DOMINIOS_PERMITIDOS_ALUNO` do `.env`.
- **Senha:** gravada com hash (bcrypt) e nunca devolvida em nenhuma resposta.

---

## 3. Índice das rotas

**Perfis:** *pública* = sem token; *professor*; *aluno*; *tutor* = aluno com vínculo `Tutor_sala` ativo. Quando a rota aceita mais de um perfil, todos aparecem.

### Autenticação e Cadastro
| Nº | Método | URL | Perfil |
|---|---|---|---|
| P17 | POST | `/professores` | pública |
| P18 | POST | `/sessao/professores` | pública |
| A11 | POST | `/alunos` | pública |
| A12 | POST | `/sessao/alunos` | pública |
| O3 | GET | `/confirmacao-email/:token` | pública |
| O4 | POST | `/confirmacao-email/reenviar` | pública |

### Sala
| Nº | Método | URL | Perfil |
|---|---|---|---|
| P19 | POST | `/salas` | professor |
| P20 | GET | `/salas` | professor |
| P1 | GET | `/salas/:id` | professor (dono) |
| P29 | PATCH | `/salas/:id/permissao-atividades` | professor (dono) |

### Aluno e Matrícula
| Nº | Método | URL | Perfil |
|---|---|---|---|
| P21 | GET | `/alunos` | professor |
| P22 | POST | `/salas/:id/matriculas` | professor (dono) |
| P23 | GET | `/salas/:id/alunos` | professor (dono) |

### Conteúdos
| Nº | Método | URL | Perfil |
|---|---|---|---|
| P25 | POST | `/salas/:id/conteudos` | professor (dono) |
| P2 | GET | `/salas/:id/conteudos` | professor (dono), tutor (ativo na sala) |
| T8 | GET | `/tipos-atividade` | professor, aluno |

### Pedido de Tutoria e Tutor da Sala
| Nº | Método | URL | Perfil |
|---|---|---|---|
| A13 | POST | `/pedidos-tutoria` | aluno |
| P26 | GET | `/pedidos-tutoria` | professor |
| P27 | PATCH | `/pedidos-tutoria/:id/aceitar` | professor (dono) |
| P28 | PATCH | `/pedidos-tutoria/:id/recusar` | professor (dono) |
| P24 | GET | `/salas/:id/tutores` | professor (dono) |
| P8 | PATCH | `/tutores-sala/:id/revogar` | professor (dono) |
| P9 | POST | `/tutores-sala/:id/avaliacoes` | professor (dono) |
| P10 | GET | `/tutores-sala/:id/avaliacoes` | professor (dono) |

### Tutoria
| Nº | Método | URL | Perfil |
|---|---|---|---|
| P30 | POST | `/tutorias` | professor (dono) |
| P4 | GET | `/salas/:id/tutorias` | professor (dono) |
| P5 | PATCH | `/tutorias/:id/meta` | professor (dono) |
| P6 | PATCH | `/tutorias/:id/finalizar` | professor (dono) |
| P7 | PATCH | `/tutorias/:id/reabrir` | professor (dono) |
| T1 | GET | `/tutores/me/tutorias` | tutor |
| A3 | GET | `/alunos/me/tutorias` | aluno |

### Atividades e Respostas
| Nº | Método | URL | Perfil |
|---|---|---|---|
| T9 | POST | `/atividades` | tutor (da tutoria) |
| A2 | GET | `/atividades/:id` | aluno (destinatário), tutor (criador) |
| A1 | GET | `/alunos/me/atividades` | aluno |
| P11 | GET | `/salas/:id/atividades` | professor (dono) |
| T2 | GET | `/tutores/me/atividades` | tutor |
| A14 | POST | `/atividades/:id/respostas` | aluno (destinatário) |
| P12 | GET | `/atividades/:id/respostas` | professor (dono), tutor (criador) |

### Notas
| Nº | Método | URL | Perfil |
|---|---|---|---|
| T3 | POST | `/atividades/:id/notas` | tutor (criador) |
| P14 | GET | `/salas/:id/notas` | professor (dono) |
| P15 | GET | `/salas/:id/notas/exportar` | professor (dono) |

### Contestação de Nota
| Nº | Método | URL | Perfil |
|---|---|---|---|
| A8 | POST | `/notas/:id/contestacoes` | aluno (dono da nota) |
| P16 | GET | `/contestacoes` | professor, tutor |
| A9 | GET | `/alunos/me/contestacoes` | aluno |
| T4 | PATCH | `/contestacoes/:id/resolver` | professor (dono), tutor (criador da atividade) |

### Desempenho
| Nº | Método | URL | Perfil |
|---|---|---|---|
| P13 | GET | `/salas/:id/desempenho-tutores` | professor (dono) |
| T6 | GET | `/tutores/me/desempenho` | tutor |
| A6 | GET | `/alunos/me/desempenho` | aluno |
| A7 | GET | `/alunos/me/conteudos-dominados` | aluno |

### Materiais de Apoio
| Nº | Método | URL | Perfil |
|---|---|---|---|
| T5 | POST | `/salas/:id/materiais` | tutor (ativo na sala) |
| A5 | GET | `/salas/:id/materiais` | professor, tutor, aluno |

### Avisos e Mensagens
| Nº | Método | URL | Perfil |
|---|---|---|---|
| P3 | POST | `/salas/:id/avisos` | professor (dono) |
| A4 | GET | `/salas/:id/avisos` | professor (dono), aluno (matriculado) |
| O1 | POST | `/tutorias/:id/mensagens` | tutor, aluno (participantes da tutoria) |
| O2 | GET | `/tutorias/:id/mensagens` | tutor, aluno (participantes da tutoria) |

### Feedback
| Nº | Método | URL | Perfil |
|---|---|---|---|
| A10 | POST | `/tutorias/:id/feedbacks` | aluno (tutorado) |
| T7 | GET | `/feedbacks` | tutor, professor |

**Total: 57 rotas.**

---

## 4. Rotas

### 4.1 Autenticação e Cadastro

### [P17] Cadastrar professor
- **Método:** POST
- **URL:** `/professores`
- **Autenticação:** pública
- **Descrição:** Cria a conta de um professor com o e-mail ainda não confirmado e envia por e-mail um link de confirmação válido por 1 hora (RN20). O domínio do e-mail precisa estar na lista `DOMINIOS_PERMITIDOS_PROFESSOR`, e a senha é gravada com hash. Se o envio do e-mail falhar, o cadastro é mantido e a resposta continua 201, só com outra mensagem.
- **Parâmetros de rota:** Não possui
- **Parâmetros de query:** Não possui
- **Corpo da requisição:**

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| nome | string | sim | Nome do professor (não pode ser vazio) |
| email | string | sim | E-mail institucional, em formato válido e com domínio permitido |
| senha | string | sim | Senha (não pode ser vazia) |

```json
{
  "nome": "Mariana Souza",
  "email": "mariana.souza@portalsesi.org.br",
  "senha": "********"
}
```

- **Respostas:**
  - **Sucesso (201):**

```json
{
  "id_professor": 3,
  "nome": "Mariana Souza",
  "email": "mariana.souza@portalsesi.org.br",
  "email_confirmado": false,
  "mensagem": "Cadastro realizado. Enviamos um link de confirmação para o seu e-mail."
}
```

  Se o envio do e-mail falhar, `mensagem` vem como `"Cadastro realizado, mas não foi possível enviar o e-mail de confirmação."`

  - **Erros:**

| Código | Mensagem retornada | Quando ocorre |
|---|---|---|
| 400 | Nome, email e senha são obrigatórios | Algum dos três campos está ausente, vazio ou não é texto |
| 400 | Email em formato inválido | O e-mail não tem o formato `nome@dominio.ext` |
| 400 | Domínio de email não permitido | O domínio do e-mail não está em `DOMINIOS_PERMITIDOS_PROFESSOR` |
| 409 | Email já cadastrado | Já existe professor com esse e-mail |
| 500 | Erro interno do servidor | Erro inesperado (ex.: falha no banco) |

> ⚠️ Divergência: e-mail duplicado devolve **409**, código fora da lista padrão.

---

### [P18] Login de professor
- **Método:** POST
- **URL:** `/sessao/professores`
- **Autenticação:** pública
- **Descrição:** Confere e-mail e senha e devolve o token JWT do professor, válido por 30 dias. A confirmação do e-mail só é verificada depois que e-mail e senha estão corretos, para que a mensagem não revele se o e-mail está cadastrado.
- **Parâmetros de rota:** Não possui
- **Parâmetros de query:** Não possui
- **Corpo da requisição:**

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| email | string | sim | E-mail cadastrado |
| senha | string | sim | Senha |

```json
{
  "email": "mariana.souza@portalsesi.org.br",
  "senha": "********"
}
```

- **Respostas:**
  - **Sucesso (200):**

```json
{
  "id_professor": 3,
  "nome": "Mariana Souza",
  "email": "mariana.souza@portalsesi.org.br",
  "token": "<token JWT>"
}
```

  - **Erros:**

| Código | Mensagem retornada | Quando ocorre |
|---|---|---|
| 400 | Email e senha são obrigatórios | Algum dos dois campos está ausente, vazio ou não é texto |
| 401 | Email ou senha incorretos | E-mail não cadastrado ou senha errada |
| 403 | Confirme seu e-mail antes de entrar. Verifique sua caixa de entrada. | E-mail e senha corretos, mas o e-mail ainda não foi confirmado (RN20) |
| 500 | Erro interno do servidor | Erro inesperado |

> ⚠️ Divergência: e-mail não confirmado devolve **403**, código fora da lista padrão.

---

### [A11] Cadastrar aluno
- **Método:** POST
- **URL:** `/alunos`
- **Autenticação:** pública
- **Descrição:** Cria a conta de um aluno com o e-mail ainda não confirmado e envia por e-mail um link de confirmação válido por 1 hora (RN20). O domínio do e-mail precisa estar na lista `DOMINIOS_PERMITIDOS_ALUNO`, e a senha é gravada com hash. Se o envio do e-mail falhar, o cadastro é mantido e a resposta continua 201, só com outra mensagem.
- **Parâmetros de rota:** Não possui
- **Parâmetros de query:** Não possui
- **Corpo da requisição:**

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| nome | string | sim | Nome do aluno (não pode ser vazio) |
| email | string | sim | E-mail institucional, em formato válido e com domínio permitido |
| senha | string | sim | Senha (não pode ser vazia) |

```json
{
  "nome": "Lucas Pereira",
  "email": "lucas.pereira@portalsesisp.org.br",
  "senha": "********"
}
```

- **Respostas:**
  - **Sucesso (201):**

```json
{
  "id_aluno": 12,
  "nome": "Lucas Pereira",
  "email": "lucas.pereira@portalsesisp.org.br",
  "email_confirmado": false,
  "mensagem": "Cadastro realizado. Enviamos um link de confirmação para o seu e-mail."
}
```

  Se o envio do e-mail falhar, `mensagem` vem como `"Cadastro realizado, mas não foi possível enviar o e-mail de confirmação."`

  - **Erros:**

| Código | Mensagem retornada | Quando ocorre |
|---|---|---|
| 400 | Nome, email e senha são obrigatórios | Algum dos três campos está ausente, vazio ou não é texto |
| 400 | Email em formato inválido | O e-mail não tem o formato `nome@dominio.ext` |
| 400 | Domínio de email não permitido | O domínio do e-mail não está em `DOMINIOS_PERMITIDOS_ALUNO` |
| 409 | Email já cadastrado | Já existe aluno com esse e-mail |
| 500 | Erro interno do servidor | Erro inesperado (ex.: falha no banco) |

> ⚠️ Divergência: e-mail duplicado devolve **409**, código fora da lista padrão.

---

### [A12] Login de aluno
- **Método:** POST
- **URL:** `/sessao/alunos`
- **Autenticação:** pública
- **Descrição:** Confere e-mail e senha e devolve o token JWT do aluno, válido por 30 dias. O tutor usa este mesmo login. A confirmação do e-mail só é verificada depois que e-mail e senha estão corretos.
- **Parâmetros de rota:** Não possui
- **Parâmetros de query:** Não possui
- **Corpo da requisição:**

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| email | string | sim | E-mail cadastrado |
| senha | string | sim | Senha |

```json
{
  "email": "lucas.pereira@portalsesisp.org.br",
  "senha": "********"
}
```

- **Respostas:**
  - **Sucesso (200):**

```json
{
  "id_aluno": 12,
  "nome": "Lucas Pereira",
  "email": "lucas.pereira@portalsesisp.org.br",
  "token": "<token JWT>"
}
```

  - **Erros:**

| Código | Mensagem retornada | Quando ocorre |
|---|---|---|
| 400 | Email e senha são obrigatórios | Algum dos dois campos está ausente, vazio ou não é texto |
| 401 | Email ou senha incorretos | E-mail não cadastrado ou senha errada |
| 403 | Confirme seu e-mail antes de entrar. Verifique sua caixa de entrada. | E-mail e senha corretos, mas o e-mail ainda não foi confirmado (RN20) |
| 500 | Erro interno do servidor | Erro inesperado |

> ⚠️ Divergência: e-mail não confirmado devolve **403**, código fora da lista padrão.

---

### [O3] Confirmar e-mail
- **Método:** GET
- **URL:** `/confirmacao-email/:token`
- **Autenticação:** pública
- **Descrição:** É o link enviado por e-mail no cadastro, e vale tanto para professor quanto para aluno (RN20). Se o token existe e não expirou, marca o e-mail como confirmado e apaga o token, então o link só pode ser usado uma vez. Um token expirado não é apagado. A resposta é uma **página HTML** com a mensagem, porque o link é aberto no navegador.
- **Parâmetros de rota:**

| Nome | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| token | string | sim | Token recebido no link do e-mail |

- **Parâmetros de query:** Não possui
- **Corpo da requisição:** Não possui
- **Respostas:**
  - **Sucesso (200):** página HTML (`Content-Type: text/html`) com o título "Protutal" e a mensagem:

```
E-mail confirmado! Você já pode entrar no Protutal.
```

  - **Erros:**

| Código | Mensagem retornada | Quando ocorre |
|---|---|---|
| 400 | Link de confirmação inválido ou já utilizado | O token não existe em nenhuma das duas tabelas ou já foi usado (página HTML) |
| 410 | Link de confirmação expirado | O token existe, mas passou o prazo de 1 hora (página HTML) |
| 500 | Erro interno do servidor | Erro inesperado (em JSON, pelo handler global) |

> ⚠️ Divergência: link expirado devolve **410**, código fora da lista padrão. A rota também não segue o formato JSON das demais: sucesso, 400 e 410 vêm como página HTML, e só o 500 vem em JSON.

---

### [O4] Reenviar link de confirmação de e-mail
- **Método:** POST
- **URL:** `/confirmacao-email/reenviar`
- **Autenticação:** pública
- **Descrição:** Gera um token novo, válido por 1 hora, e reenvia o link para o professor e/ou aluno com esse e-mail que ainda não tenha confirmado o cadastro. O token anterior deixa de valer. Se o último envio foi há menos de 2 minutos, se o e-mail não está cadastrado ou se já foi confirmado, nada é feito. A resposta é sempre a mesma, para não revelar se o e-mail está cadastrado.
- **Parâmetros de rota:** Não possui
- **Parâmetros de query:** Não possui
- **Corpo da requisição:**

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| email | string | sim | E-mail usado no cadastro |

```json
{
  "email": "lucas.pereira@portalsesisp.org.br"
}
```

- **Respostas:**
  - **Sucesso (200):** sempre a mesma mensagem, haja ou não reenvio. Se o envio do e-mail falhar, a falha fica registrada só no console do servidor.

```json
{
  "mensagem": "Se o e-mail estiver cadastrado e aguardando confirmação, um novo link foi enviado. Ele vale por 1 hora."
}
```

  - **Erros:**

| Código | Mensagem retornada | Quando ocorre |
|---|---|---|
| 400 | Email é obrigatório | Campo `email` ausente, vazio ou que não é texto |
| 500 | Erro interno do servidor | Erro inesperado (ex.: falha no banco) |

---

### 4.2 Sala

> Erros de autenticação e perfil comuns às rotas deste módulo. Eles são conferidos antes de qualquer validação do service:
>
> | Código | Mensagem retornada | Quando ocorre |
> |---|---|---|
> | 401 | Token não informado | Requisição sem o cabeçalho `Authorization` |
> | 401 | Token mal formatado | Cabeçalho sem o token depois de `Bearer` |
> | 401 | Token inválido | Token adulterado, expirado ou assinado com outro segredo |
> | 403 | Acesso permitido somente para professores | O token não pertence a um professor (`isProfessor`) |
>
> Nas tabelas de cada rota, essas linhas aparecem resumidas como "401 / 403 (perfil)".

### [P19] Criar sala
- **Método:** POST
- **URL:** `/salas`
- **Autenticação:** token obrigatório (perfil: professor)
- **Descrição:** Cria uma sala ligada ao professor logado. O professor vem do token, nunca do corpo. O nome é gravado sem espaços nas pontas.
- **Parâmetros de rota:** Não possui
- **Parâmetros de query:** Não possui
- **Corpo da requisição:**

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| nome | string | sim | Nome da sala, até 100 caracteres |
| serie | number | sim | Série do Ensino Médio: 1, 2 ou 3 |
| ano_letivo | number | sim | Ano letivo, número inteiro (ex.: 2026) |

```json
{
  "nome": "2º A",
  "serie": 2,
  "ano_letivo": 2026
}
```

- **Respostas:**
  - **Sucesso (201):**

```json
{
  "id_sala": 5,
  "nome": "2º A",
  "serie": 2,
  "ano_letivo": 2026,
  "id_professor": 3
}
```

  - **Erros:**

| Código | Mensagem retornada | Quando ocorre |
|---|---|---|
| 401 / 403 | (ver tabela comum do módulo) | Token ausente ou inválido, ou usuário que não é professor |
| 400 | O campo nome é obrigatório | `nome` ausente, vazio ou que não é texto |
| 400 | O nome deve ter no máximo 100 caracteres | `nome` com mais de 100 caracteres |
| 400 | O campo serie é obrigatório | `serie` ausente ou `null` |
| 400 | A serie deve ser 1, 2 ou 3 | `serie` diferente de 1, 2 ou 3 |
| 400 | O campo ano_letivo é obrigatório | `ano_letivo` ausente, `null` ou vazio |
| 400 | O ano_letivo deve ser um número inteiro | `ano_letivo` que não é inteiro |
| 500 | Erro interno do servidor | Erro inesperado |

> ⚠️ Divergência: o 403 do perfil está fora da lista padrão.

---

### [P20] Listar salas
- **Método:** GET
- **URL:** `/salas`
- **Autenticação:** token obrigatório (perfil: professor)
- **Descrição:** Lista somente as salas do professor logado, em ordem crescente de `id_sala`. Sem salas, devolve uma lista vazia.
- **Parâmetros de rota:** Não possui
- **Parâmetros de query:** Não possui
- **Corpo da requisição:** Não possui
- **Respostas:**
  - **Sucesso (200):**

```json
[
  {
    "id_sala": 5,
    "nome": "2º A",
    "serie": 2,
    "ano_letivo": 2026,
    "id_professor": 3
  },
  {
    "id_sala": 6,
    "nome": "3º B",
    "serie": 3,
    "ano_letivo": 2026,
    "id_professor": 3
  }
]
```

  - **Erros:**

| Código | Mensagem retornada | Quando ocorre |
|---|---|---|
| 401 / 403 | (ver tabela comum do módulo) | Token ausente ou inválido, ou usuário que não é professor |
| 500 | Erro interno do servidor | Erro inesperado |

> ⚠️ Divergência: o 403 do perfil está fora da lista padrão.

---

### [P1] Detalhar sala
- **Método:** GET
- **URL:** `/salas/:id`
- **Autenticação:** token obrigatório (perfil: professor, dono da sala)
- **Descrição:** Devolve os dados básicos da sala e o professor responsável (só id e nome). Só o professor dono da sala tem acesso (RN07). Alunos, tutores e conteúdos não vêm nesta rota, porque têm rotas próprias (P23, P24 e P2).
- **Parâmetros de rota:**

| Nome | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| id | number | sim | Id da sala (inteiro positivo) |

- **Parâmetros de query:** Não possui
- **Corpo da requisição:** Não possui
- **Respostas:**
  - **Sucesso (200):**

```json
{
  "id_sala": 5,
  "nome": "2º A",
  "serie": 2,
  "ano_letivo": 2026,
  "professor": {
    "id_professor": 3,
    "nome": "Mariana Souza"
  }
}
```

  - **Erros:**

| Código | Mensagem retornada | Quando ocorre |
|---|---|---|
| 401 / 403 | (ver tabela comum do módulo) | Token ausente ou inválido, ou usuário que não é professor |
| 400 | O id da sala deve ser um número inteiro | `:id` não é inteiro positivo |
| 404 | Sala não encontrada | Não existe sala com esse id |
| 403 | Você não tem permissão para acessar esta sala | A sala é de outro professor |
| 500 | Erro interno do servidor | Erro inesperado |

> ⚠️ Divergência: sala de outro professor devolve **403**, código fora da lista padrão.

---

### [P29] Conceder ou retirar a permissão de criar atividades
- **Método:** PATCH
- **URL:** `/salas/:id/permissao-atividades`
- **Autenticação:** token obrigatório (perfil: professor, dono da sala)
- **Descrição:** Liga ou desliga, de uma vez, o `pode_criar_ativ` de todos os tutores ativos da sala, ou seja, os vínculos `Tutor_sala` sem `data_revogacao`. Os vínculos revogados não são alterados. Uma sala sem tutor ativo não gera erro: a resposta vem com `quantidade_atualizada: 0`.
- **Parâmetros de rota:**

| Nome | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| id | number | sim | Id da sala (inteiro positivo) |

- **Parâmetros de query:** Não possui
- **Corpo da requisição:**

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| pode_criar_ativ | boolean | sim | `true` concede e `false` retira a permissão. Texto `"true"`, `1` e `null` são recusados |

```json
{
  "pode_criar_ativ": true
}
```

- **Respostas:**
  - **Sucesso (200):**

```json
{
  "id_sala": 5,
  "pode_criar_ativ": true,
  "quantidade_atualizada": 2
}
```

  - **Erros:**

| Código | Mensagem retornada | Quando ocorre |
|---|---|---|
| 401 / 403 | (ver tabela comum do módulo) | Token ausente ou inválido, ou usuário que não é professor |
| 400 | O id da sala deve ser um número inteiro | `:id` não é inteiro positivo |
| 400 | O campo pode_criar_ativ é obrigatório e deve ser true ou false | Campo ausente ou que não é booleano |
| 404 | Sala não encontrada | Não existe sala com esse id |
| 403 | Você não tem permissão para acessar esta sala | A sala é de outro professor |
| 500 | Erro interno do servidor | Erro inesperado |

> ⚠️ Divergência: sala de outro professor devolve **403**, código fora da lista padrão. Nesta rota o corpo é validado **antes** de conferir se a sala existe. Em P22 e P25, a ordem é id → 404 → 403 → corpo.

---

### 4.3 Aluno e Matrícula

> As três rotas deste módulo usam `isAuthenticated` + `isProfessor`. Os erros 401 e 403 de perfil são os mesmos da tabela comum da seção 4.2.

### [P21] Listar alunos
- **Método:** GET
- **URL:** `/alunos`
- **Autenticação:** token obrigatório (perfil: professor)
- **Descrição:** Lista todos os alunos cadastrados no Protutal, em ordem alfabética de nome, para o professor escolher quem matricular. O filtro `?busca=` faz uma busca parcial por nome **ou** e-mail, sem diferenciar maiúsculas de minúsculas. Senha e tokens nunca saem na resposta.
- **Parâmetros de rota:** Não possui
- **Parâmetros de query:**

| Nome | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| busca | string | não | Trecho do nome ou do e-mail. Vazio, só com espaços ou repetido (`?busca=a&busca=b`) é ignorado, e a rota lista todos os alunos |

- **Corpo da requisição:** Não possui
- **Respostas:**
  - **Sucesso (200):** exemplo de `GET /alunos?busca=pereira`

```json
[
  {
    "id_aluno": 12,
    "nome": "Lucas Pereira",
    "email": "lucas.pereira@portalsesisp.org.br",
    "email_confirmado": true
  }
]
```

  - **Erros:**

| Código | Mensagem retornada | Quando ocorre |
|---|---|---|
| 401 / 403 | (ver tabela comum da seção 4.2) | Token ausente ou inválido, ou usuário que não é professor |
| 500 | Erro interno do servidor | Erro inesperado |

> ⚠️ Divergência: o 403 do perfil está fora da lista padrão.

---

### [P22] Matricular aluno na sala
- **Método:** POST
- **URL:** `/salas/:id/matriculas`
- **Autenticação:** token obrigatório (perfil: professor, dono da sala)
- **Descrição:** Cria a matrícula (`Matricula`) do aluno na sala. Só o professor dono da sala pode matricular. O aluno não pode ser matriculado duas vezes na mesma sala, nem em outra sala do mesmo ano letivo (a comparação usa o `ano_letivo` da sala).
- **Parâmetros de rota:**

| Nome | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| id | number | sim | Id da sala (inteiro positivo) |

- **Parâmetros de query:** Não possui
- **Corpo da requisição:**

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| id_aluno | number | sim | Id do aluno a matricular (inteiro positivo) |

```json
{
  "id_aluno": 12
}
```

- **Respostas:**
  - **Sucesso (201):**

```json
{
  "id_matricula": 40,
  "id_aluno": 12,
  "id_sala": 5
}
```

  - **Erros** (na ordem em que são conferidos):

| Código | Mensagem retornada | Quando ocorre |
|---|---|---|
| 401 / 403 | (ver tabela comum da seção 4.2) | Token ausente ou inválido, ou usuário que não é professor |
| 400 | O id da sala deve ser um número inteiro | `:id` não é inteiro positivo |
| 404 | Sala não encontrada | Não existe sala com esse id |
| 403 | Você não tem permissão para acessar esta sala | A sala é de outro professor |
| 400 | O campo id_aluno é obrigatório e deve ser um número inteiro | `id_aluno` ausente, `null` ou que não é inteiro positivo |
| 404 | Aluno não encontrado | Não existe aluno com esse id |
| 409 | Aluno já matriculado nesta sala | O aluno já tem matrícula nesta sala (também é a resposta quando duas requisições iguais chegam ao mesmo tempo) |
| 409 | Aluno já matriculado em outra sala no ano letivo 2026 | O aluno já está em outra sala com o mesmo `ano_letivo`. A mensagem traz o ano da sala (o exemplo usa 2026) |
| 500 | Erro interno do servidor | Erro inesperado |

> ⚠️ Divergência: sala de outro professor devolve **403**, e matrícula duplicada ou no mesmo ano letivo devolve **409**. Os dois códigos estão fora da lista padrão.

---

### [P23] Listar alunos da sala
- **Método:** GET
- **URL:** `/salas/:id/alunos`
- **Autenticação:** token obrigatório (perfil: professor, dono da sala)
- **Descrição:** Lista os alunos matriculados na sala, em ordem alfabética de nome. Só o professor dono da sala tem acesso. Sala sem alunos devolve uma lista vazia.
- **Parâmetros de rota:**

| Nome | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| id | number | sim | Id da sala (inteiro positivo) |

- **Parâmetros de query:** Não possui
- **Corpo da requisição:** Não possui
- **Respostas:**
  - **Sucesso (200):**

```json
[
  {
    "id_aluno": 15,
    "nome": "Ana Ribeiro",
    "email": "ana.ribeiro@portalsesisp.org.br",
    "email_confirmado": true
  },
  {
    "id_aluno": 12,
    "nome": "Lucas Pereira",
    "email": "lucas.pereira@portalsesisp.org.br",
    "email_confirmado": true
  }
]
```

  - **Erros:**

| Código | Mensagem retornada | Quando ocorre |
|---|---|---|
| 401 / 403 | (ver tabela comum da seção 4.2) | Token ausente ou inválido, ou usuário que não é professor |
| 400 | O id da sala deve ser um número inteiro | `:id` não é inteiro positivo |
| 404 | Sala não encontrada | Não existe sala com esse id |
| 403 | Você não tem permissão para acessar esta sala | A sala é de outro professor |
| 500 | Erro interno do servidor | Erro inesperado |

> ⚠️ Divergência: sala de outro professor devolve **403**, código fora da lista padrão.

---

### 4.4 Conteúdos

> Os erros 401 (token) são os mesmos da tabela comum da seção 4.2 em todas as rotas deste módulo. O 403 "Acesso permitido somente para professores" só vale para a P25. A P2 e a T8 não usam o `isProfessor`.

### [P25] Cadastrar conteúdo na sala
- **Método:** POST
- **URL:** `/salas/:id/conteudos`
- **Autenticação:** token obrigatório (perfil: professor, dono da sala)
- **Descrição:** Vincula um conteúdo à sala por meio da tabela `Sala_conteudo`. O nome do conteúdo é único no sistema inteiro. Se outra sala já cadastrou um conteúdo com o mesmo nome, sem diferenciar maiúsculas de minúsculas ("Relevo" = "relevo"), ele é reaproveitado e só o vínculo é criado. Nesse caso, a resposta traz o nome já gravado. Se o conteúdo não existe, ele e o vínculo são criados na mesma operação.
- **Parâmetros de rota:**

| Nome | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| id | number | sim | Id da sala (inteiro positivo) |

- **Parâmetros de query:** Não possui
- **Corpo da requisição:**

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| nome | string | sim | Nome do conteúdo, até 100 caracteres (gravado sem espaços nas pontas) |

```json
{
  "nome": "Relevo brasileiro"
}
```

- **Respostas:**
  - **Sucesso (201):**

```json
{
  "id_sala_conteudo": 21,
  "id_sala": 5,
  "conteudo": {
    "id_conteudo": 8,
    "nome": "Relevo brasileiro"
  }
}
```

  - **Erros** (na ordem em que são conferidos):

| Código | Mensagem retornada | Quando ocorre |
|---|---|---|
| 401 / 403 | (ver tabela comum da seção 4.2) | Token ausente ou inválido, ou usuário que não é professor |
| 400 | O id da sala deve ser um número inteiro | `:id` não é inteiro positivo |
| 404 | Sala não encontrada | Não existe sala com esse id |
| 403 | Você não tem permissão para acessar esta sala | A sala é de outro professor |
| 400 | O campo nome é obrigatório | `nome` ausente, vazio ou que não é texto |
| 400 | O nome deve ter no máximo 100 caracteres | `nome` com mais de 100 caracteres |
| 409 | Conteúdo já cadastrado nesta sala | O conteúdo já está vinculado a esta sala (também é a resposta quando duas requisições iguais chegam ao mesmo tempo) |
| 500 | Erro interno do servidor | Erro inesperado |

> ⚠️ Divergência: sala de outro professor devolve **403**, e conteúdo repetido na sala devolve **409**. Os dois códigos estão fora da lista padrão.

---

### [P2] Listar conteúdos da sala
- **Método:** GET
- **URL:** `/salas/:id/conteudos`
- **Autenticação:** token obrigatório (perfil: professor dono da sala ou tutor ativo da sala)
- **Descrição:** Lista os conteúdos vinculados à sala, em ordem alfabética de nome. O tutor usa a lista para escolher o conteúdo de uma atividade (T9). A permissão é conferida pelo middleware `isTutorAtivoSala`: passa o professor dono da sala ou um aluno com vínculo `Tutor_sala` ativo nessa sala. Sala sem conteúdos devolve uma lista vazia.
- **Parâmetros de rota:**

| Nome | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| id | number | sim | Id da sala (inteiro positivo) |

- **Parâmetros de query:** Não possui
- **Corpo da requisição:** Não possui
- **Respostas:**
  - **Sucesso (200):**

```json
[
  {
    "id_conteudo": 9,
    "nome": "Clima e vegetação"
  },
  {
    "id_conteudo": 8,
    "nome": "Relevo brasileiro"
  }
]
```

  - **Erros** (na ordem em que são conferidos):

| Código | Mensagem retornada | Quando ocorre |
|---|---|---|
| 401 | (ver tabela comum da seção 4.2) | Token ausente, mal formatado ou inválido |
| 400 | O id da sala deve ser um número inteiro | `:id` não é inteiro positivo |
| 404 | Sala não encontrada | Não existe sala com esse id |
| 403 | Você não tem permissão para acessar esta sala | O usuário não é o professor dono nem tutor ativo da sala (inclui tutor revogado e aluno comum) |
| 500 | Erro interno do servidor | Erro inesperado |

> ⚠️ Divergência: o usuário sem permissão recebe **403**, código fora da lista padrão.

---

### [T8] Listar tipos de atividade
- **Método:** GET
- **URL:** `/tipos-atividade`
- **Autenticação:** token obrigatório (perfil: professor ou aluno, qualquer usuário autenticado)
- **Descrição:** Lista os valores do enum `TipoAtividade` com o rótulo em português, para o campo de seleção do front-end. A rota não consulta o banco: os valores vêm do enum gerado pelo Prisma, na ordem em que foram declarados no `schema.prisma`.
- **Parâmetros de rota:** Não possui
- **Parâmetros de query:** Não possui
- **Corpo da requisição:** Não possui
- **Respostas:**
  - **Sucesso (200):** lista completa (15 tipos)

```json
[
  { "valor": "aula_invertida", "rotulo": "Aula invertida" },
  { "valor": "prova_alternativa", "rotulo": "Prova de alternativas" },
  { "valor": "prova_dissertativa", "rotulo": "Prova dissertativa" },
  { "valor": "projeto", "rotulo": "Projeto" },
  { "valor": "interpretacao_imagens", "rotulo": "Interpretação de imagens" },
  { "valor": "exercicios_livro", "rotulo": "Exercícios do livro" },
  { "valor": "interpretacao_mapas", "rotulo": "Interpretação de mapas" },
  { "valor": "analise_graficos", "rotulo": "Análise de gráficos" },
  { "valor": "mapa_mental", "rotulo": "Mapa mental" },
  { "valor": "pesquisa", "rotulo": "Pesquisa" },
  { "valor": "estudo_caso", "rotulo": "Estudo de caso" },
  { "valor": "trabalho_campo", "rotulo": "Trabalho de campo" },
  { "valor": "teatro", "rotulo": "Teatro" },
  { "valor": "atividade_extracurricular", "rotulo": "Atividade extracurricular" },
  { "valor": "autoavaliacao", "rotulo": "Autoavaliação" }
]
```

  - **Erros:**

| Código | Mensagem retornada | Quando ocorre |
|---|---|---|
| 401 | (ver tabela comum da seção 4.2) | Token ausente, mal formatado ou inválido |
| 500 | Erro interno do servidor | Erro inesperado |

---

### 4.5 Pedido de Tutoria e Tutor da Sala

> Os erros 401 (token) são os da tabela comum da seção 4.2. A A13 usa o `isAluno`, que devolve **403** `Acesso permitido somente para alunos` quando o token não é de aluno. As demais rotas usam o `isProfessor` (403 `Acesso permitido somente para professores`).
>
> Fluxo: o aluno pede para ser tutor (A13) → o professor aceita (P27) ou recusa (P28). Ao aceitar, são criados o registro em `Tutor` e o vínculo `Tutor_sala` com a sala. Antes do aceite existe apenas o `Pedido_tutoria`.

### [A13] Pedir para ser tutor
- **Método:** POST
- **URL:** `/pedidos-tutoria`
- **Autenticação:** token obrigatório (perfil: aluno)
- **Descrição:** Cria um pedido de tutoria com status `pendente` para uma sala em que o aluno logado está matriculado. O aluno não pode ter outro pedido pendente e não pode já ser tutor, porque `Tutor.id_aluno` é único: quem já tem registro em `Tutor` não pede de novo, nem para outra sala.
- **Parâmetros de rota:** Não possui
- **Parâmetros de query:** Não possui
- **Corpo da requisição:**

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| id_sala | number | sim | Sala em que o aluno quer ser tutor (inteiro positivo) |

```json
{
  "id_sala": 5
}
```

- **Respostas:**
  - **Sucesso (201):**

```json
{
  "id_pedido": 7,
  "id_aluno": 12,
  "id_sala": 5,
  "status": "pendente",
  "data_solicitacao": "2026-10-20T13:45:00.000Z"
}
```

  - **Erros** (na ordem em que são conferidos):

| Código | Mensagem retornada | Quando ocorre |
|---|---|---|
| 401 | (ver tabela comum da seção 4.2) | Token ausente, mal formatado ou inválido |
| 403 | Acesso permitido somente para alunos | O token não é de aluno |
| 400 | O campo id_sala é obrigatório e deve ser um número inteiro | `id_sala` ausente, `null` ou que não é inteiro positivo |
| 404 | Sala não encontrada | Não existe sala com esse id |
| 400 | Você não está matriculado nesta sala | O aluno não tem matrícula na sala |
| 409 | Você já é tutor | O aluno já tem registro em `Tutor` |
| 409 | Você já tem um pedido de tutoria pendente | Já existe pedido `pendente` do aluno, em qualquer sala |
| 500 | Erro interno do servidor | Erro inesperado |

> ⚠️ Divergência: o perfil errado devolve **403**, e já ser tutor ou ter pedido pendente devolve **409**. Os dois códigos estão fora da lista padrão. "Você não está matriculado nesta sala" é uma relação que não existe e devolve **400**, não 404.

---

### [P26] Listar pedidos de tutoria
- **Método:** GET
- **URL:** `/pedidos-tutoria`
- **Autenticação:** token obrigatório (perfil: professor)
- **Descrição:** Lista os pedidos **pendentes** feitos para as salas do professor logado, do mais antigo para o mais recente. Para cada pedido vêm a sala escolhida (`sala_pedido`), o aluno (id e nome) e as salas desse professor em que o aluno está matriculado (`salas_matriculado`). Sem pedidos, devolve uma lista vazia.
- **Parâmetros de rota:** Não possui
- **Parâmetros de query:** Não possui
- **Corpo da requisição:** Não possui
- **Respostas:**
  - **Sucesso (200):**

```json
[
  {
    "id_pedido": 7,
    "data_solicitacao": "2026-10-20T13:45:00.000Z",
    "sala_pedido": {
      "id_sala": 5,
      "nome": "2º A"
    },
    "aluno": {
      "id_aluno": 12,
      "nome": "Lucas Pereira"
    },
    "salas_matriculado": [
      {
        "id_sala": 5,
        "nome": "2º A"
      }
    ]
  }
]
```

  - **Erros:**

| Código | Mensagem retornada | Quando ocorre |
|---|---|---|
| 401 / 403 | (ver tabela comum da seção 4.2) | Token ausente ou inválido, ou usuário que não é professor |
| 500 | Erro interno do servidor | Erro inesperado |

> ⚠️ Divergência: o 403 do perfil está fora da lista padrão.

---

### [P27] Aceitar pedido de tutoria
- **Método:** PATCH
- **URL:** `/pedidos-tutoria/:id/aceitar`
- **Autenticação:** token obrigatório (perfil: professor, dono da sala do pedido)
- **Descrição:** Aceita um pedido pendente. Numa única transação, a rota muda o pedido para `aceito` (com `data_decisao` e o professor), cria o registro em `Tutor` e o vínculo `Tutor_sala` com `pode_criar_ativ: false`. O `id_sala` do corpo precisa ser a mesma sala escolhida no pedido, e o aluno ainda precisa estar matriculado nela. Se dois professores aceitarem ao mesmo tempo, só o primeiro grava.
- **Parâmetros de rota:**

| Nome | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| id | number | sim | Id do pedido (inteiro positivo) |

- **Parâmetros de query:** Não possui
- **Corpo da requisição:**

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| id_sala | number | sim | Sala do pedido (inteiro positivo). Precisa ser igual à sala escolhida pelo aluno |

```json
{
  "id_sala": 5
}
```

- **Respostas:**
  - **Sucesso (200):**

```json
{
  "pedido": {
    "id_pedido": 7,
    "id_aluno": 12,
    "id_sala": 5,
    "status": "aceito",
    "data_solicitacao": "2026-10-20T13:45:00.000Z",
    "data_decisao": "2026-10-21T10:00:00.000Z",
    "id_professor": 3
  },
  "tutor_sala": {
    "id_tutor_sala": 4,
    "id_tutor": 4,
    "id_sala": 5,
    "data_definicao": "2026-10-21T10:00:00.000Z",
    "pode_criar_ativ": false
  }
}
```

  - **Erros** (na ordem em que são conferidos):

| Código | Mensagem retornada | Quando ocorre |
|---|---|---|
| 401 / 403 | (ver tabela comum da seção 4.2) | Token ausente ou inválido, ou usuário que não é professor |
| 400 | O id do pedido deve ser um número inteiro | `:id` não é inteiro positivo |
| 400 | O campo id_sala é obrigatório e deve ser um número inteiro | `id_sala` ausente, `null` ou que não é inteiro positivo |
| 404 | Pedido de tutoria não encontrado | Não existe pedido com esse id |
| 409 | Este pedido já foi decidido | O pedido não está `pendente` (também é a resposta quando outro professor decidiu ao mesmo tempo) |
| 404 | Sala não encontrada | Não existe sala com o `id_sala` informado |
| 403 | Você não tem permissão para acessar esta sala | A sala é de outro professor |
| 400 | Este pedido foi feito para outra sala | O `id_sala` do corpo é diferente da sala do pedido |
| 400 | O aluno não está matriculado nesta sala | O aluno não tem mais matrícula na sala |
| 409 | Este aluno já é tutor | O aluno já tem registro em `Tutor` (violação de UNIQUE ao criar) |
| 500 | Erro interno do servidor | Erro inesperado |

> ⚠️ Divergência: sala de outro professor devolve **403**, e pedido já decidido ou aluno que já é tutor devolve **409**. Os dois códigos estão fora da lista padrão. "Pedido feito para outra sala" e "aluno não matriculado" devolvem **400**, não 404.

---

### [P28] Recusar pedido de tutoria
- **Método:** PATCH
- **URL:** `/pedidos-tutoria/:id/recusar`
- **Autenticação:** token obrigatório (perfil: professor, dono da sala do pedido)
- **Descrição:** Recusa um pedido pendente: muda o status para `recusado` e grava `data_decisao` e o professor. A rota não cria `Tutor` nem `Tutor_sala`. A sala conferida é a do pedido, então a rota não tem corpo.
- **Parâmetros de rota:**

| Nome | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| id | number | sim | Id do pedido (inteiro positivo) |

- **Parâmetros de query:** Não possui
- **Corpo da requisição:** Não possui
- **Respostas:**
  - **Sucesso (200):**

```json
{
  "pedido": {
    "id_pedido": 7,
    "id_aluno": 12,
    "id_sala": 5,
    "status": "recusado",
    "data_solicitacao": "2026-10-20T13:45:00.000Z",
    "data_decisao": "2026-10-21T10:00:00.000Z",
    "id_professor": 3
  }
}
```

  - **Erros** (na ordem em que são conferidos):

| Código | Mensagem retornada | Quando ocorre |
|---|---|---|
| 401 / 403 | (ver tabela comum da seção 4.2) | Token ausente ou inválido, ou usuário que não é professor |
| 400 | O id do pedido deve ser um número inteiro | `:id` não é inteiro positivo |
| 404 | Pedido de tutoria não encontrado | Não existe pedido com esse id |
| 409 | Este pedido já foi decidido | O pedido não está `pendente` (também é a resposta quando outro professor decidiu ao mesmo tempo) |
| 404 | Sala não encontrada | A sala do pedido não existe |
| 403 | Você não tem permissão para acessar esta sala | A sala do pedido é de outro professor |
| 500 | Erro interno do servidor | Erro inesperado |

> ⚠️ Divergência: sala de outro professor devolve **403**, e pedido já decidido devolve **409**. Os dois códigos estão fora da lista padrão.

---

### [P24] Listar tutores da sala
- **Método:** GET
- **URL:** `/salas/:id/tutores`
- **Autenticação:** token obrigatório (perfil: professor, dono da sala)
- **Descrição:** Lista os tutores **ativos** da sala, ou seja, vínculos `Tutor_sala` sem `data_revogacao`, pela ordem de `data_definicao`. Cada item traz o aluno-tutor (id, nome e e-mail) e se ele pode criar atividades. Sala sem tutor ativo devolve uma lista vazia.
- **Parâmetros de rota:**

| Nome | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| id | number | sim | Id da sala (inteiro positivo) |

- **Parâmetros de query:** Não possui
- **Corpo da requisição:** Não possui
- **Respostas:**
  - **Sucesso (200):**

```json
[
  {
    "id_tutor_sala": 4,
    "id_tutor": 4,
    "pode_criar_ativ": true,
    "data_definicao": "2026-10-21T10:00:00.000Z",
    "aluno": {
      "id_aluno": 12,
      "nome": "Lucas Pereira",
      "email": "lucas.pereira@portalsesisp.org.br"
    }
  }
]
```

  - **Erros:**

| Código | Mensagem retornada | Quando ocorre |
|---|---|---|
| 401 / 403 | (ver tabela comum da seção 4.2) | Token ausente ou inválido, ou usuário que não é professor |
| 400 | O id da sala deve ser um número inteiro | `:id` não é inteiro positivo |
| 404 | Sala não encontrada | Não existe sala com esse id |
| 403 | Você não tem permissão para acessar esta sala | A sala é de outro professor |
| 500 | Erro interno do servidor | Erro inesperado |

> ⚠️ Divergência: sala de outro professor devolve **403**, código fora da lista padrão.

---

### [P8] Revogar tutor da sala
- **Método:** PATCH
- **URL:** `/tutores-sala/:id/revogar`
- **Autenticação:** token obrigatório (perfil: professor, dono da sala)
- **Descrição:** Revoga o vínculo do tutor com a sala (RF18) e finaliza as tutorias ativas dele, na mesma transação. A revogação preenche `data_revogacao`, e as tutorias passam a `finalizada` com `data_fim`. O registro não é apagado, e atividades, notas, materiais e `pode_criar_ativ` não mudam. A revogação é bloqueada se houver contestação de nota pendente em qualquer tutoria do vínculo (RN15).
- **Parâmetros de rota:**

| Nome | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| id | number | sim | Id do vínculo `Tutor_sala` (inteiro positivo) |

- **Parâmetros de query:** Não possui
- **Corpo da requisição:** Não possui
- **Respostas:**
  - **Sucesso (200):**

```json
{
  "tutor_sala": {
    "id_tutor_sala": 4,
    "data_revogacao": "2026-10-25T14:30:00.000Z"
  },
  "tutorias_finalizadas": 2
}
```

  - **Erros** (na ordem em que são conferidos):

| Código | Mensagem retornada | Quando ocorre |
|---|---|---|
| 401 / 403 | (ver tabela comum da seção 4.2) | Token ausente ou inválido, ou usuário que não é professor |
| 400 | O id do tutor da sala deve ser um número inteiro | `:id` não é inteiro positivo |
| 404 | Tutor da sala não encontrado | Não existe vínculo com esse id |
| 403 | Você não tem permissão para acessar esta sala | A sala do vínculo é de outro professor |
| 409 | Este tutor já foi revogado nesta sala | O vínculo já tem `data_revogacao` (também é a resposta quando outra requisição revogou ao mesmo tempo) |
| 409 | Não é possível revogar o tutor: há 1 contestação de nota pendente | Uma contestação pendente nas tutorias do vínculo. Com mais de uma: `Não é possível revogar o tutor: há N contestações de nota pendentes` |
| 500 | Erro interno do servidor | Erro inesperado |

> ⚠️ Divergência: sala de outro professor devolve **403**, e tutor já revogado ou com contestação pendente devolve **409**. Os dois códigos estão fora da lista padrão.

---

### [P9] Avaliar tutor
- **Método:** POST
- **URL:** `/tutores-sala/:id/avaliacoes`
- **Autenticação:** token obrigatório (perfil: professor, dono da sala)
- **Descrição:** Registra uma avaliação do professor sobre o tutor da sala (RF19), com nota e comentário. O mesmo tutor pode receber várias avaliações, e um tutor revogado também pode ser avaliado. A data é preenchida pelo banco.
- **Parâmetros de rota:**

| Nome | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| id | number | sim | Id do vínculo `Tutor_sala` (inteiro positivo) |

- **Parâmetros de query:** Não possui
- **Corpo da requisição:**

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| nota | number | sim | Nota de 0 a 10, com no máximo 2 casas decimais. Precisa ser número no JSON: o texto `"8.5"` é recusado |
| comentario | string | sim | Comentário (não pode ser vazio nem só espaços). É gravado sem espaços nas pontas |

```json
{
  "nota": 8.5,
  "comentario": "Tutor comprometido, acompanha de perto os tutorados."
}
```

- **Respostas:**
  - **Sucesso (201):**

```json
{
  "id_avaliacao": 10,
  "id_tutor_sala": 4,
  "id_professor": 3,
  "nota": 8.5,
  "comentario": "Tutor comprometido, acompanha de perto os tutorados.",
  "data": "2026-10-26T09:15:00.000Z"
}
```

  - **Erros** (na ordem em que são conferidos):

| Código | Mensagem retornada | Quando ocorre |
|---|---|---|
| 401 / 403 | (ver tabela comum da seção 4.2) | Token ausente ou inválido, ou usuário que não é professor |
| 400 | O id do tutor da sala deve ser um número inteiro | `:id` não é inteiro positivo |
| 400 | O campo nota é obrigatório e deve ser um número | `nota` ausente ou que não é número |
| 400 | A nota deve estar entre 0 e 10 | `nota` menor que 0 ou maior que 10 |
| 400 | A nota deve ter no máximo 2 casas decimais | `nota` com mais de 2 casas decimais |
| 400 | O campo comentario é obrigatório e não pode ser vazio | `comentario` ausente, vazio ou só com espaços |
| 404 | Tutor da sala não encontrado | Não existe vínculo com esse id |
| 403 | Você não tem permissão para acessar esta sala | A sala do vínculo é de outro professor |
| 500 | Erro interno do servidor | Erro inesperado |

> ⚠️ Divergência: sala de outro professor devolve **403**, código fora da lista padrão.

---

### [P10] Listar avaliações do tutor
- **Método:** GET
- **URL:** `/tutores-sala/:id/avaliacoes`
- **Autenticação:** token obrigatório (perfil: professor, dono da sala)
- **Descrição:** Mostra o tutor do vínculo (nome, sala e situação de revogação), um resumo com o total de avaliações e a média das notas, e a lista de avaliações da mais recente para a mais antiga. Tutor revogado também tem o histórico listado. Sem avaliações, `media_notas` vem `null` e a lista vem vazia. A média é calculada pelo banco e não é arredondada pela API.
- **Parâmetros de rota:**

| Nome | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| id | number | sim | Id do vínculo `Tutor_sala` (inteiro positivo) |

- **Parâmetros de query:** Não possui
- **Corpo da requisição:** Não possui
- **Respostas:**
  - **Sucesso (200):**

```json
{
  "tutor": {
    "id_tutor_sala": 4,
    "nome": "Lucas Pereira",
    "sala": {
      "nome": "2º A",
      "serie": 2
    },
    "revogado": false,
    "data_revogacao": null
  },
  "resumo": {
    "total_avaliacoes": 2,
    "media_notas": 8.75
  },
  "avaliacoes": [
    {
      "id_avaliacao": 11,
      "nota": 9,
      "comentario": "Melhorou a organização das atividades.",
      "data": "2026-10-26T09:15:00.000Z",
      "professor": {
        "nome": "Mariana Souza"
      }
    },
    {
      "id_avaliacao": 10,
      "nota": 8.5,
      "comentario": "Tutor comprometido, acompanha de perto os tutorados.",
      "data": "2026-10-10T09:15:00.000Z",
      "professor": {
        "nome": "Mariana Souza"
      }
    }
  ]
}
```

  - **Erros** (na ordem em que são conferidos):

| Código | Mensagem retornada | Quando ocorre |
|---|---|---|
| 401 / 403 | (ver tabela comum da seção 4.2) | Token ausente ou inválido, ou usuário que não é professor |
| 400 | O id do tutor da sala deve ser um número inteiro | `:id` não é inteiro positivo |
| 404 | Tutor da sala não encontrado | Não existe vínculo com esse id |
| 403 | Você não tem permissão para acessar esta sala | A sala do vínculo é de outro professor |
| 500 | Erro interno do servidor | Erro inesperado |

> ⚠️ Divergência: sala de outro professor devolve **403**, código fora da lista padrão.

---

### 4.6 Tutoria

> Os erros 401 (token) são os da tabela comum da seção 4.2. As rotas P30, P4, P5, P6 e P7 usam o `isProfessor` (403 `Acesso permitido somente para professores`). A T1 usa o `isTutor`, que devolve **403** `Acesso permitido somente para tutores com vínculo ativo` quando o aluno não tem nenhum `Tutor_sala` sem `data_revogacao`. A A3 usa o `isAluno` (403 `Acesso permitido somente para alunos`).
>
> A tutoria tem só dois status: `ativa` e `finalizada`.

### [P30] Criar tutoria
- **Método:** POST
- **URL:** `/tutorias`
- **Autenticação:** token obrigatório (perfil: professor, dono da sala do tutor)
- **Descrição:** Liga um tutor ativo da sala (`Tutor_sala`) a um aluno matriculado na mesma sala, criando uma tutoria com status `ativa`. A meta de aprendizagem é obrigatória nesta rota, embora a coluna seja opcional no schema. O tutor não pode ser tutor de si mesmo, e não pode haver duas tutorias ativas entre o mesmo tutor e o mesmo aluno.
- **Parâmetros de rota:** Não possui
- **Parâmetros de query:** Não possui
- **Corpo da requisição:**

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| id_tutor_sala | number | sim | Vínculo do tutor com a sala (inteiro positivo) |
| id_aluno | number | sim | Aluno que será tutorado (inteiro positivo) |
| meta_aprendizagem | string | sim | Meta de aprendizagem (não pode ser vazia). É gravada sem espaços nas pontas |

```json
{
  "id_tutor_sala": 4,
  "id_aluno": 15,
  "meta_aprendizagem": "Interpretar mapas temáticos e identificar as formas de relevo do Brasil."
}
```

- **Respostas:**
  - **Sucesso (201):**

```json
{
  "id_tutoria": 9,
  "id_tutor_sala": 4,
  "id_aluno": 15,
  "meta_aprendizagem": "Interpretar mapas temáticos e identificar as formas de relevo do Brasil.",
  "status": "ativa",
  "data_inicio": "2026-10-22T11:00:00.000Z"
}
```

  - **Erros** (na ordem em que são conferidos):

| Código | Mensagem retornada | Quando ocorre |
|---|---|---|
| 401 / 403 | (ver tabela comum da seção 4.2) | Token ausente ou inválido, ou usuário que não é professor |
| 400 | O campo id_tutor_sala é obrigatório e deve ser um número inteiro | `id_tutor_sala` ausente, `null` ou que não é inteiro positivo |
| 400 | O campo id_aluno é obrigatório e deve ser um número inteiro | `id_aluno` ausente, `null` ou que não é inteiro positivo |
| 400 | O campo meta_aprendizagem é obrigatório | `meta_aprendizagem` ausente, vazia ou que não é texto |
| 404 | Tutor da sala não encontrado ou revogado | O vínculo não existe ou tem `data_revogacao` |
| 403 | Você não tem permissão para acessar esta sala | A sala do vínculo é de outro professor |
| 404 | Aluno não encontrado | Não existe aluno com esse id |
| 400 | O tutor não pode ser tutor de si mesmo | O `id_aluno` é o próprio aluno-tutor do vínculo |
| 400 | O aluno não está matriculado nesta sala | O aluno não tem matrícula na sala do vínculo |
| 409 | Já existe uma tutoria ativa entre este tutor e este aluno | Já há tutoria `ativa` com o mesmo `id_tutor_sala` e o mesmo `id_aluno` |
| 500 | Erro interno do servidor | Erro inesperado |

> ⚠️ Divergência: sala de outro professor devolve **403**, e tutoria ativa duplicada devolve **409**. Os dois códigos estão fora da lista padrão. "Aluno não matriculado nesta sala" é uma relação que não existe e devolve **400**, não 404.

---

### [P4] Listar tutorias da sala
- **Método:** GET
- **URL:** `/salas/:id/tutorias`
- **Autenticação:** token obrigatório (perfil: professor, dono da sala)
- **Descrição:** Lista as tutorias da sala (RF3), isto é, as tutorias cujo `Tutor_sala` pertence à sala, pela ordem de `data_inicio`. Entram também as tutorias de tutores revogados. Cada item traz o tutor (só o nome), o aluno tutorado (só o nome), o status e a meta. Sala sem tutorias devolve uma lista vazia.
- **Parâmetros de rota:**

| Nome | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| id | number | sim | Id da sala (inteiro positivo) |

- **Parâmetros de query:**

| Nome | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| status | string | não | `ativa` ou `finalizada`. Sem o filtro, vêm todas |

- **Corpo da requisição:** Não possui
- **Respostas:**
  - **Sucesso (200):**

```json
[
  {
    "id_tutoria": 9,
    "status": "ativa",
    "meta_aprendizagem": "Interpretar mapas temáticos e identificar as formas de relevo do Brasil.",
    "data_inicio": "2026-10-22T11:00:00.000Z",
    "data_fim": null,
    "tutor": {
      "nome": "Lucas Pereira"
    },
    "aluno": {
      "nome": "Ana Ribeiro"
    }
  }
]
```

  - **Erros** (na ordem em que são conferidos):

| Código | Mensagem retornada | Quando ocorre |
|---|---|---|
| 401 / 403 | (ver tabela comum da seção 4.2) | Token ausente ou inválido, ou usuário que não é professor |
| 400 | O id da sala deve ser um número inteiro | `:id` não é inteiro positivo |
| 400 | O status deve ser ativa ou finalizada | `?status=` com outro valor (inclusive repetido) |
| 404 | Sala não encontrada | Não existe sala com esse id |
| 403 | Você não tem permissão para acessar esta sala | A sala é de outro professor |
| 500 | Erro interno do servidor | Erro inesperado |

> ⚠️ Divergência: sala de outro professor devolve **403**, código fora da lista padrão.

---

### [P5] Definir meta de aprendizagem da tutoria
- **Método:** PATCH
- **URL:** `/tutorias/:id/meta`
- **Autenticação:** token obrigatório (perfil: professor, dono da sala da tutoria)
- **Descrição:** Define ou substitui a meta de aprendizagem da tutoria (RF16). Só vale para tutoria `ativa`: uma tutoria finalizada precisa ser reaberta antes (P7). A meta é gravada sem espaços nas pontas e não tem tamanho máximo, porque a coluna é `TEXT`.
- **Parâmetros de rota:**

| Nome | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| id | number | sim | Id da tutoria (inteiro positivo) |

- **Parâmetros de query:** Não possui
- **Corpo da requisição:**

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| meta_aprendizagem | string | sim | Nova meta (não pode ser vazia) |

```json
{
  "meta_aprendizagem": "Analisar gráficos climáticos e relacioná-los aos tipos de vegetação."
}
```

- **Respostas:**
  - **Sucesso (200):**

```json
{
  "id_tutoria": 9,
  "status": "ativa",
  "meta_aprendizagem": "Analisar gráficos climáticos e relacioná-los aos tipos de vegetação."
}
```

  - **Erros** (na ordem em que são conferidos):

| Código | Mensagem retornada | Quando ocorre |
|---|---|---|
| 401 / 403 | (ver tabela comum da seção 4.2) | Token ausente ou inválido, ou usuário que não é professor |
| 400 | O id da tutoria deve ser um número inteiro | `:id` não é inteiro positivo |
| 404 | Tutoria não encontrada | Não existe tutoria com esse id |
| 403 | Você não tem permissão para acessar esta sala | A sala da tutoria é de outro professor |
| 400 | O campo meta_aprendizagem é obrigatório | `meta_aprendizagem` ausente, vazia ou que não é texto |
| 409 | Esta tutoria está finalizada. É preciso reabrir a tutoria antes de alterar a meta | A tutoria está `finalizada` (também é a resposta quando ela foi finalizada ao mesmo tempo) |
| 500 | Erro interno do servidor | Erro inesperado |

> ⚠️ Divergência: sala de outro professor devolve **403**, e tutoria finalizada devolve **409**. Os dois códigos estão fora da lista padrão.

---

### [P6] Finalizar tutoria
- **Método:** PATCH
- **URL:** `/tutorias/:id/finalizar`
- **Autenticação:** token obrigatório (perfil: professor, dono da sala da tutoria)
- **Descrição:** Finaliza a tutoria (RF3): muda o status para `finalizada` e preenche `data_fim`. A rota é bloqueada se houver contestação de nota pendente do aluno tutorado nas atividades desse tutor (RN15). Não tem corpo.
- **Parâmetros de rota:**

| Nome | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| id | number | sim | Id da tutoria (inteiro positivo) |

- **Parâmetros de query:** Não possui
- **Corpo da requisição:** Não possui
- **Respostas:**
  - **Sucesso (200):**

```json
{
  "id_tutoria": 9,
  "status": "finalizada",
  "data_fim": "2026-11-30T17:00:00.000Z"
}
```

  - **Erros** (na ordem em que são conferidos):

| Código | Mensagem retornada | Quando ocorre |
|---|---|---|
| 401 / 403 | (ver tabela comum da seção 4.2) | Token ausente ou inválido, ou usuário que não é professor |
| 400 | O id da tutoria deve ser um número inteiro | `:id` não é inteiro positivo |
| 404 | Tutoria não encontrada | Não existe tutoria com esse id |
| 403 | Você não tem permissão para acessar esta sala | A sala da tutoria é de outro professor |
| 409 | Esta tutoria já está finalizada | A tutoria não está `ativa` (também é a resposta quando outra requisição finalizou ao mesmo tempo) |
| 409 | Não é possível finalizar a tutoria: há 1 contestação de nota pendente | Uma contestação pendente. Com mais de uma: `Não é possível finalizar a tutoria: há N contestações de nota pendentes` |
| 500 | Erro interno do servidor | Erro inesperado |

> ⚠️ Divergência: sala de outro professor devolve **403**, e tutoria já finalizada ou com contestação pendente devolve **409**. Os dois códigos estão fora da lista padrão.

---

### [P7] Reabrir tutoria
- **Método:** PATCH
- **URL:** `/tutorias/:id/reabrir`
- **Autenticação:** token obrigatório (perfil: professor, dono da sala da tutoria)
- **Descrição:** Reabre uma tutoria finalizada: o status volta a `ativa` e `data_fim` volta a `null`. Só é possível se o `ano_letivo` da sala for o ano atual do servidor, se o tutor não foi revogado e se o aluno não tem outra tutoria ativa na mesma sala. Não tem corpo.
- **Parâmetros de rota:**

| Nome | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| id | number | sim | Id da tutoria (inteiro positivo) |

- **Parâmetros de query:** Não possui
- **Corpo da requisição:** Não possui
- **Respostas:**
  - **Sucesso (200):**

```json
{
  "id_tutoria": 9,
  "status": "ativa",
  "data_fim": null
}
```

  - **Erros** (na ordem em que são conferidos):

| Código | Mensagem retornada | Quando ocorre |
|---|---|---|
| 401 / 403 | (ver tabela comum da seção 4.2) | Token ausente ou inválido, ou usuário que não é professor |
| 400 | O id da tutoria deve ser um número inteiro | `:id` não é inteiro positivo |
| 404 | Tutoria não encontrada | Não existe tutoria com esse id |
| 403 | Você não tem permissão para acessar esta sala | A sala da tutoria é de outro professor |
| 409 | Esta tutoria já está ativa | A tutoria não está `finalizada` (também é a resposta quando outra requisição reabriu ao mesmo tempo) |
| 409 | Não é possível reabrir a tutoria: ela é de outro ano letivo (2025) | O `ano_letivo` da sala é diferente do ano atual. A mensagem traz o ano da sala (o exemplo usa 2025) |
| 409 | Não é possível reabrir a tutoria: o tutor foi revogado | O vínculo `Tutor_sala` tem `data_revogacao` |
| 409 | Não é possível reabrir a tutoria: o aluno já tem outra tutoria ativa nesta sala | O aluno tem outra tutoria `ativa` com um tutor da mesma sala |
| 500 | Erro interno do servidor | Erro inesperado |

> ⚠️ Divergência: sala de outro professor devolve **403**, e todas as recusas de reabertura devolvem **409**. Os dois códigos estão fora da lista padrão.

---

### [T1] Listar seus tutorados
- **Método:** GET
- **URL:** `/tutores/me/tutorias`
- **Autenticação:** token obrigatório (perfil: tutor)
- **Descrição:** Lista as tutorias que o aluno logado conduz como tutor, em todos os vínculos `Tutor_sala` **ativos**, pela ordem de `data_inicio`. Tutorias de vínculos revogados não entram. Cada item traz o aluno tutorado (só o nome), a sala, o status e a meta.
- **Parâmetros de rota:** Não possui
- **Parâmetros de query:**

| Nome | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| status | string | não | `ativa` ou `finalizada`. Sem o filtro, vêm todas |

- **Corpo da requisição:** Não possui
- **Respostas:**
  - **Sucesso (200):**

```json
[
  {
    "id_tutoria": 9,
    "status": "ativa",
    "meta_aprendizagem": "Interpretar mapas temáticos e identificar as formas de relevo do Brasil.",
    "data_inicio": "2026-10-22T11:00:00.000Z",
    "data_fim": null,
    "aluno": {
      "nome": "Ana Ribeiro"
    },
    "sala": {
      "id_sala": 5,
      "nome": "2º A",
      "serie": 2
    }
  }
]
```

  - **Erros:**

| Código | Mensagem retornada | Quando ocorre |
|---|---|---|
| 401 | (ver tabela comum da seção 4.2) | Token ausente, mal formatado ou inválido |
| 403 | Acesso permitido somente para tutores com vínculo ativo | O usuário não é aluno com `Tutor_sala` ativo (inclui professor e tutor revogado) |
| 400 | O status deve ser ativa ou finalizada | `?status=` com outro valor (inclusive repetido) |
| 500 | Erro interno do servidor | Erro inesperado |

> ⚠️ Divergência: o usuário que não é tutor ativo recebe **403**, código fora da lista padrão.

---

### [A3] Ver as próprias tutorias (tutor e meta)
- **Método:** GET
- **URL:** `/alunos/me/tutorias`
- **Autenticação:** token obrigatório (perfil: aluno)
- **Descrição:** Lista as tutorias em que o aluno logado é o **tutorado**. As que ele conduz como tutor não entram. Inclui as tutorias de tutores revogados, como histórico. As ativas vêm primeiro e, dentro de cada status, a ordem é a de `data_inicio`. Do tutor, sai só o nome.
- **Parâmetros de rota:** Não possui
- **Parâmetros de query:**

| Nome | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| status | string | não | `ativa` ou `finalizada`. Sem o filtro, vêm todas |

- **Corpo da requisição:** Não possui
- **Respostas:**
  - **Sucesso (200):**

```json
[
  {
    "id_tutoria": 9,
    "status": "ativa",
    "meta_aprendizagem": "Interpretar mapas temáticos e identificar as formas de relevo do Brasil.",
    "data_inicio": "2026-10-22T11:00:00.000Z",
    "data_fim": null,
    "tutor": {
      "nome": "Lucas Pereira"
    },
    "sala": {
      "id_sala": 5,
      "nome": "2º A",
      "serie": 2
    }
  }
]
```

  - **Erros:**

| Código | Mensagem retornada | Quando ocorre |
|---|---|---|
| 401 | (ver tabela comum da seção 4.2) | Token ausente, mal formatado ou inválido |
| 403 | Acesso permitido somente para alunos | O token não é de aluno |
| 400 | O status deve ser ativa ou finalizada | `?status=` com outro valor (inclusive repetido) |
| 500 | Erro interno do servidor | Erro inesperado |

> ⚠️ Divergência: o perfil errado devolve **403**, código fora da lista padrão.

---

### 4.7 Atividades e Respostas

> Os erros 401 (token) são os da tabela comum da seção 4.2. Middlewares de perfil usados neste módulo:
> - T9, A2, A1 e A14: `isAluno` → 403 `Acesso permitido somente para alunos`
> - P11: `isProfessor` → 403 `Acesso permitido somente para professores`
> - T2: `isTutor` → 403 `Acesso permitido somente para tutores com vínculo ativo`
> - P12: `isTutorCriadorOuProfessorAtividade`, que confere id, existência e permissão (ver a rota)
>
> **Status de entrega:** não fica salvo no banco. É calculado comparando a data de envio da resposta com o prazo (`data_entrega`): `pendente` (sem resposta), `entregue` (enviada até o prazo) ou `entregue_com_atraso` (enviada depois do prazo).
>
> **`pode_responder`:** é `true` quando a tutoria do aluno está `ativa` e ele ainda não respondeu. O prazo vencido não bloqueia a resposta.

### [T9] Enviar atividade para o tutorado
- **Método:** POST
- **URL:** `/atividades`
- **Autenticação:** token obrigatório (perfil: tutor da tutoria informada)
- **Descrição:** O tutor cria uma atividade para o aluno da tutoria informada. O destinatário (`Atividade_destinatario`) é criado na mesma operação. A tutoria precisa estar `ativa`, o vínculo do tutor não pode estar revogado e o professor precisa ter liberado a criação de atividades (`pode_criar_ativ`, ver P29). O conteúdo precisa estar cadastrado na sala do tutor.
- **Parâmetros de rota:** Não possui
- **Parâmetros de query:** Não possui
- **Corpo da requisição:**

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| id_tutoria | number | sim | Tutoria do aluno que vai receber a atividade (inteiro positivo) |
| id_conteudo | number | sim | Conteúdo da atividade, que precisa estar vinculado à sala (inteiro positivo) |
| titulo | string | sim | Título, até 150 caracteres |
| descricao | string | não | Descrição. Vazia vira `null` |
| tipo | string | sim | Um dos valores de `TipoAtividade` (ver T8) |
| etapa | number | sim | 1, 2 ou 3 |
| prazo | string | sim | Data e hora de entrega em formato de data válido (ex.: `"2026-11-11T02:59:00.000Z"`; sem fuso, a data é interpretada no horário do servidor). Precisa ser no futuro |

```json
{
  "id_tutoria": 9,
  "id_conteudo": 8,
  "titulo": "Formas de relevo no mapa do Brasil",
  "descricao": "Identifique planaltos, planícies e depressões no mapa enviado.",
  "tipo": "interpretacao_mapas",
  "etapa": 2,
  "prazo": "2026-11-11T02:59:00.000Z"
}
```

- **Respostas:**
  - **Sucesso (201):**

```json
{
  "id_atividade": 30,
  "id_tutor_sala": 4,
  "id_conteudo": 8,
  "titulo": "Formas de relevo no mapa do Brasil",
  "descricao": "Identifique planaltos, planícies e depressões no mapa enviado.",
  "tipo": "interpretacao_mapas",
  "etapa": 2,
  "data_entrega": "2026-11-11T02:59:00.000Z",
  "destinatarios": [
    {
      "id_att_destinatario": 31,
      "id_tutoria": 9
    }
  ]
}
```

  - **Erros** (na ordem em que são conferidos):

| Código | Mensagem retornada | Quando ocorre |
|---|---|---|
| 401 | (ver tabela comum da seção 4.2) | Token ausente, mal formatado ou inválido |
| 403 | Acesso permitido somente para alunos | O token não é de aluno |
| 400 | O campo id_tutoria é obrigatório e deve ser um número inteiro | `id_tutoria` ausente, `null` ou que não é inteiro positivo |
| 400 | O campo id_conteudo é obrigatório e deve ser um número inteiro | `id_conteudo` ausente, `null` ou que não é inteiro positivo |
| 400 | O campo titulo é obrigatório | `titulo` ausente, vazio ou que não é texto |
| 400 | O titulo deve ter no máximo 150 caracteres | `titulo` com mais de 150 caracteres |
| 400 | O campo descricao deve ser um texto | `descricao` enviada com tipo diferente de texto |
| 400 | O campo tipo é obrigatório | `tipo` ausente, vazio ou que não é texto |
| 400 | Tipo inválido. Valores aceitos: aula_invertida, prova_alternativa, prova_dissertativa, projeto, interpretacao_imagens, exercicios_livro, interpretacao_mapas, analise_graficos, mapa_mental, pesquisa, estudo_caso, trabalho_campo, teatro, atividade_extracurricular, autoavaliacao | `tipo` fora do enum `TipoAtividade` |
| 400 | O campo etapa é obrigatório e deve ser 1, 2 ou 3 | `etapa` ausente, booleana ou diferente de 1, 2 e 3 |
| 400 | O campo prazo é obrigatório | `prazo` ausente, vazio ou que não é texto |
| 400 | O campo prazo deve ser uma data válida | `prazo` que não pode ser convertido em data |
| 400 | O prazo deve ser uma data futura | `prazo` igual ou anterior ao momento atual |
| 403 | Você não é tutor desta tutoria ou ela não está ativa | A tutoria não existe, está finalizada, o vínculo do tutor foi revogado ou o aluno logado não é o tutor dela |
| 403 | O professor não liberou a criação de atividades | `pode_criar_ativ` do vínculo é `false` |
| 404 | Conteúdo não encontrado | Não existe conteúdo com esse id |
| 400 | O conteúdo não pertence à sala desta tutoria | O conteúdo não está vinculado à sala do tutor |
| 500 | Erro interno do servidor | Erro inesperado |

> ⚠️ Divergência: as recusas de permissão devolvem **403**, código fora da lista padrão. Uma **tutoria inexistente também devolve 403**, e não 404: o código usa a mesma mensagem para não revelar se a tutoria existe. "Conteúdo não pertence à sala" devolve **400**.

---

### [A2] Detalhar atividade
- **Método:** GET
- **URL:** `/atividades/:id`
- **Autenticação:** token obrigatório (perfil: aluno destinatário ou tutor que criou a atividade)
- **Descrição:** Devolve os dados da atividade com uma visão diferente para cada perfil, indicada no campo `perfil`:
  - `"aluno"`: o aluno destinatário, com tutoria ativa ou finalizada (histórico). Recebe o status de entrega, `pode_responder` e a própria resposta e nota.
  - `"tutor"`: o tutor que criou a atividade, com vínculo ativo. Recebe a lista de destinatários. As respostas e notas de cada aluno ficam na P12.
  - Qualquer outro aluno, ou um tutor revogado, recebe 403.
- **Parâmetros de rota:**

| Nome | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| id | number | sim | Id da atividade (inteiro positivo) |

- **Parâmetros de query:** Não possui
- **Corpo da requisição:** Não possui
- **Respostas:**
  - **Sucesso (200):** visão do aluno (`perfil: "aluno"`)

```json
{
  "perfil": "aluno",
  "id_atividade": 30,
  "titulo": "Formas de relevo no mapa do Brasil",
  "descricao": "Identifique planaltos, planícies e depressões no mapa enviado.",
  "tipo": "interpretacao_mapas",
  "etapa": 2,
  "data_entrega": "2026-11-11T02:59:00.000Z",
  "conteudo": {
    "id_conteudo": 8,
    "nome": "Relevo brasileiro"
  },
  "sala": {
    "id_sala": 5,
    "nome": "2º A",
    "serie": 2,
    "ano_letivo": 2026
  },
  "tutor": {
    "nome": "Lucas Pereira"
  },
  "status": "entregue",
  "pode_responder": false,
  "resposta": {
    "id_resposta": 18,
    "texto": "Segue o mapa com as formas de relevo marcadas.",
    "conteudo_file": "https://res.cloudinary.com/exemplo/raw/upload/v1/resposta.pdf",
    "data_envio": "2026-11-08T20:10:00.000Z"
  },
  "nota": {
    "id_nota": 14,
    "valor": 8.5,
    "comentario": "Boa identificação dos planaltos.",
    "data_lancamento": "2026-11-12T15:00:00.000Z"
  }
}
```

  Sem resposta, `resposta` vem `null`. Sem nota, `nota` vem `null`.

  Visão do tutor (`perfil: "tutor"`): mesmos campos comuns, de `id_atividade` até `tutor`, mais a lista de destinatários em ordem alfabética:

```json
{
  "perfil": "tutor",
  "id_atividade": 30,
  "titulo": "Formas de relevo no mapa do Brasil",
  "descricao": "Identifique planaltos, planícies e depressões no mapa enviado.",
  "tipo": "interpretacao_mapas",
  "etapa": 2,
  "data_entrega": "2026-11-11T02:59:00.000Z",
  "conteudo": { "id_conteudo": 8, "nome": "Relevo brasileiro" },
  "sala": { "id_sala": 5, "nome": "2º A", "serie": 2, "ano_letivo": 2026 },
  "tutor": { "nome": "Lucas Pereira" },
  "destinatarios": [
    { "id_aluno": 15, "nome": "Ana Ribeiro" }
  ]
}
```

  - **Erros** (na ordem em que são conferidos):

| Código | Mensagem retornada | Quando ocorre |
|---|---|---|
| 401 | (ver tabela comum da seção 4.2) | Token ausente, mal formatado ou inválido |
| 403 | Acesso permitido somente para alunos | O token não é de aluno |
| 400 | O id da atividade deve ser um número inteiro | `:id` não é inteiro positivo |
| 404 | Atividade não encontrada | Não existe atividade com esse id |
| 403 | Você não tem permissão para acessar esta atividade | O aluno não é destinatário nem o tutor criador com vínculo ativo |
| 500 | Erro interno do servidor | Erro inesperado |

> ⚠️ Divergência: o usuário sem permissão recebe **403**, código fora da lista padrão.

---

### [A1] Listar atividades destinadas ao aluno
- **Método:** GET
- **URL:** `/alunos/me/atividades`
- **Autenticação:** token obrigatório (perfil: aluno)
- **Descrição:** Lista as atividades em que o aluno logado é destinatário (RF30), pelo prazo mais próximo primeiro (`data_entrega` crescente). As atividades que ele criou como tutor não entram. Cada item traz conteúdo, sala, tutor, status de entrega, nota (valor e comentário) e `pode_responder`. Inclui atividades de tutorias finalizadas.
- **Parâmetros de rota:** Não possui
- **Parâmetros de query:**

| Nome | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| status | string | não | `pendente`, `entregue` ou `entregue_com_atraso` |
| etapa | number | não | 1, 2 ou 3 |

- **Corpo da requisição:** Não possui
- **Respostas:**
  - **Sucesso (200):**

```json
[
  {
    "id_atividade": 30,
    "titulo": "Formas de relevo no mapa do Brasil",
    "descricao": "Identifique planaltos, planícies e depressões no mapa enviado.",
    "tipo": "interpretacao_mapas",
    "etapa": 2,
    "data_entrega": "2026-11-11T02:59:00.000Z",
    "conteudo": {
      "id_conteudo": 8,
      "nome": "Relevo brasileiro"
    },
    "sala": {
      "id_sala": 5,
      "nome": "2º A",
      "serie": 2,
      "ano_letivo": 2026
    },
    "tutor": {
      "nome": "Lucas Pereira"
    },
    "status": "pendente",
    "nota": null,
    "pode_responder": true
  }
]
```

  Com nota lançada, `nota` vem como `{ "valor": 8.5, "comentario": "..." }`.

  - **Erros** (na ordem em que são conferidos):

| Código | Mensagem retornada | Quando ocorre |
|---|---|---|
| 401 | (ver tabela comum da seção 4.2) | Token ausente, mal formatado ou inválido |
| 403 | Acesso permitido somente para alunos | O token não é de aluno |
| 400 | A etapa deve ser 1, 2 ou 3 | `?etapa=` com outro valor (inclusive vazio ou repetido) |
| 400 | O status deve ser pendente, entregue ou entregue_com_atraso | `?status=` com outro valor (inclusive repetido) |
| 500 | Erro interno do servidor | Erro inesperado |

> ⚠️ Divergência: o perfil errado devolve **403**, código fora da lista padrão.

---

### [P11] Listar atividades da sala
- **Método:** GET
- **URL:** `/salas/:id/atividades`
- **Autenticação:** token obrigatório (perfil: professor, dono da sala)
- **Descrição:** Lista as atividades lançadas pelos tutores na sala (RF11), do prazo mais recente para o mais antigo. Inclui tutores revogados. Cada item traz conteúdo, tutor e as contagens de destinatários, entregas e notas. O detalhe por aluno fica na P12. Sem atividades, ou se o filtro não encontrar nada, devolve uma lista vazia.
- **Parâmetros de rota:**

| Nome | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| id | number | sim | Id da sala (inteiro positivo) |

- **Parâmetros de query:**

| Nome | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| etapa | number | não | 1, 2 ou 3 |
| id_conteudo | number | não | Filtra por conteúdo (inteiro positivo) |
| id_tutor_sala | number | não | Filtra por vínculo de tutor (inteiro positivo) |

- **Corpo da requisição:** Não possui
- **Respostas:**
  - **Sucesso (200):**

```json
[
  {
    "id_atividade": 30,
    "titulo": "Formas de relevo no mapa do Brasil",
    "tipo": "interpretacao_mapas",
    "etapa": 2,
    "data_entrega": "2026-11-11T02:59:00.000Z",
    "conteudo": {
      "id_conteudo": 8,
      "nome": "Relevo brasileiro"
    },
    "tutor": {
      "id_tutor_sala": 4,
      "nome": "Lucas Pereira"
    },
    "total_destinatarios": 1,
    "total_entregues": 1,
    "total_com_nota": 0
  }
]
```

  - **Erros** (na ordem em que são conferidos):

| Código | Mensagem retornada | Quando ocorre |
|---|---|---|
| 401 / 403 | (ver tabela comum da seção 4.2) | Token ausente ou inválido, ou usuário que não é professor |
| 400 | O id da sala deve ser um número inteiro | `:id` não é inteiro positivo |
| 400 | A etapa deve ser 1, 2 ou 3 | `?etapa=` com outro valor (inclusive vazio ou repetido) |
| 400 | O id do conteúdo deve ser um número inteiro | `?id_conteudo=` que não é inteiro positivo |
| 400 | O id do tutor da sala deve ser um número inteiro | `?id_tutor_sala=` que não é inteiro positivo |
| 404 | Sala não encontrada | Não existe sala com esse id |
| 403 | Você não tem permissão para acessar esta sala | A sala é de outro professor |
| 500 | Erro interno do servidor | Erro inesperado |

> ⚠️ Divergência: sala de outro professor devolve **403**, código fora da lista padrão.

---

### [T2] Listar atividades que o tutor criou
- **Método:** GET
- **URL:** `/tutores/me/atividades`
- **Autenticação:** token obrigatório (perfil: tutor)
- **Descrição:** Lista as atividades criadas pelo tutor logado, só nos vínculos `Tutor_sala` **ativos** (vínculo revogado não entra), do prazo mais recente para o mais antigo. O formato é o da P11, com o bloco `sala` no lugar do bloco `tutor`. Um `?id_sala=` de uma sala em que ele não é tutor devolve uma lista vazia, sem erro.
- **Parâmetros de rota:** Não possui
- **Parâmetros de query:**

| Nome | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| id_sala | number | não | Filtra por sala (inteiro positivo) |
| id_conteudo | number | não | Filtra por conteúdo (inteiro positivo) |
| etapa | number | não | 1, 2 ou 3 |

- **Corpo da requisição:** Não possui
- **Respostas:**
  - **Sucesso (200):**

```json
[
  {
    "id_atividade": 30,
    "titulo": "Formas de relevo no mapa do Brasil",
    "tipo": "interpretacao_mapas",
    "etapa": 2,
    "data_entrega": "2026-11-11T02:59:00.000Z",
    "conteudo": {
      "id_conteudo": 8,
      "nome": "Relevo brasileiro"
    },
    "sala": {
      "id_sala": 5,
      "nome": "2º A"
    },
    "total_destinatarios": 1,
    "total_entregues": 1,
    "total_com_nota": 0
  }
]
```

  - **Erros** (na ordem em que são conferidos):

| Código | Mensagem retornada | Quando ocorre |
|---|---|---|
| 401 | (ver tabela comum da seção 4.2) | Token ausente, mal formatado ou inválido |
| 403 | Acesso permitido somente para tutores com vínculo ativo | O usuário não é aluno com `Tutor_sala` ativo |
| 400 | A etapa deve ser 1, 2 ou 3 | `?etapa=` com outro valor (inclusive vazio ou repetido) |
| 400 | O id da sala deve ser um número inteiro | `?id_sala=` que não é inteiro positivo |
| 400 | O id do conteúdo deve ser um número inteiro | `?id_conteudo=` que não é inteiro positivo |
| 500 | Erro interno do servidor | Erro inesperado |

> ⚠️ Divergência: o usuário que não é tutor ativo recebe **403**, código fora da lista padrão.

---

### [A14] Responder atividade
- **Método:** POST
- **URL:** `/atividades/:id/respostas`
- **Autenticação:** token obrigatório (perfil: aluno destinatário da atividade)
- **Descrição:** O aluno tutorado envia a resposta da atividade, com arquivo obrigatório e texto opcional, via `multipart/form-data`. O arquivo é enviado ao Cloudinary só depois de todas as validações, e a API grava a URL. A tutoria da atividade precisa estar `ativa`, e cada aluno responde uma única vez. O prazo vencido não bloqueia o envio: a entrega fica como `entregue_com_atraso`.
- **Parâmetros de rota:**

| Nome | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| id | number | sim | Id da atividade (inteiro positivo) |

- **Parâmetros de query:** Não possui
- **Corpo da requisição** (`multipart/form-data`):

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| file | arquivo | sim | Arquivo da resposta, um único arquivo. O código não restringe o formato. O tamanho máximo é o limite global de 50 MB |
| texto | string | não | Texto que acompanha a resposta. Vazio vira `null` |

  Exemplo (campos do form-data):

```
file:  mapa_relevo.pdf
texto: Segue o mapa com as formas de relevo marcadas.
```

- **Respostas:**
  - **Sucesso (201):**

```json
{
  "id_resposta": 18,
  "id_atividade": 30,
  "id_aluno": 15,
  "texto": "Segue o mapa com as formas de relevo marcadas.",
  "conteudo_file": "https://res.cloudinary.com/exemplo/raw/upload/v1/resposta.pdf",
  "data_envio": "2026-11-08T20:10:00.000Z"
}
```

  - **Erros** (na ordem em que são conferidos):

| Código | Mensagem retornada | Quando ocorre |
|---|---|---|
| 401 | (ver tabela comum da seção 4.2) | Token ausente, mal formatado ou inválido |
| 403 | Acesso permitido somente para alunos | O token não é de aluno |
| 400 | O id da atividade deve ser um número inteiro | `:id` não é inteiro positivo |
| 400 | O arquivo da resposta é obrigatório (campo file) | Nenhum arquivo no campo `file` |
| 400 | Envie apenas um arquivo no campo file | Mais de um arquivo no campo `file` |
| 400 | O campo texto deve ser um texto | `texto` enviado com tipo diferente de texto |
| 404 | Atividade não encontrada | Não existe atividade com esse id |
| 403 | Esta atividade não foi direcionada a você | O aluno logado não é destinatário da atividade |
| 403 | A tutoria desta atividade não está ativa | A tutoria do aluno está `finalizada` |
| 409 | Você já respondeu esta atividade | O aluno já tem resposta nesta atividade (também é a resposta quando duas requisições chegam ao mesmo tempo) |
| 500 | Erro interno do servidor | Erro inesperado (ex.: falha no upload ao Cloudinary) |

> ⚠️ Divergência: as recusas de permissão e a tutoria finalizada devolvem **403**, e a resposta repetida devolve **409**. Os dois códigos estão fora da lista padrão. Ao contrário de T5 e A10, esta rota **não valida formato nem tamanho** do arquivo no service.

---

### [P12] Ver respostas, notas e comentários de uma atividade
- **Método:** GET
- **URL:** `/atividades/:id/respostas`
- **Autenticação:** token obrigatório (perfil: professor dono da sala ou tutor que criou a atividade, com vínculo ativo)
- **Descrição:** Lista todos os destinatários da atividade (RF12), em ordem alfabética, e para cada um mostra a resposta (ou `null`), a nota com comentário (ou `null`) e o status de entrega. A permissão é conferida pelo middleware `isTutorCriadorOuProfessorAtividade`.
- **Parâmetros de rota:**

| Nome | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| id | number | sim | Id da atividade (inteiro positivo) |

- **Parâmetros de query:** Não possui
- **Corpo da requisição:** Não possui
- **Respostas:**
  - **Sucesso (200):**

```json
{
  "id_atividade": 30,
  "titulo": "Formas de relevo no mapa do Brasil",
  "tipo": "interpretacao_mapas",
  "data_entrega": "2026-11-11T02:59:00.000Z",
  "alunos": [
    {
      "aluno": {
        "id_aluno": 15,
        "nome": "Ana Ribeiro"
      },
      "resposta": {
        "id_resposta": 18,
        "texto": "Segue o mapa com as formas de relevo marcadas.",
        "conteudo_file": "https://res.cloudinary.com/exemplo/raw/upload/v1/resposta.pdf",
        "data_envio": "2026-11-08T20:10:00.000Z"
      },
      "nota": {
        "id_nota": 14,
        "valor": 8.5,
        "comentario": "Boa identificação dos planaltos."
      },
      "status": "entregue"
    }
  ]
}
```

  - **Erros** (na ordem em que são conferidos):

| Código | Mensagem retornada | Quando ocorre |
|---|---|---|
| 401 | (ver tabela comum da seção 4.2) | Token ausente, mal formatado ou inválido |
| 400 | O id da atividade deve ser um número inteiro | `:id` não é inteiro positivo |
| 404 | Atividade não encontrada | Não existe atividade com esse id |
| 403 | Você não tem permissão para acessar esta atividade | O usuário não é o professor dono da sala nem o tutor criador com vínculo ativo |
| 500 | Erro interno do servidor | Erro inesperado |

> ⚠️ Divergência: o usuário sem permissão recebe **403**, código fora da lista padrão.

---

### 4.8 Notas

> Os erros 401 (token) são os da tabela comum da seção 4.2. A T3 usa só o `isAuthenticated`: o perfil de tutor é conferido dentro do service, depois da validação do corpo. A P14 e a P15 usam o `isProfessor` (403 `Acesso permitido somente para professores`).

### [T3] Lançar nota e comentário na resposta do aluno
- **Método:** POST
- **URL:** `/atividades/:id/notas`
- **Autenticação:** token obrigatório (perfil: tutor que criou a atividade, com vínculo ativo)
- **Descrição:** O tutor lança a nota, e opcionalmente um comentário, para um aluno destinatário da atividade (RF21). A tutoria do aluno precisa estar `ativa` (RN14). Se o aluno não enviou resposta, a nota só pode ser lançada depois do prazo, como nota por falta de entrega. Cada aluno tem no máximo uma nota por atividade, e a rota só cria (não altera). A data de lançamento é preenchida pelo banco.
- **Parâmetros de rota:**

| Nome | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| id | number | sim | Id da atividade (inteiro positivo) |

- **Parâmetros de query:** Não possui
- **Corpo da requisição:**

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| id_aluno | number | sim | Aluno que recebe a nota (inteiro positivo) |
| valor | number | sim | Nota de 0 a 10, com no máximo 2 casas decimais. Precisa ser número no JSON: o texto `"8.5"` é recusado |
| comentario | string | não | Comentário do tutor. Vazio vira `null` |

```json
{
  "id_aluno": 15,
  "valor": 8.5,
  "comentario": "Boa identificação dos planaltos."
}
```

- **Respostas:**
  - **Sucesso (201):**

```json
{
  "id_nota": 14,
  "id_atividade": 30,
  "id_aluno": 15,
  "valor": 8.5,
  "comentario": "Boa identificação dos planaltos.",
  "data_lancamento": "2026-11-12T15:00:00.000Z"
}
```

  - **Erros** (na ordem em que são conferidos):

| Código | Mensagem retornada | Quando ocorre |
|---|---|---|
| 401 | (ver tabela comum da seção 4.2) | Token ausente, mal formatado ou inválido |
| 400 | O id da atividade deve ser um número inteiro | `:id` não é inteiro positivo |
| 400 | O campo id_aluno é obrigatório e deve ser um número inteiro | `id_aluno` ausente, `null`, booleano ou que não é inteiro positivo |
| 400 | O campo valor é obrigatório e deve ser um número | `valor` ausente ou que não é número |
| 400 | O valor deve estar entre 0 e 10 | `valor` menor que 0 ou maior que 10 |
| 400 | O valor deve ter no máximo 2 casas decimais | `valor` com mais de 2 casas decimais |
| 400 | O campo comentario deve ser um texto | `comentario` enviado com tipo diferente de texto |
| 404 | Atividade não encontrada | Não existe atividade com esse id |
| 403 | Você não tem permissão para lançar notas nesta atividade | O usuário não é o tutor que criou a atividade com vínculo ativo (inclui professor e tutor revogado) |
| 400 | O aluno informado não é destinatário desta atividade | O `id_aluno` não recebeu esta atividade |
| 400 | A tutoria deste aluno foi finalizada e não aceita alterações | A tutoria do aluno está `finalizada` |
| 400 | O aluno ainda não enviou resposta e o prazo de entrega não venceu | Sem resposta e com o prazo ainda aberto |
| 409 | Já existe nota lançada para este aluno nesta atividade | O aluno já tem nota nesta atividade (também é a resposta quando duas requisições chegam ao mesmo tempo) |
| 500 | Erro interno do servidor | Erro inesperado |

> ⚠️ Divergência: o usuário sem permissão recebe **403**, e a nota repetida devolve **409**. Os dois códigos estão fora da lista padrão. "Aluno não é destinatário" devolve **400**, não 404. Para "tutoria finalizada", esta rota devolve **400**, enquanto outras rotas usam 409 (P5, O1, A10) ou 403 (A8, A14).

---

### [P14] Consultar notas lançadas na sala
- **Método:** GET
- **URL:** `/salas/:id/notas`
- **Autenticação:** token obrigatório (perfil: professor, dono da sala)
- **Descrição:** Só consulta, porque quem lança a nota é o tutor (RF15). Devolve uma linha por nota lançada nas atividades da sala, com aluno, atividade, conteúdo, tutor e `contestacao_pendente` (`true` se a nota tem contestação pendente). A ordem é aluno (nome) → etapa → prazo. Aluno sem nota não aparece. Se o filtro não encontrar nada, devolve uma lista vazia.
- **Parâmetros de rota:**

| Nome | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| id | number | sim | Id da sala (inteiro positivo) |

- **Parâmetros de query:**

| Nome | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| etapa | number | não | 1, 2 ou 3 |
| id_conteudo | number | não | Filtra por conteúdo (inteiro positivo) |
| id_aluno | number | não | Filtra por aluno (inteiro positivo) |
| id_tutor_sala | number | não | Filtra por vínculo de tutor (inteiro positivo) |

- **Corpo da requisição:** Não possui
- **Respostas:**
  - **Sucesso (200):**

```json
[
  {
    "id_nota": 14,
    "valor": 8.5,
    "comentario": "Boa identificação dos planaltos.",
    "data_lancamento": "2026-11-12T15:00:00.000Z",
    "aluno": {
      "id_aluno": 15,
      "nome": "Ana Ribeiro"
    },
    "atividade": {
      "id_atividade": 30,
      "titulo": "Formas de relevo no mapa do Brasil",
      "tipo": "interpretacao_mapas",
      "etapa": 2,
      "data_entrega": "2026-11-11T02:59:00.000Z"
    },
    "conteudo": {
      "id_conteudo": 8,
      "nome": "Relevo brasileiro"
    },
    "tutor": {
      "id_tutor_sala": 4,
      "nome": "Lucas Pereira"
    },
    "contestacao_pendente": false
  }
]
```

  - **Erros** (na ordem em que são conferidos):

| Código | Mensagem retornada | Quando ocorre |
|---|---|---|
| 401 / 403 | (ver tabela comum da seção 4.2) | Token ausente ou inválido, ou usuário que não é professor |
| 400 | O id da sala deve ser um número inteiro | `:id` não é inteiro positivo |
| 400 | A etapa deve ser 1, 2 ou 3 | `?etapa=` com outro valor (inclusive vazio ou repetido) |
| 400 | O id do conteúdo deve ser um número inteiro | `?id_conteudo=` que não é inteiro positivo |
| 400 | O id do aluno deve ser um número inteiro | `?id_aluno=` que não é inteiro positivo |
| 400 | O id do tutor da sala deve ser um número inteiro | `?id_tutor_sala=` que não é inteiro positivo |
| 404 | Sala não encontrada | Não existe sala com esse id |
| 403 | Você não tem permissão para acessar esta sala | A sala é de outro professor |
| 500 | Erro interno do servidor | Erro inesperado |

> ⚠️ Divergência: sala de outro professor devolve **403**, código fora da lista padrão.

---

### [P15] Exportar notas para Excel
- **Método:** GET
- **URL:** `/salas/:id/notas/exportar`
- **Autenticação:** token obrigatório (perfil: professor, dono da sala)
- **Descrição:** Exporta para Excel (RF14 / RNF10) as mesmas notas da P14, com os mesmos filtros, validações e ordem, porque a rota reaproveita o service da P14. A resposta é um arquivo `.xlsx` para download, não JSON. A planilha tem a aba "Notas", com uma linha por nota. Sem notas, a planilha sai só com o cabeçalho (200).
- **Parâmetros de rota:**

| Nome | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| id | number | sim | Id da sala (inteiro positivo) |

- **Parâmetros de query:** os mesmos da P14 (`etapa`, `id_conteudo`, `id_aluno`, `id_tutor_sala`), todos opcionais
- **Corpo da requisição:** Não possui
- **Respostas:**
  - **Sucesso (200):** arquivo binário com os cabeçalhos:

```
Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
Content-Disposition: attachment; filename="notas_2_A_2026.xlsx"
```

  O nome do arquivo é `notas_<nome da sala>_<ano letivo>.xlsx`. O nome da sala sai sem acentos e sem caracteres especiais, e os espaços viram `_` (ex.: "2º A" → `2_A`).

  Colunas da aba "Notas":

| Coluna | Conteúdo |
|---|---|
| Aluno | Nome do aluno |
| Atividade | Título da atividade |
| Tipo | Rótulo em português do tipo (ex.: "Interpretação de mapas") |
| Etapa | 1, 2 ou 3 |
| Conteúdo | Nome do conteúdo |
| Tutor | Nome do tutor |
| Prazo | Data de entrega (formato `dd/mm/yyyy`) |
| Nota | Valor (formato `0.00`) |
| Comentário | Comentário do tutor (vazio se não houver) |
| Data de lançamento | Data da nota (formato `dd/mm/yyyy`) |
| Contestação pendente | "Sim" ou "Não" |

  - **Erros** (em JSON, na mesma ordem da P14):

| Código | Mensagem retornada | Quando ocorre |
|---|---|---|
| 401 / 403 | (ver tabela comum da seção 4.2) | Token ausente ou inválido, ou usuário que não é professor |
| 400 | O id da sala deve ser um número inteiro | `:id` não é inteiro positivo |
| 400 | A etapa deve ser 1, 2 ou 3 | `?etapa=` com outro valor |
| 400 | O id do conteúdo deve ser um número inteiro | `?id_conteudo=` inválido |
| 400 | O id do aluno deve ser um número inteiro | `?id_aluno=` inválido |
| 400 | O id do tutor da sala deve ser um número inteiro | `?id_tutor_sala=` inválido |
| 404 | Sala não encontrada | Não existe sala com esse id |
| 403 | Você não tem permissão para acessar esta sala | A sala é de outro professor |
| 500 | Erro interno do servidor | Erro inesperado (ex.: falha ao gerar a planilha) |

> ⚠️ Divergência: sala de outro professor devolve **403**, código fora da lista padrão. A resposta de sucesso é um arquivo, não JSON.

---

### 4.9 Contestação de Nota

> Os erros 401 (token) são os da tabela comum da seção 4.2. A A8 e a A9 usam o `isAluno` (403 `Acesso permitido somente para alunos`). A P16 e a T4 atendem professor e tutor, então usam só o `isAuthenticated` e conferem a permissão dentro do service.
>
> Status da contestação (enum `StatusContestacao`): `pendente`, `aceita` e `recusada`. A contestação nasce `pendente`. Quem pode resolver são o professor dono da sala e o tutor que criou a atividade, com vínculo ativo.

### [A8] Contestar nota
- **Método:** POST
- **URL:** `/notas/:id/contestacoes`
- **Autenticação:** token obrigatório (perfil: aluno, dono da nota)
- **Descrição:** O aluno contesta uma nota que recebeu (RF29), informando o motivo. Só é possível enquanto a tutoria estiver `ativa` (RN14), e cada nota pode ser contestada uma única vez, qualquer que seja o status da contestação anterior. O status (`pendente`) e a data de envio são preenchidos pelo banco.
- **Parâmetros de rota:**

| Nome | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| id | number | sim | Id da nota (inteiro positivo) |

- **Parâmetros de query:** Não possui
- **Corpo da requisição:**

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| comentario | string | sim | Motivo da contestação (não pode ser vazio). É gravado sem espaços nas pontas |

```json
{
  "comentario": "Marquei as planícies corretamente no mapa, mas a correção considerou errado."
}
```

- **Respostas:**
  - **Sucesso (201):**

```json
{
  "id_contestacao": 3,
  "id_nota": 14,
  "comentario": "Marquei as planícies corretamente no mapa, mas a correção considerou errado.",
  "status": "pendente",
  "data_envio": "2026-11-13T12:00:00.000Z"
}
```

  - **Erros** (na ordem em que são conferidos):

| Código | Mensagem retornada | Quando ocorre |
|---|---|---|
| 401 | (ver tabela comum da seção 4.2) | Token ausente, mal formatado ou inválido |
| 403 | Acesso permitido somente para alunos | O token não é de aluno |
| 400 | O id da nota deve ser um número inteiro | `:id` não é inteiro positivo |
| 400 | O campo comentario é obrigatório | `comentario` ausente, vazio ou que não é texto |
| 404 | Nota não encontrada | Não existe nota com esse id |
| 403 | Você não tem permissão para contestar esta nota | A nota é de outro aluno |
| 403 | A tutoria foi finalizada e não aceita contestação de nota | A tutoria da atividade com este aluno está `finalizada` (ou não foi encontrada) |
| 409 | Esta nota já foi contestada | Já existe contestação para esta nota, em qualquer status |
| 500 | Erro interno do servidor | Erro inesperado |

> ⚠️ Divergência: as recusas de permissão e a tutoria finalizada devolvem **403**, e a nota já contestada devolve **409**. Os dois códigos estão fora da lista padrão.

---

### [P16] Listar contestações de nota
- **Método:** GET
- **URL:** `/contestacoes`
- **Autenticação:** token obrigatório (perfil: professor ou tutor)
- **Descrição:** Lista as contestações da mais recente para a mais antiga. O que cada perfil vê:
  - **Professor:** as contestações das salas em que é dono.
  - **Tutor:** as contestações das atividades que criou, só nos vínculos `Tutor_sala` ativos.
  - **Qualquer outro usuário**, inclusive aluno sem vínculo ativo de tutor, recebe 403.

  O `?id_sala=` só restringe dentro do que o usuário já pode ver. Cada item traz nota, aluno, atividade, sala e tutor.
- **Parâmetros de rota:** Não possui
- **Parâmetros de query:**

| Nome | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| status | string | não | `pendente`, `aceita` ou `recusada` |
| id_sala | number | não | Filtra por sala (inteiro positivo) |

- **Corpo da requisição:** Não possui
- **Respostas:**
  - **Sucesso (200):**

```json
[
  {
    "id_contestacao": 3,
    "comentario": "Marquei as planícies corretamente no mapa, mas a correção considerou errado.",
    "status": "pendente",
    "data_envio": "2026-11-13T12:00:00.000Z",
    "decisao": null,
    "data_resolucao": null,
    "nota": {
      "id_nota": 14,
      "valor": 8.5
    },
    "aluno": {
      "id_aluno": 15,
      "nome": "Ana Ribeiro"
    },
    "atividade": {
      "id_atividade": 30,
      "titulo": "Formas de relevo no mapa do Brasil",
      "etapa": 2,
      "conteudo": {
        "nome": "Relevo brasileiro"
      }
    },
    "sala": {
      "id_sala": 5,
      "nome": "2º A"
    },
    "tutor": {
      "id_tutor_sala": 4,
      "nome": "Lucas Pereira"
    }
  }
]
```

  - **Erros** (na ordem em que são conferidos):

| Código | Mensagem retornada | Quando ocorre |
|---|---|---|
| 401 | (ver tabela comum da seção 4.2) | Token ausente, mal formatado ou inválido |
| 400 | O status deve ser pendente ou aceita ou recusada | `?status=` com outro valor (inclusive repetido) |
| 400 | O id da sala deve ser um número inteiro | `?id_sala=` que não é inteiro positivo |
| 403 | Você não tem permissão para listar contestações | O usuário não é professor nem aluno com vínculo de tutor ativo |
| 500 | Erro interno do servidor | Erro inesperado |

> ⚠️ Divergência: o usuário sem permissão recebe **403**, código fora da lista padrão.

---

### [A9] Ver histórico de contestações
- **Método:** GET
- **URL:** `/alunos/me/contestacoes`
- **Autenticação:** token obrigatório (perfil: aluno)
- **Descrição:** Lista as contestações das notas do aluno logado, da mais recente para a mais antiga (UC06, passo 4). Entram as contestações de tutorias ativas e finalizadas (RN14). Cada item traz a nota (com o valor atual), a atividade (etapa e conteúdo), o tutor (só o nome) e, quando resolvida, a decisão e a data da resolução.
- **Parâmetros de rota:** Não possui
- **Parâmetros de query:**

| Nome | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| status | string | não | `pendente`, `aceita` ou `recusada` |

- **Corpo da requisição:** Não possui
- **Respostas:**
  - **Sucesso (200):**

```json
[
  {
    "id_contestacao": 3,
    "comentario": "Marquei as planícies corretamente no mapa, mas a correção considerou errado.",
    "status": "aceita",
    "data_envio": "2026-11-13T12:00:00.000Z",
    "decisao": "Revisei o mapa e as planícies estavam corretas.",
    "data_resolucao": "2026-11-14T10:00:00.000Z",
    "nota": {
      "id_nota": 14,
      "valor": 9.5
    },
    "atividade": {
      "id_atividade": 30,
      "titulo": "Formas de relevo no mapa do Brasil",
      "etapa": 2,
      "conteudo": {
        "nome": "Relevo brasileiro"
      }
    },
    "tutor": {
      "nome": "Lucas Pereira"
    }
  }
]
```

  - **Erros:**

| Código | Mensagem retornada | Quando ocorre |
|---|---|---|
| 401 | (ver tabela comum da seção 4.2) | Token ausente, mal formatado ou inválido |
| 403 | Acesso permitido somente para alunos | O token não é de aluno |
| 400 | O status deve ser pendente ou aceita ou recusada | `?status=` com outro valor (inclusive repetido) |
| 500 | Erro interno do servidor | Erro inesperado |

> ⚠️ Divergência: o perfil errado devolve **403**, código fora da lista padrão.

---

### [T4] Resolver contestação de nota
- **Método:** PATCH
- **URL:** `/contestacoes/:id/resolver`
- **Autenticação:** token obrigatório (perfil: professor dono da sala ou tutor que criou a atividade, com vínculo ativo)
- **Descrição:** Resolve uma contestação `pendente` (RF29 / UC06), com status `aceita` ou `recusada` e uma decisão por escrito. Quando aceita, o `valor` enviado **substitui** a nota, e o valor anterior não fica guardado. Quando recusada, a nota não muda. A contestação e a nota são gravadas numa única transação.
- **Parâmetros de rota:**

| Nome | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| id | number | sim | Id da contestação (inteiro positivo) |

- **Parâmetros de query:** Não possui
- **Corpo da requisição:**

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| status | string | sim | `aceita` ou `recusada` |
| decisao | string | sim | Parecer da resolução (não pode ser vazio). É gravado sem espaços nas pontas |
| valor | number | só se `aceita` | Nova nota, de 0 a 10, com no máximo 2 casas decimais. Precisa ser número no JSON. Com `recusada`, o campo **não pode** ser enviado (nem como `null`) |

```json
{
  "status": "aceita",
  "decisao": "Revisei o mapa e as planícies estavam corretas.",
  "valor": 9.5
}
```

- **Respostas:**
  - **Sucesso (200):**

```json
{
  "id_contestacao": 3,
  "status": "aceita",
  "decisao": "Revisei o mapa e as planícies estavam corretas.",
  "data_resolucao": "2026-11-14T10:00:00.000Z",
  "nota": {
    "id_nota": 14,
    "valor": 9.5
  }
}
```

  - **Erros** (na ordem em que são conferidos):

| Código | Mensagem retornada | Quando ocorre |
|---|---|---|
| 401 | (ver tabela comum da seção 4.2) | Token ausente, mal formatado ou inválido |
| 400 | O id da contestação deve ser um número inteiro | `:id` não é inteiro positivo |
| 400 | O status deve ser aceita ou recusada | `status` ausente, que não é texto ou com outro valor (inclusive `pendente`) |
| 400 | O campo decisao é obrigatório | `decisao` ausente, vazia ou que não é texto |
| 400 | O campo valor é obrigatório quando a contestação é aceita e deve ser um número | `status: "aceita"` sem `valor` numérico |
| 400 | O valor deve estar entre 0 e 10 | `valor` menor que 0 ou maior que 10 |
| 400 | O valor deve ter no máximo 2 casas decimais | `valor` com mais de 2 casas decimais |
| 400 | O campo valor só pode ser enviado quando a contestação é aceita | `status: "recusada"` com `valor` no corpo |
| 404 | Contestação não encontrada | Não existe contestação com esse id |
| 403 | Você não tem permissão para resolver esta contestação | O usuário não é o professor dono da sala nem o tutor criador da atividade com vínculo ativo |
| 409 | Esta contestação já foi resolvida | A contestação não está `pendente` (também é a resposta quando duas resoluções chegam ao mesmo tempo) |
| 500 | Erro interno do servidor | Erro inesperado |

> ⚠️ Divergência: o usuário sem permissão recebe **403**, e a contestação já resolvida devolve **409**. Os dois códigos estão fora da lista padrão.

---

### 4.10 Desempenho

> Os erros 401 (token) são os da tabela comum da seção 4.2. A P13 usa o `isProfessor`, a T6 usa o `isTutor` (403 `Acesso permitido somente para tutores com vínculo ativo`), e a A6 e a A7 usam o `isAluno` (403 `Acesso permitido somente para alunos`).
>
> **Médias:** são calculadas pelo helper `calcularMedia` e arredondadas para 2 casas. Quando não há nota, a média é `null`, nunca 0.
>
> **Desempenho do tutor (P13 e T6):** usa dois indicadores lado a lado, sem uma nota única que combine os dois:
> - feedback dos alunos, com média geral e média por etapa (sempre as 3 etapas);
> - avaliações do professor, só com média geral.
>
> As notas dos alunos tutorados não entram no desempenho do tutor.

### [P13] Dashboard de desempenho dos tutores
- **Método:** GET
- **URL:** `/salas/:id/desempenho-tutores`
- **Autenticação:** token obrigatório (perfil: professor, dono da sala)
- **Descrição:** Mostra os indicadores de desempenho de cada vínculo de tutor da sala (RF13 / UC15), inclusive os revogados. Os ativos vêm primeiro e, dentro de cada grupo, a ordem é alfabética. A rota traz só os números. As listas de feedbacks e avaliações ficam na T7 e na P10. Sala sem tutores devolve uma lista vazia.
- **Parâmetros de rota:**

| Nome | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| id | number | sim | Id da sala (inteiro positivo) |

- **Parâmetros de query:** Não possui
- **Corpo da requisição:** Não possui
- **Respostas:**
  - **Sucesso (200):**

```json
[
  {
    "id_tutor_sala": 4,
    "nome": "Lucas Pereira",
    "revogado": false,
    "data_revogacao": null,
    "feedback": {
      "media_geral": 8.75,
      "quantidade": 2,
      "por_etapa": [
        { "etapa": 1, "media": 8.5, "quantidade": 1 },
        { "etapa": 2, "media": 9, "quantidade": 1 },
        { "etapa": 3, "media": null, "quantidade": 0 }
      ]
    },
    "avaliacoes_professor": {
      "media_geral": 8.5,
      "quantidade": 1
    }
  }
]
```

  - **Erros** (na ordem em que são conferidos):

| Código | Mensagem retornada | Quando ocorre |
|---|---|---|
| 401 / 403 | (ver tabela comum da seção 4.2) | Token ausente ou inválido, ou usuário que não é professor |
| 400 | O id da sala deve ser um número inteiro | `:id` não é inteiro positivo |
| 404 | Sala não encontrada | Não existe sala com esse id |
| 403 | Você não tem permissão para acessar esta sala | A sala é de outro professor |
| 500 | Erro interno do servidor | Erro inesperado |

> ⚠️ Divergência: sala de outro professor devolve **403**, código fora da lista padrão.

---

### [T6] Ver o próprio desempenho (tutor)
- **Método:** GET
- **URL:** `/tutores/me/desempenho`
- **Autenticação:** token obrigatório (perfil: tutor)
- **Descrição:** Mostra ao tutor logado os mesmos indicadores da P13 (RF23 / UC20), um item por vínculo `Tutor_sala` dele, inclusive os revogados. Além dos números, cada item traz as listas de feedbacks (com o nome do aluno que escreveu) e de avaliações (com o nome do professor), da mais recente para a mais antiga. Os vínculos ativos vêm primeiro, depois o ano letivo mais recente. Um `?id_sala=` de uma sala em que ele não é tutor devolve uma lista vazia.
- **Parâmetros de rota:** Não possui
- **Parâmetros de query:**

| Nome | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| id_sala | number | não | Filtra por sala (inteiro positivo) |

- **Corpo da requisição:** Não possui
- **Respostas:**
  - **Sucesso (200):**

```json
[
  {
    "id_tutor_sala": 4,
    "sala": {
      "id_sala": 5,
      "nome": "2º A",
      "serie": 2,
      "ano_letivo": 2026
    },
    "revogado": false,
    "data_revogacao": null,
    "feedback": {
      "media_geral": 9,
      "quantidade": 1,
      "por_etapa": [
        { "etapa": 1, "media": null, "quantidade": 0 },
        { "etapa": 2, "media": 9, "quantidade": 1 },
        { "etapa": 3, "media": null, "quantidade": 0 }
      ],
      "feedbacks": [
        {
          "id_feedback": 6,
          "etapa": 2,
          "nota": 9,
          "comentario": "Explica com paciência e tira as dúvidas rápido.",
          "rubrica_file": "https://res.cloudinary.com/exemplo/raw/upload/v1/rubrica.pdf",
          "data": "2026-11-20T18:00:00.000Z",
          "aluno": {
            "nome": "Ana Ribeiro"
          }
        }
      ]
    },
    "avaliacoes_professor": {
      "media_geral": 8.5,
      "quantidade": 1,
      "avaliacoes": [
        {
          "id_avaliacao": 10,
          "nota": 8.5,
          "comentario": "Tutor comprometido, acompanha de perto os tutorados.",
          "data": "2026-10-26T09:15:00.000Z",
          "professor": {
            "nome": "Mariana Souza"
          }
        }
      ]
    }
  }
]
```

  - **Erros** (na ordem em que são conferidos):

| Código | Mensagem retornada | Quando ocorre |
|---|---|---|
| 401 | (ver tabela comum da seção 4.2) | Token ausente, mal formatado ou inválido |
| 403 | Acesso permitido somente para tutores com vínculo ativo | O usuário não é aluno com `Tutor_sala` ativo |
| 400 | O id da sala deve ser um número inteiro | `?id_sala=` que não é inteiro positivo |
| 500 | Erro interno do servidor | Erro inesperado |

> ⚠️ Divergência: o usuário que não é tutor ativo recebe **403**, código fora da lista padrão.

---

### [A6] Ver dashboard de notas
- **Método:** GET
- **URL:** `/alunos/me/desempenho`
- **Autenticação:** token obrigatório (perfil: aluno)
- **Descrição:** É o dashboard de notas do aluno logado (RF26), com as notas de tutorias ativas e finalizadas (RN14). Traz:
  - a média geral;
  - a média por etapa: sempre as 3 etapas, ou só a etapa filtrada, e etapa sem nota aparece com `media: null`;
  - a média por conteúdo, em ordem alfabética, só dos conteúdos com nota;
  - a lista das notas, com o status da contestação (`null` se não houver).

  Atividade sem nota lançada não entra em nenhum cálculo.
- **Parâmetros de rota:** Não possui
- **Parâmetros de query:**

| Nome | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| id_sala | number | não | Filtra por sala (inteiro positivo) |
| etapa | number | não | 1, 2 ou 3 |

- **Corpo da requisição:** Não possui
- **Respostas:**
  - **Sucesso (200):**

```json
{
  "media_geral": {
    "media": 9.5,
    "total_notas": 1
  },
  "por_etapa": [
    { "etapa": 1, "media": null, "quantidade": 0 },
    { "etapa": 2, "media": 9.5, "quantidade": 1 },
    { "etapa": 3, "media": null, "quantidade": 0 }
  ],
  "por_conteudo": [
    { "id_conteudo": 8, "nome": "Relevo brasileiro", "media": 9.5, "quantidade": 1 }
  ],
  "notas": [
    {
      "id_nota": 14,
      "valor": 9.5,
      "comentario": "Boa identificação dos planaltos.",
      "data_lancamento": "2026-11-12T15:00:00.000Z",
      "atividade": {
        "id_atividade": 30,
        "titulo": "Formas de relevo no mapa do Brasil",
        "tipo": "interpretacao_mapas",
        "etapa": 2
      },
      "conteudo": {
        "nome": "Relevo brasileiro"
      },
      "contestacao_status": "aceita"
    }
  ]
}
```

  Sem nenhuma nota, a resposta vem com `media_geral.media: null` e `total_notas: 0`, as etapas com `null`/0 e as listas vazias. Isso não é erro.

  - **Erros** (na ordem em que são conferidos):

| Código | Mensagem retornada | Quando ocorre |
|---|---|---|
| 401 | (ver tabela comum da seção 4.2) | Token ausente, mal formatado ou inválido |
| 403 | Acesso permitido somente para alunos | O token não é de aluno |
| 400 | A etapa deve ser 1, 2 ou 3 | `?etapa=` com outro valor (inclusive vazio ou repetido) |
| 400 | O id da sala deve ser um número inteiro | `?id_sala=` que não é inteiro positivo |
| 500 | Erro interno do servidor | Erro inesperado |

> ⚠️ Divergência: o perfil errado devolve **403**, código fora da lista padrão.

---

### [A7] Ver conteúdos dominados
- **Método:** GET
- **URL:** `/alunos/me/conteudos-dominados`
- **Autenticação:** token obrigatório (perfil: aluno)
- **Descrição:** Classifica cada conteúdo em que o aluno logado tem nota (RF27), considerando tutorias ativas e finalizadas (RN14). A média do conteúdo é arredondada para 2 casas e depois comparada com as faixas da tabela `faixa_desempenho`. A resposta é um objeto com **uma lista por faixa cadastrada**, e o nome da faixa é a chave. Cada lista vem em ordem alfabética de conteúdo. Nenhum limite de nota fica escrito no código: tudo vem da tabela.
- **Parâmetros de rota:** Não possui
- **Parâmetros de query:**

| Nome | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| id_sala | number | não | Filtra por sala (inteiro positivo) |

- **Corpo da requisição:** Não possui
- **Respostas:**
  - **Sucesso (200):** exemplo com as faixas cadastradas pelo `prisma/seed.ts` (`com_dificuldade`: 0.00 a 6.99; `dominado`: 7.00 a 10.00)

```json
{
  "com_dificuldade": [
    { "id_conteudo": 9, "nome": "Clima e vegetação", "media": 6.25, "quantidade": 2 }
  ],
  "dominado": [
    { "id_conteudo": 8, "nome": "Relevo brasileiro", "media": 9.5, "quantidade": 1 }
  ]
}
```

  Sem nenhuma nota, todas as listas vêm vazias. Isso não é erro.

  - **Erros** (na ordem em que são conferidos):

| Código | Mensagem retornada | Quando ocorre |
|---|---|---|
| 401 | (ver tabela comum da seção 4.2) | Token ausente, mal formatado ou inválido |
| 403 | Acesso permitido somente para alunos | O token não é de aluno |
| 400 | O id da sala deve ser um número inteiro | `?id_sala=` que não é inteiro positivo |
| 500 | Erro interno do servidor | A tabela `faixa_desempenho` está vazia ou alguma média não cabe em nenhuma faixa. O service lança `Error("faixas de desempenho não cadastradas")`, mensagem que só aparece no console do servidor |

> ⚠️ Divergência: o perfil errado devolve **403**, código fora da lista padrão. A falta de configuração das faixas devolve **500** com a mensagem genérica, porque o service usa `Error` comum, não `AppError`.

---

### 4.11 Materiais de Apoio

> Os erros 401 (token) são os da tabela comum da seção 4.2. A T5 usa o `isAluno` e, depois, o `isTutorAtivoSala`. O `isAluno` vem primeiro para que o professor dono da sala não passe pelo `isTutorAtivoSala`. A A5 usa só o `isAuthenticated` e confere a permissão dentro do service.

### [T5] Anexar material de apoio
- **Método:** POST
- **URL:** `/salas/:id/materiais`
- **Autenticação:** token obrigatório (perfil: tutor ativo da sala)
- **Descrição:** O tutor anexa um material de apoio na sala (RF25), via `multipart/form-data`. O arquivo é enviado ao Cloudinary só depois de todas as validações, e a API grava a URL. O tutor precisa ter pelo menos uma tutoria `ativa` na sala (RN14). A data de envio é preenchida pelo banco.
- **Parâmetros de rota:**

| Nome | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| id | number | sim | Id da sala (inteiro positivo) |

- **Parâmetros de query:** Não possui
- **Corpo da requisição** (`multipart/form-data`):

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| titulo | string | sim | Título do material, até 150 caracteres |
| descricao | string | não | Descrição. Vazia vira `null` |
| file | arquivo | sim | Um único arquivo. Formatos aceitos: .pdf, .doc, .docx, .xls, .xlsx e .csv (conferidos pela extensão, sem diferenciar maiúsculas de minúsculas). Tamanho máximo: 10 MB |

  Exemplo (campos do form-data):

```
titulo:    Mapa do relevo brasileiro
descricao: Mapa com as principais unidades de relevo, para a atividade da etapa 2.
file:      mapa_relevo.pdf
```

- **Respostas:**
  - **Sucesso (201):**

```json
{
  "id_material": 5,
  "id_tutor_sala": 4,
  "titulo": "Mapa do relevo brasileiro",
  "descricao": "Mapa com as principais unidades de relevo, para a atividade da etapa 2.",
  "arquivo": "https://res.cloudinary.com/exemplo/image/upload/v1/mapa_relevo.pdf",
  "data_envio": "2026-10-28T14:00:00.000Z"
}
```

  - **Erros** (na ordem em que são conferidos):

| Código | Mensagem retornada | Quando ocorre |
|---|---|---|
| 401 | (ver tabela comum da seção 4.2) | Token ausente, mal formatado ou inválido |
| 403 | Acesso permitido somente para alunos | O token não é de aluno (inclui o professor) |
| 400 | O id da sala deve ser um número inteiro | `:id` não é inteiro positivo |
| 404 | Sala não encontrada | Não existe sala com esse id |
| 403 | Você não tem permissão para acessar esta sala | O aluno não é tutor ativo da sala |
| 400 | O título do material é obrigatório | `titulo` ausente, vazio ou que não é texto |
| 400 | O título do material deve ter no máximo 150 caracteres | `titulo` com mais de 150 caracteres |
| 400 | O campo descricao deve ser um texto | `descricao` enviada com tipo diferente de texto |
| 400 | O arquivo do material é obrigatório (campo file) | Nenhum arquivo no campo `file` |
| 400 | Envie apenas um arquivo no campo file | Mais de um arquivo no campo `file` |
| 400 | Formato não aceito. Envie um arquivo .pdf, .doc, .docx, .xls, .xlsx ou .csv | Extensão fora da lista |
| 400 | O arquivo deve ter no máximo 10 MB | Arquivo maior que 10 MB |
| 403 | Você precisa ter pelo menos uma tutoria ativa nesta sala para anexar material | O tutor não tem nenhuma tutoria `ativa` na sala |
| 500 | Erro interno do servidor | Erro inesperado (ex.: falha no upload ao Cloudinary) |

> ⚠️ Divergência: as recusas de permissão devolvem **403**, código fora da lista padrão.

---

### [A5] Listar materiais de apoio
- **Método:** GET
- **URL:** `/salas/:id/materiais`
- **Autenticação:** token obrigatório (perfil: professor, tutor ou aluno)
- **Descrição:** Lista os materiais da sala (RF28), do mais recente para o mais antigo, com o tutor que anexou cada um. O que cada perfil vê:
  - **Professor:** qualquer professor cadastrado, mesmo que não seja o dono da sala, vê todos os materiais da sala.
  - **Tutor ativo:** vê os materiais que ele mesmo anexou.
  - **Aluno:** vê os materiais dos tutores com quem tem ou teve tutoria na sala.

  Um aluno que é tutor e tutorado na mesma sala recebe as duas listas juntas.
- **Parâmetros de rota:**

| Nome | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| id | number | sim | Id da sala (inteiro positivo) |

- **Parâmetros de query:** Não possui
- **Corpo da requisição:** Não possui
- **Respostas:**
  - **Sucesso (200):**

```json
[
  {
    "id_material": 5,
    "titulo": "Mapa do relevo brasileiro",
    "descricao": "Mapa com as principais unidades de relevo, para a atividade da etapa 2.",
    "arquivo": "https://res.cloudinary.com/exemplo/image/upload/v1/mapa_relevo.pdf",
    "data_envio": "2026-10-28T14:00:00.000Z",
    "tutor": {
      "id_tutor_sala": 4,
      "nome": "Lucas Pereira"
    }
  }
]
```

  - **Erros** (na ordem em que são conferidos):

| Código | Mensagem retornada | Quando ocorre |
|---|---|---|
| 401 | (ver tabela comum da seção 4.2) | Token ausente, mal formatado ou inválido |
| 400 | O id da sala deve ser um número inteiro | `:id` não é inteiro positivo |
| 404 | Sala não encontrada | Não existe sala com esse id |
| 403 | Você não tem permissão para acessar esta sala | Aluno que não é tutor ativo da sala nem tem ou teve tutoria com um tutor dela |
| 500 | Erro interno do servidor | Erro inesperado |

> ⚠️ Divergência: o usuário sem permissão recebe **403**, código fora da lista padrão.

---

### 4.12 Avisos e Mensagens

> Os erros 401 (token) são os da tabela comum da seção 4.2. Middlewares de perfil:
> - P3: `isProfessor`.
> - A4: só o `isAuthenticated`, e a permissão é conferida no service.
> - O1 e O2: `isAluno` (403 `Acesso permitido somente para alunos`). A participação na tutoria é conferida no service pelo helper `buscarParticipanteTutoria`.
>
> **Aviso** é publicado pelo professor para a sala inteira. **Mensagem** é trocada entre o tutor e o aluno tutorado dentro de uma tutoria. Uma mensagem com `assunto` preenchido é um **comunicado**, e só o tutor pode enviar comunicados.

### [P3] Publicar aviso na sala
- **Método:** POST
- **URL:** `/salas/:id/avisos`
- **Autenticação:** token obrigatório (perfil: professor, dono da sala)
- **Descrição:** Publica um aviso visível a todos os alunos matriculados na sala (RF10 / RN10). Só é possível se a sala tiver pelo menos uma tutoria `ativa` (RN14). A data de publicação é preenchida pelo banco.
- **Parâmetros de rota:**

| Nome | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| id | number | sim | Id da sala (inteiro positivo) |

- **Parâmetros de query:** Não possui
- **Corpo da requisição:**

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| titulo | string | sim | Título do aviso, até 150 caracteres |
| conteudo | string | sim | Texto do aviso (não pode ser vazio) |

```json
{
  "titulo": "Entrega das atividades da etapa 2",
  "conteudo": "As atividades da etapa 2 devem ser entregues até 10/11. Procurem o tutor em caso de dúvida."
}
```

- **Respostas:**
  - **Sucesso (201):**

```json
{
  "id_aviso": 2,
  "titulo": "Entrega das atividades da etapa 2",
  "conteudo": "As atividades da etapa 2 devem ser entregues até 10/11. Procurem o tutor em caso de dúvida.",
  "data_publicacao": "2026-10-29T12:00:00.000Z",
  "id_sala": 5,
  "professor": {
    "id_professor": 3,
    "nome": "Mariana Souza"
  }
}
```

  - **Erros** (na ordem em que são conferidos):

| Código | Mensagem retornada | Quando ocorre |
|---|---|---|
| 401 / 403 | (ver tabela comum da seção 4.2) | Token ausente ou inválido, ou usuário que não é professor |
| 400 | O id da sala deve ser um número inteiro | `:id` não é inteiro positivo |
| 404 | Sala não encontrada | Não existe sala com esse id |
| 403 | Você não tem permissão para acessar esta sala | A sala é de outro professor |
| 400 | O campo titulo é obrigatório | `titulo` ausente, vazio ou que não é texto |
| 400 | O título deve ter no máximo 150 caracteres | `titulo` com mais de 150 caracteres |
| 400 | O campo conteudo é obrigatório | `conteudo` ausente, vazio ou que não é texto |
| 409 | Não é possível publicar o aviso: não há tutoria ativa nesta sala | Nenhuma tutoria `ativa` na sala |
| 500 | Erro interno do servidor | Erro inesperado |

> ⚠️ Divergência: sala de outro professor devolve **403**, e sala sem tutoria ativa devolve **409**. Os dois códigos estão fora da lista padrão.

---

### [A4] Listar avisos da sala
- **Método:** GET
- **URL:** `/salas/:id/avisos`
- **Autenticação:** token obrigatório (perfil: professor dono da sala ou aluno matriculado na sala, o que inclui o tutor)
- **Descrição:** Lista os avisos da sala, do mais recente para o mais antigo. Não há filtro de tutoria ativa nem de ano letivo: os avisos antigos ficam como histórico (RN14). O formato de cada aviso é o mesmo da P3, sem o `id_sala`. Sala sem avisos devolve uma lista vazia.
- **Parâmetros de rota:**

| Nome | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| id | number | sim | Id da sala (inteiro positivo) |

- **Parâmetros de query:** Não possui
- **Corpo da requisição:** Não possui
- **Respostas:**
  - **Sucesso (200):**

```json
[
  {
    "id_aviso": 2,
    "titulo": "Entrega das atividades da etapa 2",
    "conteudo": "As atividades da etapa 2 devem ser entregues até 10/11. Procurem o tutor em caso de dúvida.",
    "data_publicacao": "2026-10-29T12:00:00.000Z",
    "professor": {
      "id_professor": 3,
      "nome": "Mariana Souza"
    }
  }
]
```

  - **Erros** (na ordem em que são conferidos):

| Código | Mensagem retornada | Quando ocorre |
|---|---|---|
| 401 | (ver tabela comum da seção 4.2) | Token ausente, mal formatado ou inválido |
| 400 | O id da sala deve ser um número inteiro | `:id` não é inteiro positivo |
| 404 | Sala não encontrada | Não existe sala com esse id |
| 403 | Você não tem permissão para acessar esta sala | Professor que não é dono da sala, ou aluno sem matrícula na sala |
| 500 | Erro interno do servidor | Erro inesperado |

> ⚠️ Divergência: o usuário sem permissão recebe **403**, código fora da lista padrão.

---

### [O1] Enviar mensagem ou comunicado
- **Método:** POST
- **URL:** `/tutorias/:id/mensagens`
- **Autenticação:** token obrigatório (perfil: aluno participante da tutoria, ou seja, o tutor ou o aluno tutorado)
- **Descrição:** O tutor ou o aluno tutorado envia uma mensagem na tutoria (RF2). Se o `assunto` vier preenchido, a mensagem é um **comunicado** (RF24), e só o tutor pode enviar comunicados. A tutoria precisa estar `ativa`. A resposta indica quem enviou (`remetente`: `"tutor"` ou `"tutorado"`). A data de envio é preenchida pelo banco.
- **Parâmetros de rota:**

| Nome | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| id | number | sim | Id da tutoria (inteiro positivo) |

- **Parâmetros de query:** Não possui
- **Corpo da requisição:**

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| texto | string | sim | Texto da mensagem (não pode ser vazio nem só espaços) |
| assunto | string | não | Assunto do comunicado, até 150 caracteres. Se vier, não pode ser vazio. `null` ou ausente faz da mensagem uma mensagem comum |

```json
{
  "texto": "Lembrete: amanhã revisamos as formas de relevo antes da atividade.",
  "assunto": "Revisão de relevo"
}
```

- **Respostas:**
  - **Sucesso (201):**

```json
{
  "id_mensagem": 41,
  "id_tutoria": 9,
  "texto": "Lembrete: amanhã revisamos as formas de relevo antes da atividade.",
  "assunto": "Revisão de relevo",
  "data_envio": "2026-10-30T19:00:00.000Z",
  "remetente": "tutor"
}
```

  - **Erros** (na ordem em que são conferidos):

| Código | Mensagem retornada | Quando ocorre |
|---|---|---|
| 401 | (ver tabela comum da seção 4.2) | Token ausente, mal formatado ou inválido |
| 403 | Acesso permitido somente para alunos | O token não é de aluno |
| 400 | O id da tutoria deve ser um número inteiro | `:id` não é inteiro positivo |
| 404 | Tutoria não encontrada | Não existe tutoria com esse id |
| 403 | Você não participa desta tutoria | O aluno não é o tutor nem o tutorado da tutoria |
| 409 | Esta tutoria está finalizada e não aceita novas mensagens | A tutoria está `finalizada` |
| 400 | O campo texto é obrigatório e não pode ser vazio | `texto` ausente, vazio ou que não é texto |
| 400 | O campo assunto não pode ser vazio | `assunto` enviado vazio ou com tipo diferente de texto |
| 400 | O assunto deve ter no máximo 150 caracteres | `assunto` com mais de 150 caracteres |
| 403 | Somente o tutor pode enviar comunicados | O aluno tutorado enviou `assunto` |
| 500 | Erro interno do servidor | Erro inesperado |

> ⚠️ Divergência: as recusas de permissão devolvem **403**, e a tutoria finalizada devolve **409**. Os dois códigos estão fora da lista padrão.

---

### [O2] Listar mensagens da tutoria
- **Método:** GET
- **URL:** `/tutorias/:id/mensagens`
- **Autenticação:** token obrigatório (perfil: aluno participante da tutoria, ou seja, o tutor ou o aluno tutorado)
- **Descrição:** Lista as mensagens da tutoria da mais antiga para a mais recente, como num chat. A tutoria finalizada também é listada, como histórico. Se o vínculo do tutor foi revogado, o tutor perde o acesso, mas o tutorado continua vendo o histórico. Do remetente saem o tipo (`tutor` ou `tutorado`) e o nome.
- **Parâmetros de rota:**

| Nome | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| id | number | sim | Id da tutoria (inteiro positivo) |

- **Parâmetros de query:**

| Nome | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| tipo | string | não | Só aceita `comunicado`: lista só as mensagens com assunto |

- **Corpo da requisição:** Não possui
- **Respostas:**
  - **Sucesso (200):**

```json
[
  {
    "id_mensagem": 40,
    "texto": "Oi, tenho dúvida sobre a diferença entre planalto e planície.",
    "assunto": null,
    "data_envio": "2026-10-30T18:30:00.000Z",
    "remetente": {
      "tipo": "tutorado",
      "nome": "Ana Ribeiro"
    }
  },
  {
    "id_mensagem": 41,
    "texto": "Lembrete: amanhã revisamos as formas de relevo antes da atividade.",
    "assunto": "Revisão de relevo",
    "data_envio": "2026-10-30T19:00:00.000Z",
    "remetente": {
      "tipo": "tutor",
      "nome": "Lucas Pereira"
    }
  }
]
```

  - **Erros** (na ordem em que são conferidos):

| Código | Mensagem retornada | Quando ocorre |
|---|---|---|
| 401 | (ver tabela comum da seção 4.2) | Token ausente, mal formatado ou inválido |
| 403 | Acesso permitido somente para alunos | O token não é de aluno |
| 400 | O id da tutoria deve ser um número inteiro | `:id` não é inteiro positivo |
| 404 | Tutoria não encontrada | Não existe tutoria com esse id |
| 403 | Você não participa desta tutoria | O aluno não é o tutor nem o tutorado da tutoria |
| 403 | Seu vínculo de tutor nesta sala foi revogado | O aluno é o tutor, mas o vínculo `Tutor_sala` foi revogado |
| 400 | O tipo deve ser comunicado | `?tipo=` com valor diferente de `comunicado` (inclusive repetido) |
| 500 | Erro interno do servidor | Erro inesperado |

> ⚠️ Divergência: as recusas de permissão devolvem **403**, código fora da lista padrão.

---

### 4.13 Feedback

> Os erros 401 (token) são os da tabela comum da seção 4.2. A A10 usa o `isAluno` (403 `Acesso permitido somente para alunos`), e a participação na tutoria é conferida no service pelo helper `buscarParticipanteTutoria`. A T7 atende tutor e professor, então usa só o `isAuthenticated` e confere a permissão no service.

### [A10] Enviar feedback ao tutor via rubrica
- **Método:** POST
- **URL:** `/tutorias/:id/feedbacks`
- **Autenticação:** token obrigatório (perfil: aluno tutorado da tutoria)
- **Descrição:** O aluno tutorado avalia o tutor (RF22 / UC14) com uma nota, um comentário opcional e um arquivo de rubrica obrigatório, via `multipart/form-data`. Regras:
  - Só um feedback por etapa (1 a 3) em cada tutoria.
  - A tutoria precisa estar `ativa`.
  - O tutor não pode enviar feedback para si mesmo.

  O arquivo é enviado ao Cloudinary só depois de todas as validações. A data é preenchida pelo banco.
- **Parâmetros de rota:**

| Nome | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| id | number | sim | Id da tutoria (inteiro positivo) |

- **Parâmetros de query:** Não possui
- **Corpo da requisição** (`multipart/form-data`; os campos de texto chegam como texto e são convertidos):

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| etapa | texto numérico | sim | `1`, `2` ou `3` |
| nota | texto numérico | sim | De 0 a 10, com no máximo 2 casas decimais, separadas por **ponto** (`9.5`). Com vírgula (`9,5`), a nota é recusada |
| comentario | string | não | Comentário. Se vier, não pode ser vazio |
| file | arquivo | sim | Rubrica, um único arquivo. Formatos aceitos: .pdf, .doc, .docx, .xls, .xlsx e .csv (conferidos pela extensão, sem diferenciar maiúsculas de minúsculas). Tamanho máximo: 10 MB |

  Exemplo (campos do form-data):

```
etapa:      2
nota:       9
comentario: Explica com paciência e tira as dúvidas rápido.
file:       rubrica_tutor.pdf
```

- **Respostas:**
  - **Sucesso (201):**

```json
{
  "id_feedback": 6,
  "id_tutoria": 9,
  "etapa": 2,
  "nota": 9,
  "comentario": "Explica com paciência e tira as dúvidas rápido.",
  "rubrica_file": "https://res.cloudinary.com/exemplo/raw/upload/v1/rubrica.pdf",
  "data": "2026-11-20T18:00:00.000Z"
}
```

  - **Erros** (na ordem em que são conferidos):

| Código | Mensagem retornada | Quando ocorre |
|---|---|---|
| 401 | (ver tabela comum da seção 4.2) | Token ausente, mal formatado ou inválido |
| 403 | Acesso permitido somente para alunos | O token não é de aluno |
| 400 | O id da tutoria deve ser um número inteiro | `:id` não é inteiro positivo |
| 404 | Tutoria não encontrada | Não existe tutoria com esse id |
| 403 | Você não participa desta tutoria | O aluno não é o tutor nem o tutorado da tutoria |
| 403 | Somente o aluno tutorado pode enviar feedback ao tutor | O aluno logado é o tutor da tutoria |
| 409 | Esta tutoria está finalizada e não aceita novos feedbacks | A tutoria está `finalizada` |
| 400 | O campo etapa é obrigatório e deve ser 1, 2 ou 3 | `etapa` ausente, vazia ou diferente de 1, 2 e 3 |
| 400 | O campo nota é obrigatório e deve ser um número | `nota` ausente, vazia ou que não é número (ex.: `9,5`) |
| 400 | A nota deve estar entre 0 e 10 | `nota` menor que 0 ou maior que 10 |
| 400 | A nota deve ter no máximo 2 casas decimais | `nota` com mais de 2 casas decimais |
| 400 | O campo comentario não pode ser vazio | `comentario` enviado vazio ou só com espaços |
| 400 | O arquivo da rubrica é obrigatório (campo file) | Nenhum arquivo no campo `file` |
| 400 | Envie apenas um arquivo no campo file | Mais de um arquivo no campo `file` |
| 400 | Formato não aceito. Envie um arquivo .pdf, .doc, .docx, .xls, .xlsx ou .csv | Extensão fora da lista |
| 400 | O arquivo deve ter no máximo 10 MB | Arquivo maior que 10 MB |
| 409 | Já foi enviado um feedback nesta tutoria para a 2ª etapa | Já existe feedback desta tutoria na etapa informada. A mensagem traz o número da etapa (o exemplo usa 2). Também é a resposta quando duas requisições chegam ao mesmo tempo |
| 500 | Erro interno do servidor | Erro inesperado (ex.: falha no upload ao Cloudinary) |

> ⚠️ Divergência: as recusas de permissão devolvem **403**, e a tutoria finalizada ou a etapa repetida devolve **409**. Os dois códigos estão fora da lista padrão.

---

### [T7] Ver feedbacks recebidos
- **Método:** GET
- **URL:** `/feedbacks`
- **Autenticação:** token obrigatório (perfil: tutor ou professor)
- **Descrição:** Lista os feedbacks do mais recente para o mais antigo, com um resumo (total e média das notas) que respeita os mesmos filtros. O que cada perfil vê:
  - **Tutor**, que precisa ter pelo menos um vínculo ativo: os feedbacks de todos os seus vínculos, inclusive revogados e de anos anteriores.
  - **Professor:** os feedbacks das salas em que é dono.
  - **Qualquer outro usuário** recebe 403.

  A média é calculada pelo banco e não é arredondada pela API. Sem feedbacks, o `resumo` vem com `total_feedbacks: 0` e `media_notas: null`, e a lista vem vazia.
- **Parâmetros de rota:** Não possui
- **Parâmetros de query:**

| Nome | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| etapa | number | não | 1, 2 ou 3 |
| ano | number | não | Ano letivo da sala (inteiro positivo) |
| id_aluno | number | não | Filtra pelo aluno tutorado que escreveu (inteiro positivo) |
| id_sala | number | não | **Só para o professor.** Filtra por sala (inteiro positivo). Para o tutor, é validado mas ignorado |
| id_tutor_sala | number | não | **Só para o professor.** Filtra por vínculo de tutor (inteiro positivo). Para o tutor, é validado mas ignorado |

- **Corpo da requisição:** Não possui
- **Respostas:**
  - **Sucesso (200):**

```json
{
  "resumo": {
    "total_feedbacks": 1,
    "media_notas": 9
  },
  "feedbacks": [
    {
      "id_feedback": 6,
      "id_tutoria": 9,
      "etapa": 2,
      "nota": 9,
      "comentario": "Explica com paciência e tira as dúvidas rápido.",
      "rubrica_file": "https://res.cloudinary.com/exemplo/raw/upload/v1/rubrica.pdf",
      "data": "2026-11-20T18:00:00.000Z",
      "aluno": {
        "id_aluno": 15,
        "nome": "Ana Ribeiro"
      },
      "tutor": {
        "id_tutor_sala": 4,
        "nome": "Lucas Pereira"
      },
      "sala": {
        "id_sala": 5,
        "nome": "2º A",
        "serie": 2,
        "ano_letivo": 2026
      }
    }
  ]
}
```

  - **Erros** (na ordem em que são conferidos):

| Código | Mensagem retornada | Quando ocorre |
|---|---|---|
| 401 | (ver tabela comum da seção 4.2) | Token ausente, mal formatado ou inválido |
| 400 | A etapa deve ser 1, 2 ou 3 | `?etapa=` com outro valor (inclusive vazio ou repetido) |
| 400 | O ano deve ser um número inteiro | `?ano=` que não é inteiro positivo |
| 400 | O id do aluno deve ser um número inteiro | `?id_aluno=` que não é inteiro positivo |
| 400 | O id da sala deve ser um número inteiro | `?id_sala=` que não é inteiro positivo |
| 400 | O id do tutor da sala deve ser um número inteiro | `?id_tutor_sala=` que não é inteiro positivo |
| 403 | Você não tem permissão para listar feedbacks | O usuário não é professor nem aluno com vínculo de tutor ativo |
| 500 | Erro interno do servidor | Erro inesperado |

> ⚠️ Divergência: no antigo arquivo de controle, esta rota estava prevista como `GET /tutores/me/feedbacks`, só para o tutor. No código, a URL é **`GET /feedbacks`** e a rota atende tutor e professor. O usuário sem permissão recebe **403**, código fora da lista padrão.

---

## 5. Pendências encontradas

Pontos ambíguos, incompletos ou inconsistentes encontrados ao comparar o código com este documento. Nenhum deles foi alterado no código: a lista serve para o grupo decidir o que fazer.

### 5.1 Códigos HTTP fora da lista padrão
1. **403, 409 e 410 em uso.** A lista padrão é 200, 201, 400, 401, 404 e 500, mas o código também devolve:
   - **403:** em quase todas as rotas autenticadas (perfil e permissão), e no login com e-mail não confirmado (P18 e A12);
   - **409:** em conflitos (P17, A11, P22, P25, A13, P27, P28, P30, P5, P6, P7, P8, P3, O1, A10, A14, T3, A8 e T4);
   - **410:** na O3, para link expirado.

   Os três estão declarados no comentário de `backend/src/errors/AppError.ts`. Falta decidir se entram oficialmente no padrão do projeto.
2. **"Não encontrado" ou "não pertence" devolvido como 400**, em vez de 404:
   - "Você não está matriculado nesta sala" (A13);
   - "O aluno não está matriculado nesta sala" (P27 e P30);
   - "Este pedido foi feito para outra sala" (P27);
   - "O conteúdo não pertence à sala desta tutoria" (T9);
   - "O aluno informado não é destinatário desta atividade" (T3).
3. **Tutoria inexistente devolvida como 403 na T9.** A mensagem "Você não é tutor desta tutoria ou ela não está ativa" cobre também a tutoria que não existe. O comentário do código indica que é intencional, para não revelar se a tutoria existe.
4. **Status diferente para "tutoria finalizada":**
   - **400** na T3;
   - **403** na A8 e na A14;
   - **409** na P5, na O1 e na A10.

### 5.2 Tratamento de erros e validação
5. **A7 usa `Error` comum.** O `ConteudosDominadosService` lança `throw new Error("faixas de desempenho não cadastradas")` quando a tabela `faixa_desempenho` está vazia ou uma média não cabe em nenhuma faixa. O cliente recebe 500 "Erro interno do servidor". É o único service que não usa `AppError`, e o comentário do código diz que foi intencional (falha de configuração).
6. **`isAuthenticated` e `isProfessor` respondem direto** com `res.status(...).json(...)`, sem lançar `AppError` como os demais middlewares. O formato do corpo é o mesmo.
7. **A14 sem validação de arquivo.** A rota de resposta não confere formato nem tamanho. Vale só o limite global de 50 MB do `express-fileupload`, enquanto a T5 e a A10 aceitam apenas .pdf, .doc, .docx, .xls, .xlsx e .csv de até 10 MB. **Não verificado:** o comportamento com arquivo acima de 50 MB. O `express-fileupload` está configurado sem `abortOnLimit`.
8. **P19 sem limite para `ano_letivo`.** A coluna é `SMALLINT`, mas o service só confere se o valor é inteiro. **Não verificado:** um valor fora da faixa do `SMALLINT` (ex.: 99999) provavelmente chega ao banco e vira 500.
9. **Médias sem arredondamento na P10 e na T7.** As duas usam a média do banco (`_avg`) e não arredondam. P13, T6, A6 e A7 arredondam para 2 casas com o helper `calcularMedia`. A mesma média pode aparecer diferente em rotas diferentes.
10. **Contestação duplicada (A8).** Não existe UNIQUE em `Contestacao_nota.id_nota`. O comentário do código admite que duas requisições simultâneas podem criar duas contestações para a mesma nota.

### 5.3 Regras de negócio inconsistentes ou incompletas
11. **Duas tutorias ativas do aluno na mesma sala.** A P7 não deixa reabrir uma tutoria se o aluno já tem outra tutoria ativa na mesma sala. A P30 só bloqueia tutoria ativa entre **o mesmo tutor e o mesmo aluno**, então permite criar uma segunda tutoria ativa para o aluno com outro tutor da mesma sala.
12. **Tutor em uma única sala.** `Tutor.id_aluno` é único, e a A13 recusa com "Você já é tutor". Nenhuma rota cria um segundo `Tutor_sala` para um aluno que já é tutor, e um tutor revogado também não consegue pedir de novo, embora a tabela `Tutor_sala` permita vários vínculos.
13. **Tutor só com vínculos revogados não vê o próprio histórico.** A T6 (pelo `isTutor`) e a T7 (pela conferência no service) exigem pelo menos um vínculo ativo, embora os services incluam os vínculos revogados no resultado.
14. **P27 com `id_sala` redundante.** O corpo exige `id_sala`, mas o valor precisa ser igual ao `id_sala` do próprio pedido.
15. **A5: qualquer professor vê os materiais de qualquer sala.** Nas demais rotas de professor, só o dono da sala tem acesso (RN07). O comentário do código indica que foi uma decisão.
16. **T4 sobrescreve a nota.** Quando a contestação é aceita, o valor anterior da nota não fica guardado.
17. **P20 sem filtros por série e ano letivo.** Os filtros `?ano_letivo=` e `?serie=`, citados para a navegação do RF4/RF5, não existem.
18. **Notificações não implementadas,** por falta de tabela de notificação, segundo os comentários dos services:
    - aviso ao tutor ou professor quando o aluno contesta uma nota (A8, UC06 passo 02);
    - aviso ao aluno quando a contestação é resolvida (T4, UC06 passo 03);
    - aviso aos tutorados quando o tutor anexa material (T5, UC17 passo 08);
    - aviso aos alunos da sala quando o professor publica um aviso (P3).
19. **P7 usa o ano do relógio do servidor.** A reabertura compara o `ano_letivo` da sala com `new Date().getFullYear()`.

### 5.4 Documentação desatualizada ou não confirmada
20. **T7 com outra URL.** O antigo arquivo de controle previa `GET /tutores/me/feedbacks`, só para o tutor. O código implementou `GET /feedbacks`, para tutor e professor.
21. **`CLAUDE.md` desatualizado.** O histórico de schema ainda lista como pendência "`CreateAtividadeService` (rota `POST /atividades`) ainda não envia `tipo` como enum nem `etapa`". O service atual (T9) já valida e grava os dois, e o `prisma/seed.ts`, citado na mesma pendência, também já envia `tipo` e `etapa` nas atividades. A pendência do `CLAUDE.md` pode ser revista pelo grupo.
22. **RF11 não confirmado.** A P11 foi implementada supondo que "o professor visualiza as atividades da sala". O texto final do RF11 ainda não foi confirmado.
23. **Dicionário de dados desatualizado:**
    - a contestação usa os status `pendente/aceita/recusada` no código, e o dicionário ainda usa `pendente/resolvida`;
    - o código tem `Sala.serie` (1 a 3) e `Sala.ano_letivo` (ano), e o dicionário ainda tem `Sala.ano_letivo` com CHECK de 1 a 3.
24. **RF18 desatualizado.** O RF18 diz que o histórico passa ao novo tutor. No código, a revogação (P8) não transfere nada: ela preenche `data_revogacao` e finaliza as tutorias ativas na mesma transação, e as novas tutorias são criadas com a P30.
25. **Fluxo de troca de tutor.** O código segue o fluxo revogar (P8, que já finaliza as tutorias) → criar novas tutorias (P30). A P8 não recebe o novo tutor. Falta o grupo confirmar se esse é o fluxo desejado.
