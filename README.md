# API Forum NestJS

A Q&A forum API — students ask questions, instructors answer, question
authors pick a best answer — built as a hands-on study of **Domain-Driven
Design**, **Clean Architecture** and **NestJS**, following Rocketseat's
*Ignite Node.js* track.

This repository's history is intentionally kept in full, commit by commit,
from the very first plain-Node domain layer (no framework at all) through
to a complete NestJS application with auth, file uploads, domain events and
Redis caching. It's meant to be read as a timeline of how the concepts were
layered in, not just a finished snapshot.

## What this project actually demonstrates

**Domain layer, framework-agnostic**
- Entities vs. **Value Objects** (identity-by-value vs. individual identity) — e.g. `Slug`, `QuestionDetails`, `CommentWithAuthor` as Value Objects aggregating data from multiple entities to avoid REST over-/under-fetching without reaching for GraphQL.
- **Aggregate Roots** (`Question`, `Answer`) and **Watched Lists** (`QuestionAttachmentList`, `AnswerAttachmentList`) — incremental diffing (`getNewItems()` / `getRemovedItems()`) so a single `save()` call persists exactly what changed, instead of re-writing the whole collection.
- **Domain Events** — `AggregateRoot.addDomainEvent` + a static `DomainEvents` registry, dispatched after persistence succeeds, consumed by subscribers (`OnAnswerCreated`, `OnQuestionBestAnswerChosen`) that live entirely in the application layer, registered as Nest providers in infra.
- **Repository Pattern** via Dependency Inversion — interfaces declared in `domain/*/application/repositories`, implemented against Prisma in `infra`, with in-memory fakes used across every unit test. One method per read/write granularity; existing methods are never mutated to fit a new use case.
- **Gateways** for infrastructure capabilities the domain needs but shouldn't know how to do: `HashGenerator`/`HashComparer` (bcrypt), `Encrypter` (JWT), `Uploader` (Cloudflare R2) — abstract in the domain, concrete in infra, fake in tests.
- **Either/Result pattern** for expected, recoverable errors (`WrongCredentialsError`, `NotAllowedError`, `ResourceNotFoundError`) — business errors are *values* returned from a use case (`Either<Left, Right>`), not exceptions; exceptions are reserved for truly unexpected failures. A deliberate, narrow use of a functional-programming technique inside an otherwise object-oriented domain model.

**NestJS / infrastructure layer**
- Modules, Controllers and Services wired by Nest's dependency injection container (by type and, for interfaces, by token via `provide`/`useClass`).
- **Pipes** (`ZodValidationPipe`) for schema validation on `@Body()`/`@Param()`/`@Query()`.
- **Guards** — JWT authentication (RS256) via `@nestjs/passport`, first scoped per-controller, then promoted to a global `APP_GUARD` with `@Public()` + `Reflector` for the explicit opt-out (protected-by-default, instead of protected-by-exception).
- Custom **decorators** — `@CurrentUser()` via `createParamDecorator` (reads a per-request value) and `@Public()` via `SetMetadata` (a static label read later by a Guard) — the two patterns Nest offers for building your own.
- **File uploads** — `FileInterceptor` + `ParseFilePipe`/`MaxFileSizeValidator`/`FileTypeValidator`, stored in **Cloudflare R2** through `@aws-sdk/client-s3` against R2's S3-compatible endpoint (chosen over plain S3 specifically for its zero egress fees).
- **Caching** — cache-aside (lazy-loading) with Redis (`ioredis`) behind a `CacheRepository` abstraction, invalidated on write, kept entirely in infra (the domain layer has no idea a cache exists).
- Environment variables validated at boot with Zod through `ConfigModule`.

## Project structure

```
src/
├── core/                      # framework-agnostic base classes: Entity, AggregateRoot,
│                              # UniqueEntityID, DomainEvents, Either, Watched List
├── domain/
│   ├── forum/
│   │   ├── enterprise/        # entities, value objects, domain events
│   │   └── application/       # use cases, repository/cryptography/storage interfaces
│   └── notification/          # a second, smaller bounded context (read notifications)
└── infra/
    ├── auth/                  # JWT strategy, guards, custom decorators
    ├── cache/redis/            # CacheRepository implementation
    ├── cryptography/          # bcrypt + JWT gateway implementations
    ├── database/prisma/        # repositories + mappers (Prisma row ⇄ domain entity)
    ├── events/                # domain event subscribers registered as providers
    ├── http/                  # controllers, pipes, presenters
    └── storage/               # Cloudflare R2 gateway implementation

test/
├── factories/                 # entity factories for tests (make-question, make-student, …)
└── repositories/               # in-memory repository fakes, used by every unit test
```

19 use cases, 12 domain entities/value objects, 27 unit test suites and 23
end-to-end test suites (Vitest + SWC), all run against in-memory fakes at
the unit level and against real Postgres/Redis containers at the e2e level.

## Stack

NestJS 10 · TypeScript 5 · Prisma 5 (PostgreSQL) · Redis (`ioredis`) ·
Cloudflare R2 (`@aws-sdk/client-s3`) · Zod · JWT (`@nestjs/passport`,
RS256) · bcryptjs · Vitest + SWC

## Running locally

```bash
docker compose up -d        # postgres + redis
pnpm install
npx prisma migrate dev
pnpm start:dev
```

```bash
pnpm test        # unit tests
pnpm test:e2e     # end-to-end tests
```

## Context

Built while following Rocketseat's *Ignite Node.js* course. The commit
history tracks the course module by module: a plain domain layer first
(no framework, no database — just entities, use cases and in-memory
repositories), then progressively wrapped in NestJS, Prisma, auth, file
uploads, domain events and caching, each stage synced against the
official course repository and verified against its test suite before
moving on.
