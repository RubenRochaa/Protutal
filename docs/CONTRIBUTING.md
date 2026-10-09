# Como contribuir com o Protutal

Este documento descreve o workflow de branches e as regras de pull request adotados pelo grupo no repositório do Protutal.

## Workflow de branches

O grupo adota um fluxo baseado no Git Flow, com três tipos de branch:

| Branch | Função | Criada a partir de | Recebe merge de |
| --- | --- | --- | --- |
| `main` | Versão estável do projeto, usada nas entregas | — | `develop` |
| `develop` | Integração das funcionalidades em desenvolvimento | `main` | `feature-*` |
| `feature-<nome>` | Desenvolvimento de uma funcionalidade ou tarefa | `develop` | — |

O caminho de qualquer alteração é sempre o mesmo:

```
feature-<nome>  →  develop  →  main
```

### Nomenclatura das branches de funcionalidade

- Prefixo `feature-` seguido de um nome curto que descreva a tarefa.
- Letras minúsculas, sem acentos, com as palavras separadas por hífen.
- Exemplos: `feature-cadastro-professor`, `feature-cadastro-aluno`, `feature-login`.

### Passo a passo

1. Atualizar a `develop` local:

   ```bash
   git checkout develop
   git pull origin develop
   ```

2. Criar a branch da funcionalidade a partir da `develop`:

   ```bash
   git checkout -b feature-nome-da-tarefa
   ```

3. Desenvolver e registrar os commits na branch da funcionalidade.

4. Enviar a branch para o GitHub:

   ```bash
   git push -u origin feature-nome-da-tarefa
   ```

5. Abrir um pull request da branch da funcionalidade para a `develop`.

6. Depois do merge, excluir a branch da funcionalidade.

7. Quando a `develop` estiver estável, abrir um pull request da `develop` para a `main`.

## Regras de pull request

### Proteção da `main`

A branch `main` é protegida por um ruleset configurado no GitHub. Essas regras são aplicadas pelo próprio repositório:

- Não é permitido enviar commits diretamente para a `main`.
- Não é permitido excluir a `main`.
- Toda alteração na `main` entra obrigatoriamente por pull request.

### Regras do grupo

1. Toda funcionalidade entra na `develop` por pull request, e não por merge local.
2. Pull requests de funcionalidade apontam para a `develop`. Apenas a `develop` abre pull request para a `main`.
3. Cada pull request trata de uma única funcionalidade ou tarefa.
4. Antes de abrir o pull request, a branch deve ser atualizada com a `develop` e os conflitos devem ser resolvidos pelo autor.
5. O código deve estar executando sem erros antes da abertura do pull request.
6. O pull request precisa da revisão e aprovação de pelo menos um outro integrante do grupo. O autor não aprova o próprio pull request.
7. O título deve descrever a alteração de forma objetiva, e a descrição deve informar:
   - o que foi feito;
   - por que foi feito;
   - como testar.
