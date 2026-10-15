import { Router } from 'express';

import { CreateProfessorController } from './controllers/professor/CreateProfessorController';
import { CreateAlunoController } from './controllers/aluno/CreateAlunoController';

import { AuthProfessorController } from './controllers/professor/AuthProfessorController';
import { AuthAlunoController } from './controllers/aluno/AuthAlunoController';

import { CreateSalaController } from './controllers/professor/CreateSalaController';
import { ListSalaController } from './controllers/professor/ListSalaController';

import { isAuthenticated } from './middlewares/isAuthenticated';
import { isProfessor } from './middlewares/isProfessor';


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

export { router };