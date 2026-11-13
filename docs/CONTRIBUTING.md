<h1 align="center">
  <img src="banner_contributing.svg" alt="Guia de contribuição do Protutal" width="100%">
</h1>

Este documento descreve o workflow de branches, as regras de pull request, o padrão de commits e as convenções de código adotados pelo grupo no repositório do Protutal.

## Workflow de branches

O grupo adota um fluxo baseado no Git Flow. Na fase final do projeto (preparação para o code freeze) existe uma branch intermediária, a `feature-pre-codeFreeze`, que concentra tudo o que ainda vai entrar antes do congelamento:

| Branch | Função | Criada a partir de | Recebe merge de |
| --- | --- | --- | --- |
| `main` | Versão estável do projeto, usada nas entregas | — | `develop` |
| `develop` | Integração das funcionalidades e correções em desenvolvimento | `main` | `feature-pre-codeFreeze` |
| `feature-pre-codeFreeze` | Integração de tudo o que entra na fase final, antes do code freeze | `develop` | `feature-*` e `fix-*` |
| `feature-<nome>` | Desenvolvimento de uma funcionalidade ou tarefa | `feature-pre-codeFreeze` | — |
| `fix-<nome>` | Correção de um bug ou problema já existente | `feature-pre-codeFreeze` | — |

O caminho de qualquer alteração é sempre o mesmo:

```
feature-<nome>  ─┐
                 ├→  feature-pre-codeFreeze  →  develop  →  main
fix-<nome>      ─┘
```

### Nomenclatura das branches

- `feature-` para funcionalidades novas e `fix-` para correções, seguidos de um nome curto que descreva a tarefa.
- Letras minúsculas, sem acentos, com as palavras separadas por hífen.
- Exemplos de funcionalidade: `feature-cadastro-professor`, `feature-cadastro-aluno`, `feature-login`.
- Exemplos de correção: `fix-mobile-toast`, `fix-mobile-teclado`.

### Passo a passo

1. Atualizar a `feature-pre-codeFreeze` local:

   ```bash
   git checkout feature-pre-codeFreeze
   git pull origin feature-pre-codeFreeze
   ```

2. Criar a branch a partir da `feature-pre-codeFreeze` (`feature-` para funcionalidade, `fix-` para correção):

   ```bash
   git checkout -b feature-nome-da-tarefa
   # ou
   git checkout -b fix-nome-da-correcao
   ```

