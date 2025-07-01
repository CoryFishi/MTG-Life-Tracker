import { useEffect, useState } from "react";
import { doc, onSnapshot, updateDoc, deleteField } from "firebase/firestore";
import { db } from "../firebase";
import PopupMenu from "./PopupMenu";
import { CgMenuRound } from "react-icons/cg";
import PlayerPopupMenu from "./PlayerPopupMenu";
import { useParams } from "react-router-dom";
import { GiPoisonBottle } from "react-icons/gi";
import { FaSkullCrossbones } from "react-icons/fa";

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

export default function GameBoard() {
  const [players, setPlayers] = useState({});
  const [isOpen, setIsOpen] = useState(false);
  const [isEffectOpen, setIsEffectOpen] = useState(false);
  const [selectedEffect, setSelectedEffect] = useState("poison");
  const [rotateRow, setRotateRow] = useState(false);
  const [selectedPlayerId, setSelectedPlayerId] = useState(null);

  const { id: gameId } = useParams();

  useEffect(() => {
    localStorage.setItem("lastVisitedGameId", gameId);
  }, [gameId]);

  const holdTimers = {};
  const pressStartTimes = {};

  const handleDown = (playerId, delta) => {
    pressStartTimes[playerId] = Date.now();

    holdTimers[playerId] = setTimeout(() => {
      animateAndAdjust(playerId, delta * 10);
      holdTimers[playerId] = null;
    }, 500);
  };

  const handleUp = (playerId, delta) => {
    const held = holdTimers[playerId] === null;
    clearTimeout(holdTimers[playerId]);

    if (!held) {
      const duration = Date.now() - pressStartTimes[playerId];
      if (duration < 500) {
        animateAndAdjust(playerId, delta);
      }
    }

    delete pressStartTimes[playerId];
    delete holdTimers[playerId];
  };

  const deletePlayer = async (playerId) => {
    try {
      await updateDoc(doc(db, "games", gameId), {
        [`players.${playerId}`]: deleteField(),
      });
    } catch (err) {
      console.error("Error removing player:", err);
    }
  };

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "games", gameId), (docSnap) => {
      if (docSnap.exists()) {
        setPlayers(docSnap.data().players || {});
      }
    });
    return () => unsub();
  }, [gameId]);

  const playerList = Object.entries(players)
    .sort(([, a], [, b]) => a.joinedAt - b.joinedAt)
    .slice(0, 8);

  const isOdd = playerList.length % 2 !== 0;
  const lastIndex = playerList.length - 1;

  let cols = 1;
  let rows = 1;

  if (playerList.length === 2) {
    cols = 2;
    rows = 1;
  } else if (playerList.length <= 4) {
    cols = 2;
    rows = 2;
  } else if (playerList.length <= 6) {
    cols = 3;
    rows = 2;
  } else {
    cols = 4;
    rows = 2;
  }

  const layoutClass = `grid-cols-${cols} grid-rows-${rows}`;

  const animateAndAdjust = async (playerId, delta) => {
    const player = players[playerId];
    if (!player) return;
    const newLife = player.life + delta;
    try {
      await updateDoc(doc(db, "games", gameId), {
        [`players.${playerId}.life`]: newLife,
      });
    } catch (err) {
      console.error("Failed to update life:", err);
    }
  };

  const toggleEffect = async (playerId, effectName) => {
    const player = players[playerId];
    const current = player?.effects?.[effectName] || false;
    try {
      await updateDoc(doc(db, "games", gameId), {
        [`players.${playerId}.effects.${effectName}`]: !current,
      });
    } catch (err) {
      console.error("Failed to toggle effect:", err);
    }
  };

  const adjustEffect = async (playerId, effectName, delta) => {
    const player = players[playerId];
    const current = player?.effects?.[effectName] || 0;
    const newVal = Math.max(0, current + delta);
    try {
      await updateDoc(doc(db, "games", gameId), {
        [`players.${playerId}.effects.${effectName}`]: newVal,
      });
    } catch (err) {
      console.error("Failed to adjust effect:", err);
    }
  };

  return (
    <div className={`w-screen h-screen grid ${layoutClass} gap-0`}>
      {/* hidden div required so tailwind keeps the grid definitions */}
      <div className="hidden grid-cols-1 grid-cols-2 grid-cols-3 grid-cols-4 grid-rows-1 grid-rows-2" />
      {isOpen && (
        <PopupMenu
          isOpen={isOpen}
          setIsOpen={setIsOpen}
          rotateRow={rotateRow}
          setRotateRow={setRotateRow}
          players={players}
        />
      )}
      {isEffectOpen && (
        <PlayerPopupMenu
          isOpen={isEffectOpen}
          setIsOpen={setIsEffectOpen}
          selectedEffect={selectedEffect}
          setSelectedEffect={setSelectedEffect}
          selectedPlayerId={selectedPlayerId}
          toggleEffect={toggleEffect}
          adjustEffect={adjustEffect}
          players={players}
          deletePlayer={deletePlayer}
          adjustCommanderDamage={(targetId, sourceId, delta) => {
            const current =
              players?.[targetId]?.commanderDamage?.[sourceId] || 0;
            const newVal = Math.max(0, current + delta);
            return updateDoc(doc(db, "games", gameId), {
              [`players.${targetId}.commanderDamage.${sourceId}`]: newVal,
            });
          }}
        />
      )}
      <div
        className="fixed z-10 -translate-x-[50%] left-1/2 top-1/2 -translate-y-[50%] bg-white/50 hover:bg-white rounded-full cursor-pointer hover:scale-105 duration-300"
        title="Open Menu"
        onClick={() => setIsOpen(true)}
      >
        <CgMenuRound className="text-6xl" />
      </div>
      {playerList
        .sort(([aId], [bId]) => aId.localeCompare(bId))
        .map(([playerId, player], index) => {
          const rowSize = cols;
          const isTopRow = index < rowSize;
          const isLastUnpaired = isOdd && index === lastIndex;
          const colSpanClass = isLastUnpaired ? "col-span-2" : "";
          return (
            <div
              key={playerId}
              className={`relative border border-collapse border-zinc-400 overflow-hidden text-white text-6xl font-bold ${
                player.color || allColors[index % allColors.length]
              } ${colSpanClass}`}
              style={{
                transform: rotateRow && isTopRow ? "rotate(180deg)" : "none",
              }}
            >
              {/* Minus (left) */}
              <div
                onMouseDown={() => handleDown(playerId, -1)}
                onTouchStart={() => handleDown(playerId, -1)}
                onMouseUp={() => handleUp(playerId, -1)}
                onTouchEnd={() => handleUp(playerId, -1)}
                onMouseLeave={() => handleUp(playerId, -1)}
                className="absolute left-0 z-5 top-0 h-full w-1/2 flex justify-center items-center 
             transition-all duration-150 active:scale-[1.5] hover:scale-[1.5] active:bg-black/10 cursor-pointer"
              >
                <span className="text-5xl opacity-40 pointer-events-none select-none mr-20">
                  –
                </span>
              </div>
              {/* Plus (right) */}
              <div
                onMouseDown={() => handleDown(playerId, 1)}
                onTouchStart={() => handleDown(playerId, 1)}
                onMouseUp={() => handleUp(playerId, 1)}
                onTouchEnd={() => handleUp(playerId, 1)}
                onMouseLeave={() => handleUp(playerId, 1)}
                className="absolute right-0 z-5 top-0 h-full w-1/2 flex justify-center items-center 
             transition-all duration-150 active:scale-[1.5] hover:scale-[1.5] active:bg-white/10 cursor-pointer"
              >
                <span className="text-5xl opacity-40 pointer-events-none select-none ml-20">
                  +
                </span>
              </div>
              {/* Centered Life Display */}
              <div className="h-full w-full flex flex-col justify-center items-center select-none">
                {(player.effects?.poison > 9 || player.life < 1) && (
                  <FaSkullCrossbones className="w-full h-full absolute text-black/50" />
                )}
                <div className="text-8xl pointer-events-none z-5">
                  {player.life}
                </div>
                <div className="text-md mt-1 pointer-events-none z-5">
                  {player.name}
                </div>
                {/* Commander Damage Grid */}
                <div
                  className={`mt-5 grid gap-1 z-30 pointer-events-auto cursor-pointer ${layoutClass}`}
                  onClick={() => {
                    setSelectedPlayerId(playerId);
                    setIsEffectOpen(true);
                  }}
                >
                  {playerList
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([otherId, otherPlayer]) => {
                      const currentDmg = player.commanderDamage?.[otherId] || 0;
                      return (
                        <div
                          key={otherId}
                          title={`${otherPlayer.name}: ${currentDmg} Commander Damage`}
                          className="w-6 h-6 border-2 border-white rounded-md flex items-center justify-center text-xs font-bold bg-white/10 hover:bg-white/20"
                        >
                          {currentDmg > 0 ? currentDmg : ""}
                        </div>
                      );
                    })}
                </div>
                {/* Status Effects Row */}
                {player.effects && (
                  <div
                    className="mt-2 flex flex-wrap justify-center gap-1 text-xs z-30 cursor-pointer"
                    onClick={() => {
                      setSelectedPlayerId(id);
                      setIsEffectOpen(true);
                    }}
                  >
                    {/* Poison */}
                    {typeof player.effects.poison === "number" &&
                      player.effects.poison > 0 && (
                        <div className="bg-green-700 text-white px-2 py-1 rounded-full flex items-center gap-1">
                          <GiPoisonBottle /> {player.effects.poison}
                        </div>
                      )}

                    {/* Monarch */}
                    {player.effects.monarch && (
                      <div className="bg-yellow-500 text-black px-2 py-1 rounded-full">
                        👑 Monarch
                      </div>
                    )}

                    {/* Add any other effect you support */}
                    {Object.entries(player.effects)
                      .filter(
                        ([key, val]) =>
                          key !== "poison" &&
                          key !== "monarch" &&
                          val !== false &&
                          val !== 0
                      )
                      .map(([key, val]) => (
                        <div
                          key={key}
                          className="bg-white/20 text-white px-2 py-1 rounded-full"
                        >
                          {key}: {typeof val === "boolean" ? "" : val}
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
    </div>
  );
}
