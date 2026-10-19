export function GamesEmptyState() {
  return (
    <div
      style={{ textAlign: "center", padding: 80, color: "var(--ink-faint)" }}
    >
      <div
        className="pixel"
        style={{ fontSize: 14, color: "var(--magenta)", marginBottom: 12 }}
      >
        NO HAY JUEGOS DISPONIBLES
      </div>
      <div>Todavía no hay juegos publicados. Vuelve pronto.</div>
    </div>
  );
}
