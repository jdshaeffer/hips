const fonts = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Mono:wght@400;500&display=swap');
`;

interface Props {
  onPlay: () => void;
  onBack: () => void;
}

export default function GameSelect({ onPlay, onBack }: Props) {
  return (
    <>
      <style>{fonts}</style>
      <style>{css}</style>
      <div className="gs-root">
        <button className="gs-back" onClick={onBack}>← back</button>
        <div className="gs-content">
          <p className="gs-label">select mode</p>
          <div className="gs-card" onClick={onPlay}>
            <span className="gs-card-title">ninjas and statues</span>
            <span className="gs-card-desc">hide in plain sight</span>
            <span className="gs-card-arrow">→</span>
          </div>
        </div>
      </div>
    </>
  );
}

const css = `
.gs-root {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #111116;
  animation: menu-fade 0.4s ease both;
}

@keyframes menu-fade {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}

.gs-back {
  position: fixed;
  top: 28px;
  left: 32px;
  font-family: 'DM Mono', monospace;
  font-size: 12px;
  letter-spacing: 0.15em;
  color: #444;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0;
  transition: color 0.15s;
}

.gs-back:hover {
  color: #888;
}

.gs-content {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 20px;
}

.gs-label {
  font-family: 'DM Mono', monospace;
  font-size: 11px;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  color: #444;
  margin: 0;
}

.gs-card {
  display: grid;
  grid-template-columns: 1fr auto;
  grid-template-rows: auto auto;
  align-items: center;
  gap: 6px 24px;
  width: 340px;
  padding: 24px 28px;
  border: 1px solid #2a2a32;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
  background: transparent;
}

.gs-card:hover {
  border-color: #555;
  background: #16161c;
}

.gs-card-title {
  font-family: 'Bebas Neue', sans-serif;
  font-size: 28px;
  letter-spacing: 0.08em;
  color: #e8e8e8;
  grid-column: 1;
  grid-row: 1;
}

.gs-card-desc {
  font-family: 'DM Mono', monospace;
  font-size: 11px;
  letter-spacing: 0.12em;
  color: #555;
  grid-column: 1;
  grid-row: 2;
}

.gs-card-arrow {
  font-family: 'DM Mono', monospace;
  font-size: 18px;
  color: #444;
  grid-column: 2;
  grid-row: 1 / 3;
  align-self: center;
  transition: color 0.15s, transform 0.15s;
}

.gs-card:hover .gs-card-arrow {
  color: #e8e8e8;
  transform: translateX(4px);
}
`;
