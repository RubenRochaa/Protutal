import { Router } from 'express';

import { CreateProfessorController } from './controllers/professor/CreateProfessorController';
import { CreateAlunoController } from './controllers/aluno/CreateAlunoController';

import { AuthProfessorController } from './controllers/professor/AuthProfessorController';
import { AuthAlunoController } from './controllers/aluno/AuthAlunoController';

import { CreateSalaController } from './controllers/professor/CreateSalaController';
import { ListSalaController } from './controllers/professor/ListSalaController';
import { DetailSalaController } from './controllers/professor/DetailSalaController';
import { ListAlunoController } from './controllers/professor/ListAlunoController';
import { CreateMatriculaController } from './controllers/professor/CreateMatriculaController';
import { ListAlunosSalaController } from './controllers/professor/ListAlunosSalaController';
import { ListTutoresSalaController } from './controllers/professor/ListTutoresSalaController';
import { ListTutoriasSalaController } from './controllers/professor/ListTutoriasSalaController';
import { ListAtividadesSalaController } from './controllers/professor/ListAtividadesSalaController';
import { ListNotasSalaController } from './controllers/professor/ListNotasSalaController';
import { ExportNotasSalaController } from './controllers/professor/ExportNotasSalaController';
import { CreateConteudoController } from './controllers/professor/CreateConteudoController';
import { ListConteudosSalaController } from './controllers/professor/ListConteudosSalaController';
import { CreateAvisoController } from './controllers/professor/CreateAvisoController';
import { ListAvisosSalaController } from './controllers/professor/ListAvisosSalaController';

import { CreatePedidoTutoriaController } from './controllers/aluno/CreatePedidoTutoriaController';
import { ListPedidosTutoriaController } from './controllers/professor/ListPedidosTutoriaController';
import { AceitarPedidoTutoriaController } from './controllers/professor/AceitarPedidoTutoriaController';
import { RecusarPedidoTutoriaController } from './controllers/professor/RecusarPedidoTutoriaController';

import { PermissaoAtividadesSalaController } from './controllers/professor/PermissaoAtividadesSalaController';

import { CreateTutoriaController } from './controllers/professor/CreateTutoriaController';
import { UpdateMetaTutoriaController } from './controllers/professor/UpdateMetaTutoriaController';
import { FinalizarTutoriaController } from './controllers/professor/FinalizarTutoriaController';
import { ReabrirTutoriaController } from './controllers/professor/ReabrirTutoriaController';
import { RevogarTutorSalaController } from './controllers/professor/RevogarTutorSalaController';
import { CreateAvaliacaoTutorController } from './controllers/professor/CreateAvaliacaoTutorController';
import { ListAvaliacoesTutorController } from './controllers/professor/ListAvaliacoesTutorController';

import { CreateAtividadeController } from './controllers/aluno/CreateAtividadeController';
import { DetailAtividadeController } from './controllers/aluno/DetailAtividadeController';
import { CreateRespostaController } from './controllers/aluno/CreateRespostaController';
import { ListRespostasAtividadeController } from './controllers/professor/ListRespostasAtividadeController';
import { ListAtividadesAlunoController } from './controllers/aluno/ListAtividadesAlunoController';
import { CreateNotaController } from './controllers/aluno/CreateNotaController';
import { CreateContestacaoNotaController } from './controllers/aluno/CreateContestacaoNotaController';
import { ListTutoriasTutorController } from './controllers/aluno/ListTutoriasTutorController';
import { ListTutoriasAlunoController } from './controllers/aluno/ListTutoriasAlunoController';
import { ListContestacoesAlunoController } from './controllers/aluno/ListContestacoesAlunoController';
import { ListContestacoesController } from './controllers/professor/ListContestacoesController';
import { ResolverContestacaoController } from './controllers/professor/ResolverContestacaoController';
import { CreateMaterialController } from './controllers/aluno/CreateMaterialController';
import { ListMateriaisSalaController } from './controllers/professor/ListMateriaisSalaController';
import { ListTiposAtividadeController } from './controllers/professor/ListTiposAtividadeController';
import { CreateMensagemController } from './controllers/aluno/CreateMensagemController';
import { ListMensagensTutoriaController } from './controllers/aluno/ListMensagensTutoriaController';
import { CreateFeedbackController } from './controllers/aluno/CreateFeedbackController';
import { ListFeedbacksController } from './controllers/professor/ListFeedbacksController';

