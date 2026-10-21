---
name: suggestion-crossing
description: Detalle de la sugerencia CRUCE (`crossing`, ACTION, 57/60, estilo Frogger) del 2026-10-21 — desglose, mecánicas, riesgos y assets.
metadata:
  type: project
---

# CRUCE (`crossing`) · ACTION · 57/60 · sugerido 2026-10-21

Título genérico «CRUCE» para evitar la marca «Frogger» (Konami/Sega).

## Desglose

| Criterio                 | Nota | Peso | Total |
| ------------------------ | ---- | ---- | ----- |
| Diversidad de categorías | 4    | x3   | 12    |
| Factibilidad Canvas 2D   | 5    | x3   | 15    |
| Reconocimiento clásico   | 5    | x3   | 15    |
| Puntaje competitivo      | 5    | x1   | 5     |
| Controles simples        | 5    | x1   | 5     |
| Sesiones cortas          | 5    | x1   | 5     |
| **Total**                |      |      | 57    |

Diversidad 4 (no 5): ACTION es nueva en el catálogo, pero el género podría percibirse como ARCADE (ya cubierta).

## Mecánicas propuestas

- Movimiento por casillas con flechas/WASD (un salto por pulsación).
- Mitad inferior: carretera con carriles de vehículos a distintas velocidades/direcciones (colisión = muerte).
- Mitad superior: río con troncos/tortugas que transportan al jugador (caer al agua = muerte).
- 5 nichos de llegada; llenarlos todos sube de nivel (más velocidad, más carriles densos).
- Temporizador por vida; vidas (3) → `hasLives: true`.
- Puntaje: +10 por fila nueva avanzada, +50 por nicho, bonus por tiempo restante, +1000 por nivel completo.

## Riesgos

- Bajo. Grid + entidades rectangulares con wrap horizontal; colisión AABB.
- Detalle a cuidar: el jugador "montado" en troncos debe moverse con ellos y morir al salir del borde.

## Assets

- Opcionales: sprites simples (rana, autos, troncos) o formas vectoriales con colores neón. Sonidos opcionales.
- Sin base en `references/started-games/` (vacío al 2026-10-21).
