import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
// import adicionado para que o prisma consiga ler as variáveis de ambiente do arquivo .env
import { PrismaClient } from '../generated/prisma';
const prismaClient = new PrismaClient();

export default prismaClient;