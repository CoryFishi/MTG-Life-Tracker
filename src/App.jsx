import { useState } from "react";
import JoinGame from "./components/JoinGame";
import GameBoard from "./components/GameBoard";

function App() {
  const [gameId, setGameId] = useState(null);
  const [playerId, setPlayerId] = useState(null);

  return (
    <div className="min-h-screen">
      {!gameId ? (
        <JoinGame
          onJoined={(id, pid) => {
            setGameId(id);
            setPlayerId(pid);
          }}
        />
      ) : (
        <GameBoard gameId={gameId} />
      )}
    </div>
  );
}

export default App;
