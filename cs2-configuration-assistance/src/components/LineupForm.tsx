import React, { useState, useEffect } from 'react';
import { Lineup, ThrowType, GrenadeType } from '../types';


interface Props {
  mapId: string;
  existing?: Lineup;
  onSave: (lineup: Omit<Lineup, 'id'>) => void;
  onCancel: () => void;
}

const THROW_TYPES: ThrowType[] = ['WJT', 'JT', 'WSJT', 'DSJT'];
const GRENADE_TYPES: GrenadeType[] = ['smoke', 'flash', 'he', 'molotov'];


const GRENADE_COLORS: Record<GrenadeType, string> = {
  smoke: 'bg-gray-500',
  flash: 'bg-yellow-400',
  he: 'bg-red-500',
  molotov: 'bg-orange-500',
};

const GRENADE_ICONS: Record<GrenadeType, string> = {
  smoke: '💨',
  flash: '⚡',
  he: '💣',
  molotov: '🔥',
};

const empty: Omit<Lineup, 'id'> = {
  name: '',
  description: '',
  map: '',
  grenadeType: 'smoke',
  throwType: 'WJT',
  posX: '0',
  posY: '0',
  posZ: '0',
  yaw: '0',
  pitch: '0',
  slot: 1,
  tab: 0,
  tags: [],
};

export default function LineupForm({ mapId, existing, onSave, onCancel }: Props) {
  const [form, setForm] = useState<Omit<Lineup, 'id'>>(
    existing ? { ...existing } : { ...empty, map: mapId }
  );
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    if (existing) setForm({ ...existing });
    else setForm({ ...empty, map: mapId });
  }, [existing, mapId]);

  const set = <K extends keyof typeof form>(key: K, val: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [key]: val }));

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !form.tags.includes(t)) {
      set('tags', [...form.tags, t]);
    }
    setTagInput('');
  };

  const removeTag = (tag: string) => set('tags', form.tags.filter((t) => t !== tag));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
  };

  const inputCls =
    'w-full bg-[#1a1f2e] border border-[#2d3550] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#f97316] transition-colors';
  const labelCls = 'block text-xs text-gray-400 mb-1 uppercase tracking-wide';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Name & Description */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Lineup Name *</label>
          <input
            required
            className={inputCls}
            placeholder='np. "Window smoke spawn 1"'
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
          />
        </div>
        <div>
          <label className={labelCls}>Description</label>
          <input
            className={inputCls}
            placeholder="Krótki opis lineupa"
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
          />
        </div>
      </div>

      {/* Grenade Type */}
      <div>
        <label className={labelCls}>Granat</label>
        <div className="flex gap-2">
          {GRENADE_TYPES.map((g) => (
            <button
              type="button"
              key={g}
              onClick={() => set('grenadeType', g)}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold border-2 transition-all ${
                form.grenadeType === g
                  ? 'border-[#f97316] text-white scale-105'
                  : 'border-[#2d3550] text-gray-400 hover:border-gray-500'
              } ${form.grenadeType === g ? GRENADE_COLORS[g] : 'bg-[#1a1f2e]'}`}
            >
              {GRENADE_ICONS[g]} {g}
            </button>
          ))}
        </div>
      </div>

      {/* Throw Type */}
      <div>
        <label className={labelCls}>Rodzaj rzutu</label>
        <div className="grid grid-cols-2 gap-2">
          {THROW_TYPES.map((t) => (
            <button
              type="button"
              key={t}
              onClick={() => set('throwType', t)}
              className={`py-2 px-3 rounded-lg text-sm text-left border-2 transition-all ${
                form.throwType === t
                  ? 'border-[#f97316] bg-[#f97316]/10 text-orange-300'
                  : 'border-[#2d3550] text-gray-400 bg-[#1a1f2e] hover:border-gray-500'
              }`}
            >
              <span className="font-bold">{t}</span>
              <span className="text-xs text-gray-500 ml-1">
                {t === 'WJT' ? '(walk+jump)' : t === 'JT' ? '(running)' : t === 'WSJT' ? '(walkspeed)' : '(duckspeed)'}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Position */}
      <div>
        <label className={labelCls}>Pozycja (setpos) — skopiuj z CS2: getpos</label>
        <div className="grid grid-cols-3 gap-2">
          {(['posX', 'posY', 'posZ'] as const).map((axis) => (
            <div key={axis}>
              <label className="text-xs text-gray-500 mb-1 block">{axis.replace('pos', 'Oś ').replace('X','X').replace('Y','Y').replace('Z','Z')}</label>
              <input
                className={inputCls}
                placeholder="0.000000"
                value={form[axis]}
                onChange={(e) => set(axis, e.target.value)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Angles */}
      <div>
        <label className={labelCls}>Kąty celowania — skopiuj z CS2: getpos_exact</label>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Yaw (obrót poziomy)</label>
            <input
              className={inputCls}
              placeholder="7544.44"
              value={form.yaw}
              onChange={(e) => set('yaw', e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Pitch (kąt pionowy)</label>
            <input
              className={inputCls}
              placeholder="2726.65"
              value={form.pitch}
              onChange={(e) => set('pitch', e.target.value)}
            />
          </div>
        </div>
        <p className="text-xs text-gray-600 mt-1">
          💡 Wejdź do CS2, ustaw pozycję i kąt, wpisz <code className="text-orange-400 bg-[#1a1f2e] px-1 rounded">getpos_exact</code> w konsoli i skopiuj wartości.
        </p>
      </div>

      {/* Tab & Slot */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Tab (0=lewy, 1=środek, 2=prawy)</label>
          <select
            className={inputCls}
            value={form.tab}
            onChange={(e) => set('tab', Number(e.target.value))}
          >
            <option value={0}>Tab 0 — Lewy</option>
            <option value={1}>Tab 1 — Środkowy</option>
            <option value={2}>Tab 2 — Prawy</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>Slot w menu (1-8)</label>
          <select
            className={inputCls}
            value={form.slot}
            onChange={(e) => set('slot', Number(e.target.value))}
          >
            {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
              <option key={s} value={s}>
                Slot {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tags */}
      <div>
        <label className={labelCls}>Tagi</label>
        <div className="flex gap-2">
          <input
            className={inputCls}
            placeholder="np. A-site, window..."
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
          />
          <button
            type="button"
            onClick={addTag}
            className="px-3 py-2 rounded-lg bg-[#2d3550] text-gray-300 hover:bg-[#3d4560] text-sm"
          >
            +
          </button>
        </div>
        <div className="flex flex-wrap gap-1 mt-2">
          {form.tags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 rounded-full bg-[#f97316]/20 text-orange-300 text-xs flex items-center gap-1"
            >
              {tag}
              <button type="button" onClick={() => removeTag(tag)} className="hover:text-red-400">
                ×
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* Buttons */}
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          className="flex-1 py-2.5 rounded-lg bg-[#f97316] hover:bg-[#ea6c0a] text-white font-bold text-sm transition-colors"
        >
          {existing ? '💾 Zapisz zmiany' : '➕ Dodaj lineup'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2.5 rounded-lg bg-[#2d3550] hover:bg-[#3d4560] text-gray-300 text-sm transition-colors"
        >
          Anuluj
        </button>
      </div>
    </form>
  );
}
