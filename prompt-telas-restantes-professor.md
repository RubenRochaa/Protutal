# Tarefa: implementar todas as telas restantes do professor (Pessoa A, Lotes A1 a A6)

Você vai implementar as telas da área do professor do Protutal que ainda faltam. São muitas telas, então o trabalho será feito **lote por lote**, com parada para conferência ao fim de cada um. Leia este prompt inteiro antes de começar.

---

## 0. Leitura obrigatória antes de qualquer código

1. Leia por completo `design/CLAUDE_DESIGN.md`. Ele tem as regras técnicas do front e deve ser seguido.
2. Leia `docs/rotas_do_sistema.md`. Os números de rota usados aqui (P1, P20, T4 etc.) são os desse arquivo. Para cada rota citada neste prompt, anote: método, caminho, parâmetros (de caminho e de query), corpo, se exige token, campos devolvidos e todas as respostas de erro. Se o `CLAUDE_DESIGN.md` disser que uma rota não existe, mas ela aparecer no `rotas_do_sistema.md`, vale o `rotas_do_sistema.md`. Registre a divergência no relatório.
3. Leia o back-end **só para consulta** (nunca altere nada em `/backend`): controllers, services e validações das rotas usadas. As regras de negócio que o back-end já valida devem ter mensagem de erro clara no front. As regras que dá para checar antes de enviar também devem ser validadas no front.
4. Leia o que já existe no front:
   - `src/app/professor/` (telas prontas: **Minhas turmas** e **Detalhe da sala**, com o `layout.tsx` da sala e o array de configuração das abas);
   - `src/components`, `src/lib`, `src/services/api.ts`;
   - as telas de login e cadastro, para manter o mesmo padrão.
   Se o Detalhe da sala (layout com abas) ainda não existir, **pare e me avise**, porque todas as telas abaixo dependem dele.
5. Abra as imagens do Figma que estão em `design/figma/` (lista e mapa na seção 3).

---

## 1. Forma de trabalho

- Trabalhe **um lote por vez**, na ordem: A1 (resto) → A2 → A3 → A4 → A5 → A6. A ordem é de dependência: por exemplo, não dá para testar notas sem atividades e tutorias.
- Antes de começar, faça a **Etapa de componentes compartilhados** (seção 5). Ela vai numa branch separada e entra na `develop` antes dos lotes.
- Para cada lote:
  1. Mostre o plano do lote: arquivos que vai criar ou alterar, componentes, rotas chamadas e onde cada uma é chamada, e qual imagem do Figma cada tela segue. **Espere minha confirmação.**
  2. Eu crio a branch do lote a partir da `develop` atualizada (`feature-professor-lote-a2`, por exemplo). Confira com `git branch --show-current` se está na branch certa antes de escrever código. Não faça commit na `develop` nem na `main`.
  3. Implemente.
  4. Rode `npm run build` e `npm run lint` dentro de `design` e corrija os erros.
  5. Entregue o relatório do lote (seção 7) e **pare**. Só siga para o próximo lote quando eu mandar.
- Na Etapa 0 (antes do Lote A1), responda às **decisões da seção 4** junto com o plano. Não implemente nada que dependa delas antes da minha resposta.

---

## 2. Regras que não podem ser quebradas

- O token fica no cookie `session` com `httpOnly`. **Toda chamada que exige login roda no servidor**: componente de servidor para buscar dados e Server Action (`"use server"`) para enviar formulários e ações (aceitar, recusar, revogar, finalizar etc.). Não chame a API em componente `"use client"` e não use `getCookieClient()`.
- **Download de arquivo** (exportar notas, anexos de atividade e de resposta): como o navegador não lê o token, crie um Route Handler do Next (`src/app/api/.../route.ts`) que lê o cookie no servidor, chama a API e devolve o arquivo com o `Content-Type` e o `Content-Disposition` corretos. O botão de download só aponta para esse handler.
- Depois de uma ação que muda dados, atualize a tela com `revalidatePath` (ou `router.refresh()`), sem recarregar a página inteira.
- Erros: use `getErrorMessage` e mostre a mensagem em toast (`sonner`). Nada de erro só no console.
- Ações destrutivas ou difíceis de desfazer (recusar pedido, revogar tutor, finalizar tutoria, aceitar ou recusar contestação) pedem **confirmação em modal** antes de chamar a API.
- Não copie da pasta `design/exemplos` (pizzaria): textos, imagens, rotas, chamadas no cliente, validação via `/me`, o logout com `path: "/ "`.
- Não altere nada em `/backend` nem em `design/exemplos`.
- Não adicione dependência nova ao `package.json` sem me perguntar.
- Cada componente é uma pasta com `index.tsx` e `styles.module.scss`. Componente usado só por uma tela fica em `components/` dentro da pasta dessa tela. Se for usado por mais de uma, vai para `src/components`.
- Nomes de pastas e rotas sem acento, sem espaço e sem maiúscula. Use o mesmo padrão de nome que já existe ("sala" ou "turma"; não misture os dois).
- Só usuário com perfil de professor pode abrir estas telas. Uma sala de outro professor deve mostrar a mensagem de erro da API, nunca os dados.
- **Não invente dados.** Se o Figma mostrar algo que nenhuma rota fornece, deixe de fora (ou desabilitado com o texto "Em breve") e registre no relatório. Nada de dado falso fixo no código.

