// src/ui/UpgradeIcon.jsx
import React from "react";
import UPG from "../assets/art/UpgradeLogo.png"; // ensure this file exists

export default function UpgradeIcon({
  size = 80,
  radius = 10,
  alt = "Upgrade",
}) {
  return (
    <div
      aria-label={alt}
      title={alt}
      style={{
        width: size,
        height: Math.round((size * 3) / 5), // match 500×375 aspect visuals
        borderRadius: radius,
        overflow: "hidden",
        background: `#0b0f15 url(${UPG}) center/contain no-repeat`,
        outline: "1px solid #1e2530",
      }}
    />
  );
}
