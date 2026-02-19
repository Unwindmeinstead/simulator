import React from 'react';

export default function PayoffChart({ stockPrice, strikePrice, premium, type }) {
  // very minimal chart placeholder; actual rendering can be filled later
  const W = 640, H = 180;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="auto">
      <rect x="0" y="0" width={W} height={H} fill="#0b0f15" />
      <text x={W/2} y={H/2} fill="#9bd" textAnchor="middle" fontFamily="monospace">PayoffChart</text>
    </svg>
  );
}
