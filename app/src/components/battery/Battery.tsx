import { TbBolt } from 'react-icons/tb'

interface BatteryProps {
  percentage: number
  isCharging?: boolean
}

export default function Battery({ percentage, isCharging = false }: BatteryProps) {
  const pct = Math.min(100, Math.max(0, percentage))

  const fillColor =
    pct >= 60 ? '#3ef5a0' :
    pct >= 30 ? '#f0b040' :
    '#f07070'

  // center of battery body: x=2 width=38 → cx=21, height=24 → cy=12
  const cx = 21
  const cy = 12

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width="48" height="24" viewBox="0 0 48 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* outline */}
        <rect x="2" y="4" width="38" height="16" rx="2" stroke="#3a4060" strokeWidth="1.5" fill="none" />
        {/* terminal */}
        <rect x="41" y="8" width="4" height="8" rx="1" fill="#3a4060" />
        {/* fill */}
        <rect x="4" y="6" width={(34 * pct) / 100} height="12" rx="1" fill={fillColor} />

        {isCharging ? (
          <foreignObject x={cx - 6} y={cy - 6} width="12" height="12">
            <TbBolt size={12} color="#0d0f14" />
          </foreignObject>
        ) : (
          <text
            x={cx}
            y={cy}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#0d0f14"
            fontSize="8"
            fontWeight="700"
            fontFamily="inherit"
            pointerEvents="none"
          >
            {pct}%
          </text>
        )}
      </svg>
    </div>
  )
}