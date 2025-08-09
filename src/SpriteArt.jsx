import React from 'react'

export default function SpriteArt({img, cols=5, rows=4, index=1, width=120, height=180, border=false}){
  if(!img) return null
  const cw = 100/cols, ch = 100/rows
  const ix = ((index-1) % cols)
  const iy = Math.floor((index-1) / cols)
  const bgPos = `${-ix*cw}% ${-iy*ch}%`
  const style = {
    width, height,
    backgroundImage:`url(${img})`,
    backgroundSize:`${cols*100}% ${rows*100}%`,
    backgroundPosition:bgPos,
    imageRendering:'pixelated',
    border: border ? '2px solid #273140' : 'none',
    borderRadius: '8px'
  }
  return <div style={style} />
}
