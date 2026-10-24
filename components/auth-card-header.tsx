type AuthCardHeaderProps = {
  subtitle: string;
};

export function AuthCardHeader({ subtitle }: AuthCardHeaderProps) {
  return (
    <div className="auth-header">
      <div className="mark"></div>
      <h2 className="neon-cyan">ARCADE VAULT</h2>
      <div className="mono auth-subtitle">{subtitle}</div>
    </div>
  );
}
