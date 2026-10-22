---
name: spec-impl-game
description: Implementa una spec aprobada de un juego con el mismo flujo SDD de /spec-impl y, al terminar, ejecuta en secuencia los agentes skin-designer y mobile-porter sobre ese juego.
disable-model-invocation: true
argument-hint: <NN-id-game>
allowed-tools: Read, Glob, Grep, Edit, Write, AskUserQuestion, Agent, Bash(git status:*), Bash(git branch:*), Bash(git checkout:*), Bash(git log:*), Bash(git diff:*), Bash(git stash:*), Bash(cat:*), Bash(ls:*)
---

# /spec-impl-game — Implementación de specs de juegos + skins + móvil

## Contexto de la sesión

Estado del repositorio:
!`git status --short`

Rama actual:
!`git branch --show-current`

Specs disponibles:
!`ls specs/ 2>/dev/null || echo "The specs/ folder does not exist"`

Configuración de ramas:
!`cat specs/.spec-config.yml 2>/dev/null || echo "AutoCreateBranch: true (default, no config file)"`

---

## Instrucciones

Este comando **reutiliza** `/spec-impl`; no dupliques sus reglas.

### Fases 1–4 — Flujo de `/spec-impl`

1. Lee `~/.claude/skills/spec-impl/SKILL.md`.
2. Sigue sus Fases 1 a 4 **al pie de la letra** con el argumento `$ARGUMENTS` y el contexto de sesión de arriba (validación del estado «Aprobado», rama `spec-NN-slug`, resumen de la spec, implementación paso a paso con pausas, nunca commitear).
3. **Validación extra en la Fase 1:** la spec debe ser de un juego (archivo `specs/NN-<id>-game.md` o una spec que cree `lib/games/<id>/`). Si no lo es, detente y sugiere usar `/spec-impl`.
4. Al terminar el último paso **no** muestres el mensaje final de `/spec-impl`: pasa a la Fase 5.

### Fase 5 — Skins y versión móvil

Solo cuando el usuario haya confirmado el último paso del plan:

1. Resuelve el `game-id` (del nombre de la spec o de `lib/games/<id>/`). Si es ambiguo, pregunta.
2. Anuncia: `▶ Ejecutando skin-designer sobre <game-id>…`
3. Lanza el agente **`skin-designer`** con el `game-id`. **Espera su resultado** antes de seguir y resume lo que hizo.
4. Si `skin-designer` falló o reportó errores de `tsc`/`lint`/Playwright, **detente**, muéstralos y pregunta cómo seguir. No lances el siguiente agente.
5. Anuncia: `▶ Ejecutando mobile-porter sobre <game-id>…`
6. Lanza el agente **`mobile-porter`** con el `game-id`. Espera su resultado y resúmelo.

Reglas: los agentes van **uno después del otro, nunca en paralelo**. No commitees.

Mensaje final:

```
✅ Spec implementada, skins (skin-designer) y versión móvil (mobile-porter) aplicadas.

Siguiente paso: verifica los criterios de aceptación uno por uno.
Si todos pasan, cambia el estado de la spec a "Implemented" y haz el commit final
antes de integrar la rama.
```
