import 'dotenv/config'; 
// import adicionado para que o prisma consiga ler as variáveis de ambiente do arquivo .env
import { PrismaClient } from '../generated/prisma';
const prismaClient = new PrismaClient();

export default prismaClient;