3. Desenvolver e registrar os commits na branch, seguindo o [padrão de commits](#padrão-de-commits).

4. Enviar a branch para o GitHub:

   ```bash
   git push -u origin feature-nome-da-tarefa
   ```

5. Abrir um pull request da branch para a `feature-pre-codeFreeze`.

6. Depois do merge, excluir a branch.

7. Quando a `feature-pre-codeFreeze` estiver estável, abrir um pull request dela para a `develop`.

8. Quando a `develop` estiver estável, abrir um pull request da `develop` para a `main`.

## Regras de pull request

### Proteção da `main`

A branch `main` é protegida por um ruleset configurado no GitHub. Essas regras são aplicadas pelo próprio repositório:

- Não é permitido enviar commits diretamente para a `main`.
- Não é permitido excluir a `main`.
- Toda alteração na `main` entra obrigatoriamente por pull request.

### Regras do grupo

1. Toda funcionalidade ou correção entra na `feature-pre-codeFreeze` por pull request, e não por merge local.
2. Pull requests de `feature-*` e `fix-*` apontam para a `feature-pre-codeFreeze`. Apenas a `feature-pre-codeFreeze` abre pull request para a `develop`, e apenas a `develop` abre pull request para a `main`.
3. Cada pull request trata de uma única funcionalidade, correção ou tarefa.
4. Antes de abrir o pull request, a branch deve ser atualizada com a `feature-pre-codeFreeze` e os conflitos devem ser resolvidos pelo autor.
5. O código deve estar executando sem erros antes da abertura do pull request.
6. O pull request precisa da revisão e aprovação de pelo menos um outro integrante do grupo. O autor não aprova o próprio pull request.
7. O título deve descrever a alteração de forma objetiva, e a descrição deve informar:
   - o que foi feito;
   - por que foi feito;
   - como testar.

## Code freeze

O code freeze é o congelamento do código para a entrega final. A partir dele o projeto só recebe correções, e nenhuma funcionalidade nova é aceita.

| Item | Regra |
| --- | --- |
| Data do congelamento | 12/11/2026 |
| O que entra depois da data | Somente correções de bugs, em branches `fix-*` |
| O que não entra depois da data | Funcionalidades novas (`feature-*`), mudanças de escopo e refatorações que não corrigem um bug |
| Versão final | O commit da `main` que representa a entrega recebe a tag `v1.0.0` |

Como marcar a versão final, depois do merge da `develop` na `main`:

```bash
git checkout main
git pull origin main
git tag -a v1.0.0 -m "Versão final do Protutal"
git push origin v1.0.0
```

## Padrão de commits

As mensagens de commit seguem o formato do [gitmoji](https://gitmoji.dev/):

```
:emoji: tipo: Descrição
```

- `:emoji:` é o código do emoji, escrito entre dois-pontos (ex.: `:sparkles:`), e não o símbolo em si.
- `tipo` identifica o tipo da alteração, em minúsculas.
- `Descrição` é curta, em português e começa com letra maiúscula.

| Emoji | Tipo | Quando usar | Exemplo |
| --- | --- | --- | --- |
| `:sparkles:` | `feat` | Funcionalidade nova | `:sparkles: feat: Contadores de notificação no site` |
| `:bug:` | `fix` | Correção de bug | `:bug: fix: Toast do site no topo e por cima de modais` |
| `:books:` | `docs` | Documentação (README, guias, comentários) | `:books: docs: Atualiza README e CONTRIBUTING para o code freeze` |
| `:recycle:` | `refactor` | Reorganização de código sem mudar o comportamento | `:recycle: refactor: Centraliza validações repetidas dos services em helpers` |
| `:broom:` | `cleanup` | Limpeza de código (imports, variáveis e comentários sem uso) | `:broom: cleanup: Remove imports sem uso dos controllers` |
| `:wastebasket:` | `remove` | Remoção de arquivo, pasta ou funcionalidade | `:wastebasket: remove: Remove projeto de exemplo da pasta mobile` |

## Convenções de código

As regras abaixo descrevem o que o código já segue. Antes de criar algo novo, procure um arquivo parecido e siga o mesmo padrão.

### Geral

| Convenção | Regra |
| --- | --- |
| Linguagem | TypeScript nas três pastas: `backend/`, `design/` e `mobile/`. |
| Nomes de branch | Letras minúsculas, sem acentos, palavras separadas por hífen (`feature-cadastro-aluno`, `fix-mobile-toast`). |
| Banco de dados | Nomes de tabelas e colunas seguem o MER e o dicionário de dados do projeto, em português (ex.: `id_sala`, `data_definicao`). Não renomear nem traduzir. |
| Idioma | Mensagens de erro, comentários e documentação em português. |

### Back-end (MVC)

O back-end segue a arquitetura MVC. Cada pasta de `backend/src/` tem uma responsabilidade:

| Pasta ou arquivo | Responsabilidade |
| --- | --- |
| `routes.ts` | Registro de todas as rotas da API, com os middlewares de cada uma. |
| `controllers/` | Recebem a requisição, extraem os dados e chamam o service. Não contêm regra de negócio. |
| `services/` | Regras de negócio e acesso ao banco pelo Prisma. |
| `middlewares/` | Autenticação e autorização (`isAuthenticated`, `isProfessor`, `isAluno`, `isTutor`, ...). |
| `helpers/` | Funções reutilizadas por vários services (validações, cálculos, envio de e-mail). |
| `errors/` | A classe `AppError`. |

Convenções do back-end:

- **Nomes de services e controllers:** `<Ação><Entidade>Service` e `<Ação><Entidade>Controller`, uma classe por arquivo, com o arquivo tendo o mesmo nome da classe. Exemplos: `CreateAlunoService`, `ListSalasAlunoService`, `DetailAtividadeService`, `UpdateMetaTutoriaService`, `FinalizarTutoriaService`.
- **Organização por perfil:** services e controllers ficam nas subpastas `aluno/` e `professor/`. Os que atendem aos dois perfis (ex.: `ConfirmarEmailService`) ficam na raiz da pasta.
- **Erros:** toda falha esperada é lançada com `throw new AppError(mensagem, status)`. O handler global em `server.ts` converte o `AppError` em uma resposta `{ error: mensagem }` com o status informado. Qualquer outro erro vira 500.

  | Status | Quando usar |
  | --- | --- |
  | 400 | Dados de entrada inválidos (padrão quando o status não é informado) |
  | 401 | Não autenticado (token ausente ou inválido, login incorreto) |
  | 403 | Autenticado, mas sem permissão |
  | 404 | Recurso não encontrado |
  | 409 | Conflito com dado existente ou regra de negócio |
  | 410 | Recurso expirado (ex.: link de confirmação vencido) |

- **Validações repetidas** (id, nota, etapa, arquivo, cadastro) ficam em `helpers/`, e não dentro de cada service.
- **Segurança:** senhas sempre com hash. Nenhuma resposta da API devolve a senha nem o hash.
- **Testes:** ficam em `src/__tests__/`, seguindo a mesma estrutura de pastas do código. O Prisma é mockado em `setup.ts`, então os testes nunca acessam o banco.

## Registro de defeitos

Todo bug encontrado em teste ou em uso do sistema é registrado na tabela abaixo antes de ser corrigido. Cada bug:

1. recebe um ID sequencial (`BUG01`, `BUG02`, ...);
2. é corrigido em uma branch `fix-<nome>`, criada a partir da `feature-pre-codeFreeze`;
3. é ligado ao commit ou ao pull request da correção. O ID deve aparecer na descrição do pull request (ex.: "Corrige o BUG01").

| ID | Descrição | Onde foi encontrado | Branch da correção | Commit ou PR | Status |
| --- | --- | --- | --- | --- | --- |
| BUG01 | | | | | |

Os status possíveis são: `aberto`, `em correção` e `corrigido`.
