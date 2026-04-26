import { useState } from "react";

const fonts = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Mono:wght@400;500&display=swap');
`;

interface Props {
  onPlay: (name: string) => void;
}

export default function MainMenu({ onPlay }: Props) {
  const [name, setName] = useState("");

  const trimmed = name.trim();
  const handlePlay = () => trimmed && onPlay(trimmed);

  return (
    <>
      <style>{fonts}</style>
      <style>{css}</style>
      <div className="menu-root">
        <div className="menu-content">
          <h1 className="menu-title">HIPS</h1>
          <input
            className="menu-name-input"
            type="text"
            placeholder="enter your name"
            maxLength={20}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handlePlay()}
            autoFocus
          />
          <button className="menu-btn" onClick={handlePlay} disabled={!trimmed}>Play Now</button>
        </div>
      </div>
    </>
  );
}

const css = `
.menu-root {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #111116;
  animation: menu-fade 0.6s ease both;
}

@keyframes menu-fade {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}

.menu-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 28px;
}

.menu-title {
  font-family: 'Bebas Neue', sans-serif;
  font-size: clamp(96px, 20vw, 200px);
  letter-spacing: 0.12em;
  text-indent: 0.12em;
  color: #e8e8e8;
  margin: 0;
  line-height: 1;
  text-align: center;
}

.menu-name-input {
  font-family: 'DM Mono', monospace;
  font-size: 13px;
  letter-spacing: 0.15em;
  color: #e8e8e8;
  background: transparent;
  border: none;
  border-bottom: 1px solid #333;
  padding: 10px 4px;
  width: 220px;
  text-align: center;
  outline: none;
  transition: border-color 0.15s;
}

.menu-name-input::placeholder {
  color: #444;
}

.menu-name-input:focus {
  border-bottom-color: #666;
}

.menu-btn {
  font-family: 'DM Mono', monospace;
  font-size: 13px;
  letter-spacing: 0.25em;
  text-transform: uppercase;
  color: #888;
  background: transparent;
  border: 1px solid #333;
  padding: 14px 40px;
  cursor: pointer;
  transition: color 0.15s, border-color 0.15s;
  margin-top: 8px;
}

.menu-btn:hover:not(:disabled) {
  color: #e8e8e8;
  border-color: #e8e8e8;
}

.menu-btn:disabled {
  color: #333;
  border-color: #222;
  cursor: default;
}
`;
