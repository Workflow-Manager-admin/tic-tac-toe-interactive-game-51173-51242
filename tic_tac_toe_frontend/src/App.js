import React, { useState, useEffect } from 'react';
import './App.css';

/**
 * Colors and layout decisions (see design requirements):
 * - primary (#1976d2): board outline, X pieces, action buttons
 * - secondary (#ffffff): background
 * - accent (#d32f2f): O pieces, win highlights
 */

/* Square component for the board */
function Square({ value, onClick, highlight }) {
  return (
    <button
      className={`ttt-square${highlight ? " highlight" : ""}`}
      onClick={onClick}
      aria-label={value ? `Square ${value}` : "Empty Square"}
    >
      {value}
    </button>
  );
}

// PUBLIC_INTERFACE
function App() {
  // Game board state: Array(9). 'X', 'O', or null
  const [board, setBoard] = useState(Array(9).fill(null));
  // X is player 1, O is player 2 or AI
  const [xIsNext, setXIsNext] = useState(true);
  // Mode: 'PVP' for 2-player, 'AI' for AI opponent
  const [gameMode, setGameMode] = useState('PVP');
  const [isGameActive, setIsGameActive] = useState(true);
  const [status, setStatus] = useState('');
  const [winnerLine, setWinnerLine] = useState([]);
  const [aiThinking, setAiThinking] = useState(false);

  // Determine the winner and winning line, or if it's a draw
  function calculateWinner(squares) {
    const lines = [
      [0,1,2], [3,4,5], [6,7,8], // rows
      [0,3,6], [1,4,7], [2,5,8], // cols
      [0,4,8], [2,4,6]           // diagonals
    ];
    for (let [a, b, c] of lines) {
      if (
        squares[a] &&
        squares[a] === squares[b] &&
        squares[a] === squares[c]
      ) {
        return { winner: squares[a], line: [a, b, c] };
      }
    }
    if (!squares.includes(null)) {
      return { winner: 'draw', line: [] };
    }
    return null;
  }

  // PUBLIC_INTERFACE
  // Restart the game
  function handleRestart() {
    setBoard(Array(9).fill(null));
    setXIsNext(true);
    setIsGameActive(true);
    setWinnerLine([]);
    setStatus('');
    setAiThinking(false);
  }

  // PUBLIC_INTERFACE
  // Play a move (user or AI)
  function handleClick(i) {
    if (!isGameActive || board[i] || (gameMode === 'AI' && !xIsNext)) {
      return;
    }
    const newBoard = board.slice();
    newBoard[i] = xIsNext ? 'X' : 'O';
    setBoard(newBoard);
    setXIsNext(!xIsNext);
  }

  // AI logic: pick random empty spot or win/block if possible (simple AI)
  function findBestMove(b) {
    // First, win if possible
    for (let i = 0; i < 9; i++) {
      const newB = b.slice();
      if (!newB[i]) {
        newB[i] = 'O';
        if (calculateWinner(newB)?.winner === 'O') return i;
      }
    }
    // Block X win if possible
    for (let i = 0; i < 9; i++) {
      const newB = b.slice();
      if (!newB[i]) {
        newB[i] = 'X';
        if (calculateWinner(newB)?.winner === 'X') return i;
      }
    }
    // Take center
    if (!b[4]) return 4;
    // Take corner
    for (let idx of [0,2,6,8]) if (!b[idx]) return idx;
    // Else pick first free
    for (let i = 0; i < 9; i++) if (!b[i]) return i;
    return null;
  }

  // Run after every board change to check game status & possibly make AI move
  useEffect(() => {
    const result = calculateWinner(board);
    if (result) {
      setIsGameActive(false);
      setWinnerLine(result.line);
      if (result.winner === 'draw') {
        setStatus("It's a draw!");
      } else {
        setStatus(`Winner: ${result.winner === 'X' ? 'Player 1' : (gameMode === 'PVP' ? 'Player 2' : 'AI')}`);
      }
    } else {
      setWinnerLine([]);
      if (gameMode === 'AI') {
        if (xIsNext) {
          setStatus("Your turn (X)");
        } else {
          setStatus("AI thinking...");
          setAiThinking(true);
        }
      } else {
        setStatus(`Turn: Player ${xIsNext ? '1 (X)' : '2 (O)'}`);
      }
    }

    if (gameMode === 'AI' && !xIsNext && !result) {
      setAiThinking(true);
      // Simulate AI thinking delay for UX
      const timeout = setTimeout(() => {
        const move = findBestMove(board);
        if (move !== null) {
          handleClick(move);
        }
        setAiThinking(false);
      }, 550); // 0.55s "thinking"
      return () => clearTimeout(timeout);
    }
    // eslint-disable-next-line
  }, [board, xIsNext, gameMode]); // eslint-disable-line react-hooks/exhaustive-deps

  // PUBLIC_INTERFACE
  // Switch game mode and reset
  function handleModeChange(e) {
    setGameMode(e.target.value);
    handleRestart();
  }

  // UI: Construct the tic-tac-toe board
  function renderBoard() {
    // 3x3 grid
    return (
      <div className="ttt-board">
        {board.map((val, idx) => (
          <Square
            key={idx}
            value={val}
            onClick={() => handleClick(idx)}
            highlight={winnerLine.includes(idx)}
          />
        ))}
      </div>
    );
  }

  // Set up theme based on requirements (enforce light theme, but retain toggle for structure)
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'light');
  }, []);

  return (
    <div className="ttt-app">
      <header className="ttt-header">
        <h1>Tic Tac Toe</h1>
        <p className="ttt-status" data-testid="ttt-status">{status}</p>
      </header>

      <main className="ttt-main">
        <section className="ttt-center">
          {renderBoard()}
        </section>
        <div className="ttt-controls">
          <label className="ttt-mode-label">
            Mode: &nbsp;
            <select
              value={gameMode}
              disabled={!isGameActive && winnerLine.length > 0}
              onChange={handleModeChange}
              className="ttt-mode-select"
            >
              <option value="PVP">2 Players</option>
              <option value="AI">vs AI</option>
            </select>
          </label>
          <button className="ttt-btn ttt-btn-primary" onClick={handleRestart}>
            Restart Game
          </button>
        </div>
      </main>

      <footer className="ttt-footer">
        <span>
          &copy; {new Date().getFullYear()} | <a href="https://reactjs.org" target="_blank" rel="noopener noreferrer">React</a> Tic Tac Toe
        </span>
      </footer>
    </div>
  );
}

export default App;