---

## 3. Design e mapa do Figma

### 3.1 Regras de design
- Telas **com Figma**: o layout, a hierarquia, os textos e a posição dos elementos seguem a imagem.
- O protótipo é de baixa fidelidade. Cores, fontes, sombras e espaçamentos saem do `globals.scss` e dos componentes do projeto, não da imagem. O padrão visual geral do Figma deve ser mantido: faixa vermelha com o título da página, cartões cinza-claros com itens brancos arredondados, títulos de seção sublinhados em vermelho e modais brancos sobre fundo escurecido.
- Telas **sem Figma**: siga a tela-modelo indicada em cada item (seção 6) e reaproveite os componentes. Liste no relatório tudo o que não veio do Figma.
- **Barra de navegação:** no Figma, quase todas as telas usam a barra do aluno ("Minhas atividades", "Minhas nota"). Isso é inconsistência do protótipo. **Em todas as telas do professor, use a barra da p13/p16: Início, Turmas, Tutoria, Desempenho, Sair.** Se o layout do professor já tiver outra barra, ajuste para essa e me avise.
- Nos exemplos do Figma aparecem nomes de pessoas e números (Guilherme, 8,2, "3°B" etc.). São só exemplos: tudo vem da API.

### 3.2 Imagens disponíveis em `design/figma/`

| Arquivo | O que mostra | Usar em |
|---|---|---|
| `p13-inicio-professor.png` | Início do professor: "Bem-vindo ao Protutal!" e cartões Ver Tutorias, Notificações e Exportar notas | Início (ver decisão D1) |
| `p06-tutoria-sala-alunos-tutores.png` | "Tutoria 3°B": lista de alunos (com "tornar tutor?"), lista de tutores (com "Remover?") e botões "Ver atividades" e "Adicionar alunos" | Alunos da sala (A1) e Tutores da sala (A3) |
| `p07-permissoes-tutor-modal.png` | Modal "Permissões como tutor": alunos com "Vincular" e permissões (Criar atividades, Vincular materiais, Modelo de correção) | Criar tutoria (A4) e Permissão de criar atividades (A3); ver decisão D4 |
| `p08-notificacoes-lista.png` | "Notificações": lista de cartões (pedidos para ser tutor, notas lançadas) e "Mandar notificação" | Pedidos de tutoria (A3); ver decisão D2 |
| `p05-notificacoes-pedido-modal.png` | Modal "Pedido para se tornar tutor de: (nome)" com Aceitar e Recusar | Aceitar ou recusar pedido (A3) |
| `p02-notificacoes-enviar-modal.png` | Modal "Enviar notificação": recado, para quem, ano e turma, Enviar e Cancelar | Avisos da sala (A2); ver decisão D3 |
| `p03-atividades-sala-e-aviso.png` | "Atividades 3°B": lista de atividades ao lado do cartão "Enviar aviso para a sala" | Atividades da sala (A5) e formulário de aviso (A2) |
| `p04-atividade-detalhe.png` | Detalhe da atividade: alunos que enviaram, tutor que enviou, criação e prazo, anexo | Respostas de uma atividade (A5) |
| `p01-atividade-envio-do-aluno-modal.png` | Modal "Envio do aluno": aluno, arquivo enviado (download) e nota | Ver resposta de um aluno (A5) |
| `p15-anos-de-tutoria.png` | "Anos de Tutoria": cartões 3°, 2°, 1° e "Histórico dos anos anteriores" | Navegação do menu "Tutoria" (A4) |
| `p21-anos-passados-vazio.png` | "Anos Passados" com a lista vazia: "Ainda não foi finalizado nenhum projeto de tutoria" | Histórico (A4) e modelo de **estado vazio** em todas as telas |
| `p16-exportar-notas.png` | "Exportar notas": selects de ano, turma e trimestre e botão Exportar | Exportar notas (A5) |
| `p20-desempenho-tutores.png` | "Desempenhos dos tutores": lista de tutores com nota e gráfico de linha | Desempenho dos tutores (A6) |
| `p14-desempenhos-tutorados-tutores.png` | "Desempenhos": duas colunas, Tutorados e Tutores, com nota | Menu "Desempenho" (A6); ver decisão D5 |
| `p09-desempenho-alunos.png` | "Desempenhos dos alunos": lista de alunos com nota e gráfico | Notas da sala (A5); ver decisão D5 |

