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
import { CreateConteudoController } from './controllers/professor/CreateConteudoController';
import { ListConteudosSalaController } from './controllers/professor/ListConteudosSalaController';

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

import { CreateAtividadeController } from './controllers/aluno/CreateAtividadeController';
import { CreateRespostaController } from './controllers/aluno/CreateRespostaController';
import { ListRespostasAtividadeController } from './controllers/professor/ListRespostasAtividadeController';
import { ListAtividadesAlunoController } from './controllers/aluno/ListAtividadesAlunoController';
import { CreateNotaController } from './controllers/aluno/CreateNotaController';
import { ListTutoriasTutorController } from './controllers/aluno/ListTutoriasTutorController';
import { ListTutoriasAlunoController } from './controllers/aluno/ListTutoriasAlunoController';
import { CreateMaterialController } from './controllers/aluno/CreateMaterialController';

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

// -- ROTAS TUTOR DA SALA (somente professor autenticado) --
// revoga o tutor da sala (data_revogacao) e finaliza as tutorias ativas dele numa transação;
// só o professor dono da sala, só vínculo não revogado e sem contestação de nota pendente (RN15)
router.patch('/tutores-sala/:id/revogar', isAuthenticated, isProfessor, new RevogarTutorSalaController().handle);

// -- ROTAS ATIVIDADE (somente aluno autenticado que seja tutor da tutoria) --
// o tutor cria uma atividade para o aluno que ele tutora (destinatário pela tutoria)
router.post('/atividades', isAuthenticated, isAluno, new CreateAtividadeController().handle);

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

// -- ROTAS DO ALUNO LOGADO (somente aluno autenticado) --
// atenção: se um dia existir uma rota /alunos/:id, ela deve ficar DEPOIS das rotas /alunos/me/...,
// senão o Express trata "me" como :id
// lista as atividades em que o aluno logado é destinatário (nunca as que ele criou como tutor);
// filtros opcionais: ?status=pendente|entregue|entregue_com_atraso e ?etapa=1|2|3
router.get('/alunos/me/atividades', isAuthenticated, isAluno, new ListAtividadesAlunoController().handle);
// lista as tutorias em que o aluno logado é o tutorado (nunca as que ele conduz como tutor),
// com tutor (só o nome), sala, status e meta; ativas primeiro; filtro opcional ?status=ativa|finalizada
router.get('/alunos/me/tutorias', isAuthenticated, isAluno, new ListTutoriasAlunoController().handle);

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

export { router };