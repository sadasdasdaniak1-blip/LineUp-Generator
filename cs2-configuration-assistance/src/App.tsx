import { useState, useMemo } from 'react';
import { useStore } from './store';
import { Lineup } from './types';
import LineupForm from './components/LineupForm';
import LineupCard from './components/LineupCard';
import RadialPreview from './components/RadialPreview';
import { generateCmdCfg, generateLabelCfg, generateReadme, downloadFile } from './cfgGenerator';

const MAP_ICONS: Record<string, string> = {
  mirage: '🏙️',
  inferno: '🔥',
  ancient: '🏛️',
  anubis: '⚱️',
  dust2: '🏜️',
};

export default function App() {
  const { maps, activeMapId, setActiveMap, addMap, removeMap, addLineup, updateLineup, removeLineup, duplicateLineup } = useStore();
  const [showForm, setShowForm] = useState(false);
  const [editingLineup, setEditingLineup] = useState<Lineup | undefined>(undefined);
  const [filterGrenade, setFilterGrenade] = useState<string>('all');
  const [filterTab, setFilterTab] = useState<number>(-1);
  const [search, setSearch] = useState('');
  const [activePreviewTab, setActivePreviewTab] = useState(0);
  const [newMapName, setNewMapName] = useState('');
  const [showNewMap, setShowNewMap] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showExport, setShowExport] = useState(false);

  const activeMap = maps.find((m) => m.id === activeMapId);

  const filteredLineups = useMemo(() => {
    if (!activeMap) return [];
    return activeMap.lineups.filter((l) => {
      if (filterGrenade !== 'all' && l.grenadeType !== filterGrenade) return false;
      if (filterTab !== -1 && l.tab !== filterTab) return false;
      if (search && !l.name.toLowerCase().includes(search.toLowerCase()) && !l.description.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [activeMap, filterGrenade, filterTab, search]);

  const handleSave = (lineup: Omit<Lineup, 'id'>) => {
    if (!activeMapId) return;
    if (editingLineup) {
      updateLineup(activeMapId, { ...lineup, id: editingLineup.id });
    } else {
      addLineup(activeMapId, { ...lineup, map: activeMapId });
    }
    setShowForm(false);
    setEditingLineup(undefined);
  };

  const handleEdit = (lineup: Lineup) => {
    setEditingLineup(lineup);
    setShowForm(true);
  };

  const handleAddMap = () => {
    if (!newMapName.trim()) return;
    addMap(newMapName.trim());
    setNewMapName('');
    setShowNewMap(false);
  };

  const handleExport = (type: 'cmd' | 'label' | 'readme') => {
    if (!activeMap) return;
    if (type === 'cmd') downloadFile(generateCmdCfg(activeMap), `cmd.cfg`);
    if (type === 'label') downloadFile(generateLabelCfg(activeMap), `label.cfg`);
    if (type === 'readme') downloadFile(generateReadme(activeMap), `${activeMap.name}_lineups.md`);
  };

  return (
    <div className="min-h-screen bg-[#0d1117] text-white flex flex-col">
      {/* HEADER */}
      <header className="bg-[#1a1f2e] border-b border-[#2d3550] px-6 py-3 flex items-center justify-between gap-4 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-[#f97316] rounded-lg flex items-center justify-center text-lg font-black">
            CS
          </div>
          <div>
            <h1 className="text-base font-bold leading-tight">AutoLineup Creator</h1>
            <p className="text-xs text-gray-500">CS2 CFG Generator — format AutoLineup by Leiti</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowHelp(!showHelp)}
            className="px-3 py-1.5 rounded-lg bg-[#2d3550] hover:bg-[#3d4560] text-gray-300 text-sm transition-colors"
          >
            ❓ Jak używać
          </button>
          <a
            href="https://github.com/xLeiti/AutoLineup"
            target="_blank"
            rel="noreferrer"
            className="px-3 py-1.5 rounded-lg bg-[#2d3550] hover:bg-[#3d4560] text-gray-300 text-sm transition-colors"
          >
            📦 GitHub
          </a>
        </div>
      </header>

      {/* HELP PANEL */}
      {showHelp && (
        <div className="bg-[#131820] border-b border-[#2d3550] px-6 py-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-orange-400 font-bold mb-3">📖 Jak stworzyć własny lineup?</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="bg-[#1a1f2e] rounded-xl p-4">
                <div className="text-2xl mb-2">1️⃣</div>
                <h3 className="font-bold text-white mb-1">Znajdź pozycję w CS2</h3>
                <p className="text-gray-400">Ustaw się w miejscu rzutu, wpisz w konsoli:</p>
                <code className="text-orange-300 bg-[#0d1117] block px-2 py-1 rounded mt-2 text-xs">getpos_exact</code>
                <p className="text-gray-400 mt-2 text-xs">Skopiuj wartości X, Y, Z (setpos) i kąty (yaw, pitch).</p>
              </div>
              <div className="bg-[#1a1f2e] rounded-xl p-4">
                <div className="text-2xl mb-2">2️⃣</div>
                <h3 className="font-bold text-white mb-1">Dodaj lineup tutaj</h3>
                <p className="text-gray-400 text-xs">Wybierz mapę, kliknij "Dodaj Lineup", wypełnij formularz z skopiowanymi danymi. Wybierz tab i slot w menu radialnym.</p>
              </div>
              <div className="bg-[#1a1f2e] rounded-xl p-4">
                <div className="text-2xl mb-2">3️⃣</div>
                <h3 className="font-bold text-white mb-1">Eksportuj i wklej</h3>
                <p className="text-gray-400 text-xs">Kliknij "Eksportuj CFG", pobierz pliki <code className="text-orange-300">cmd.cfg</code> i <code className="text-orange-300">label.cfg</code>, wklej je do:</p>
                <code className="text-green-300 bg-[#0d1117] block px-2 py-1 rounded mt-2 text-xs">cfg/autolineup/maps/MAPA/</code>
              </div>
            </div>
            <div className="mt-3 bg-[#1a1f2e] rounded-xl p-4">
              <h3 className="font-bold text-white mb-2 text-sm">🎯 Format kątów — jak czytać getpos_exact</h3>
              <code className="text-green-300 text-xs">setpos 1296.000000 32.000000 -167.968750; setang 0.000000 7544.44 0</code>
              <p className="text-gray-400 text-xs mt-2">
                • <span className="text-orange-300">setpos</span> → X Y Z — wklej jako pozycję<br/>
                • <span className="text-orange-300">setang</span> → pitch yaw roll — <strong>YAW</strong> to poziomy obrót, <strong>PITCH</strong> to pionowy kąt
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* SIDEBAR — Maps */}
        <aside className="w-52 bg-[#131820] border-r border-[#2d3550] flex flex-col shrink-0">
          <div className="p-3 border-b border-[#2d3550]">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Mapy</p>
          </div>
          <div className="flex-1 overflow-y-auto py-2">
            {maps.map((map) => (
              <div
                key={map.id}
                className={`group flex items-center justify-between px-3 py-2.5 mx-2 rounded-lg cursor-pointer transition-all mb-1 ${
                  activeMapId === map.id
                    ? 'bg-[#f97316]/20 border border-[#f97316]/40'
                    : 'hover:bg-[#1a1f2e] border border-transparent'
                }`}
                onClick={() => setActiveMap(map.id)}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-base">{MAP_ICONS[map.id.toLowerCase()] || '🗺️'}</span>
                  <div className="min-w-0">
                    <p className={`text-sm font-semibold truncate ${activeMapId === map.id ? 'text-orange-300' : 'text-gray-300'}`}>
                      {map.name}
                    </p>
                    <p className="text-xs text-gray-600">{map.lineups.length} lineups</p>
                  </div>
                </div>
                {!['mirage', 'inferno', 'ancient', 'anubis', 'dust2'].includes(map.id) && (
                  <button
                    onClick={(e) => { e.stopPropagation(); removeMap(map.id); }}
                    className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-400 text-xs transition-opacity"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Add map */}
          <div className="p-3 border-t border-[#2d3550]">
            {showNewMap ? (
              <div className="space-y-2">
                <input
                  autoFocus
                  className="w-full bg-[#1a1f2e] border border-[#2d3550] rounded-lg px-2 py-1.5 text-white text-xs focus:outline-none focus:border-[#f97316]"
                  placeholder="Nazwa mapy..."
                  value={newMapName}
                  onChange={(e) => setNewMapName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddMap()}
                />
                <div className="flex gap-1">
                  <button onClick={handleAddMap} className="flex-1 py-1 rounded bg-[#f97316] text-white text-xs font-bold">
                    Dodaj
                  </button>
                  <button onClick={() => setShowNewMap(false)} className="px-2 py-1 rounded bg-[#2d3550] text-gray-400 text-xs">
                    ✕
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowNewMap(true)}
                className="w-full py-2 rounded-lg bg-[#1a1f2e] hover:bg-[#2d3550] text-gray-400 hover:text-white text-xs border border-dashed border-[#2d3550] hover:border-[#f97316] transition-all"
              >
                + Dodaj mapę
              </button>
            )}
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {activeMap ? (
            <>
              {/* Toolbar */}
              <div className="bg-[#1a1f2e] border-b border-[#2d3550] px-5 py-3 flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{MAP_ICONS[activeMap.id.toLowerCase()] || '🗺️'}</span>
                  <h2 className="text-lg font-bold">{activeMap.name}</h2>
                  <span className="px-2 py-0.5 rounded-full bg-[#f97316]/20 text-orange-300 text-xs">
                    {activeMap.lineups.length} lineups
                  </span>
                </div>

                <div className="flex items-center gap-2 ml-auto flex-wrap">
                  {/* Search */}
                  <input
                    className="bg-[#0d1117] border border-[#2d3550] rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-[#f97316] w-40"
                    placeholder="🔍 Szukaj..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                  {/* Grenade filter */}
                  <select
                    className="bg-[#0d1117] border border-[#2d3550] rounded-lg px-2 py-1.5 text-gray-300 text-sm focus:outline-none focus:border-[#f97316]"
                    value={filterGrenade}
                    onChange={(e) => setFilterGrenade(e.target.value)}
                  >
                    <option value="all">Wszystkie granaty</option>
                    <option value="smoke">💨 Smoke</option>
                    <option value="flash">⚡ Flash</option>
                    <option value="he">💣 HE</option>
                    <option value="molotov">🔥 Molotov</option>
                  </select>
                  {/* Tab filter */}
                  <select
                    className="bg-[#0d1117] border border-[#2d3550] rounded-lg px-2 py-1.5 text-gray-300 text-sm focus:outline-none focus:border-[#f97316]"
                    value={filterTab}
                    onChange={(e) => setFilterTab(Number(e.target.value))}
                  >
                    <option value={-1}>Wszystkie taby</option>
                    <option value={0}>Tab 0</option>
                    <option value={1}>Tab 1</option>
                    <option value={2}>Tab 2</option>
                  </select>

                  {/* Export */}
                  <div className="relative">
                    <button
                      onClick={() => setShowExport(!showExport)}
                      className="px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-500 text-white text-sm font-semibold transition-colors"
                    >
                      ⬇️ Eksportuj CFG
                    </button>
                    {showExport && (
                      <div className="absolute right-0 top-full mt-1 bg-[#1a1f2e] border border-[#2d3550] rounded-xl shadow-2xl z-50 w-52 overflow-hidden">
                        <button
                          onClick={() => { handleExport('cmd'); setShowExport(false); }}
                          className="w-full px-4 py-3 text-left text-sm hover:bg-[#2d3550] text-gray-200 border-b border-[#2d3550]"
                        >
                          📄 <strong>cmd.cfg</strong>
                          <p className="text-xs text-gray-500">Komendy lineupów</p>
                        </button>
                        <button
                          onClick={() => { handleExport('label'); setShowExport(false); }}
                          className="w-full px-4 py-3 text-left text-sm hover:bg-[#2d3550] text-gray-200 border-b border-[#2d3550]"
                        >
                          🏷️ <strong>label.cfg</strong>
                          <p className="text-xs text-gray-500">Nazwy w menu</p>
                        </button>
                        <button
                          onClick={() => { handleExport('readme'); setShowExport(false); }}
                          className="w-full px-4 py-3 text-left text-sm hover:bg-[#2d3550] text-gray-200"
                        >
                          📋 <strong>README.md</strong>
                          <p className="text-xs text-gray-500">Lista lineupów</p>
                        </button>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => { setEditingLineup(undefined); setShowForm(true); }}
                    className="px-4 py-1.5 rounded-lg bg-[#f97316] hover:bg-[#ea6c0a] text-white text-sm font-bold transition-colors"
                  >
                    ➕ Dodaj Lineup
                  </button>
                </div>
              </div>

              <div className="flex flex-1 overflow-hidden">
                {/* Lineup list */}
                <div className="flex-1 overflow-y-auto p-5">
                  {filteredLineups.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center gap-4 py-20">
                      <div className="text-6xl">🎯</div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-300 mb-2">Brak lineupów</h3>
                        <p className="text-gray-500 text-sm max-w-xs">
                          {activeMap.lineups.length === 0
                            ? 'Dodaj swój pierwszy lineup dla tej mapy klikając przycisk powyżej.'
                            : 'Żaden lineup nie spełnia kryteriów filtrowania.'}
                        </p>
                      </div>
                      {activeMap.lineups.length === 0 && (
                        <button
                          onClick={() => { setEditingLineup(undefined); setShowForm(true); }}
                          className="px-6 py-2.5 rounded-xl bg-[#f97316] hover:bg-[#ea6c0a] text-white font-bold transition-colors"
                        >
                          ➕ Dodaj pierwszy lineup
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                      {filteredLineups.map((lineup) => (
                        <LineupCard
                          key={lineup.id}
                          lineup={lineup}
                          onEdit={() => handleEdit(lineup)}
                          onDelete={() => removeLineup(activeMapId!, lineup.id)}
                          onDuplicate={() => duplicateLineup(activeMapId!, lineup.id)}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Right panel — Radial Preview + Form */}
                <aside className="w-80 bg-[#131820] border-l border-[#2d3550] flex flex-col shrink-0 overflow-y-auto">
                  {/* Radial preview */}
                  <div className="p-4 border-b border-[#2d3550]">
                    <h3 className="text-sm font-bold text-gray-300 mb-3">🎮 Podgląd menu radialnego</h3>
                    <div className="flex gap-1 mb-3">
                      {[0, 1, 2].map((t) => (
                        <button
                          key={t}
                          onClick={() => setActivePreviewTab(t)}
                          className={`flex-1 py-1 rounded text-xs font-semibold transition-colors ${
                            activePreviewTab === t
                              ? 'bg-[#f97316] text-white'
                              : 'bg-[#2d3550] text-gray-400 hover:bg-[#3d4560]'
                          }`}
                        >
                          Tab {t}
                        </button>
                      ))}
                    </div>
                    <RadialPreview lineups={activeMap.lineups} tab={activePreviewTab} />
                    <div className="mt-3 space-y-1">
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((slot) => {
                        const l = activeMap.lineups.find((x) => x.tab === activePreviewTab && x.slot === slot);
                        return (
                          <div key={slot} className="flex items-center gap-2 text-xs">
                            <span className="text-gray-600 w-10 shrink-0">Slot {slot}</span>
                            {l ? (
                              <span className="text-orange-300 font-semibold truncate">{l.name}</span>
                            ) : (
                              <span className="text-gray-700">— pusty —</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="p-4">
                    <h3 className="text-sm font-bold text-gray-300 mb-3">📊 Statystyki</h3>
                    <div className="space-y-2">
                      {(['smoke', 'flash', 'he', 'molotov'] as const).map((g) => {
                        const count = activeMap.lineups.filter((l) => l.grenadeType === g).length;
                        const icons: Record<string, string> = { smoke: '💨', flash: '⚡', he: '💣', molotov: '🔥' };
                        return (
                          <div key={g} className="flex items-center gap-2">
                            <span className="text-sm w-6">{icons[g]}</span>
                            <div className="flex-1 bg-[#0d1117] rounded-full h-2">
                              <div
                                className="h-2 rounded-full bg-[#f97316] transition-all"
                                style={{ width: activeMap.lineups.length ? `${(count / activeMap.lineups.length) * 100}%` : '0%' }}
                              />
                            </div>
                            <span className="text-xs text-gray-400 w-4 text-right">{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </aside>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-gray-500">Wybierz mapę z bocznego paska</p>
            </div>
          )}
        </main>
      </div>

      {/* FORM MODAL */}
      {showForm && activeMap && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={(e) => e.target === e.currentTarget && (setShowForm(false), setEditingLineup(undefined))}
        >
          <div className="bg-[#1a1f2e] rounded-2xl border border-[#2d3550] w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="px-6 py-4 border-b border-[#2d3550] flex items-center justify-between">
              <h2 className="text-lg font-bold">
                {editingLineup ? '✏️ Edytuj lineup' : '➕ Nowy lineup'} — {activeMap.name}
              </h2>
              <button
                onClick={() => { setShowForm(false); setEditingLineup(undefined); }}
                className="text-gray-400 hover:text-white text-xl leading-none"
              >
                ✕
              </button>
            </div>
            <div className="p-6">
              <LineupForm
                mapId={activeMap.id}
                existing={editingLineup}
                onSave={handleSave}
                onCancel={() => { setShowForm(false); setEditingLineup(undefined); }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
