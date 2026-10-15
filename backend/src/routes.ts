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
import { CreateConteudoController } from './controllers/professor/CreateConteudoController';

import { CreatePedidoTutoriaController } from './controllers/aluno/CreatePedidoTutoriaController';
import { ListPedidosTutoriaController } from './controllers/professor/ListPedidosTutoriaController';
import { AceitarPedidoTutoriaController } from './controllers/professor/AceitarPedidoTutoriaController';

import { PermissaoAtividadesSalaController } from './controllers/professor/PermissaoAtividadesSalaController';

import { isAuthenticated } from './middlewares/isAuthenticated';
import { isProfessor } from './middlewares/isProfessor';
import { isAluno } from './middlewares/isAluno';


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

// -- ROTAS CONTEÚDO (somente professor autenticado) --
router.post('/salas/:id/conteudos', isAuthenticated, isProfessor, new CreateConteudoController().handle);

// -- ROTAS PEDIDO DE TUTORIA --
// aluno pede para ser tutor numa sala em que está matriculado
router.post('/pedidos-tutoria', isAuthenticated, isAluno, new CreatePedidoTutoriaController().handle);
// professor lista e aceita os pedidos das próprias salas
router.get('/pedidos-tutoria', isAuthenticated, isProfessor, new ListPedidosTutoriaController().handle);
router.patch('/pedidos-tutoria/:id/aceitar', isAuthenticated, isProfessor, new AceitarPedidoTutoriaController().handle);

// -- ROTAS PERMISSÃO DE ATIVIDADES (somente professor autenticado) --
// concede ou revoga, para todos os tutores ativos da sala, a permissão de criar atividades
router.patch('/salas/:id/permissao-atividades', isAuthenticated, isProfessor, new PermissaoAtividadesSalaController().handle);

export { router };