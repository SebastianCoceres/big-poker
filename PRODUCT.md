# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
Equipos que hacen Planning Poker durante reuniones de Planning/Refinamiento presenciales — no un equipo específico, sino cualquier equipo que autohostee la app. No hay onboarding de cuentas: alguien crea una sala al momento y comparte un código verbal/escrito con el resto, que se suma desde su propio dispositivo en la misma reunión.

## Product Purpose
Reemplazar las cartas físicas de Planning Poker con una herramienta web mínima para estimar historias en equipo. Un participante (el "master") escribe la pregunta/historia, el resto vota con una escala Fibonacci, y al revelar se calcula la media (redondeada hacia arriba al Fibonacci más cercano) o se avisa que hace falta discusión si alguien votó una carta de duda (`?`/`☕`). Éxito = una ronda completa (crear sala → unirse → votar → revelar) toma segundos, sin fricción de configuración.

## Positioning
A diferencia de otras herramientas de Planning Poker existentes, BigPoker no depende de una cuenta ni de un servicio de terceros: se autohostea (Docker, un solo proceso, sin base de datos) y arranca sin login — se entra a una URL, se crea o une a una sala con un código, y listo. El control de los datos (autohosteo) y la fricción cero para empezar pesan igual como razones para elegirlo.

## Operating Context
Uso durante reuniones presenciales de Planning/Refinamiento: varias personas en la misma sala física, cada una en su propio dispositivo, mirando la misma sala compartida por código. Pensado para tiempo real estricto (Server-Sent Events) porque todos están presentes al mismo tiempo — no hay caso de uso asincrónico.

## Capabilities and Constraints
- Crear sala (queda como master) o unirse con un código de 6 caracteres (alfabeto sin `0/O/1/I` para poder dictarlo en voz alta).
- El master escribe la pregunta/historia, inicia la ronda, revela los votos e inicia nuevas rondas; también puede votar como cualquier participante.
- Escala de votación: `0, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, ?, ☕`.
- Al revelar: si todos los votos son numéricos, se calcula la media redondeada hacia arriba al valor Fibonacci más cercano; si alguien votó `?`/`☕`, no se calcula media y se avisa que hace falta discusión/re-voto.
- Sin cuentas, sin login, sin base de datos: el estado de cada sala vive en memoria del proceso Node mientras corre; un reinicio del proceso borra todas las salas (aceptado explícitamente).
- Pensado para un único contenedor Docker — no tolera múltiples réplicas balanceadas, ya que el estado vive en memoria de un solo proceso.
- Sin roles más allá de master/participante; sin historial de rondas, sin integración con Jira/Azure DevOps, sin modo espectador (fuera de alcance actual).

## Brand Commitments
Nombre confirmado: **BigPoker**. El branding visible en el código (Header, título de la página) todavía dice "Planning Poker" — pendiente de actualizar para reflejar el nombre definitivo.

## Evidence on Hand
Ninguna todavía: sin testimonios, casos de estudio, ni datos de uso real. No inventar ninguno en trabajo futuro.

## Product Principles
- Cero fricción: menos pasos que usar cartas físicas, sin cuentas ni configuración.
- Tiempo real estricto: pensado para gente presente en la misma reunión al mismo tiempo, no para uso asincrónico.
- Autohosteable y sin dependencias externas: un contenedor, sin base de datos, sin servicios de terceros.
- Simplicidad deliberada por sobre features: sin historial, sin integraciones, sin roles adicionales — cada adición futura debe justificar el costo contra esta simplicidad.

## Accessibility & Inclusion
No se estableció ningún requisito específico de accesibilidad todavía.