import { isAuthenticated } from './middlewares/isAuthenticated';
import { isProfessor } from './middlewares/isProfessor';
import { isAluno } from './middlewares/isAluno';
import { isTutorAtivoSala } from './middlewares/isTutorAtivoSala';
import { isTutor } from './middlewares/isTutor';
import { isTutorCriadorOuProfessorAtividade } from './middlewares/isTutorCriadorOuProfessorAtividade';


const router = Router();

// -- ROTAS PROFESSOR --
router.post('/professores', new CreateProfessorController().handle);
router.post('/sessao/professores', new AuthProfessorController().handle);

// -- ROTAS ALUNO --
router.post('/alunos', new CreateAlunoController().handle);
router.post('/sessao/alunos', new AuthAlunoController().handle);

// -- ROTAS SALA (somente professor autenticado) --
router.post('/salas', isAuthenticated, isProfessor, new CreateSalaController().handle);
router.get('/salas', isAuthenticated, isProfessor, new ListSalaController().handle);
// detalhar: somente o professor dono da sala (dados básicos + professor; sem alunos, tutores e conteúdos)
router.get('/salas/:id', isAuthenticated, isProfessor, new DetailSalaController().handle);

// -- ROTAS ALUNOS (somente professor autenticado) --
router.get('/alunos', isAuthenticated, isProfessor, new ListAlunoController().handle);

// -- ROTAS MATRÍCULA (somente professor autenticado) --
router.post('/salas/:id/matriculas', isAuthenticated, isProfessor, new CreateMatriculaController().handle);
router.get('/salas/:id/alunos', isAuthenticated, isProfessor, new ListAlunosSalaController().handle);
router.get('/salas/:id/tutores', isAuthenticated, isProfessor, new ListTutoresSalaController().handle);
// tutorias da sala (tutor, aluno tutorado, status e meta); filtro opcional ?status=ativa|finalizada
router.get('/salas/:id/tutorias', isAuthenticated, isProfessor, new ListTutoriasSalaController().handle);
// atividades lançadas pelos tutores na sala, com conteúdo, tutor e contagens de entrega; só o professor dono.
// filtros opcionais ?etapa=1|2|3, ?id_conteudo= e ?id_tutor_sala=; o detalhe por aluno fica em /atividades/:id/respostas
router.get('/salas/:id/atividades', isAuthenticated, isProfessor, new ListAtividadesSalaController().handle);
// notas lançadas nas atividades da sala (só consulta, RF15), uma linha por nota, com aluno, atividade,
// conteúdo, tutor e contestacao_pendente; só o professor dono. ordem: aluno -> etapa -> data de entrega.
// filtros opcionais ?etapa=1|2|3, ?id_conteudo=, ?id_aluno= e ?id_tutor_sala=; a P15 (Excel) reaproveita o service
router.get('/salas/:id/notas', isAuthenticated, isProfessor, new ListNotasSalaController().handle);
// exporta as mesmas notas da rota acima para Excel (RF14 / RNF10): .xlsx com a aba "Notas", uma linha por nota.
// mesmos filtros, validações e ordem de erros (400 -> 404 -> 403); sem notas, devolve só o cabeçalho (200)
router.get('/salas/:id/notas/exportar', isAuthenticated, isProfessor, new ExportNotasSalaController().handle);
// publica aviso na sala (titulo até 150 + conteudo), visível a todos os alunos da turma (RN10);
// só o professor dono e só com tutoria ativa na sala (RN14). ordem: 400 -> 404 -> 403 -> 400 (corpo) -> 409
router.post('/salas/:id/avisos', isAuthenticated, isProfessor, new CreateAvisoController().handle);
// lista os avisos da sala (mais recente primeiro): aluno matriculado (inclui o tutor) ou professor dono.
// sem filtro de tutoria ativa nem de ano letivo (histórico, RN14). A permissão é conferida no service,
// na ordem: id inválido (400) -> não encontrada (404) -> sem permissão (403)
router.get('/salas/:id/avisos', isAuthenticated, new ListAvisosSalaController().handle);

