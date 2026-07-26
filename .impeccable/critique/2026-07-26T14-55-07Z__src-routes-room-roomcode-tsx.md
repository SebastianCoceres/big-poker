---
target: room de BigPoker (src/routes/room/$roomCode.tsx)
total_score: 21
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 2
timestamp: 2026-07-26T14-55-07Z
slug: src-routes-room-roomcode-tsx
---
Method: dual-agent (A: revisión de diseño aislada · B: detector + evidencia de browser aislada, sin verse entre sí)

## Design Health Score

| # | Heurística | Score | Hallazgo clave |
|---|-----------|-------|-----------------|
| 1 | Visibilidad del estado del sistema | 3 | Buen feedback en vivo (contador de votos, pill "Ya votaste", checkmarks), pero no hay ningún indicador durante `connectionState === "connecting"` en la primera carga — pantalla vacía hasta el primer snapshot SSE. |
| 2 | Coincidencia con el mundo real | 3 | Copy en español claro, convención estándar de Planning Poker respetada; "master" nunca se explica a quien no conoce el juego. |
| 3 | Control y libertad del usuario | 1 | Sin forma de salir de una sala, cancelar una ronda iniciada por error, ni botón de "volver". |
| 4 | Consistencia y estándares | 2 | Sistema `demo-*` consistente puertas adentro, pero el Header trae branding de TanStack sin adaptar — **corroborado por el detector**: `ai-color-palette` marcó 13 veces los mismos íconos de nav/chip como paleta genérica de IA. |
| 5 | Prevención de errores | 2 | Inputs con `maxLength`/`required`, pero sin chequeo de nombres duplicados en la misma sala (confirmado en `rooms.server.ts`, valida solo longitud). |
| 6 | Reconocimiento antes que recuerdo | 3 | Código de sala siempre visible, tooltip con nombre completo en cada avatar. |
| 7 | Flexibilidad y eficiencia | 1 | Cero atajos de teclado para votar/revelar/iniciar ronda — todo mouse/tap, para una herramienta de uso diario en reuniones. |
| 8 | Diseño estético y minimalista | 2 | Paleta e islas con identidad propia, pero el detector confirma **jerarquía tipográfica chata** (`flat-type-hierarchy`: tamaños 10–18px, ratio ~1.6–1.8:1) y 4 casos de **bajo contraste** — coincide con la observación cualitativa de que el `ResultsPanel` es texto plano sin jerarquía. |
| 9 | Ayuda a reconocer/recuperarse de errores | 3 | `CardBoard` preserva la carta elegida y ofrece "Reintentar" tras un fallo de red; errores server-side específicos (`ROOM_NOT_FOUND`, `INVALID_NAME`). |
| 10 | Ayuda y documentación | 1 | Sin onboarding ni tooltip que explique la escala Fibonacci o `?`/`☕` a alguien nuevo en Planning Poker. |
| **Total** | | **21/40** | **Aceptable — mejoras significativas necesarias antes de que los usuarios estén conformes.** |

Ninguna heurística es `n/a`: este es un producto **Operate** puro (tarea repetida en una reunión real), así que las 10 aplican — de hecho 3, 7 y 10 son las más débiles.

## Veredicto de Especificidad de Diseño

**LLM (Assessment A)**: No está autorado para BigPoker todavía — es una plantilla de TanStack con una skin de color encima. El `Header` tiene links en vivo a `x.com/tan_stack` y `github.com/TanStack`, visibles en cada pantalla, incluida la sala en plena votación. La paleta "sea/lagoon/palm" y la tipografía Fraunces/Manrope sí tienen carácter propio — el trabajo de marca está bien encaminado — pero el chrome de navegación (Header/Footer) no se adaptó al producto real.

**Scan determinístico (Assessment B)**: `detect.mjs --json` sobre `src/routes/room`, `src/components/room` y `src/routes/index.tsx` dio `[]` (0 hallazgos) — pero es un **falso negativo estructural**: los analizadores de página completa del detector (`single-font`, `flat-type-hierarchy`, `marketing-buzzword`, etc.) exigen literalmente `<!doctype>`/`<html>`/`<head>` en el texto del archivo para activarse, algo que ningún `.tsx` de React va a tener nunca — así que esa clase de reglas nunca corre vía CLI en este stack, sea cual sea su cobertura nominal de extensiones. La evidencia real vino del navegador: inyectando el detector en vivo sobre `http://localhost:3001` encontró **23 anti-patrones en Home** y **22 en la sala esperando ronda**, incluyendo `ai-color-palette` ×13 (los mismos íconos cyan de nav/chip que Assessment A señaló como branding sin adaptar), `low-contrast` ×4 (1.7:1, 1.3:1, 1.3:1, 4.3:1 — todos por debajo del mínimo AA de 4.5:1), `flat-type-hierarchy`, `dark-glow` ×3, `clipped-overflow-container` ×3, `cramped-padding` ×3, `bounce-easing` ×1 (overshoot elástico), y `undersized-functional-text` sobre las iniciales del avatar.

