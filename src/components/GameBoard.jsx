import { useEffect, useState } from "react";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import PopupMenu from "./PopupMenu";
import { CgMenuRound } from "react-icons/cg";
import PlayerPopupMenu from "./PlayerPopupMenu";
import { MdEditNote } from "react-icons/md";

const playerColors = [
  "bg-purple-600",
  "bg-blue-600",
  "bg-green-600",
  "bg-orange-500",
];

export default function GameBoard({ gameId }) {
  const [players, setPlayers] = useState({});
  const [isOpen, setIsOpen] = useState(false);
  const [isEffectOpen, setIsEffectOpen] = useState(false);
  const [selectedEffect, setSelectedEffect] = useState("poison");
  const [rotateRow, setRotateRow] = useState(false);
  const [selectedPlayerId, setSelectedPlayerId] = useState(null);

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
      <PopupMenu
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        gameId={gameId}
        rotateRow={rotateRow}
        setRotateRow={setRotateRow}
      />
      <PlayerPopupMenu
        isOpen={isEffectOpen}
        setIsOpen={setIsEffectOpen}
        selectedEffect={selectedEffect}
        setSelectedEffect={setSelectedEffect}
        selectedPlayerId={selectedPlayerId}
        toggleEffect={toggleEffect}
        adjustEffect={adjustEffect}
        players={players}
        adjustCommanderDamage={(targetId, sourceId, delta) => {
          const current = players?.[targetId]?.commanderDamage?.[sourceId] || 0;
          const newVal = Math.max(0, current + delta);
          return updateDoc(doc(db, "games", gameId), {
            [`players.${targetId}.commanderDamage.${sourceId}`]: newVal,
          });
        }}
      />
      <div
        className="fixed z-10 -translate-x-[50%] left-1/2 top-1/2 -translate-y-[50%] bg-white/50 hover:bg-white rounded-full cursor-pointer hover:scale-105 duration-300"
        title="Open Menu"
        onClick={() => setIsOpen(true)}
      >
        <CgMenuRound className="text-9xl" />
      </div>
      {playerList.map(([id, player], index) => {
        const rowSize = cols;
        const isTopRow = index < rowSize;
        const isLastUnpaired = isOdd && index === lastIndex;
        const colSpanClass = isLastUnpaired ? "col-span-2" : "";
        return (
          <div
            key={id}
            className={`relative border border-collapse border-zinc-400 overflow-hidden text-white text-6xl font-bold ${
              playerColors[index % playerColors.length]
            } ${colSpanClass}`}
            style={{
              transform: rotateRow && isTopRow ? "rotate(180deg)" : "none",
            }}
          >
            {/* Minus (left) */}
            <div
              onMouseDown={() => handleDown(id, -1)}
              onTouchStart={() => handleDown(id, -1)}
              onMouseUp={() => handleUp(id, -1)}
              onTouchEnd={() => handleUp(id, -1)}
              onMouseLeave={() => handleUp(id, -1)}
              className="absolute left-0 top-0 h-full w-1/2 flex justify-center items-center 
             transition-all duration-150 active:scale-[1.5] hover:scale-[1.5] active:bg-black/10 cursor-pointer"
            >
              <span className="text-5xl opacity-20 pointer-events-none select-none mr-10">
                –
              </span>
            </div>
            {/* Plus (right) */}
            <div
              onMouseDown={() => handleDown(id, 1)}
              onTouchStart={() => handleDown(id, 1)}
              onMouseUp={() => handleUp(id, 1)}
              onTouchEnd={() => handleUp(id, 1)}
              onMouseLeave={() => handleUp(id, 1)}
              className="absolute right-0 top-0 h-full w-1/2 flex justify-center items-center 
             transition-all duration-150 active:scale-[1.5] hover:scale-[1.5] active:bg-white/10 cursor-pointer"
            >
              <span className="text-5xl opacity-20 pointer-events-none select-none ml-10">
                +
              </span>
            </div>
            {/* Centered Life Display */}
            <div className="h-full w-full flex flex-col justify-center items-center select-none pointer-events-none">
              <div className="text-8xl">
                {player.effects?.poison > 9 || player.life < 1 ? (
                  <p>☠️</p>
                ) : (
                  player.life
                )}
              </div>
              <div className="text-md mt-1">{player.name}</div>
            </div>
            <div
              onClick={() => {
                setSelectedPlayerId(id);
                setIsEffectOpen(true);
              }}
              title="Click to add, right-click to subtract poison"
              className={`absolute top-2 right-2 bg-black/70 text-white text-3xl px-2 py-1 rounded-full shadow-lg select-none cursor-pointer hover:scale-105 duration-300`}
            >
              <MdEditNote />
            </div>
            {player.effects && (
              <div className="absolute top-2 left-2 flex flex-col gap-1">
                {Object.entries(player.effects)
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([effect, value]) => {
                    if (value === false || value === 0) return null;
                    return (
                      <div
                        key={effect}
                        className="bg-black/50 text-white text-xs p-1 px-2 rounded-full select-none text-center items-center justify-center flex gap-1 w-fit"
                      >
                        {typeof value != "number" && (
                          <p
                            className="px-1 hover:bg-zinc-400 rounded-full cursor-pointer"
                            onClick={(e) => {
                              e.preventDefault();
                              toggleEffect(id, effect);
                            }}
                          >
                            x
                          </p>
                        )}
                        {typeof value === "number" && (
                          <p
                            className="px-1 hover:bg-zinc-400 rounded-full cursor-pointer"
                            onClick={(e) => {
                              e.preventDefault();
                              if (typeof value === "number")
                                adjustEffect(id, effect, -1);
                              else toggleEffect(id, effect);
                            }}
                          >
                            -
                          </p>
                        )}
                        {effect === "poison" && (
                          <p
                            className={`${
                              value < 3
                                ? "text-green-200"
                                : value < 7
                                ? "text-green-400"
                                : value < 10
                                ? "text-green-600"
                                : "text-green-800"
                            }`}
                          >
                            ☣︎ {value}
                          </p>
                        )}

                        {effect === "monarch"
                          ? "👑 Monarch"
                          : effect === "poison"
                          ? ""
                          : effect}

                        {typeof value === "number" && (
                          <p
                            onClick={() => {
                              if (typeof value === "number")
                                adjustEffect(id, effect, 1);
                              else toggleEffect(id, effect);
                            }}
                            className="px-1 hover:bg-zinc-400 rounded-full cursor-pointer"
                          >
                            +
                          </p>
                        )}
                      </div>
                    );
                  })}
                {Object.entries(player.commanderDamage || {})
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([otherId, damage]) => {
                    if (damage < 1) return null;
                    const otherPlayer = players[otherId];
                    if (!otherPlayer) return null;
                    return (
                      <div
                        key={otherId}
                        className="bg-black/50 text-white text-xs p-1 px-2 rounded-full select-none text-center items-center justify-center flex gap-1 w-fit"
                      >
                        <p
                          className="px-1 hover:bg-zinc-400 rounded-full cursor-pointer"
                          onClick={(e) => {
                            e.preventDefault();
                            const newVal = Math.max(0, damage - 1);
                            updateDoc(doc(db, "games", gameId), {
                              [`players.${id}.commanderDamage.${otherId}`]:
                                newVal,
                            });
                          }}
                        >
                          -
                        </p>
                        {otherPlayer.name}: {damage}{" "}
                        <p
                          onClick={() => {
                            const newVal = damage + 1;
                            updateDoc(doc(db, "games", gameId), {
                              [`players.${id}.commanderDamage.${otherId}`]:
                                newVal,
                            });
                          }}
                          className="px-1 hover:bg-zinc-400 rounded-full cursor-pointer"
                        >
                          +
                        </p>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
