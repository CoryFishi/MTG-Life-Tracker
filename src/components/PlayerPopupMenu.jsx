import { useEffect, useState } from "react";

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
}) {
  const availableEffects = ["poison", "monarch", "initiative"];
  const [poisonValue, setPoisonValue] = useState(0);

  useEffect(() => {
    if (
      selectedEffect === "poison" &&
      selectedPlayerId &&
      players[selectedPlayerId]
    ) {
      setPoisonValue(players[selectedPlayerId].effects?.poison || 0);
    }
  }, [selectedEffect, selectedPlayerId, players]);

  if (!isOpen) return null;

  const handleApplyEffect = (effect) => {
    setSelectedEffect(effect);
    if (effect !== "poison" && selectedPlayerId && toggleEffect) {
      toggleEffect(selectedPlayerId, effect);
      setIsOpen(false);
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
              className={`px-3 py-1 text-sm rounded ${
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
        <div className="flex flex-wrap gap-2">
          {Object.entries(players)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([id, player]) => {
              if (id === selectedPlayerId) return null;
              const dmg = players[selectedPlayerId]?.commanderDamage?.[id] || 0;
              return (
                <div
                  key={id}
                  className="bg-gray-200 rounded px-2 py-1 text-xs flex flex-col items-center gap-1"
                >
                  <span>
                    {player.name}: {dmg}
                  </span>
                  <div className="flex">
                    <button
                      className="cursor-pointer py-1 px-2 hover:bg-zinc-300 rounded-full"
                      onClick={() =>
                        adjustCommanderDamage(selectedPlayerId, id, 1)
                      }
                    >
                      +
                    </button>
                    <button
                      className="cursor-pointer py-1 px-2 hover:bg-zinc-300 rounded-full"
                      onClick={() =>
                        adjustCommanderDamage(selectedPlayerId, id, -1)
                      }
                    >
                      -
                    </button>
                  </div>
                </div>
              );
            })}
        </div>

        <button
          className="bg-gray-300 hover:bg-gray-400 rounded duration-300 px-4 py-2 text-sm font-medium cursor-pointer self-start mt-6"
          onClick={() => setIsOpen(false)}
        >
          Close
        </button>
      </div>
    </div>
  );
}
