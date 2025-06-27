export default function PopupMenu({
  isOpen,
  setIsOpen,
  gameId,
  rotateRow,
  setRotateRow,
}) {
  if (!isOpen) return;

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
          onClick={() => setIsOpen(false)}
        >
          Close
        </button>
      </div>
    </div>
  );
}