Advertencia honesta sobre los 4 hallazgos de `low-contrast`: tres de los valores medidos (`#afcdc8`, `#b8efe5`, `#d0d5dd`) corresponden a variables CSS pensadas para **modo oscuro** apareciendo supuestamente "sobre blanco" — esto puede ser un bug real (algún elemento no theming correctamente) o un artefacto de cómo el detector muestreó el fondo durante la inyección en vivo. Ambos sub-agentes reportaron inestabilidad del navegador compartido durante esta corrida (pestañas que se congelaron, contención entre los dos agentes corriendo en paralelo sobre el mismo Chrome). Recomiendo una verificación manual puntual antes de tratar esto como confirmado al 100%, aunque el patrón (3 de 4 casos son la misma familia de valores dark-mode) es sospechoso de un problema real, no solo ruido aleatorio.

**Overlays visuales**: confirmados como realmente visibles en pantalla (Assessment B verificó con un screenshot que las cajas amarillas con las etiquetas de regla aparecían superpuestas sobre la página real, no una alucinación) — se mostraron en la pestaña `[Human]` durante la corrida, ya cerrada al finalizar.

## Impresión General

BigPoker tiene una identidad de marca real (paleta costera, tipografía con carácter, sistema `demo-*` consistente) y una capa de resiliencia de tiempo real genuinamente sólida para el caso de uso (reconexión, banner de master desconectado, preservación de voto en `CardBoard`). El problema no es la base — es que el "chrome" de la app (Header/Footer del scaffold original) nunca terminó de mudarse al producto real, y el momento más importante de cada ronda (el reveal del resultado) es visualmente el más pobre de toda la experiencia. La mayor oportunidad: rematar la migración de marca (ya reconocida en `PRODUCT.md`) y darle al `ResultsPanel` la jerarquía visual que se merece como clímax de cada ronda.

## Lo que Funciona

1. **Reconexión y resiliencia de tiempo real** (`useRoomStream`, `ConnectionBanner`): distingue correctamente `reconnecting` de `room-gone` siguiendo el spec real de `EventSource`, y cubre el caso específico de "el master se desconectó, podés seguir votando" — el tipo de detalle que una reunión presencial real necesita.
2. **Recuperación de errores en el voto** (`CardBoard`): si el voto falla en red, la carta elegida se preserva y aparece "Reintentar" sin forzar a re-elegir.
3. **Identidad de marca propia en la paleta/tipografía** (Fraunces + Manrope, paleta sea/lagoon/palm) — no es el genérico azul-botón de cualquier SaaS.

## Issues Prioritarios

**[P1] El Footer global se superpone con la `ParticipantBar` fija.**
Confirmado con `getBoundingClientRect()` en vivo: el footer queda ~52px tapado por la barra fija de participantes en la vista de sala. El `Footer` se renderiza globalmente desde `__root.tsx` en *todas* las rutas, sin reservarle espacio a la barra fija que solo existe en `/room/$roomCode`.
**Por qué importa**: layout roto medible, no una opinión — y mostrar el footer de marketing en medio de una tarea operativa es ruido que compite con el panel de la ronda.
**Fix**: esconder el `Footer` global en rutas `/room/*`, o agregarle padding-bottom dinámico igual a la altura de `ParticipantBar`.
**Comando sugerido**: `/impeccable harden`

**[P1] El voto de un participante desconectado queda casi ilegible.**
`ParticipantBar.tsx` aplica `opacity-40` a todo el círculo del avatar cuando `!p.connected`, **incluido el badge de voto ya revelado**. Confirmado con zoom en vivo sobre un `ResultsPanel` revelado.
**Por qué importa**: ocurre justo en el escenario que el propio producto anticipa ("el master se desconectó, podés seguir votando") y en el momento donde más se necesita leer el voto de todos para discutir.
**Fix**: atenuar solo el círculo de fondo, no el badge de voto/check — o marcar la desconexión con un borde punteado en vez de opacidad reducida.
**Comando sugerido**: `/impeccable harden`

