import { Router } from 'express';

import { CreateProfessorController } from './controllers/professor/CreateProfessorController';
import { CreateAlunoController } from './controllers/aluno/CreateAlunoController';

import { AuthProfessorController } from './controllers/professor/AuthProfessorController';
import { AuthAlunoController } from './controllers/aluno/AuthAlunoController';

import { CreateSalaController } from './controllers/professor/CreateSalaController';
import { ListSalaController } from './controllers/professor/ListSalaController';
import { ListAlunoController } from './controllers/professor/ListAlunoController';
import { CreateMatriculaController } from './controllers/professor/CreateMatriculaController';
import { ListAlunosSalaController } from './controllers/professor/ListAlunosSalaController';
import { ListTutoresSalaController } from './controllers/professor/ListTutoresSalaController';
import { CreateConteudoController } from './controllers/professor/CreateConteudoController';
import { ListConteudosSalaController } from './controllers/professor/ListConteudosSalaController';

import { CreatePedidoTutoriaController } from './controllers/aluno/CreatePedidoTutoriaController';
import { ListPedidosTutoriaController } from './controllers/professor/ListPedidosTutoriaController';
import { AceitarPedidoTutoriaController } from './controllers/professor/AceitarPedidoTutoriaController';
import { RecusarPedidoTutoriaController } from './controllers/professor/RecusarPedidoTutoriaController';

import { PermissaoAtividadesSalaController } from './controllers/professor/PermissaoAtividadesSalaController';

import { CreateTutoriaController } from './controllers/professor/CreateTutoriaController';

import { CreateAtividadeController } from './controllers/aluno/CreateAtividadeController';
import { CreateRespostaController } from './controllers/aluno/CreateRespostaController';
import { ListRespostasAtividadeController } from './controllers/professor/ListRespostasAtividadeController';
import { ListAtividadesAlunoController } from './controllers/aluno/ListAtividadesAlunoController';

import { isAuthenticated } from './middlewares/isAuthenticated';
import { isProfessor } from './middlewares/isProfessor';
import { isAluno } from './middlewares/isAluno';
import { isTutorAtivoSala } from './middlewares/isTutorAtivoSala';
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

// -- ROTAS ALUNOS (somente professor autenticado) --
router.get('/alunos', isAuthenticated, isProfessor, new ListAlunoController().handle);

// -- ROTAS MATRÍCULA (somente professor autenticado) --
router.post('/salas/:id/matriculas', isAuthenticated, isProfessor, new CreateMatriculaController().handle);
router.get('/salas/:id/alunos', isAuthenticated, isProfessor, new ListAlunosSalaController().handle);
router.get('/salas/:id/tutores', isAuthenticated, isProfessor, new ListTutoresSalaController().handle);

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

// -- ROTAS ATIVIDADE (somente aluno autenticado que seja tutor da tutoria) --
// o tutor cria uma atividade para o aluno que ele tutora (destinatário pela tutoria)
router.post('/atividades', isAuthenticated, isAluno, new CreateAtividadeController().handle);

// -- ROTAS RESPOSTA (somente aluno autenticado que seja destinatário da atividade) --
// o aluno tutorado envia a resposta (arquivo obrigatório + texto opcional) via multipart/form-data
router.post('/atividades/:id/respostas', isAuthenticated, isAluno, new CreateRespostaController().handle);
// listar: tutor que criou a atividade (vínculo ativo) ou professor dono da sala;
// traz todos os destinatários, com resposta, nota e status de entrega
router.get('/atividades/:id/respostas', isAuthenticated, isTutorCriadorOuProfessorAtividade, new ListRespostasAtividadeController().handle);

// -- ROTAS ATIVIDADES DO ALUNO (somente aluno autenticado) --
// lista as atividades em que o aluno logado é destinatário (nunca as que ele criou como tutor);
// filtros opcionais: ?status=pendente|entregue|entregue_com_atraso e ?etapa=1|2|3
router.get('/alunos/me/atividades', isAuthenticated, isAluno, new ListAtividadesAlunoController().handle);

export { router };