# Money Track · finance-service

[![CI](https://github.com/matheus-santos-da-silva/money-track-finance-service/actions/workflows/ci.yml/badge.svg)](https://github.com/matheus-santos-da-silva/money-track-finance-service/actions/workflows/ci.yml)

Serviço financeiro do [Money Track](https://github.com/matheus-santos-da-silva/money-track), um app de finanças pessoais. Cuida de categorias, despesas, receitas, parcelamento, recorrência e extrato. Mantém uma cópia mínima do usuário (`id`, `plan`, `trialEndsAt`), sincronizada por eventos Kafka vindos do [users-service](https://github.com/matheus-santos-da-silva/money-track-user-service), para aplicar as regras de plano sem depender dele a cada requisição.

**Stack:** NestJS · TypeScript · Prisma (PostgreSQL) · Kafka · JWT · class-validator · Throttler

## Destaques

- **Parcelamento em centavos exatos.** O total é dividido em centavos inteiros e as sobras vão para as primeiras parcelas (R$ 100 em 3x = 33,34 + 33,33 + 33,33). As datas são ajustadas ao fim do mês, e todas as parcelas são gravadas numa única transação: [`installments.ts`](src/shared/transactions/installments.ts).
- **Recorrência sob demanda.** Uma despesa ou receita mensal ou anual cria uma `RecurringSeries`; as ocorrências são geradas ao consultar o período, até 24 meses à frente, sem job agendado. A geração é idempotente: um índice único impede duplicatas em requisições simultâneas ([`materialize-recurrences.service.ts`](src/application/services/materialize-recurrences.service.ts)).
- **Extrato com paginação por cursor**, filtros combináveis (tipo, categorias, faixa de valor, modalidade, busca) e totais por dia: [`statement-repository.ts`](src/infra/database/repositories/statement/statement-repository.ts).
- **Consumers Kafka robustos.** São idempotentes (`upsert`) e chegam ao mesmo estado em qualquer ordem de entrega. Erros permanentes vão direto para a DLQ; erros passageiros têm retry com backoff: [`is-transient-error.ts`](src/infra/kafka/dead-letter/is-transient-error.ts), [`with-retry-and-dlq.ts`](src/infra/kafka/dead-letter/with-retry-and-dlq.ts).

## Eventos consumidos

| Tópico | Efeito |
|---|---|
| `user-created` | Cria o usuário local (`upsert`, sem sobrescrever o plano) |
| `user-plan-updated` | Atualiza o plano; cria o usuário se ele ainda não existir |
| `user-deleted` | Apaga despesas, receitas, categorias e o usuário, em transação |

O serviço cria os tópicos e as DLQs (`<tópico>.dlq`) ao iniciar.

## Endpoints

Todas as rotas usam o prefixo `/finance` e exigem `Authorization: Bearer <token>`.

| Recurso | Rotas |
|---|---|
| Categorias | `POST /categories` · `GET /categories?type=` · `GET`/`PATCH`/`DELETE /categories/:id` (exclusão lógica) |
| Despesas | `POST /expenses` · `GET`/`PATCH /expenses/:id` · `DELETE /expenses/:id?applyToAll=true` |
| Receitas | Mesmo contrato de despesas, em `/incomes` |
| Transações do mês | `GET /transactions?start_date=&end_date=` |
| Extrato | `GET /transactions/statement` (filtros e cursor) |

`applyToAll` atua no grupo de parcelas ou, numa transação recorrente, nesta ocorrência e nas seguintes.

## Arquitetura

Clean Architecture: os controllers dependem de contratos (`use-cases-protocol`) e o Nest injeta a implementação concreta.

```
src/
├── presentation/               controllers REST e pipes
├── application/
│   ├── auth/                   AuthGuard (JWT)
│   ├── services/               geração de recorrências
│   └── use-cases/              uma classe por operação
├── domain/                     DTOs, entidades e contratos
├── infra/
│   ├── database/               Prisma e repositórios
│   └── kafka/                  consumers, criação de tópicos e DLQ
└── shared/transactions/        parcelamento, recorrência e extrato
```

## Rodando

O jeito mais simples é subir a stack inteira pelo [repositório principal](https://github.com/matheus-santos-da-silva/money-track) (Kafka, bancos e os dois serviços com um `docker compose`).

Para rodar só este serviço na máquina, com Kafka e Postgres já de pé:

```bash
cp .env.example .env      # PORT, DATABASE_URL, JWT_SECRET, KAFKA_URL
yarn install
yarn prisma generate
npx prisma migrate deploy
yarn run seed             # categorias padrão
yarn start:dev
```

`JWT_SECRET` precisa ser idêntico ao do users-service.

## Testes

```bash
yarn test:unit     # unitários
yarn test:e2e      # e2e: precisa de um Postgres com as credenciais de .env.testing
```

Cada execução e2e cria e remove um schema `test_<uuid>` isolado.
