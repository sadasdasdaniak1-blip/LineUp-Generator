import { Lineup } from '../types';

interface Props {
  lineups: Lineup[];
  tab: number;
}

const SLOT_ANGLES: Record<number, number> = {
  1: -90,   // top
  2: -45,   // top-right
  3: 0,     // right
  4: 45,    // bottom-right
  5: 90,    // bottom
  6: 135,   // bottom-left
  7: 180,   // left
  8: -135,  // top-left
};

const GRENADE_COLORS: Record<string, string> = {
  smoke: '#6b7280',
  flash: '#facc15',
  he: '#ef4444',
  molotov: '#f97316',
};

const GRENADE_ICONS: Record<string, string> = {
  smoke: '💨',
  flash: '⚡',
  he: '💣',
  molotov: '🔥',
};

export default function RadialPreview({ lineups, tab }: Props) {
  const tabLineups = lineups.filter((l) => l.tab === tab);
  const radius = 90;
  const cx = 130;
  const cy = 130;

  return (
    <div className="flex flex-col items-center">
      <div className="text-xs text-gray-500 mb-2">Tab {tab} — podgląd menu radialnego</div>
      <svg width={260} height={260} className="drop-shadow-lg">
        {/* Background circle */}
        <circle cx={cx} cy={cy} r={125} fill="#0d1117" stroke="#2d3550" strokeWidth={1} />
        <circle cx={cx} cy={cy} r={40} fill="#1a1f2e" stroke="#2d3550" strokeWidth={1} />
        <text x={cx} y={cy + 5} textAnchor="middle" fill="#6b7280" fontSize={10}>
          MENU
        </text>

        {/* Slots */}
        {[1, 2, 3, 4, 5, 6, 7, 8].map((slot) => {
          const angle = ((SLOT_ANGLES[slot] || 0) * Math.PI) / 180;
          const x = cx + radius * Math.cos(angle);
          const y = cy + radius * Math.sin(angle);
          const lineup = tabLineups.find((l) => l.slot === slot);
          const color = lineup ? GRENADE_COLORS[lineup.grenadeType] || '#f97316' : '#2d3550';
          const icon = lineup ? GRENADE_ICONS[lineup.grenadeType] || '?' : '';

          return (
            <g key={slot}>
              <circle
                cx={x}
                cy={y}
                r={22}
                fill={lineup ? color + '33' : '#1a1f2e'}
                stroke={color}
                strokeWidth={lineup ? 2 : 1}
              />
              {lineup ? (
                <>
                  <text x={x} y={y - 4} textAnchor="middle" fontSize={14}>
                    {icon}
                  </text>
                  <text
                    x={x}
                    y={y + 10}
                    textAnchor="middle"
                    fill="white"
                    fontSize={6}
                    fontWeight="bold"
                  >
                    {lineup.name.slice(0, 8)}
                  </text>
                </>
              ) : (
                <text x={x} y={y + 4} textAnchor="middle" fill="#4b5563" fontSize={10}>
                  {slot}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
