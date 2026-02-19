import { fmtD, fmtPct } from './math'
import { G, GB, ACC, RED } from './ui'

export default function ScenarioTable({ scenarios, targetRoi }) {
  if (!scenarios || scenarios.length === 0) return null

  const maxPl = Math.max(...scenarios.map(s => Math.abs(s.pl)))
  const hasTarget = typeof targetRoi === 'number' && targetRoi > 0

  return (
    <div style={{
      background: 'rgba(255,255,255,0.02)',
      borderRadius: 8,
      padding: 12,
      overflowX: 'auto',
      maxHeight: '240px',
      overflowY: 'auto'
    }}>
      <table style={{
        width: '100%',
        minWidth: '420px',
        borderCollapse: 'collapse',
        fontSize: 12,
        fontFamily: 'JetBrains Mono'
      }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left', color: 'rgba(255,255,255,0.35)', fontWeight: 400, padding: '6px 8px' }}>Scenario</th>
            <th style={{ textAlign: 'right', color: 'rgba(255,255,255,0.35)', fontWeight: 400, padding: '6px 8px' }}>Price</th>
            <th style={{ textAlign: 'center', color: 'rgba(255,255,255,0.35)', fontWeight: 400, padding: '6px 8px', width: '40%' }}>P&L</th>
            <th style={{ textAlign: 'right', color: 'rgba(255,255,255,0.35)', fontWeight: 400, padding: '6px 8px' }}>Return</th>
          </tr>
        </thead>
        <tbody>
          {scenarios.map((row, i) => {
            const isPos = row.pl >= 0
            const color = isPos ? '#00e07a' : '#e05050'
            const dimColor = isPos ? 'rgba(0,224,122,0.6)' : 'rgba(224,80,80,0.6)'
            const barWidth = maxPl > 0 ? (Math.abs(row.pl) / maxPl) * 100 : 0
            
            return (
              <tr key={i}>
                <td style={{ color: 'rgba(255,255,255,0.45)', padding: '6px 8px', whiteSpace: 'nowrap' }}>{row.label}</td>
                <td style={{ textAlign: 'right', color: '#e8e8e8', padding: '6px 8px' }}>{fmtD(row.price)}</td>
                <td style={{ padding: '6px 4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{
                        width: `${barWidth}%`,
                        height: '100%',
                        background: color,
                        borderRadius: 3,
                        marginLeft: isPos ? 'auto' : 0,
                        transition: 'width 0.3s ease'
                      }} />
                    </div>
                    <span style={{ color, fontWeight: 700, minWidth: 50, textAlign: 'right', fontSize: 11 }}>
                      {isPos ? '+' : ''}{fmtD(row.pl)}
                    </span>
                  </div>
                </td>
                <td style={{ textAlign: 'right', color: dimColor, padding: '6px 8px' }}>
                  {isPos ? '+' : ''}{fmtPct(row.plPct)}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
