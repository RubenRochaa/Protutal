# 👨‍🏫Protutal

Protutal conectando o professor e estimulando o aluno a ser tutor..

​Plataforma web de tutoria entre alunos da rede SESI, com foco na matéria de Geografia. Permite acompanhamento de desempenho, comunicação entre tutor e tutorado, e supervisão do professor sobre o processo de tutoria.

---

## 📌 Documentação Oficial e Diário de Bordo
Toda a documentação viva, requisitos, regras de negócio e o nosso log diário de atividades estão centralizados no nosso workspace do Notion.

[Acessar o link do Notion do Protutal](https://app.notion.com/p/Protutal-3de1c237e893802eac2ee5375cc85dd3)

---

## 👨‍💻 Stack Tecnológica

| Camada | Tecnologia | Responsabilidade |
| :--- | :--- | :--- |
| `Backend` | Node.js, Express e TypeScript  | API, regras de negócio e autenticação |
| `Frontend` | Next.js, React e TypeScript | Interface web para alunos, tutores e professores |
| `Aplicativo mobile` | React Native, Expo e TypeScript | Operação e acompanhamento pelo celular |
| `Banco de dados` | PostgreSQL e Prisma ORM | Persistência e relacionamento dos dados |

---

## 📂 Guia de Pastas deste Repositório

| Pasta | Descrição | O que tem aqui? |
| :--- | :--- | :--- |
| `backend/` | API (Node.js + Express + TypeScript) | Código no padrão MVC em `src/` (controllers, services, routes, middlewares, helpers), testes Jest em `src/__tests__/` e schema/migrations do Prisma em `prisma/`. |
| `design/` | Frontend web (Next.js + React) | Código da interface em `src/` e `components/`, referências de tela exportadas do Figma em `figma/` e o guia de design `CLAUDE_DESIGN.md`. |
| `mobile/` | Aplicativo mobile (React Native + Expo) | Código do app em `src/` e assets. |
| `docs/` | Documentação técnica | Guia de contribuição (`CONTRIBUTING.md`), mapa de rotas da API (`rotas_do_sistema.md`) e coleções do Insomnia para testes em `collections/`. |
| `.ai/` | Agentes de IA | Instruções dos agentes usados no desenvolvimento (orquestrador, PO, dev, tester, reviewer etc.) e o `UI_PROTOCOL.md`. |

---

## 🚀 Como executar o projeto

O projeto tem três partes independentes (API, site e aplicativo). O site e o aplicativo precisam da API no ar para funcionar, então comece sempre pelo backend.

### Pré-requisitos

| Requisito | Detalhe | Usado por |
| :--- | :--- | :--- |
| Node.js e npm | Node.js 20.9 ou superior (mínimo exigido pelo Next 16 usado no site). O grupo desenvolve com o Node 22. | `backend/`, `design/` e `mobile/` |
| PostgreSQL | Um banco PostgreSQL acessível pela `DATABASE_URL`. O acesso é feito pelo Prisma 6.8.2 (não atualizar a versão). | `backend/` |
| Conta no Cloudinary | Nome da cloud, API key e API secret. É onde ficam os arquivos enviados em materiais, respostas de atividades e feedbacks. | `backend/` |
| Conta no Gmail com senha de app | O envio de e-mails (confirmação de cadastro e redefinição de senha) usa o Nodemailer com o Gmail. `EMAIL_PASS` é uma **senha de app** do Google, não a senha normal da conta. | `backend/` |
| Expo Go no celular | Aplicativo Expo Go (Android ou iOS) compatível com o Expo SDK 58. O celular precisa estar na mesma rede Wi-Fi do computador. | `mobile/` |

Versões principais, conforme os `package.json` de cada pasta:

| Pasta | Tecnologias e versões |
| :--- | :--- |
| `backend/` | Express 4.21, Prisma 6.8.2, TypeScript 5.6, Jest 29.7 |
| `design/` | Next.js 16.4.3, React 19.2.8, TypeScript 5 |
| `mobile/` | Expo SDK 58, React Native 0.88.1, React 19.3.0, TypeScript 6.0 |

### 1. Backend (`backend/`)

1. Na **raiz do repositório** (não dentro de `backend/`), copie o `.env.example` para `.env` e preencha as variáveis. O client do Prisma (`backend/src/prisma/index.ts`) e o `backend/prisma.config.ts` leem o `.env` da raiz.

   | Variável | O que é |
   | :--- | :--- |
   | `DATABASE_URL` | String de conexão do PostgreSQL |
   | `JWT_SECRET` | Segredo usado para assinar os tokens de login |
   | `CLOUDINARY_NAME`, `CLOUDINARY_KEY`, `CLOUDINARY_SECRET` | Credenciais do Cloudinary |
   | `DOMINIOS_PERMITIDOS_PROFESSOR`, `DOMINIOS_PERMITIDOS_ALUNO` | Domínios de e-mail aceitos no cadastro, separados por vírgula |
   | `EMAIL_USER`, `EMAIL_PASS` | Conta do Gmail e a senha de app usadas no envio de e-mails |
   | `APP_URL` | Endereço da API (`http://localhost:3333`), usado no link de confirmação de e-mail |
   | `FRONT_URL` | Endereço do site (`http://localhost:3000`), usado no link de redefinição de senha |

2. Instale as dependências:

   ```bash
   cd backend
   npm install
   ```

3. Gere o client do Prisma (a pasta `src/generated/` não é versionada, por isso esse passo é obrigatório):

   ```bash
   npx prisma generate
   ```

4. Aplique as migrations no banco:

   ```bash
   npx prisma migrate deploy
   ```

5. (Opcional) Popule o banco com os dados fictícios de `prisma/seed.ts`:

   ```bash
   npx prisma db seed
   ```

   > ⚠️ O seed **apaga todos os dados** de todas as tabelas (`TRUNCATE ... RESTART IDENTITY`) antes de inserir os registros fictícios. Rode somente em um banco local, seu. Nunca rode no banco compartilhado do grupo. A senha de todos os usuários do seed é `Protutal@123`.

6. Suba a API em modo de desenvolvimento:

   ```bash
   npm run dev
   ```

   A API responde em `http://localhost:3333` (porta fixa em `src/server.ts`). O mapa completo das rotas está em [`docs/rotas_do_sistema.md`](docs/rotas_do_sistema.md).

### 2. Front web (`design/`)

1. Copie `design/.env.example` para `design/.env.local` e preencha `NEXT_PUBLIC_API_URL` (endereço da API) e os domínios de e-mail (`NEXT_PUBLIC_DOMINIO_PROFESSOR` e `NEXT_PUBLIC_DOMINIO_ALUNO`).

2. Instale as dependências e suba o site:

   ```bash
   cd design
   npm install
   npm run dev
   ```

   O site abre em `http://localhost:3000`. Para abrir o site pelo celular na mesma rede, use `npm run dev:celular` e acesse pelo IP do computador (ex.: `http://192.168.0.15:3000`).

### 3. Aplicativo mobile (`mobile/`)

1. Copie `mobile/.env.example` para `mobile/.env` e preencha `EXPO_PUBLIC_API_URL` com o **IP do computador** que roda a API (ex.: `http://192.168.0.15:3333`). No celular, `localhost` não funciona. Preencha também `EXPO_PUBLIC_DOMINIO_PROFESSOR` e `EXPO_PUBLIC_DOMINIO_ALUNO` com os mesmos domínios do site.

2. Instale as dependências e inicie o Expo:

   ```bash
   cd mobile
   npm install
   npx expo start
   ```

3. Abra o Expo Go no celular (na mesma rede Wi-Fi do computador) e leia o QR code exibido no terminal.

### Como rodar os testes

Os testes unitários ficam em `backend/src/__tests__/` e usam Jest. Eles **não acessam o banco**: o Prisma é substituído por um mock em `setup.ts`, e as variáveis de ambiente usadas são falsas. Mesmo assim, os testes importam os tipos do client gerado, então o `npx prisma generate` precisa ter sido executado antes.

```bash
cd backend
npx prisma generate
npm test               # roda todos os testes
npm run test:coverage  # roda os testes e gera o relatório de cobertura
```

### Limitações conhecidas

- **Confirmação de e-mail e redefinição de senha no aplicativo:** o aplicativo consegue cadastrar o usuário e pedir a redefinição de senha, mas os links enviados por e-mail apontam para `APP_URL` e `FRONT_URL`, que no `.env.example` são `localhost`. Esses links não abrem no celular, então a confirmação do e-mail e a troca de senha só funcionam pela versão web.

---

## 👥 A Equipe Protutal
Estamos empolgados em desenvolver esta solução! Conheça os integrantes do grupo:

* 👤 **Arthur Souza Soares** - [@ArthurSouzaS](https://github.com/ArthurSouzaS)
* 👤 **Cesar Castro Rodrigues** - [@CesarCastroR](https://github.com/CesarCastroR)
* 👤 **Luisa Santos Carvalho** - [@luisasantoscarvalho](https://github.com/luisasantoscarvalho)
* 👤 **Ruben Rocha Barbosa** - [@RubenRochaa](https://github.com/RubenRochaa)

Equipe Protutal - 2026
