# ADR-001: Frontend module boundaries

## Status
Accepted

## Decision
JCWS frontend capabilities are organized into feature modules under `src/modules`. Cross-cutting services belong under `src/core`; reusable presentation components belong under `src/shared`; application composition belongs under `src/app`.

## Consequences
- Feature modules can be lazy loaded.
- Core services must not import feature modules.
- Temporary compatibility re-exports remain until all legacy imports are migrated.