**Telas sem Figma:** Conteúdos da sala, Avaliar tutor, Tutorias da sala (lista com filtro), Editar meta, Finalizar e Reabrir tutoria, Notas da sala (tabela), Contestações e Feedbacks dos alunos aos tutores.

---

## 4. Decisões para responder no plano da Etapa 0

Para cada decisão, diga o que encontrou nas rotas e no código e qual opção recomenda. **Espere minha resposta.**

- **D1. Página inicial.** O guia diz que `/professor` é "Minhas turmas" (já pronta). O Figma tem uma tela de Início separada (p13). Opções: (a) criar o Início da p13 em `/professor` e mover "Minhas turmas" para `/professor/turmas`, atualizando os links e o redirecionamento do login; (b) manter "Minhas turmas" como inicial e não fazer a p13. Recomendação do grupo: (a), porque a banca compara com o Figma. Diga o que muda no código em cada opção.
- **D2. Notificações.** A p08 mistura pedidos de tutoria com avisos de "nota vinculada". Confira se a P26 lista os pedidos de **uma sala** ou de **todas as salas do professor**, e se existe alguma rota de notificações. Proponha: aba "Pedidos" dentro da sala com o visual da p08 e, se a rota permitir, uma página "Notificações" geral (cartão da p13) que junta os pedidos pendentes (P26) e as contestações pendentes (P16) das salas do professor. Itens do tipo "nota vinculada" ficam de fora se não houver rota.
- **D3. Enviar notificação (p02).** A P3 publica um aviso numa sala. Confira se ela aceita destinatário ("aluno, tutor ou todos"). Se não aceitar, o modal fica só com o recado e a sala, e os outros campos saem. No menu geral, ano e turma viram um único select de sala (a partir da P20).
- **D4. Permissões do tutor (p07).** A P29 vale para **todos os tutores da sala** e só cobre "Criar atividades". Confira se existe algo para "Vincular materiais" e "Modelo de correção". Proponha como mostrar isso: interruptor único no topo da sala para P29, e as outras permissões fora (ou desabilitadas) se não houver rota. Na p06, "tornar tutor?" só pode existir se houver rota para o professor tornar um aluno tutor diretamente; se só existir o aceite de pedido (P27), retire essa coluna.
- **D5. Desempenho dos alunos.** A p09 e a coluna "Tutorados" da p14 mostram notas de alunos, mas a única rota de desempenho do professor é a P13 (tutores). Confira se a P14 (notas da sala) serve para montar essa visão. Se não servir, essas partes ficam de fora e eu registro a lacuna.
- **D6. Gráfico de linha (p09 e p20).** Não há biblioteca de gráficos no projeto. Recomendação: um componente simples em SVG feito no próprio projeto, sem dependência nova. Se achar que precisa de uma biblioteca, diga qual e por quê.
- **D7. Menu "Tutoria" (p15).** A p15 agrupa as turmas por série (3°, 2°, 1°) e tem "Histórico dos anos anteriores" (p21). Confira se a P20 devolve série e ano letivo e se a P4 filtra por ativa ou finalizada e por ano. Proponha o caminho: Tutoria → série → turma → aba Tutorias da sala.

---

## 5. Etapa de componentes compartilhados (branch separada, antes dos lotes)

Procure primeiro em `src/components` e reaproveite o que existir. Crie ou ajuste só o que faltar, de forma genérica:

