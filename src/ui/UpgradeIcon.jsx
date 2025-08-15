import React from "react";
import SpriteThumb from "./SpriteThumb";

// Single-frame upgrade logo (500×375 per your assets)
const UPGRADE_SRC = "/art/UpgradeLogo.png";

export default function UpgradeIcon({ size = 80, radius = 10 }) {
  return (
    <SpriteThumb
      src={UPGRADE_SRC}
      index={0}
      cols={1}
      rows={1}
      frameW={500}
      frameH={375}
      viewW={size}
      viewH={(size * 3) / 5}
      radius={radius}
    />
  );
}
