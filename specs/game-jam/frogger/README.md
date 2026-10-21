# Game jam — RANA AL CRUCE

- **Juego pedido:** Frogger — cruza la carretera y el río sin convertirse en papilla.
- **Fecha:** 2026-10-21
- **`id`:** `frogger`
- **Título:** `RANA AL CRUCE`
- **Categoría:** `ARCADE`
- **Color:** `green`

Las tres variantes comparten id, título, carpeta, el canvas de 800×600 con una grilla de 20×15 celdas de 40 px, el mismo trazado (casas, río, mediana, carretera y salida) y el dibujo vectorial en canvas (no hay assets de ranas, autos ni troncos en el repo). Lo que cambia es el diseño del juego.

| Archivo                                              | Enfoque                                                                                                     | Vidas                      | Niveles                                               | Complejidad |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | -------------------------- | ----------------------------------------------------- | ----------- |
| [spec-a-classic.md](spec-a-classic.md)               | Arcade clásico: 5 casas, temporizador por rana, tortugas que bucean y dificultad creciente sin fin.         | 3 (+1 a los 10 000 puntos) | Infinitos; velocidad ×(1 + 0,15 por nivel), tope ×2,5 | Media       |
| [spec-b-five-crossings.md](spec-b-five-crossings.md) | 5 niveles diseñados con amenazas nuevas (cocodrilos, serpiente, cocodrilo en casa), mosca bonus y victoria. | 3                          | 5 diseñados, victoria al completar el 5               | Alta        |
| [spec-c-time-attack.md](spec-c-time-attack.md)       | Contrarreloj de 90 s sin vidas: morir cuesta 3 s, rachas de casas multiplican puntos.                       | Sin vidas (`♥` fijo)       | Rondas infinitas por progreso; +15 s por ronda        | Baja-media  |

## Siguiente paso

Elegir una variante, moverla a `specs/12-frogger-game.md` (12 = mayor número actual en `specs/` + 1), cambiar el encabezado a `# SPEC 12 — …` y ejecutar `/spec-impl 12-frogger-game`.
