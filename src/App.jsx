import { Routes, Route } from "react-router-dom";
import GameBoard from "./components/GameBoard";
import JoinGame from "./components/JoinGame";

function App() {
  return (
    <Routes>
      <Route path="/" element={<JoinGame />} />
      <Route path="/game/:id" element={<GameBoard />} />
    </Routes>
  );
}

export default App;
