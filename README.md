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

## 👥 A Equipe Protutal
Estamos empolgados em desenvolver esta solução! Conheça os integrantes do grupo:

* 👤 **Arthur Souza Soares** - [@ArthurSouzaS](https://github.com/ArthurSouzaS)
* 👤 **Cesar Castro Rodrigues** - [@CesarCastroR](https://github.com/CesarCastroR)
* 👤 **Luisa Santos Carvalho** - [@luisasantoscarvalho](https://github.com/luisasantoscarvalho)
* 👤 **Ruben Rocha Barbosa** - [@RubenRochaa](https://github.com/RubenRochaa)

Equipe Protutal - 2026
