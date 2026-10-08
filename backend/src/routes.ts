import { Router } from 'express';

import { CreateProfessorController } from './controllers/professor/CreateProfessorController';
import { CreateAlunoController } from './controllers/aluno/CreateAlunoController';

const router = Router();

// -- ROTAS PROFESSOR --
router.post('/professores', new CreateProfessorController().handle);


// -- ROTAS ALUNO --
router.post('/alunos', new CreateAlunoController().handle);

export { router };