- **Modal** (título, conteúdo, ações, fecha com Esc e no fundo, foco preso dentro, `aria-modal`) e **ConfirmDialog** baseado nele.
- **EmptyState** (texto e ação opcional), seguindo a p21.
- **ErrorState** com o botão "Tentar novamente" (para API desligada).
- **Card de lista** (item branco arredondado dentro do cartão cinza, como na p06 e na p08).
- **PageHeader** (faixa vermelha com o título).
- **Filtro** (select ou abas de filtro) para listas.
- **Gráfico de linha** em SVG, se a decisão D6 for aprovada.
- Barra de navegação do professor conforme a seção 3.1.

Mostre o plano desta etapa junto com as decisões da seção 4.

---

## 6. Telas por lote

Para todas as telas, são obrigatórios estes estados: carregando; lista vazia com mensagem que explica o que fazer; API desligada com "Tentar novamente"; validação antes de enviar; erro da API em toast; botão desabilitado enquanto envia; responsivo em 375 px, 768 px e 1280 px.

Todas as telas da sala são **abas** dentro do layout da sala já existente. Ao terminar cada uma, marque a aba como disponível no array de configuração.

### Lote A1 (resto): Alunos e matrícula
- **Alunos da sala e matrícula.** Rotas: P23 (listar alunos da sala), P21 e P22 (confira no arquivo de rotas qual é a busca e qual é a matrícula). Figma: p06 (coluna "Alunos" e botão "Adicionar alunos").
  - Lista dos alunos matriculados, com foto se a API devolver (senão, avatar com as iniciais).
  - "Adicionar alunos" abre um modal com busca por nome (`?busca=`), com espera de uns 300 ms entre digitações e busca mínima de 2 letras. O resultado mostra os alunos encontrados e o botão de matricular. Aluno já matriculado aparece como "Já matriculado" e desabilitado.
  - "Ver atividades" da p06 leva à aba Atividades (Lote A5). Até lá, fica desabilitado.

### Lote A2: Conteúdos e avisos
- **Conteúdos da sala.** Rotas: P25 (cadastrar) e P2 (listar). Sem Figma: siga o padrão "Lista com filtro" de "Minhas turmas", com o formulário no padrão de "Nova turma". Os conteúdos de Geografia cadastrados aqui são usados depois pelo tutor ao criar atividades. Mostre isso num texto curto de ajuda na tela.
- **Avisos da sala.** Rotas: P3 (publicar) e A4 (listar). Figma: p03 (cartão "Enviar aviso para a sala") e p02 (modal), conforme a decisão D3. Lista dos avisos publicados (mais recente primeiro, com data) e formulário com o recado obrigatório e o limite de caracteres do back-end. Os alunos matriculados leem esses avisos em outra tela, que é da Pessoa B.

### Lote A3: Pedidos de tutoria e tutores
- **Pedidos de tutoria.** Rotas: P26 (listar), P27 (aceitar), P28 (recusar). Figma: p08 (lista) e p05 (modal com Aceitar e Recusar), conforme a decisão D2. Recusar pede confirmação. Depois da ação, o pedido sai da lista de pendentes.
- **Tutores da sala.** Rota: P24 (lista com `id_tutor_sala`). Figma: p06 (coluna "Tutores").
- **Revogar tutor.** Rota: P8. Figma: p06 ("Remover?"). Use um botão de remover por tutor no lugar do checkbox do Figma, porque checkbox sugere seleção e não ação. O modal de confirmação avisa: "O histórico deste tutor não passa para um novo tutor."
- **Permissão de criar atividades.** Rota: P29. Fica no **topo da tela da sala** (espaço já reservado no cabeçalho) e vale para todos os tutores da sala. Use um interruptor com texto explicando isso. Figma: p07, conforme a decisão D4.
- **Avaliar tutor.** Rotas: P9 e P10 (confira qual cria e qual lista ou edita). Sem Figma: botão "Avaliar" em cada tutor da lista, que abre um modal no padrão "Formulário". Use os campos e as escalas que o back-end exigir. Mostre a avaliação já feita, se houver.

### Lote A4: Tutorias
- **Tutorias da sala.** Rota: P4. Sem Figma: siga o padrão "Lista com filtro", com o filtro ativa ou finalizada. Cada item mostra tutor, tutorado, meta e situação.
- **Criar tutoria.** Rota: P30. Figma: p07 (adaptar: escolher o aluno e o tutor e escrever a meta). Exige um tutor da sala, um aluno e a meta de aprendizagem. Valide os três antes de enviar. O select de tutor usa a P24 e o de aluno usa a P23.
- **Editar meta, finalizar e reabrir.** Rotas: P5, P6, P7 (confira qual é qual). Sem Figma: ações no item da tutoria, com modal.
  - Finalizar só funciona sem pendências. Mostre a mensagem do back-end quando houver pendência e confirme antes de finalizar.
  - Reabrir só funciona no mesmo ano letivo. Se dá para saber isso pelos dados, esconda ou desabilite o botão com o motivo; se não dá, mostre o erro da API.