**[P2] Branding de TanStack sin adaptar en el Header, corroborado por el detector.**
Links activos a X/GitHub de TanStack visibles en cada pantalla, incluida la sala en plena votación. El detector confirmó independientemente estos mismos íconos como patrón `ai-color-palette` (13 instancias). `PRODUCT.md` ya reconoce el nombre "BigPoker" pendiente de reemplazar "Planning Poker" — esto es la misma migración, todavía sin terminar.
**Por qué importa**: para un producto cuyo principio explícito es "autohosteable, sin dependencias externas", tener links salientes a redes de otro proyecto en cada pantalla de trabajo es una inconsistencia de marca que además distrae en la tarea.
**Fix**: sacar esos links del Header (o condicionarlos fuera de `/room/*`) y completar el rename a BigPoker.
**Comando sugerido**: `/impeccable distill`

**[P2] Sin prevención de nombres duplicados dentro de la misma sala.**
`rooms.server.ts` valida `INVALID_NAME` solo por longitud — nunca chequea unicidad. Dos "Fede" en la misma reunión comparten iniciales en `ParticipantBar`, distinguibles solo por el color de avatar (hash del id) y una etiqueta de 10px.
**Por qué importa**: en una reunión real con nombres comunes, esto genera ambigüedad justo al discutir "¿quién votó qué?".
**Fix**: si el nombre (trim + case-insensitive) ya existe en la sala, sugerir agregar inicial de apellido o rechazar con mensaje claro.
**Comando sugerido**: `/impeccable harden`

**[P3] Sin loading state en la primera conexión SSE.**
`ConnectionBanner` devuelve `null` para `"connecting"`, y no hay nada renderizado hasta que llega el primer snapshot. En una red lenta, pantalla vacía por varios segundos.
**Fix**: un placeholder simple ("Conectando a la sala...").
**Comando sugerido**: `/impeccable polish`

## Persona Red Flags

**Casey (mobile, una mano, reunión presencial)**
- La tira de 13 cartas en `CardBoard` no tiene ninguna pista visual (fade, flecha, dots) de que hay más cartas fuera de pantalla — con el pulgar y poca paciencia, puede no notar que existen `21, 34, 55, 89, ?, ☕`.
- El detector confirma `undersized-functional-text` sobre las iniciales del avatar; el nombre debajo es `text-[10px]` truncado a 3rem — con 6+ personas en la barra horizontal, leer nombres cortados de 10px con el pulgar tapando parte de la pantalla es forzar la vista.
- Nada anclado en la mitad inferior para la acción principal del master — el `QuestionPanel` vive arriba del todo, lejos de la zona del pulgar.

**Jordan (primera vez con Planning Poker)**
- Cero explicación de qué significan `?`/`☕`, ni de por qué la media se "redondea hacia arriba" — un resultado como este puede parecer arbitrario sin contexto.
- El rol "master" nunca se define en la UI más allá de "vas a ser el master" en la Home.

**Riley (stress-test, reconexión, refresh)**
- El voto de un desconectado casi ilegible (ver Issue P1) es exactamente lo que Riley encontraría al simular una laptop que se duerme a mitad de reunión.
- El re-join automático solo se intenta una vez por montaje — si ese primer intento falla por red inestable, no hay reintento ni aviso al usuario.
- Nombres duplicados (Issue P2) es el tipo de caso borde que Riley documentaría metódicamente.

## Observaciones Menores

- El ciclo del `ThemeToggle` (Light→Dark→Auto→Light) deja "Auto" en el medio, atípico frente a la convención de ponerlo primero o último.
- `dark-glow` ×3 (box-shadow coloreado sobre fondo oscuro) y `bounce-easing` ×1 (cubic-bezier elástico) son detalles cosméticos menores, no bloqueantes, pero valen una revisión en una pasada de pulido.
- `ResultsPanel` es texto plano sin jerarquía tipográfica que distinga el valor de la media del resto de la oración — el momento más importante de la ronda es el visualmente más pobre.
- Un intento de iniciar ronda quedó colgado ("Iniciar ronda" deshabilitado sin recuperarse) durante la corrida de Assessment A — probablemente contención del navegador compartido entre los dos sub-agentes corriendo en simultáneo (Assessment B documentó fallas similares de timeout en pestañas propias, incluso en blanco), no un bug confirmado del producto. No lo cuento como issue real; vale la pena una prueba manual puntual si se quiere descartar del todo.

## Preguntas para Considerar

- ¿Qué pasaría si el resultado revelado tuviera el mismo peso visual que el título de la pregunta, en vez de ser un párrafo de alerta genérico?
- Si el principio #1 del producto es "cero fricción" y ya se autohostea sin dependencias externas, ¿por qué el primer contacto visual en cada pantalla sigue siendo el branding de otro proyecto?
- ¿Vale una micro-animación de "reveal" más ceremoniosa al mostrar los votos, dado que es el clímax emocional de cada ronda?
- Con 8+ personas en la reunión, ¿la barra de avatares horizontal-scroll sigue siendo usable, o en algún punto necesita agruparse ("+3 más")?
