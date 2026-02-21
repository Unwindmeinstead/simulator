import { fmtD } from './math'

export default function PayoffChart({ sp, strike, premium, type }) {
  const W = 580
  const H = 148
  const pad = { l: 46, r: 12, t: 12, b: 26 }

  if (!sp || !strike || !premium) return null

  const range = sp * 0.5
  const mn = sp - range
  const mx = sp + range
  const N = 100

  const payoffFn = type === 'cc'
    ? s => premium + (s - sp) - Math.max(0, s - strike)
    : s => premium - Math.max(0, strike - s)

  const points = []
  let minPy = Infinity, maxPy = -Infinity
  for (let i = 0; i <= N; i++) {
    const s = mn + (mx - mn) * (i / N)
    const py = payoffFn(s)
    points.push({ s, py })
    if (py < minPy) minPy = py
    if (py > maxPy) maxPy = py
  }

  const padPy = (maxPy - minPy) * 0.3
  minPy -= padPy
  maxPy += padPy

  const mapX = s => pad.l + ((s - mn) / (mx - mn)) * (W - pad.l - pad.r)
  const mapY = py => pad.t + ((maxPy - py) / (maxPy - minPy)) * (H - pad.t - pad.b)

  const pathD = points.map((pt, i) => `${i === 0 ? 'M' : 'L'} ${mapX(pt.s)},${mapY(pt.py)}`).join(' ')

  const zeroY = mapY(0)
  const clampX = x => Math.max(mn + 1, Math.min(mx - 1, x))

  const strikeX = clampX(strike)
  const spX = clampX(sp)
  const be = type === 'cc' ? sp - premium : strike - premium
  const beX = clampX(be)

  const topLabel = fmtD(maxPy)

  return (
    <div style={{ marginTop: 16 }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
        <defs>
          <clipPath id={`clipAbove-${type}`}>
            <rect x="0" y="0" width={W} height={zeroY} />
          </clipPath>
          <clipPath id={`clipBelow-${type}`}>
            <rect x="0" y={zeroY} width={W} height={H - zeroY} />
          </clipPath>
        </defs>

        <path d={pathD} stroke="#00e07a" strokeWidth={2} fill="rgba(0,224,122,0.06)" clipPath={`url(#clipAbove-${type})}`} />
        <path d={pathD} stroke="#e05050" strokeWidth={2} fill="rgba(224,80,80,0.06)" clipPath={`url(#clipBelow-${type})}`} />

        <line x1={pad.l} y1={zeroY} x2={W - pad.r} y2={zeroY} stroke="rgba(255,255,255,0.15)" strokeDasharray="4,3" />

        <text x={pad.l - 6} y={pad.t + 10} fill="rgba(255,255,255,0.4)" fontSize={9} fontFamily="Poppins" textAnchor="end">{topLabel}</text>
        <text x={pad.l - 6} y={zeroY + 3} fill="rgba(255,255,255,0.4)" fontSize={9} fontFamily="Poppins" textAnchor="end">$0</text>

        <line x1={mapX(strikeX)} y1={pad.t} x2={mapX(strikeX)} y2={H - pad.b} stroke="rgba(255,200,60,0.65)" strokeWidth={1} strokeDasharray="3,2" />
        <text x={mapX(strikeX)} y={H - 6} fill="rgba(255,200,60,0.7)" fontSize={8} fontFamily="Poppins" textAnchor="middle">K</text>

        <line x1={mapX(spX)} y1={pad.t} x2={mapX(spX)} y2={H - pad.b} stroke="rgba(255,255,255,0.3)" strokeWidth={1} strokeDasharray="3,2" />
        <text x={mapX(spX)} y={H - 6} fill="rgba(255,255,255,0.35)" fontSize={8} fontFamily="Poppins" textAnchor="middle">S</text>

        <line x1={mapX(beX)} y1={pad.t} x2={mapX(beX)} y2={H - pad.b} stroke="rgba(0,224,122,0.6)" strokeWidth={1} strokeDasharray="3,2" />
        <text x={mapX(beX)} y={H - 6} fill="rgba(0,224,122,0.65)" fontSize={8} fontFamily="Poppins" textAnchor="middle">BE</text>
      </svg>
    </div>
  )
}