- **Navegação do menu "Tutoria".** Figma: p15 (por série) e p21 (histórico vazio), conforme a decisão D7.

### Lote A5: Atividades, notas e contestações
- **Atividades da sala.** Rota: P11. Figma: p03 (lista). **Só consulta**: o professor não cria atividade, então não coloque botão de criar.
- **Respostas de uma atividade.** Rota: P12. Figma: p04 (detalhe) e p01 (modal "Envio do aluno"). O professor **só visualiza**: a nota aparece como texto, sem campo de edição. Download dos anexos pelo Route Handler (seção 2). Mostre também quem ainda não enviou, se a API devolver.
- **Notas da sala e exportar Excel.** Rotas: P14 (listar notas) e P15 (exportar). Sem Figma para a tabela: tabela com aluno, atividade e nota, com filtros se a rota tiver. Exportar: Figma p16. Ajuste os campos da p16 ao que a P15 realmente recebe (por exemplo, "ano" e "turma" viram a sala; "trimestre" só fica se a rota aceitar etapa). Download pelo Route Handler com o nome de arquivo que a API devolver. O cartão "Exportar notas" da p13 leva para esta tela.
- **Contestações.** Rotas: P16 (listar) e T4 (resolver). Sem Figma: "Lista com filtro" (pendente ou resolvida). O professor dono da sala também pode resolver. Ao aceitar, a nota é sobrescrita: deixe isso claro no modal de confirmação e, se a T4 pedir a nova nota, valide de 0 a 10 com até 2 casas decimais (aceite vírgula e envie no formato que a API espera). A justificativa do aluno aparece no detalhe.
- **Feedbacks dos alunos aos tutores.** Rota: T7. Sem Figma: lista com filtros por etapa, ano e tutor, se a rota aceitar. Se o feedback tiver arquivo de rubrica, o download vai pelo Route Handler.

### Lote A6: Desempenho dos tutores
- **Desempenho dos tutores.** Rota: P13. Figma: p20 (lista com nota e gráfico) e p14 (menu "Desempenho"), conforme as decisões D5 e D6. Mostre a avaliação do professor (média geral) e o feedback dos alunos. O gráfico só aparece se a API devolver dados por etapa ou por período; se não devolver, mostre só a lista e registre no relatório. Tutor sem avaliação mostra "Sem avaliação", não 0.

---

## 7. Relatório (ao fim de cada lote e um consolidado no final)

**a) Tabela de rotas**, com uma linha por rota usada ou prevista no lote:

| Nº | Método e caminho | Tela | Onde é acionada (botão, formulário, carregamento da página etc.) | Arquivo e função | O que acontece no sucesso | O que acontece no erro | Situação |
|---|---|---|---|---|---|---|---|

Na coluna "Situação", use um destes valores: *implementada e testada*, *implementada sem teste*, *não implementada* (dizer o motivo) ou *divergência com a documentação*.

**b) Figma:** para cada tela, qual imagem ela segue e o que foi diferente do Figma, e por quê (por exemplo: campo sem rota, checkbox trocado por botão).

**c) Fora do Figma:** telas, modais e estados criados sem base em imagem, e qual padrão foi seguido.

**d) Pendências e riscos:** rotas faltando, campos que a API não devolve, regras de negócio que não deu para garantir no front e divergências entre `CLAUDE_DESIGN.md`, `rotas_do_sistema.md` e o back-end.

**e) Arquivos criados ou alterados**, separando os de `src/components` (compartilhados).

**f) Como testar**, passo a passo, cobrindo: dados reais, lista vazia, API desligada, campo inválido, erro da API, sala de outro professor e usuário com perfil de aluno.

**No relatório consolidado final**, inclua ainda:
- a lista de todas as abas da sala com o caminho de cada uma;
- a lista das telas que precisam ser desenhadas no Figma depois, para a banca (as que foram feitas sem imagem);
- a lista das lacunas de back-end para eu levar ao grupo.