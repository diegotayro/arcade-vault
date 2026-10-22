---
name: suggestion-pong
description: Detalle de la sugerencia PING PONG (`pong`, SPORTS, 57/60) del 2026-10-21 — desglose, mecánicas, riesgos y assets.
metadata:
  type: project
---

# PING PONG (`pong`) · SPORTS · 57/60 · sugerido 2026-10-21

Título genérico «PING PONG» para evitar la marca registrada «PONG» (Atari).

## Desglose

| Criterio                 | Nota | Peso | Total |
| ------------------------ | ---- | ---- | ----- |
| Diversidad de categorías | 5    | x3   | 15    |
| Factibilidad Canvas 2D   | 5    | x3   | 15    |
| Reconocimiento clásico   | 5    | x3   | 15    |
| Puntaje competitivo      | 3    | x1   | 3     |
| Controles simples        | 5    | x1   | 5     |
| Sesiones cortas          | 4    | x1   | 4     |
| **Total**                |      |      | 57    |

## Mecánicas propuestas

- Jugador vs CPU; teclas ↑/↓ o W/S.
- Puntaje: +100 por punto ganado, bonus por rally largo y por nivel; la CPU acelera por nivel.
- Partida termina cuando la CPU llega a N puntos (sin vidas → `hasLives: false`, o goles en contra como vidas).

## Riesgos

- Leaderboard poco expresivo si solo cuenta goles: necesita fórmula con rallies/niveles.
- IA de CPU debe ser vencible pero no trivial (velocidad máxima + error aleatorio).

## Assets

- Ninguno obligatorio (formas vectoriales). Sonidos opcionales (bip de rebote).
- Sin base en `references/started-games/` (solo contiene juegos ya portados).
