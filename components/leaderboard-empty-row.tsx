export const EMPTY_LEADERBOARD_MESSAGE = "¡Sé el primero en registrar tu puntaje!";

export function LeaderboardEmptyRow() {
  return (
    <div className="lb-row lb-empty">
      <div className="rk">#01</div>
      <div className="pl">{EMPTY_LEADERBOARD_MESSAGE}</div>
      <div className="sc">---</div>
    </div>
  );
}
