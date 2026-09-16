import { TbBolt } from 'react-icons/tb'

interface BatteryProps {
  percentage: number
  isCharging?: boolean
}

export default function Battery({
  percentage,
  isCharging = false,
}: BatteryProps) {
  const pct = Math.min(100, Math.max(0, percentage))

  const fillColor =
    pct >= 60 ? '#3ef5a0' :
    pct >= 30 ? '#f0b040' :
    '#f07070'

  // Battery body: x=2..40, y=4..20
  const bodyX = 2
  const bodyY = 4
  const bodyWidth = 38
  const bodyHeight = 16

  const cx = bodyX + bodyWidth / 2
  const cy = bodyY + bodyHeight / 2

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <svg
        width="48"
        height="24"
        viewBox="0 0 48 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Battery fill */}
        <rect
          x="4"
          y="6"
          width={(34 * pct) / 100}
          height="12"
          rx="1"
          fill={fillColor}
        />

        {/* Percentage / charging indicator */}
        {isCharging ? (
          <foreignObject
            x={cx - 6}
            y={cy - 6}
            width="12"
            height="12"
            pointerEvents="none"
          >
            <div
              style={{
                width: '12px',
                height: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <TbBolt
                size={12}
                color="white"
                strokeWidth={2}
              />
            </div>
          </foreignObject>
        ) : (
          <>
            {/* Dark outline behind text */}
            <text
              x={cx}
              y={cy}
              textAnchor="middle"
              dominantBaseline="central"
              fill="none"
              stroke="#ffffff"
              strokeWidth="2"
              strokeLinejoin="round"
              fontSize="8"
              fontWeight="700"
              fontFamily="inherit"
              paintOrder="stroke"
              pointerEvents="none"
            >
              {pct}%
            </text>

            {/* Actual text */}
            <text
              x={cx}
              y={cy}
              textAnchor="middle"
              dominantBaseline="central"
              fill="#0d0f14"
              fontSize="8"
              fontWeight="700"
              fontFamily="inherit"
              pointerEvents="none"
            >
              {pct}%
            </text>
          </>
        )}

        {/* Battery outline — rendered last so everything stays inside */}
        <rect
          x="2"
          y="4"
          width="38"
          height="16"
          rx="2"
          stroke="#3a4060"
          strokeWidth="1.5"
          fill="none"
        />

        {/* Terminal */}
        <rect
          x="41"
          y="8"
          width="4"
          height="8"
          rx="1"
          fill="#3a4060"
        />
      </svg>
    </div>
  )
}