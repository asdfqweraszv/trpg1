import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Character, Equipment, SPECIES_LABELS, STAT_LABELS, SPECIES_BONUSES, FIXED_BASE_STATS, ItemRarity, JOB_BONUSES, Job  } from '../types/character';
import { getTotalStat, getEffectiveStat, verifyPassword } from '../utils/stats';
import {
  ArrowLeft, Lock, Unlock, ChevronUp, ChevronDown, Plus, Trash2,
  Shield, Swords, Zap, Heart, Sparkles, Brain, Wind, Star, AlertTriangle, Target
} from 'lucide-react';

interface Props {
  characterId: string;
  onBack: () => void;
}

const STAT_ICONS: Record<string, React.ReactNode> = {
  hp: <Heart size={14} />,
  attack: <Swords size={14} />,
  spell: <Sparkles size={14} />,
  mana: <Zap size={14} />,
  intelligence: <Brain size={14} />,
  agility: <Wind size={14} />,
  defense: <Shield size={14} />,
  magic_resist: <Star size={14} />,
  charm: <Star size={14} />,
};

const STAT_COLOR: Record<string, string> = {
  hp: 'text-red-400',
  attack: 'text-orange-400',
  spell: 'text-cyan-400',
  mana: 'text-blue-400',
  intelligence: 'text-yellow-400',
  agility: 'text-green-400',
  defense: 'text-sky-400',
  magic_resist: 'text-teal-400',
  charm: 'text-pink-400',
};

const RARITY_COLORS: Record<ItemRarity, string> = {
  '저급': 'text-amber-700 bg-amber-950/40 border-amber-800/50',
  '일반': 'text-gray-400 bg-gray-800/40 border-gray-700/50',
  '고급': 'text-purple-400 bg-purple-950/40 border-purple-800/50',
  '희귀': 'text-blue-400 bg-blue-950/40 border-blue-800/50',
  '전설': 'text-yellow-400 bg-yellow-950/40 border-yellow-800/50',
};

const STAT_BG: Record<string, string> = {
  hp: 'bg-red-950/30 border-red-900/40',
  attack: 'bg-orange-950/30 border-orange-900/40',
  spell: 'bg-cyan-950/30 border-cyan-900/40',
  mana: 'bg-blue-950/30 border-blue-900/40',
  intelligence: 'bg-yellow-950/30 border-yellow-900/40',
  agility: 'bg-green-950/30 border-green-900/40',
  defense: 'bg-sky-950/30 border-sky-900/40',
  magic_resist: 'bg-teal-950/30 border-teal-900/40',
  charm: 'bg-pink-950/30 border-pink-900/40',
};

const ALL_STATS = ['hp', 'attack', 'spell', 'mana', 'intelligence', 'agility', 'defense', 'magic_resist', 'charm'];
const EQUIPMENT_SLOTS = ['장비 1', '장비 2', '장비 3', '장비 4', '장비 5'];
const RARITY_LIST: ItemRarity[] = ['저급', '일반', '고급', '희귀', '전설'];

type Tab = 'stats' | 'equipment' | 'notes';

