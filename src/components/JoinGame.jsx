import { useState } from "react";
import {
  doc,
  getDoc,
  updateDoc,
  addDoc,
  collection,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";

export default function JoinGame({ onJoined }) {
  const [gameId, setGameId] = useState("");
  const [playerName, setPlayerName] = useState("");

  const handleJoin = async () => {
    if (!gameId.trim() || !playerName.trim()) return;

    const gameRef = doc(db, "games", gameId.trim());
    const gameSnap = await getDoc(gameRef);

    if (!gameSnap.exists()) {
      alert("Game not found.");
      return;
    }

    const playerId = crypto.randomUUID();

    const newPlayer = {
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
      onJoined(gameId.trim(), playerId);
    } catch (err) {
      console.error("Error joining game:", err);
    }
  };

  const handleCreate = async () => {
    try {
      const docRef = await addDoc(collection(db, "games"), {
        createdAt: serverTimestamp(),
        players: {}, // no players
      });
      onJoined(docRef.id, null); // Open GameBoard immediately
    } catch (err) {
      console.error("Error creating game:", err);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-2">Join or Create Game</h2>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Your Name"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          className="border p-2 rounded mr-2 mb-2"
        />
        <input
          type="text"
          placeholder="Enter Game ID"
          value={gameId}
          onChange={(e) => setGameId(e.target.value)}
          className="border p-2 rounded mr-2"
        />
        <button
          onClick={handleJoin}
          className="bg-green-600 text-white px-4 py-2 rounded"
        >
          Join Game
        </button>
      </div>

      <div>
        <button
          onClick={handleCreate}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Create Empty Game
        </button>
      </div>
    </div>
  );
}
