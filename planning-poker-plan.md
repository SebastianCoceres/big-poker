# Planning Poker Web - Plan de implementación

## Objetivo

Crear una aplicación web ligera para sustituir las cartas físicas de
Planning Poker durante sesiones de Planning y Refinamiento.

El objetivo es que una estimación completa requiera únicamente:

1.  Crear sesión.
2.  Unirse.
3.  Escribir la historia.
4.  Votar.
5.  Revelar.
6.  Repetir.

La aplicación debe priorizar velocidad, simplicidad y tiempo real.

---

## Stack tecnológico

### Fullstack

- TanStack Start
- React 19
- TypeScript
- Tailwind CSS v4
- shadcn/ui
- TanStack Query
- TanStack Router

### Tiempo real

- WebSocket bidireccional
- Implementación en el backend de TanStack Start

### Backend

- TanStack Start server functions para operaciones de negocio y auth
- TanStack Start server routes para endpoints HTTP puntuales
- Middleware / context para sesión y autorización
- Validación de inputs en server functions

### Base de datos

- SQLite para MVP
- ORM recomendado: Drizzle ORM
- Migraciones simples y esquema tipado en TypeScript

---

# Roles

## Scrum Master

Puede:

- Crear sesión
- Cerrar sesión
- Iniciar votación
- Revelar votos
- Reiniciar votación
- Cambiar historia
- Finalizar sesión

## Participante

Puede:

- Unirse
- Votar
- Cambiar voto mientras no se revele
- Abandonar sesión

---

# Flujo

Home

↓

Nueva sesión

↓

Participantes se unen

↓

Master escribe historia

↓

Iniciar votación

↓

Todos votan

↓

Revelar

↓

Discusión

↓

Nueva historia

↓

Finalizar

---

# Páginas

## Login

Autenticación.

## Sala

Componentes:

- Cabecera
- Historia actual
- Participantes
- Cartas
- Resultados
- Toolbar Master

---

# Componentes

## SessionHeader

- Nombre
- Código
- Estado

## ParticipantsList

Cada participante muestra:

- Avatar
- Nombre
- Estado

Estados:

- Esperando
- Ha votado

Nunca mostrar el valor antes del reveal.

---

## StoryCard

Información:

- Título
- Descripción opcional
- Enlace Azure DevOps/Jira (v2)

---

## VotingBoard

Cartas:

- 0
- 1
- 2
- 3
- 5
- 8
- 13
- 21
- 34
- 55
- 89
- ?
- ☕

---

## ResultsBoard

Tras revelar:

Mostrar:

- Todas las cartas
- Moda
- Valor final

Futuro:

- Dispersión
- Re-votar

---

# Estados de sesión

WaitingPlayers

Ready

Voting

Revealed

Finished

---

# Eventos WebSocket

## Cliente → Servidor

CreateSession

JoinSession

LeaveSession

StartRound

Vote

RevealVotes

ResetVotes

FinishSession

---

## Servidor → Cliente

SessionUpdated

ParticipantJoined

ParticipantLeft

ParticipantVoted

RoundStarted

VotesRevealed

RoundReset

SessionClosed

---

# Modelo de datos

## Session

- Id
- Name
- Code
- CreatedBy
- Status
- CreatedAt

## Participant

- Id
- SessionId
- UserId
- DisplayName
- IsMaster
- JoinedAt

## Round

- Id
- SessionId
- StoryTitle
- StoryDescription
- Revealed
- StartedAt
- EndedAt

## Vote

- RoundId
- ParticipantId
- Value

---

# UX

- Cartas grandes y táctiles.
- Animación flip al revelar.
- Mostrar únicamente quién ha votado.
- Botón "Nueva historia".
- Botón "Re-votar".

---

# V2

- Historial de rondas.
- Integración Azure DevOps.
- Integración Jira.
- Estadísticas.
- Modo espectador.
- Modo TV.
- Cuenta atrás automática.
- Temas claro/oscuro.

---

# Criterios de aceptación

- Crear sesión en menos de 5 segundos.
- Unirse mediante URL o código.
- Sin recargar la página.
- Actualización en tiempo real.
- Reconexión automática.
- El voto permanece oculto hasta revelar.
- El Master controla el flujo.
- Compatible con escritorio y móvil.

---

# Arquitectura recomendada

app/ login/ dashboard/ session/\[id\]/

components/ session/ voting/ participants/ results/

hooks/ useSession useSignalR

services/ signalr api

server/ hubs/ services/ repositories/

---

# Filosofía del proyecto

- Extremadamente simple.
- Sin configuraciones innecesarias.
- Menos clics que usar cartas físicas.
- Optimizado para reuniones rápidas.
- Toda la interacción ocurre en tiempo real.
