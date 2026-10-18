interface TerminalSuccessProps {
  senderName: string;
  onReset: () => void;
}

export function TerminalSuccess({ senderName, onReset }: TerminalSuccessProps) {
  return (
    <div className="terminal-success">
      <div className="term-bar">
        <span className="dot r" /><span className="dot y" /><span className="dot g" />
        <span className="term-title">VAULT-OS // TERMINAL</span>
      </div>
      <div className="term-body">
        <div className="line"><span className="prompt">vault@arcade:~$</span> ./send_message --to=team</div>
        <div className="line dim">[OK] Conectando con servidor…</div>
        <div className="line dim">[OK] Validando contenido…</div>
        <div className="line dim">[OK] Transmitiendo paquete…</div>
        <div className="line success">
          &gt; MENSAJE RECIBIDO. TE RESPONDEREMOS PRONTO. GRACIAS, {senderName.toUpperCase()}.
          <span className="caret">_</span>
        </div>
        <div style={{ marginTop: 18 }}>
          <button className="btn ghost" type="button" onClick={onReset}>ENVIAR OTRO MENSAJE</button>
        </div>
      </div>
    </div>
  );
}
