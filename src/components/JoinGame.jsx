import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import {
  doc,
  getDoc,
  updateDoc,
  addDoc,
  collection,
  getDocs,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "../firebase";

export default function JoinGame() {
  const [gameId, setGameId] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [games, setGames] = useState([]);
  const navigate = useNavigate();
  const [gameName, setGameName] = useState("");
  const [gamePassword, setGamePassword] = useState("");
  const [playerPassword, setPlayerPassword] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isJoinOpen, setIsJoinOpen] = useState(false);
  const [selectedGame, setSelectedGame] = useState("");

  // Auto-redirect if a game was previously opened
  useEffect(() => {
    const lastGameId = localStorage.getItem("lastVisitedGameId");
    if (lastGameId) {
      navigate(`/game/${lastGameId}`);
    }
  }, [navigate]);

  // Load existing games
  useEffect(() => {
    const fetchGames = async () => {
      const snapshot = await getDocs(collection(db, "games"));
      const gameList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setGames(gameList);
    };

    fetchGames();
  }, []);
  const handleDeleteGame = async (gameIdToDelete) => {
    const confirm = window.confirm(
      "Are you sure you want to delete this game?"
    );
    if (!confirm) return;

    try {
      await deleteDoc(doc(db, "games", gameIdToDelete));
      setGames((prev) => prev.filter((g) => g.id !== gameIdToDelete));
    } catch (err) {
      console.error("Error deleting game:", err);
      alert("Failed to delete game.");
    }
  };

  const joinSpecificGame = async (gameOrId) => {
    const targetGameId = typeof gameOrId === "string" ? gameOrId : gameOrId.id;

    if (!playerName.trim()) {
      alert("Please enter your name first.");
      return;
    }

    const gameRef = doc(db, "games", targetGameId);
    const gameSnap = await getDoc(gameRef);

    if (!gameSnap.exists()) {
      alert("Game not found.");
      return;
    }

    const gameData = gameSnap.data();
    if (Object.keys(gameData.players || {}).length >= 8) {
      alert("Game is full!");
      return;
    }

    if (gameData.password && playerPassword !== gameData.password) {
      alert("Incorrect password!");
      return;
    }

    const playerId = crypto.randomUUID();
    const newPlayer = {
      id: uuidv4(),
      name: playerName,
      life: 40,
      effects: {
        poison: 0,
        monarch: false,
        initiative: false,
      },
      commanderDamage: {},
      joinedAt: Date.now(),
    };

    try {
      await updateDoc(gameRef, {
        [`players.${playerId}`]: newPlayer,
      });

      localStorage.setItem("lastVisitedGameId", targetGameId);
      localStorage.setItem("playerId", playerId);
      navigate(`/game/${targetGameId}`);
    } catch (err) {
      console.error("Error joining game:", err);
    }
  };

  const handleCreate = async () => {
    if (!gameName.trim() || !gamePassword.trim()) {
      alert("Please provide both a game name and password.");
      return;
    }

    try {
      const docRef = await addDoc(collection(db, "games"), {
        createdAt: serverTimestamp(),
        name: gameName.trim(),
        password: gamePassword.trim(),
        players: {},
      });

      localStorage.setItem("lastVisitedGameId", docRef.id);
      localStorage.removeItem("playerId");

      navigate(`/game/${docRef.id}`);
    } catch (err) {
      console.error("Error creating game:", err);
    }
  };

  return (
    <div className="h-screen w-screen">
      {isCreateOpen && (
        <div className="fixed z-50 h-screen w-screen bg-black/50">
          <div className="bg-white p-4 fixed top-1/2 left-1/2 -translate-[50%] flex flex-col gap-2 rounded-lg min-w-md min-h-md">
            <h1 className="font-bold text-xl">Create Game</h1>
            <div className="flex flex-col gap-1">
              <h3>Lobby Name</h3>
              <input
                type="text"
                placeholder="MTG Goats..."
                value={gameName}
                onChange={(e) => setGameName(e.target.value)}
                className="border p-2 rounded mb-2"
              />
              <h3>Lobby Password</h3>
              <input
                type="password"
                placeholder="Password123.."
                value={gamePassword}
                onChange={(e) => setGamePassword(e.target.value)}
                className="border p-2 rounded mb-2"
              />
            </div>
            <div className="w-full justify-between flex">
              <button
                className="bg-red-500 hover:bg-red-600 hover:scale-105 rounded cursor-pointer px-2 py-1 duration-300"
                onClick={() => setIsCreateOpen(false)}
              >
                Close
              </button>
              <button
                className="bg-green-500 hover:bg-green-600 hover:scale-105 rounded cursor-pointer px-2 py-1 duration-300"
                onClick={() => handleCreate()}
              >
                Create Game
              </button>
            </div>
          </div>
        </div>
      )}
      {isJoinOpen && (
        <div className="fixed z-50 h-screen w-screen bg-black/50">
          <div className="bg-white p-4 fixed top-1/2 left-1/2 -translate-[50%] flex flex-col gap-2 rounded-lg min-w-md min-h-md">
            <h1 className="font-bold text-xl">Join Game</h1>
            <div className="flex flex-col gap-1">
              <h3>Player Name</h3>
              <input
                type="text"
                placeholder="Gerald Sportsma..."
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className="border p-2 rounded mb-2"
              />
              <h3>Lobby Password</h3>
              <input
                type="password"
                placeholder="Password123.."
                value={playerPassword}
                onChange={(e) => setPlayerPassword(e.target.value)}
                className="border p-2 rounded mb-2"
              />
            </div>
            <div className="w-full justify-between flex">
              <button
                className="bg-red-500 hover:bg-red-600 hover:scale-105 rounded cursor-pointer px-2 py-1 duration-300"
                onClick={() => setIsJoinOpen(false)}
              >
                Close
              </button>
              <button
                className="bg-green-500 hover:bg-green-600 hover:scale-105 rounded cursor-pointer px-2 py-1 duration-300"
                onClick={() => joinSpecificGame(selectedGame)}
              >
                Join Game
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="w-full h-full p-4">
        <div className="mb-4 flex gap-2 justify-between items-baseline">
          <h2 className="text-xl font-bold mb-2">MTG Tracker</h2>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Enter Game ID"
              value={gameId}
              onChange={(e) => setGameId(e.target.value)}
              className="border p-2 rounded"
            />
            <button
              onClick={() => setIsJoinOpen(gameId) & setSelectedGame(gameId)}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded cursor-pointer"
            >
              Join Game by ID
            </button>
            <button
              onClick={() => setIsCreateOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded cursor-pointer"
            >
              Create New Game
            </button>
          </div>
        </div>

        {games.length === 0 ? (
          <p className="text-gray-500">No games found.</p>
        ) : (
          <ul className="space-y-2">
            {games.map((g) => (
              <li
                key={g.id}
                className="border p-2 rounded flex justify-between items-center"
              >
                <div>
                  <div className="flex items-baseline gap-4">
                    <h2>{g.name ?? ""}</h2>{" "}
                    <p className="font-mono text-sm text-gray-600">{g.id}</p>
                  </div>
                  <p className="text-xs text-gray-600">
                    {Object.keys(g.players || {}).length} players [
                    {Object.values(g.players || {})
                      .map((p) => p.name)
                      .join(", ")}
                    ]
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    className="bg-green-500 hover:bg-green-600 cursor-pointer text-white px-3 py-1 rounded text-sm"
                    onClick={() => setIsJoinOpen(true) & setSelectedGame(g)}
                  >
                    Join
                  </button>
                  <button
                    className="bg-red-500 hover:bg-red-600 cursor-pointer text-white px-3 py-1 rounded text-sm"
                    onClick={() => handleDeleteGame(g.id)}
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
