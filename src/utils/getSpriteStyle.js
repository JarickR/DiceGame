// Sprite cropping helper for 5x4 atlases (each tile 500x500)
export function getSpriteStyle({
  sheet,
  index,
  tileSize = 500,   // source tile size
  columns = 5,      // sheet columns
  view = 80,        // displayed size in px (square)
}) {
  const col = index % columns;
  const row = Math.floor(index / columns);

  // Background coordinates in the source sheet
  const bgX = -(col * tileSize);
  const bgY = -(row * tileSize);

  return {
    width: `${view}px`,
    height: `${view}px`,
    backgroundImage: `url(${sheet})`,
    backgroundPosition: `${bgX}px ${bgY}px`,
    backgroundSize: `${columns * tileSize}px ${Math.ceil((20 / columns) * tileSize)}px`,
    backgroundRepeat: "no-repeat",
    imageRendering: "pixelated",
    borderRadius: "10px",
  };
}