// -- ROTAS CONTEÚDO --
// cadastrar: somente professor autenticado
router.post('/salas/:id/conteudos', isAuthenticated, isProfessor, new CreateConteudoController().handle);
// listar: professor dono da sala ou aluno que seja tutor ativo da sala
router.get('/salas/:id/conteudos', isAuthenticated, isTutorAtivoSala, new ListConteudosSalaController().handle);

// -- ROTAS PEDIDO DE TUTORIA --
// aluno pede para ser tutor numa sala em que está matriculado
router.post('/pedidos-tutoria', isAuthenticated, isAluno, new CreatePedidoTutoriaController().handle);
// professor lista, aceita e recusa os pedidos das próprias salas
router.get('/pedidos-tutoria', isAuthenticated, isProfessor, new ListPedidosTutoriaController().handle);
router.patch('/pedidos-tutoria/:id/aceitar', isAuthenticated, isProfessor, new AceitarPedidoTutoriaController().handle);
router.patch('/pedidos-tutoria/:id/recusar', isAuthenticated, isProfessor, new RecusarPedidoTutoriaController().handle);

// -- ROTAS PERMISSÃO DE ATIVIDADES (somente professor autenticado) --
// concede ou revoga, para todos os tutores ativos da sala, a permissão de criar atividades
router.patch('/salas/:id/permissao-atividades', isAuthenticated, isProfessor, new PermissaoAtividadesSalaController().handle);

// -- ROTAS TUTORIA (somente professor autenticado) --
// liga um tutor ativo da sala (Tutor_sala) a um aluno matriculado na mesma sala
router.post('/tutorias', isAuthenticated, isProfessor, new CreateTutoriaController().handle);
// define ou substitui a meta de aprendizagem; só o professor dono da sala e só em tutoria ativa
router.patch('/tutorias/:id/meta', isAuthenticated, isProfessor, new UpdateMetaTutoriaController().handle);
// finaliza a tutoria (status finalizada + data_fim); só o professor dono da sala,
// só tutoria ativa e sem contestação de nota pendente (RN15)
router.patch('/tutorias/:id/finalizar', isAuthenticated, isProfessor, new FinalizarTutoriaController().handle);
// reabre a tutoria (status ativa + data_fim null); só o professor dono da sala, só tutoria finalizada,
// do ano letivo atual, com tutor não revogado e sem outra tutoria ativa do aluno na sala
router.patch('/tutorias/:id/reabrir', isAuthenticated, isProfessor, new ReabrirTutoriaController().handle);

// -- ROTAS MENSAGEM (somente aluno autenticado que participe da tutoria) --
// o tutor ou o aluno tutorado envia mensagem; com assunto preenchido vira comunicado (só o tutor).
// a participação é conferida no service, na ordem: id inválido (400) -> não encontrada (404)
// -> não participa (403) -> tutoria finalizada (409) -> corpo inválido (400) -> tutorado com assunto (403)
router.post('/tutorias/:id/mensagens', isAuthenticated, isAluno, new CreateMensagemController().handle);
// lista as mensagens da tutoria (mais antiga primeiro); tutoria finalizada também lista (histórico).
// filtro opcional ?tipo=comunicado (só mensagens com assunto). a participação é conferida no service, na ordem:
// id inválido (400) -> não encontrada (404) -> não participa (403) -> tutor revogado (403) -> ?tipo inválido (400)
router.get('/tutorias/:id/mensagens', isAuthenticated, isAluno, new ListMensagensTutoriaController().handle);

