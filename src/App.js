import React, { useState, useRef, useEffect } from "react";
import "./App.css";
import bg from './assets/images/mario-bg.jpg';

// GIFs (coloque esses arquivos em src/assets com exatamente esses nomes)
import mario from "./assets/mario.gif";
import luigi from "./assets/luigi.gif";
import peach from "./assets/peach.gif";
import yoshi from "./assets/yoshi.gif";
import bowser from "./assets/bowser.gif";
import dk from "./assets/dk.gif";
import toad from "./assets/toad.gif";
import header from "./assets/header.gif";

// Base de personagens
const CHARACTERS = {
  Mario:         { NOME: "Mario",        VELOCIDADE: 4, MANOBRABILIDADE: 3, PODER: 3, IMG: mario },
  Luigi:         { NOME: "Luigi",        VELOCIDADE: 3, MANOBRABILIDADE: 4, PODER: 4, IMG: luigi },
  Peach:         { NOME: "Peach",        VELOCIDADE: 3, MANOBRABILIDADE: 4, PODER: 2, IMG: peach },
  Yoshi:         { NOME: "Yoshi",        VELOCIDADE: 2, MANOBRABILIDADE: 4, PODER: 3, IMG: yoshi },
  Bowser:        { NOME: "Bowser",       VELOCIDADE: 5, MANOBRABILIDADE: 2, PODER: 5, IMG: bowser },
  "Donkey Kong": { NOME: "Donkey Kong",  VELOCIDADE: 2, MANOBRABILIDADE: 2, PODER: 5, IMG: dk },
  Toad:          { NOME: "Toad",         VELOCIDADE: 3, MANOBRABILIDADE: 5, PODER: 1, IMG: toad },
};

// Utilidades
const rollDice = () => Math.floor(Math.random() * 6) + 1;
const getRandomBlock = () => {
  const r = Math.random();
  if (r < 0.33) return "RETA";
  if (r < 0.66) return "CURVA";
  return "CONFRONTO";
};

