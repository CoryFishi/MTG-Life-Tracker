import { collection, doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useNavigate, useParams } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";

export default function PopupMenu({
  isOpen,
  setIsOpen,
  rotateRow,
  setRotateRow,
  players,
}) {
  if (!isOpen) return null;
  const { id: gameId } = useParams();

  const allColors = [
    "bg-purple-600",
    "bg-blue-600",
    "bg-green-600",
    "bg-orange-500",
    "bg-red-500",
    "bg-pink-500",
    "bg-yellow-500",
    "bg-indigo-600",
  ];
  const navigate = useNavigate();

  const leaveGame = async () => {
    localStorage.removeItem("lastVisitedGameId");
    navigate("/");
  };

  const resetGame = async () => {
    try {
      const updates = {};
      Object.entries(players).forEach(([id, player]) => {
        updates[`players.${id}.life`] = 40;
        updates[`players.${id}.effects`] = {
          poison: 0,
          monarch: false,
          initiative: false,
        };
        updates[`players.${id}.commanderDamage`] = {};
      });

      await updateDoc(doc(db, "games", gameId), updates);
      setIsOpen(false);
    } catch (err) {
      console.error("Error resetting game:", err);
    }
  };

  const addPlayer = async () => {
    const id = uuidv4();

    const usedColors = Object.values(players || {})
      .map((p) => p.color)
      .filter(Boolean);
    const availableColors = allColors.filter((c) => !usedColors.includes(c));

    const color =
      availableColors.length > 0
        ? availableColors[0]
        : allColors[Math.floor(Math.random() * allColors.length)];

    const existingPlayerCount = Object.values(players || {}).filter((p) =>
      /^Player ?\d*$/.test(p.name)
    ).length;

    if (existingPlayerCount >= 8) return;

    const newPlayer = {
      id,
      name: `Player`,
      life: 40,
      color,
      effects: {
        poison: 0,
        monarch: false,
        initiative: false,
      },
      commanderDamage: {},
      joinedAt: Date.now(),
    };

    try {
      await updateDoc(doc(db, "games", gameId), {
        [`players.${id}`]: newPlayer,
      });
    } catch (err) {
      console.error("Error adding player:", err);
    }
  };

  return (
    <div className="bg-black/50 w-screen h-screen fixed z-50">
      <div className="bg-white p-4 fixed top-1/2 left-1/2 -translate-[50%] flex flex-col gap-2 rounded-lg min-w-md min-h-md">
        <div className="flex gap-2">
          <h2 className="font-bold">Game Id:</h2>
          <p>{gameId}</p>
        </div>
        <button
          className="bg-green-200 hover:bg-green-400 hover:scale-105 rounded duration-300 p-1 cursor-pointer"
          onClick={() => setRotateRow(!rotateRow)}
        >
          Rotate Row
        </button>
        <button
          className="bg-green-200 hover:bg-green-400 hover:scale-105 rounded duration-300 p-1 cursor-pointer"
          onClick={addPlayer}
        >
          Add Player
        </button>
        <button
          className="bg-green-200 hover:bg-green-400 hover:scale-105 rounded duration-300 p-1 cursor-pointer"
          onClick={resetGame}
        >
          Reset Game
        </button>
        <button
          className="bg-green-200 hover:bg-green-400 hover:scale-105 rounded duration-300 p-1 cursor-pointer"
          onClick={leaveGame}
        >
          Leave Game
        </button>
        <button
          className="bg-green-200 hover:bg-green-400 hover:scale-105 rounded duration-300 p-1 cursor-pointer"
          onClick={() => setIsOpen(false)}
        >
          Close
        </button>
      </div>
    </div>
  );
}
