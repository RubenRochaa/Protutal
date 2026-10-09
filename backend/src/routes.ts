import { Router } from 'express';

import { CreateProfessorController } from './controllers/professor/CreateProfessorController';
import { CreateAlunoController } from './controllers/aluno/CreateAlunoController';

import { AuthProfessorController } from './controllers/professor/AuthProfessorController';
import { AuthAlunoController } from './controllers/aluno/AuthAlunoController';


const router = Router();

// -- ROTAS PROFESSOR --
router.post('/professores', new CreateProfessorController().handle);
router.post('/sessao/professores', new AuthProfessorController().handle);

// -- ROTAS ALUNO --
router.post('/alunos', new CreateAlunoController().handle);
router.post('/sessao/alunos', new AuthAlunoController().handle);

export { router };