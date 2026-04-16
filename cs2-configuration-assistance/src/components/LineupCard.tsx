import { Lineup } from '../types';

interface Props {
  lineup: Lineup;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
}

const GRENADE_COLORS: Record<string, string> = {
  smoke: 'border-gray-500 bg-gray-500/10',
  flash: 'border-yellow-400 bg-yellow-400/10',
  he: 'border-red-500 bg-red-500/10',
  molotov: 'border-orange-500 bg-orange-500/10',
};
const GRENADE_TEXT: Record<string, string> = {
  smoke: 'text-gray-300',
  flash: 'text-yellow-300',
  he: 'text-red-300',
  molotov: 'text-orange-300',
};
const GRENADE_ICONS: Record<string, string> = {
  smoke: '💨',
  flash: '⚡',
  he: '💣',
  molotov: '🔥',
};
const THROW_COLORS: Record<string, string> = {
  WJT: 'bg-blue-500/20 text-blue-300',
  JT: 'bg-green-500/20 text-green-300',
  WSJT: 'bg-purple-500/20 text-purple-300',
  DSJT: 'bg-pink-500/20 text-pink-300',
};

export default function LineupCard({ lineup, onEdit, onDelete, onDuplicate }: Props) {
  return (
    <div
      className={`rounded-xl border-2 p-4 transition-all hover:scale-[1.01] ${GRENADE_COLORS[lineup.grenadeType] || 'border-[#2d3550] bg-[#1a1f2e]'}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-base font-bold ${GRENADE_TEXT[lineup.grenadeType]}`}>
              {GRENADE_ICONS[lineup.grenadeType]} {lineup.name}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${THROW_COLORS[lineup.throwType]}`}>
              {lineup.throwType}
            </span>
          </div>
          {lineup.description && (
            <p className="text-gray-400 text-xs mt-1">{lineup.description}</p>
          )}
        </div>

        <div className="flex gap-1 shrink-0">
          <button
            onClick={onDuplicate}
            title="Duplikuj"
            className="p-1.5 rounded-lg bg-[#2d3550] hover:bg-[#3d4560] text-gray-400 hover:text-white text-xs transition-colors"
          >
            📋
          </button>
          <button
            onClick={onEdit}
            title="Edytuj"
            className="p-1.5 rounded-lg bg-[#2d3550] hover:bg-blue-600 text-gray-400 hover:text-white text-xs transition-colors"
          >
            ✏️
          </button>
          <button
            onClick={onDelete}
            title="Usuń"
            className="p-1.5 rounded-lg bg-[#2d3550] hover:bg-red-600 text-gray-400 hover:text-white text-xs transition-colors"
          >
            🗑️
          </button>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
        <div className="bg-[#0d1117] rounded-lg px-2 py-1.5">
          <span className="text-gray-500 block">Tab / Slot</span>
          <span className="text-white font-mono">
            {lineup.tab} / {lineup.slot}
          </span>
        </div>
        <div className="bg-[#0d1117] rounded-lg px-2 py-1.5">
          <span className="text-gray-500 block">Yaw</span>
          <span className="text-white font-mono truncate block">{lineup.yaw}</span>
        </div>
        <div className="bg-[#0d1117] rounded-lg px-2 py-1.5">
          <span className="text-gray-500 block">Pitch</span>
          <span className="text-white font-mono truncate block">{lineup.pitch}</span>
        </div>
      </div>

      <div className="mt-2 bg-[#0d1117] rounded-lg px-2 py-1.5 text-xs">
        <span className="text-gray-500 block">setpos</span>
        <span className="text-green-400 font-mono">
          {lineup.posX} {lineup.posY} {lineup.posZ}
        </span>
      </div>

      {lineup.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {lineup.tags.map((tag) => (
            <span key={tag} className="px-2 py-0.5 rounded-full bg-[#f97316]/20 text-orange-300 text-xs">
              #{tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
