export async function loadSheet({url, cols, rows}) {
  const img = new Image();
  img.src = url;
  await img.decode();
  const cellW = Math.floor(img.width / cols);
  const cellH = Math.floor(img.height / rows);
  return { img, cols, rows, cellW, cellH };
}

export function frameRect(sheet, idx) {
  const col = idx % sheet.cols;
  const row = Math.floor(idx / sheet.cols);
  return { img: sheet.img, sx: col * sheet.cellW, sy: row * sheet.cellH, sw: sheet.cellW, sh: sheet.cellH };
}

export function Portrait({ sheet, index, size=128, style }) {
  if (!sheet || index == null) return null;
  const r = frameRect(sheet, index);
  return (
    <div
      style={{
        width: size, height: size,
        backgroundImage: `url(${sheet.img.src})`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: `-${r.sx}px -${r.sy}px`,
        backgroundSize: `${sheet.cols*100}% ${sheet.rows*100}%`,
        imageRendering: 'pixelated',
        ...style
      }}
      aria-hidden="true"
    />
  );
}