export default function App() {
  // aplica background importado via JS (garante que o bundler resolva o caminho)
  useEffect(() => {
    document.body.style.background = `linear-gradient(180deg, rgba(28,40,64,.35), rgba(28,40,64,.35)), url(${bg}) center / cover no-repeat fixed`;
    return () => { document.body.style.background = ''; };
  }, []);

  // seleção de pilotos
  const [p1Name, setP1Name] = useState("Mario");
  const [p2Name, setP2Name] = useState("Luigi");

  // estado da corrida
  const [logs, setLogs] = useState([]);
  const [score, setScore] = useState({ p1: 0, p2: 0 });
  const [progress, setProgress] = useState({ p1: 0, p2: 0 }); // 0..85 (% da pista)
  const [running, setRunning] = useState(false);
  const [winner, setWinner] = useState("");
  const [lastRoundWinner, setLastRoundWinner] = useState(null); // 'p1' | 'p2' | null

  // confete
  const [confetti, setConfetti] = useState([]);

  // timeouts para limpar no reset/unmount
  const timeoutsRef = useRef([]);
  const names = Object.keys(CHARACTERS);
  const maxPoints = 5;

  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach((t) => clearTimeout(t));
      timeoutsRef.current = [];
    };
  }, []);

  function pushLog(line) {
    setLogs((prev) => [...prev, line]);
  }

  function flashWinner(side) {
    setLastRoundWinner(side);
    const t = setTimeout(() => setLastRoundWinner(null), 700);
    timeoutsRef.current.push(t);
  }

  function fireConfetti() {
    const COLORS = ["#e11d48", "#22c55e", "#3b82f6", "#f59e0b", "#ffffff"];
    const pieces = Array.from({ length: 60 }).map((_, i) => ({
      id: Date.now() + i,
      left: Math.random() * 100,
      delay: Math.random() * 250,
      duration: 4 + Math.random() * 2,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      spin: 1.2 + Math.random() * 1.4,
    }));
    setConfetti(pieces);
    setTimeout(() => setConfetti([]), 6500);
  }

  function startRace() {
    if (running) return;

    setLogs([]);
    setWinner("");
    setScore({ p1: 0, p2: 0 });
    setProgress({ p1: 0, p2: 0 });
    setLastRoundWinner(null);
    setRunning(true);

    const c1 = { ...CHARACTERS[p1Name], PONTOS: 0 };
    const c2 = { ...CHARACTERS[p2Name], PONTOS: 0 };

    timeoutsRef.current.forEach((t) => clearTimeout(t));
    timeoutsRef.current = [];

    const roundDuration = 1100;

    pushLog(`🏁🚨 Corrida entre ${c1.NOME} e ${c2.NOME} começando...\n`);

    for (let round = 1; round <= 5; round++) {
      const delay = round * roundDuration;

      const t = setTimeout(() => {
        pushLog(`🏁 Rodada ${round}`);
        const block = getRandomBlock();
        pushLog(`Bloco: ${block}`);

        const d1 = rollDice();
        const d2 = rollDice();

        let total1 = 0;
        let total2 = 0;

        if (block === "RETA") {
          total1 = d1 + c1.VELOCIDADE;
          total2 = d2 + c2.VELOCIDADE;
          pushLog(`${c1.NOME} 🎲 ${d1} + Velocidade(${c1.VELOCIDADE}) = ${total1}`);
          pushLog(`${c2.NOME} 🎲 ${d2} + Velocidade(${c2.VELOCIDADE}) = ${total2}`);
        } else if (block === "CURVA") {
          total1 = d1 + c1.MANOBRABILIDADE;
          total2 = d2 + c2.MANOBRABILIDADE;
          pushLog(`${c1.NOME} 🎲 ${d1} + Manobrabilidade(${c1.MANOBRABILIDADE}) = ${total1}`);
          pushLog(`${c2.NOME} 🎲 ${d2} + Manobrabilidade(${c2.MANOBRABILIDADE}) = ${total2}`);
        } else {
          const power1 = d1 + c1.PODER;
          const power2 = d2 + c2.PODER;
          pushLog(`${c1.NOME} confrontou ${c2.NOME}! 🥊`);
          pushLog(`${c1.NOME} 🎲 ${d1} + Poder(${c1.PODER}) = ${power1}`);
          pushLog(`${c2.NOME} 🎲 ${d2} + Poder(${c2.PODER}) = ${power2}`);
          total1 = power1;
          total2 = power2;
        }

        if (total1 > total2) {
          c1.PONTOS++;
          pushLog(`${c1.NOME} marcou 1 ponto!`);
          flashWinner("p1");
        } else if (total2 > total1) {
          c2.PONTOS++;
          pushLog(`${c2.NOME} marcou 1 ponto!`);
          flashWinner("p2");
        } else {
          pushLog("Empate na rodada, ninguém pontuou.");
          flashWinner(null);
        }

        setScore({ p1: c1.PONTOS, p2: c2.PONTOS });
        setProgress({
          p1: Math.round((c1.PONTOS / maxPoints) * 85),
          p2: Math.round((c2.PONTOS / maxPoints) * 85),
        });

        pushLog("-----------------------------");

        if (round === 5) {
          const t2 = setTimeout(() => {
            let msg = "A corrida terminou em empate!";
            if (c1.PONTOS > c2.PONTOS) msg = `${c1.NOME} venceu a corrida! 🏆`;
            else if (c2.PONTOS > c1.PONTOS) msg = `${c2.NOME} venceu a corrida! 🏆`;

            setWinner(msg);
            pushLog(msg);

            if (!msg.includes("empate")) {
              fireConfetti();
            }
            setRunning(false);
          }, 600);
          timeoutsRef.current.push(t2);
        }
      }, delay);

      timeoutsRef.current.push(t);
    }
  }

  function resetRace() {
    timeoutsRef.current.forEach((t) => clearTimeout(t));
    timeoutsRef.current = [];

    setRunning(false);
    setLogs([]);
    setScore({ p1: 0, p2: 0 });
    setProgress({ p1: 0, p2: 0 });
    setWinner("");
    setLastRoundWinner(null);
    setConfetti([]);
  }

  const P1 = CHARACTERS[p1Name];
  const P2 = CHARACTERS[p2Name];

  const champP1 = winner && winner.includes(P1.NOME);
  const champP2 = winner && winner.includes(P2.NOME);

  return (
    <main className="container">
      <div className="page-decor" aria-hidden>
        <span className="cloud cloud-1" style={{ top: "6vh" }} />
        <span className="cloud cloud-2" style={{ top: "12vh" }} />
        <span className="cloud cloud-3" style={{ top: "18vh" }} />

        <span className="coin coin-big" style={{ top: "24vh", left: "12%" }} />
        <span className="coin" style={{ top: "30vh", left: "26%" }} />
        <span className="coin" style={{ top: "22vh", left: "44%" }} />
        <span className="coin coin-big" style={{ top: "28vh", left: "66%" }} />
        <span className="coin" style={{ top: "34vh", left: "82%" }} />

        <span className="block" style={{ top: "42vh", left: "18%" }} />
        <span className="block block-slow" style={{ top: "46vh", left: "52%" }} />
        <span className="block" style={{ top: "40vh", left: "74%" }} />

        {/* decorações na parte inferior */}
        <span className="coin coin-big coin-bottom" style={{ left: "8%" }} />
        <span className="coin coin-bottom" style={{ left: "22%" }} />
        <span className="block block-bottom" style={{ left: "34%" }} />
        <span className="coin coin-bottom" style={{ left: "50%" }} />
        <span className="block block-slow block-bottom" style={{ left: "66%" }} />
        <span className="coin coin-big coin-bottom" style={{ left: "80%" }} />
      </div>

      <header className="header">
        <img src={header} alt="Mario Kart Header" className="header-gif" />
        <h1>Mario Kart.JS</h1>
        <p>Simulação de corrida com 5 rodadas — animações visuais e histórico.</p>
      </header>

      <div className="picker">
        <label>
          Piloto 1:
          <select value={p1Name} onChange={(e) => setP1Name(e.target.value)} disabled={running}>
            {names.map((n) => (
              <option key={n} value={n} disabled={n === p2Name}>{n}</option>
            ))}
          </select>
        </label>

        <label>
          Piloto 2:
          <select value={p2Name} onChange={(e) => setP2Name(e.target.value)} disabled={running}>
            {names.map((n) => (
              <option key={n} value={n} disabled={n === p1Name}>{n}</option>
            ))}
          </select>
        </label>
      </div>

      <section className="versus">
        <div className="bg-elements" aria-hidden>
          <span className="coin" style={{ top: "24px", left: "14%" }} />
          <span className="coin" style={{ top: "52px", left: "32%" }} />
          <span className="coin" style={{ top: "36px", left: "46%" }} />
          <span className="coin" style={{ top: "28px", left: "62%" }} />
          <span className="coin" style={{ top: "48px", left: "78%" }} />

          <span className="block" style={{ top: "86px", left: "26%" }} />
          <span className="block" style={{ top: "78px", left: "58%" }} />
          <span className="block" style={{ top: "94px", left: "72%" }} />
        </div>

        <div
          className={`runner ${lastRoundWinner === "p1" ? "win" : ""} ${champP1 ? "champion" : ""}`}
          style={{ left: `${progress.p1}%` }}
        >
          <img src={P1.IMG} alt={P1.NOME} />
          <h3>{P1.NOME}</h3>
          <p>Pontos: {score.p1}</p>
        </div>

        <div className="finish-line">🏁</div>

        <div
          className={`runner runner-bottom ${lastRoundWinner === "p2" ? "win" : ""} ${champP2 ? "champion" : ""}`}
          style={{ left: `${progress.p2}%` }}
        >
          <img src={P2.IMG} alt={P2.NOME} />
          <h3>{P2.NOME}</h3>
          <p>Pontos: {score.p2}</p>
        </div>
      </section>

      <div className="actions">
        <button onClick={startRace} disabled={running} className="primary">
          {running ? "Corrida em andamento..." : "Iniciar corrida"}
        </button>
        <button onClick={resetRace} className="secondary">Reset</button>
      </div>

      <section className="logs">
        <h4>Histórico</h4>
        {logs.length === 0 && <p className="muted">Nenhuma rodada ainda. Clique em "Iniciar corrida".</p>}
        {logs.map((line, i) => (
          <div key={i} className="log-line">{line}</div>
        ))}
      </section>

      {winner && <h2 className="winner">{winner}</h2>}

      {confetti.length > 0 && (
        <div className="confetti-root" aria-hidden>
          {confetti.map((c) => (
            <span
              key={c.id}
              className="confetti-piece"
              style={{
                left: `${c.left}%`,
                background: c.color,
                animationDuration: `${c.duration}s, ${c.spin}s`,
                animationDelay: `${c.delay}ms, 0s`,
              }}
            />
          ))}
        </div>
      )}
    </main>
  );
}