export default function CharacterSheet({ characterId, onBack }: Props) {
  const [char, setChar] = useState<Character | null>(null);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [unlocked, setUnlocked] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [masterMode, setMasterMode] = useState(false);
  const [masterInput, setMasterInput] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [tab, setTab] = useState<Tab>('stats');
  const [saving, setSaving] = useState(false);
  const [hpInput, setHpInput] = useState('');
  const [manaInput, setManaInput] = useState('');

  const loadChar = useCallback(async () => {
    const { data: charData } = await supabase.from('characters').select('*').eq('id', characterId).maybeSingle();
    const { data: eqData } = await supabase.from('equipment').select('*').eq('character_id', characterId);
    if (charData) {
      setChar(charData as Character);
      setHpInput(String(charData.current_hp));
      setManaInput(String(charData.current_mana));
    }
    if (eqData) setEquipment(eqData as Equipment[]);
    setLoading(false);
  }, [characterId]);

  useEffect(() => {
    loadChar();
  }, [loadChar]);

  const maxHp = char ? getEffectiveStat(char, 'hp', equipment) : 0;
  const maxMana = char ? getEffectiveStat(char, 'mana', equipment) : 0;

const statPoints = char?.stat_points ?? 0;
const visibleStats = ALL_STATS;

  async function saveChar(updates: Partial<Character>) {
    if (!char) return;
    setSaving(true);
    const { data } = await supabase.from('characters').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', char.id!).select().single();
    if (data) setChar(data as Character);
    setSaving(false);
  }

  async function saveEquipment(eq: Equipment) {
    if (!eq.id) {
      const { data } = await supabase.from('equipment').insert({ ...eq, character_id: characterId }).select().single();
      if (data) setEquipment(prev => [...prev.filter(e => e.slot_name !== eq.slot_name), data as Equipment]);
    } else {
      const { data } = await supabase.from('equipment').update(eq).eq('id', eq.id).select().single();
      if (data) setEquipment(prev => prev.map(e => e.id === data.id ? data as Equipment : e));
    }
  }

  function tryUnlock() {
    if (!char) return;
    if (verifyPassword(passwordInput, char.password_hash)) {
      setUnlocked(true);
      setShowPasswordModal(false);
      setPasswordError('');
    } else {
      setPasswordError('비밀번호가 틀렸습니다');
    }
  }

  async function tryMaster() {
    const { data } = await supabase.from('master_settings').select('master_password_hash').eq('id', 1).maybeSingle();
    if (data && verifyPassword(masterInput, data.master_password_hash)) {
      setMasterMode(true);
      setUnlocked(true);
      setShowPasswordModal(false);
      setPasswordError('');
    } else {
      setPasswordError('마스터 비밀번호가 틀렸습니다');
    }
  }

  function adjustStat(statKey: string, delta: number) {
    if (!char || !unlocked) return;
    if (FIXED_BASE_STATS.includes(statKey) && !masterMode) return;
    const spentKey = `spent_${statKey}` as keyof Character;
    const currentSpent = (char[spentKey] as number) ?? 0;
    if (delta > 0 && statPoints <= 0 && !masterMode) return;
    if (delta < 0 && currentSpent <= 0 && !masterMode) return;
    const newSpent = currentSpent + delta;
    if (newSpent < 0 && !masterMode) return;
    const updates: Partial<Character> = { [spentKey]: Math.max(0, newSpent) };
    if (!masterMode) {
      updates.stat_points = statPoints - delta;
    }
    saveChar(updates);
  }

  function adjustBaseStat(statKey: string, delta: number) {
    if (!char || !masterMode) return;
    const baseKey = `stat_${statKey}` as keyof Character;
    const current = (char[baseKey] as number) ?? 0;
    saveChar({ [baseKey]: Math.max(0, current + delta) });
  }

  async function levelUp() {
    if (!char || !unlocked) return;
    const bonus = char.species === 'slime' ? 4 : 3;
    await saveChar({ level: char.level + 1, stat_points: statPoints + bonus });
  }

  async function updateCurrentHp(val: number) {
    if (!char) return;
    const clamped = Math.max(0, Math.min(maxHp, val));
    await saveChar({ current_hp: clamped });
    setHpInput(String(clamped));
  }

  async function updateCurrentMana(val: number) {
    if (!char) return;
    const clamped = Math.max(0, Math.min(maxMana, val));
    await saveChar({ current_mana: clamped });
    setManaInput(String(clamped));
  }

  async function addEquipmentSlot(slot: string) {
    if (!equipment.find(e => e.slot_name === slot)) {
      const newEq: Equipment = {
        character_id: characterId,
        slot_name: slot,
        item_name: '',
        rarity: '일반',
        bonus_hp: 0, bonus_attack: 0, bonus_spell: 0, bonus_mana: 0,
        bonus_intelligence: 0, bonus_agility: 0, bonus_defense: 0,
        bonus_magic_resist: 0, bonus_charm: 0,
      };
      const { data } = await supabase.from('equipment').insert(newEq).select().single();
      if (data) setEquipment(prev => [...prev, data as Equipment]);
    }
  }

  async function removeEquipment(id: string) {
    await supabase.from('equipment').delete().eq('id', id);
    setEquipment(prev => prev.filter(e => e.id !== id));
  }

  async function updateEquipmentField(id: string, field: string, value: string | number) {
    setEquipment(prev => prev.map(e => e.id === id ? { ...e, [field]: value } : e));
    await supabase.from('equipment').update({ [field]: value }).eq('id', id);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!char) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center text-gray-400">
        캐릭터를 찾을 수 없습니다.
      </div>
    );
  }

  const hpPercent = maxHp > 0 ? (char.current_hp / maxHp) * 100 : 0;
  const manaPercent = maxMana > 0 ? (char.current_mana / maxMana) * 100 : 0;
  const hpColor = hpPercent > 60 ? 'bg-green-500' : hpPercent > 30 ? 'bg-yellow-500' : 'bg-red-500';

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
          <div className="bg-gray-900 rounded-xl border border-gray-700 p-6 w-full max-w-sm">
            <h2 className="font-bold mb-4 text-lg">잠금 해제</h2>
            <input
              type="password"
              value={passwordInput}
              onChange={e => { setPasswordInput(e.target.value); setPasswordError(''); }}
              placeholder="캐릭터 비밀번호"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 mb-2"
              onKeyDown={e => e.key === 'Enter' && tryUnlock()}
            />
            <button onClick={tryUnlock} className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-lg font-medium mb-3 transition-colors">
              잠금 해제
            </button>
            <div className="border-t border-gray-700 pt-3">
              <input
                type="password"
                value={masterInput}
                onChange={e => { setMasterInput(e.target.value); setPasswordError(''); }}
                placeholder="마스터 비밀번호"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-amber-500 mb-2"
                onKeyDown={e => e.key === 'Enter' && tryMaster()}
              />
              <button onClick={tryMaster} className="w-full bg-amber-700 hover:bg-amber-600 text-white py-2.5 rounded-lg font-medium transition-colors">
                마스터로 잠금 해제
              </button>
            </div>
            {passwordError && <p className="text-red-400 text-sm mt-2">{passwordError}</p>}
            <button onClick={() => setShowPasswordModal(false)} className="w-full mt-3 text-gray-500 hover:text-gray-300 text-sm transition-colors">
              취소
            </button>
          </div>
        </div>
      )}

      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <button onClick={onBack} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm">
            <ArrowLeft size={16} /> 목록
          </button>
          <div className="flex items-center gap-2">
            {saving && <span className="text-xs text-gray-500 animate-pulse">저장 중...</span>}
            {masterMode && <span className="text-xs text-amber-400 bg-amber-950/50 border border-amber-800/50 px-2 py-1 rounded">마스터</span>}
            <button
              onClick={() => unlocked ? (setUnlocked(false), setMasterMode(false)) : setShowPasswordModal(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors ${
                unlocked
                  ? 'border-green-700 bg-green-950/30 text-green-400 hover:bg-green-950/50'
                  : 'border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-600'
              }`}
            >
              {unlocked ? <Unlock size={14} /> : <Lock size={14} />}
              {unlocked ? '잠금' : '수정'}
            </button>
          </div>
        </div>

        {/* Character Header */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-5 mb-4">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center text-2xl font-bold text-gray-200">
                {char.name[0]}
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">{char.name}</h1>
                <div className="text-sm text-gray-400 mt-0.5">
                  {SPECIES_LABELS[char.species as keyof typeof SPECIES_LABELS]} · {char.job}
                </div>
                {SPECIES_BONUSES[char.species as keyof typeof SPECIES_BONUSES]?.specialNote && (
                  <div className="text-xs text-amber-400/80 mt-1">{SPECIES_BONUSES[char.species as keyof typeof SPECIES_BONUSES].specialNote}</div>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-white">Lv.{char.level}</div>
              {unlocked && (
                <button
                  onClick={levelUp}
                  className="text-xs text-blue-400 hover:text-blue-300 mt-1 transition-colors"
                >
                  레벨업 +
                </button>
              )}
              {statPoints > 0 && (
                <div className="text-xs text-amber-400 mt-1 font-medium">
                  스탯 포인트: {statPoints}
                </div>
              )}
            </div>
          </div>

          {/* HP Bar */}
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5 text-red-400 text-sm font-medium">
                  <Heart size={14} />
                  <span>체력</span>
                </div>
                <div className="flex items-center gap-2">
                  {unlocked && (
                    <div className="flex items-center gap-1">
                      <button onClick={() => updateCurrentHp(char.current_hp - 1)} className="w-5 h-5 rounded bg-gray-700 hover:bg-gray-600 flex items-center justify-center text-xs transition-colors">-</button>
                      <input
                        value={hpInput}
                        onChange={e => setHpInput(e.target.value)}
                        onBlur={() => updateCurrentHp(Number(hpInput))}
                        onKeyDown={e => e.key === 'Enter' && updateCurrentHp(Number(hpInput))}
                        className="w-12 text-center bg-gray-800 border border-gray-700 rounded text-white text-xs py-0.5 focus:outline-none focus:border-red-500"
                      />
                      <button onClick={() => updateCurrentHp(char.current_hp + 1)} className="w-5 h-5 rounded bg-gray-700 hover:bg-gray-600 flex items-center justify-center text-xs transition-colors">+</button>
                    </div>
                  )}
                  <span className="text-sm text-gray-300 font-medium">{char.current_hp} / {maxHp}</span>
                </div>
              </div>
              <div className="w-full h-3 bg-gray-800 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all ${hpColor}`} style={{ width: `${Math.max(0, Math.min(100, hpPercent))}%` }} />
              </div>
            </div>

            {/* Mana Bar */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5 text-blue-400 text-sm font-medium">
                  <Zap size={14} />
                  <span>마나</span>
                </div>
                <div className="flex items-center gap-2">
                  {unlocked && (
                    <div className="flex items-center gap-1">
                      <button onClick={() => updateCurrentMana(char.current_mana - 1)} className="w-5 h-5 rounded bg-gray-700 hover:bg-gray-600 flex items-center justify-center text-xs transition-colors">-</button>
                      <input
                        value={manaInput}
                        onChange={e => setManaInput(e.target.value)}
                        onBlur={() => updateCurrentMana(Number(manaInput))}
                        onKeyDown={e => e.key === 'Enter' && updateCurrentMana(Number(manaInput))}
                        className="w-12 text-center bg-gray-800 border border-gray-700 rounded text-white text-xs py-0.5 focus:outline-none focus:border-blue-500"
                      />
                      <button onClick={() => updateCurrentMana(char.current_mana + 1)} className="w-5 h-5 rounded bg-gray-700 hover:bg-gray-600 flex items-center justify-center text-xs transition-colors">+</button>
                    </div>
                  )}
                  <span className="text-sm text-gray-300 font-medium">{char.current_mana} / {maxMana}</span>
                </div>
              </div>
              <div className="w-full h-3 bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${Math.max(0, Math.min(100, manaPercent))}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-4 bg-gray-900 rounded-lg p-1 border border-gray-800">
          {(['stats', 'equipment', 'notes'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
                tab === t ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              {t === 'stats' ? '스탯' : t === 'equipment' ? '장비' : '메모'}
            </button>
          ))}
        </div>

        {tab === 'stats' && (
          <div className="grid grid-cols-2 gap-2">
            {visibleStats.map(s => {
              const isFixed = FIXED_BASE_STATS.includes(s);
              const spentKey = `spent_${s}` as keyof Character;
              const spent = (char[spentKey] as number) ?? 0;
              const effective = getEffectiveStat(char, s, equipment);
              const base = getTotalStat(char, s, equipment);
              const hasEquipBonus = effective !== base || equipment.some(e => (e[`bonus_${s}` as keyof Equipment] as number) !== 0);
              const jobBonusValue = (JOB_BONUSES[char.job as Job]?.statModifiers[s as keyof Stats] ?? 0) as number;

              return (
                <div key={s} className={`rounded-xl border p-3 ${STAT_BG[s]}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className={`flex items-center gap-1.5 text-xs font-medium ${STAT_COLOR[s]}`}>
                      {STAT_ICONS[s]}
                      <span>{STAT_LABELS[s]}</span>
                    </div>
                    <span className={`text-xl font-bold ${STAT_COLOR[s]}`}>{effective}</span>
                  </div>

                  <div className="text-xs text-gray-500 space-y-0.5">
                    <div className="flex justify-between">
                      <span>기본</span>
                      <span className="text-gray-400">{char[`stat_${s}` as keyof Character] as number}</span>
                    </div>
                    {!isFixed && spent > 0 && (
                      <div className="flex justify-between">
                        <span>투자</span>
                        <span className="text-green-400">+{spent}</span>
                      </div>
                    )}
                    {equipment.map(eq => {
                      const bonus = eq[`bonus_${s}` as keyof Equipment] as number;
                      if (!bonus) return null;
                      return (
                        <div key={eq.id} className="flex justify-between">
                          <span className="truncate max-w-16">{eq.item_name || eq.slot_name}</span>
                          <span className="text-amber-400">+{bonus}</span>
                        </div>
                      );
                    })}
                  </div>

                  {unlocked && !isFixed && (
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-700/50">
                      <button
                        onClick={() => masterMode ? adjustBaseStat(s, -1) : adjustStat(s, -1)}
                        disabled={!masterMode && spent <= 0}
                        className="w-6 h-6 rounded bg-gray-700/80 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-700 flex items-center justify-center text-white font-bold text-xs transition-colors"
                      >
                        <ChevronDown size={12} />
                      </button>
                      <span className="text-xs text-gray-500">포인트 투자</span>
                      <button
                        onClick={() => masterMode ? adjustBaseStat(s, 1) : adjustStat(s, 1)}
                        disabled={!masterMode && statPoints <= 0}
                        className="w-6 h-6 rounded bg-gray-700/80 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-700 flex items-center justify-center text-white font-bold text-xs transition-colors"
                      >
                        <ChevronUp size={12} />
                      </button>
                    </div>
                  )}
                  {unlocked && isFixed && masterMode && (
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-700/50">
                      <button
                        onClick={() => adjustBaseStat(s, -1)}
                        className="w-6 h-6 rounded bg-gray-700/80 hover:bg-gray-600 flex items-center justify-center text-white font-bold text-xs transition-colors"
                      >
                        <ChevronDown size={12} />
                      </button>
                      <span className="text-xs text-amber-500">마스터 수정</span>
                      <button
                        onClick={() => adjustBaseStat(s, 1)}
                        className="w-6 h-6 rounded bg-gray-700/80 hover:bg-gray-600 flex items-center justify-center text-white font-bold text-xs transition-colors"
                      >
                        <ChevronUp size={12} />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {tab === 'equipment' && (
          <div className="space-y-3">
            {EQUIPMENT_SLOTS.map(slot => {
              const eq = equipment.find(e => e.slot_name === slot);
              return (
                <div key={slot} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-300">{slot}</span>
                    {!eq && unlocked && (
                      <button
                        onClick={() => addEquipmentSlot(slot)}
                        className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        <Plus size={12} /> 장비 추가
                      </button>
                    )}
                    {eq && unlocked && (
                      <button
                        onClick={() => removeEquipment(eq.id!)}
                        className="text-red-500 hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                  {eq ? (
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <input
                          value={eq.item_name}
                          onChange={e => updateEquipmentField(eq.id!, 'item_name', e.target.value)}
                          disabled={!masterMode}
                          placeholder="아이템 이름"
                          className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 disabled:opacity-60 transition-colors"
                        />
                        {masterMode && (
                          <select
                            value={eq.rarity || '일반'}
                            onChange={e => updateEquipmentField(eq.id!, 'rarity', e.target.value)}
                            className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors cursor-pointer ${RARITY_COLORS[eq.rarity || '일반']}`}
                          >
                            {RARITY_LIST.map(r => (
                              <option key={r} value={r}>{r}</option>
                            ))}
                          </select>
                        )}
                        {!masterMode && eq.rarity && (
                          <span className={`px-3 py-2 rounded-lg text-sm font-medium border ${RARITY_COLORS[eq.rarity]}`}>
                            {eq.rarity}
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {ALL_STATS.map(s => {
                          const bonusKey = `bonus_${s}` as keyof Equipment;
                          const val = (eq[bonusKey] as number) ?? 0;
                          return (
                            <div key={s} className="flex items-center gap-2">
                              <span className={`text-xs w-16 ${STAT_COLOR[s]}`}>{STAT_LABELS[s]}</span>
                              {masterMode ? (
                                <input
                                  type="number"
                                  value={val}
                                  onChange={e => updateEquipmentField(eq.id!, bonusKey, Number(e.target.value))}
                                  className="flex-1 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white text-center focus:outline-none focus:border-blue-500"
                                />
                              ) : (
                                <span className={`text-xs font-medium ${val > 0 ? 'text-amber-400' : val < 0 ? 'text-red-400' : 'text-gray-600'}`}>
                                  {val > 0 ? `+${val}` : val}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-gray-600 italic">장비 없음</div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {tab === 'notes' && (
          <div className="space-y-4">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <label className="block text-sm text-gray-400 mb-2">특수 능력 / 패시브</label>
              <textarea
                value={char.special_abilities}
                onChange={e => setChar(prev => prev ? { ...prev, special_abilities: e.target.value } : prev)}
                onBlur={e => saveChar({ special_abilities: e.target.value })}
                disabled={!unlocked}
                placeholder="특수 능력이나 패시브 스킬을 입력하세요..."
                rows={4}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 disabled:opacity-60 resize-none transition-colors"
              />
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <label className="block text-sm text-gray-400 mb-2">메모</label>
              <textarea
                value={char.notes}
                onChange={e => setChar(prev => prev ? { ...prev, notes: e.target.value } : prev)}
                onBlur={e => saveChar({ notes: e.target.value })}
                disabled={!unlocked}
                placeholder="배경 설정, 장비 메모, 기타..."
                rows={6}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 disabled:opacity-60 resize-none transition-colors"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
