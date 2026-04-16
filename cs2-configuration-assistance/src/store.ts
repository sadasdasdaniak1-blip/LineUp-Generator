import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { MapData, Lineup } from './types';
import { v4 as uuidv4 } from 'uuid';

interface Store {
  maps: MapData[];
  activeMapId: string | null;
  addMap: (name: string) => void;
  removeMap: (id: string) => void;
  setActiveMap: (id: string) => void;
  addLineup: (mapId: string, lineup: Omit<Lineup, 'id'>) => void;
  updateLineup: (mapId: string, lineup: Lineup) => void;
  removeLineup: (mapId: string, lineupId: string) => void;
  duplicateLineup: (mapId: string, lineupId: string) => void;
}

const DEFAULT_MAPS: MapData[] = [
  { id: 'mirage', name: 'Mirage', lineups: [] },
  { id: 'inferno', name: 'Inferno', lineups: [] },
  { id: 'ancient', name: 'Ancient', lineups: [] },
  { id: 'anubis', name: 'Anubis', lineups: [] },
  { id: 'dust2', name: 'Dust2', lineups: [] },
];

export const useStore = create<Store>()(
  persist(
    (set) => ({
      maps: DEFAULT_MAPS,
      activeMapId: 'mirage',

      addMap: (name) =>
        set((s) => ({
          maps: [...s.maps, { id: uuidv4(), name, lineups: [] }],
        })),

      removeMap: (id) =>
        set((s) => ({
          maps: s.maps.filter((m) => m.id !== id),
          activeMapId: s.activeMapId === id ? (s.maps[0]?.id ?? null) : s.activeMapId,
        })),

      setActiveMap: (id) => set({ activeMapId: id }),

      addLineup: (mapId, lineup) =>
        set((s) => ({
          maps: s.maps.map((m) =>
            m.id === mapId
              ? { ...m, lineups: [...m.lineups, { ...lineup, id: uuidv4() }] }
              : m
          ),
        })),

      updateLineup: (mapId, lineup) =>
        set((s) => ({
          maps: s.maps.map((m) =>
            m.id === mapId
              ? { ...m, lineups: m.lineups.map((l) => (l.id === lineup.id ? lineup : l)) }
              : m
          ),
        })),

      removeLineup: (mapId, lineupId) =>
        set((s) => ({
          maps: s.maps.map((m) =>
            m.id === mapId
              ? { ...m, lineups: m.lineups.filter((l) => l.id !== lineupId) }
              : m
          ),
        })),

      duplicateLineup: (mapId, lineupId) =>
        set((s) => ({
          maps: s.maps.map((m) => {
            if (m.id !== mapId) return m;
            const original = m.lineups.find((l) => l.id === lineupId);
            if (!original) return m;
            const copy = { ...original, id: uuidv4(), name: original.name + ' (copy)' };
            return { ...m, lineups: [...m.lineups, copy] };
          }),
        })),
    }),
    { name: 'cs2-autolineup-store' }
  )
);
