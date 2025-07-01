import { useEffect, useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useParams } from "react-router-dom";

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

export default function PlayerPopupMenu({
  isOpen,
  setIsOpen,
  selectedEffect,
  setSelectedEffect,
  selectedPlayerId,
  toggleEffect,
  adjustEffect,
  players,
  adjustCommanderDamage,
  deletePlayer,
}) {
  if (!isOpen) return null;

  const availableEffects = ["poison", "monarch", "initiative"];
  const [poisonValue, setPoisonValue] = useState(0);
  const { id: gameId } = useParams();

  useEffect(() => {
    if (
      selectedEffect === "poison" &&
      selectedPlayerId &&
      players[selectedPlayerId]
    ) {
      setPoisonValue(players[selectedPlayerId].effects?.poison || 0);
    }
  }, [selectedEffect, selectedPlayerId, players]);

  const handleApplyEffect = (effect) => {
    setSelectedEffect(effect);
    if (effect !== "poison" && selectedPlayerId && toggleEffect) {
      toggleEffect(selectedPlayerId, effect);
    }
  };

  const handlePoisonChange = async (delta) => {
    const newVal = Math.max(0, Math.min(10, poisonValue + delta));
    setPoisonValue(newVal);
    if (selectedPlayerId && adjustEffect) {
      await adjustEffect(selectedPlayerId, "poison", delta);
    }
  };

  return (
    <div className="bg-black/50 w-screen h-screen fixed z-50">
      <div className="bg-white p-4 fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col gap-4 rounded-lg min-w-[300px] min-h-[200px] shadow-lg">
        <h2 className="text-md font-semibold">Add Effect</h2>

        <div className="flex gap-2 flex-wrap">
          {availableEffects.map((effect) => (
            <button
              key={effect}
              onClick={() => handleApplyEffect(effect)}
              className={`px-3 cursor-pointer py-1 text-sm rounded ${
                selectedEffect === effect
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 hover:bg-gray-300"
              }`}
            >
              {effect}
            </button>
          ))}
        </div>

        {selectedEffect === "poison" && (
          <div className="flex items-center gap-3 justify-center mt-4">
            <button
              onClick={() => handlePoisonChange(-1)}
              className="px-3 py-1 bg-red-400 text-white rounded hover:scale-105"
            >
              –
            </button>
            <span className="text-xl font-bold">{poisonValue}</span>
            <button
              onClick={() => handlePoisonChange(1)}
              className="px-3 py-1 bg-green-500 text-white rounded hover:scale-105"
            >
              +
            </button>
          </div>
        )}
        <h3 className="text-sm font-semibold mt-4">Commander Damage</h3>
        <div className={`grid grid-cols-4 gap-2 mt-2`}>
          {Object.entries(players)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([id, player]) => {
              const dmg = players[selectedPlayerId]?.commanderDamage?.[id] || 0;

              return (
                <div
                  key={id}
                  title={`${player.name}: ${dmg} Commander Damage`}
                  className="py-1 gap-1 border-2 border-gray-400 rounded-md flex items-center justify-center text-xs font-bold bg-gray-100 relative"
                >
                  <button
                    className="bg-red-500 text-white px-1 rounded text-xs hover:scale-105 cursor-pointer"
                    onClick={() =>
                      adjustCommanderDamage(selectedPlayerId, id, -1)
                    }
                  >
                    –
                  </button>
                  <span>{dmg > 0 ? dmg : "0"}</span>
                  <button
                    className="bg-green-500 text-white px-1 rounded text-xs hover:scale-105 cursor-pointer"
                    onClick={() =>
                      adjustCommanderDamage(selectedPlayerId, id, 1)
                    }
                  >
                    +
                  </button>
                </div>
              );
            })}
        </div>

        <div className="mt-4">
          <h3 className="text-sm font-semibold">Set Background Color</h3>
          <div className="flex flex-wrap gap-2 mt-2">
            {allColors.map((color) => {
              const isUsed = Object.entries(players).some(
                ([id, p]) => p.color === color && id !== selectedPlayerId
              );

              const isSelected = players[selectedPlayerId]?.color === color;

              return (
                <div
                  key={color}
                  className={`relative w-6 h-6 rounded-full cursor-pointer border-2 ${color} ${
                    isSelected ? "border-black" : "border-transparent"
                  } ${
                    isUsed
                      ? "pointer-events-none opacity-40"
                      : "hover:scale-105"
                  }`}
                  title={color}
                  onClick={async () => {
                    if (!isUsed) {
                      await updateDoc(doc(db, "games", gameId), {
                        [`players.${selectedPlayerId}.color`]: color,
                      });
                    }
                  }}
                >
                  {isUsed && (
                    <div className="absolute left-0 top-0 w-full h-full flex items-center justify-center pointer-events-none">
                      <div className="w-[150%] h-[2px] bg-white rotate-45"></div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        <div className="flex justify-between">
          <button
            className="bg-red-500 text-white hover:bg-red-600 rounded duration-300 px-4 py-2 text-sm font-medium cursor-pointer self-start"
            onClick={() => {
              if (
                window.confirm("Are you sure you want to remove this player?")
              ) {
                deletePlayer(selectedPlayerId);
                setIsOpen(false);
              }
            }}
          >
            Remove Player
          </button>
          <button
            className="bg-gray-300 hover:bg-gray-400 rounded duration-300 px-4 py-2 text-sm font-medium cursor-pointer self-start"
            onClick={() => setIsOpen(false)}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