// -- ROTAS FEEDBACK (somente aluno autenticado que seja o tutorado da tutoria) --
// o aluno tutorado avalia o tutor (nota 0 a 10, comentario opcional e rubrica obrigatória) via multipart/form-data
// (file: .pdf .doc .docx .xls .xlsx .csv, até 10 MB); um feedback por etapa. a permissão é conferida no service, na ordem:
// id inválido (400) -> não encontrada (404) -> não é o tutorado (403) -> finalizada (409) -> corpo inválido (400) -> etapa repetida (409)
router.post('/tutorias/:id/feedbacks', isAuthenticated, isAluno, new CreateFeedbackController().handle);
// listar (tutor e professor): o tutor (com vínculo ativo) vê os feedbacks de todos os seus vínculos, inclusive revogados
// e de anos anteriores; o professor vê os das salas em que é dono; qualquer outro usuário recebe 403. A permissão é conferida no service.
// filtros opcionais ?etapa=1|2|3, ?ano=, ?id_aluno= e, só para o professor, ?id_sala= e ?id_tutor_sala=;
// mais recentes primeiro, com total e média das notas
router.get('/feedbacks', isAuthenticated, new ListFeedbacksController().handle);

// -- ROTAS TUTOR DA SALA (somente professor autenticado) --
// revoga o tutor da sala (data_revogacao) e finaliza as tutorias ativas dele numa transação;
// só o professor dono da sala, só vínculo não revogado e sem contestação de nota pendente (RN15)
router.patch('/tutores-sala/:id/revogar', isAuthenticated, isProfessor, new RevogarTutorSalaController().handle);
// avalia o tutor da sala (nota 0 a 10 + comentário); só o professor dono da sala.
// o mesmo tutor pode ter várias avaliações, e tutor revogado também pode ser avaliado
router.post('/tutores-sala/:id/avaliacoes', isAuthenticated, isProfessor, new CreateAvaliacaoTutorController().handle);
// lista as avaliações do tutor da sala (mais recente primeiro), com total e média das notas;
// só o professor dono da sala, e tutor revogado também tem o histórico listado
router.get('/tutores-sala/:id/avaliacoes', isAuthenticated, isProfessor, new ListAvaliacoesTutorController().handle);

// -- ROTAS ATIVIDADE (somente aluno autenticado que seja tutor da tutoria) --
// o tutor cria uma atividade para o aluno que ele tutora (destinatário pela tutoria)
router.post('/atividades', isAuthenticated, isAluno, new CreateAtividadeController().handle);
// detalhar: o aluno destinatário (tutoria ativa ou finalizada) ou o tutor que criou a atividade
// (vínculo ativo); o retorno traz "perfil" ("aluno" ou "tutor") com a visão de cada um.
// a permissão é conferida no service, na ordem: id inválido (400) -> não encontrada (404) -> sem permissão (403)
router.get('/atividades/:id', isAuthenticated, isAluno, new DetailAtividadeController().handle);

// -- ROTAS RESPOSTA (somente aluno autenticado que seja destinatário da atividade) --
// o aluno tutorado envia a resposta (arquivo obrigatório + texto opcional) via multipart/form-data
router.post('/atividades/:id/respostas', isAuthenticated, isAluno, new CreateRespostaController().handle);
// listar: tutor que criou a atividade (vínculo ativo) ou professor dono da sala;
// traz todos os destinatários, com resposta, nota e status de entrega
router.get('/atividades/:id/respostas', isAuthenticated, isTutorCriadorOuProfessorAtividade, new ListRespostasAtividadeController().handle);

// -- ROTAS NOTA (somente o tutor que criou a atividade, com vínculo ativo) --
// o tutor lança nota e comentário para um aluno destinatário da atividade.
// a permissão é conferida no service (e não num middleware) para respeitar a ordem
// das validações: corpo inválido (400) -> atividade inexistente (404) -> sem permissão (403)
router.post('/atividades/:id/notas', isAuthenticated, new CreateNotaController().handle);

// -- ROTAS CONTESTAÇÃO DE NOTA --
// o aluno contesta a nota recebida, só enquanto a tutoria estiver ativa (RN14), e uma única vez por nota.
// a permissão é conferida no service, na ordem: id/corpo inválido (400) -> nota inexistente (404)
// -> não é dono ou tutoria finalizada (403) -> nota já contestada (409)
router.post('/notas/:id/contestacoes', isAuthenticated, isAluno, new CreateContestacaoNotaController().handle);
// listar (professor e tutor): o professor vê as das salas em que é dono; o tutor vê as das atividades
// que ele criou, só nos vínculos ativos; qualquer outro usuário recebe 403. A permissão é conferida no service.
// filtros opcionais ?status=pendente|aceita|recusada e ?id_sala=; mais recentes primeiro
router.get('/contestacoes', isAuthenticated, new ListContestacoesController().handle);
// resolver (professor dono da sala ou tutor criador da atividade com vínculo ativo; os mesmos que listam acima):
// status aceita (com valor 0 a 10, que sobrescreve a nota) ou recusada (sem valor) + decisao obrigatória.
// contestação e nota numa transação; a permissão é conferida no service, na ordem:
// id/corpo inválido (400) -> não encontrada (404) -> sem permissão (403) -> já resolvida (409)
router.patch('/contestacoes/:id/resolver', isAuthenticated, new ResolverContestacaoController().handle);

// -- ROTAS DO ALUNO LOGADO (somente aluno autenticado) --
// atenção: se um dia existir uma rota /alunos/:id, ela deve ficar DEPOIS das rotas /alunos/me/...,
// senão o Express trata "me" como :id
// lista as atividades em que o aluno logado é destinatário (nunca as que ele criou como tutor);
// filtros opcionais: ?status=pendente|entregue|entregue_com_atraso e ?etapa=1|2|3
router.get('/alunos/me/atividades', isAuthenticated, isAluno, new ListAtividadesAlunoController().handle);
// lista as tutorias em que o aluno logado é o tutorado (nunca as que ele conduz como tutor),
// com tutor (só o nome), sala, status e meta; ativas primeiro; filtro opcional ?status=ativa|finalizada
router.get('/alunos/me/tutorias', isAuthenticated, isAluno, new ListTutoriasAlunoController().handle);
// histórico das contestações das notas do aluno logado, de tutorias ativas e finalizadas (UC06, passo 4; RN14),
// com nota, atividade (etapa e conteúdo) e tutor (só o nome); mais recentes primeiro;
// filtro opcional ?status=pendente|aceita|recusada
router.get('/alunos/me/contestacoes', isAuthenticated, isAluno, new ListContestacoesAlunoController().handle);

// -- ROTAS TUTOR (somente aluno autenticado com vínculo de tutor ativo) --
// atenção: se um dia existir uma rota /tutores/:id, ela deve ficar DEPOIS das rotas /tutores/me/...,
// senão o Express trata "me" como :id
// lista os tutorados do tutor logado (aluno, status, meta e sala); filtro opcional ?status=ativa|finalizada
router.get('/tutores/me/tutorias', isAuthenticated, isTutor, new ListTutoriasTutorController().handle);

// -- ROTAS MATERIAL DE APOIO --
// anexar: tutor ativo da sala com pelo menos uma tutoria ativa nela (RN14), via multipart/form-data
// (titulo obrigatório, descricao opcional, file obrigatório: .pdf .doc .docx .xls .xlsx .csv, até 10 MB).
// o isAluno vem antes para o professor dono não passar pelo isTutorAtivoSala
router.post('/salas/:id/materiais', isAuthenticated, isAluno, isTutorAtivoSala, new CreateMaterialController().handle);
// listar: qualquer professor vê todos os materiais da sala; o tutor ativo vê os que ele anexou;
// o aluno vê os dos tutores com quem tem ou teve tutoria na sala. A permissão é conferida no service
router.get('/salas/:id/materiais', isAuthenticated, new ListMateriaisSalaController().handle);

// -- ROTAS TIPOS DE ATIVIDADE (professor ou aluno autenticado) --
// lista os valores do enum TipoAtividade com o rótulo em português, para o campo de seleção do front-end
router.get('/tipos-atividade', isAuthenticated, new ListTiposAtividadeController().handle);

export { router };