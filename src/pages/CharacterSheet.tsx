import { useEffect, useState, useCallback } from 'react';
import { supabase, uploadAvatar } from '../lib/supabase';
import { Character, Equipment, SPECIES_LABELS, STAT_LABELS, SPECIES_BONUSES, FIXED_BASE_STATS, ItemRarity, JOB_BONUSES, Job, Stats } from '../types/character';
import { getTotalStat, getEffectiveStat, verifyPassword, getSpeciesPassiveDescription, canEnhanceEquipment, getEnhanceDifficulty, getMaxEnhanceLevel, rollD20, getHpRegen, getManaRegen } from '../utils/stats';
import {
  ArrowLeft, Lock, Unlock, ChevronUp, ChevronDown, Plus, Trash2,
  Shield, Swords, Zap, Heart, Sparkles, Brain, Wind, Star, AlertTriangle, Target, Camera, RefreshCw
} from 'lucide-react';
import { getExpNeededForNextLevel, getExpToNextLevel, addExp, calculateLevelUp } from '../utils/exp';

interface Props {
  characterId: string;
  onBack: () => void;
  masterMode: boolean;
  setMasterMode: (mode: boolean) => void;
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

export default function CharacterSheet({ characterId, onBack, masterMode, setMasterMode }: Props) {
  const [char, setChar] = useState<Character | null>(null);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [unlocked, setUnlocked] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [tab, setTab] = useState<Tab>('stats');
  const [saving, setSaving] = useState(false);
  const [hpInput, setHpInput] = useState('');
  const [manaInput, setManaInput] = useState('');
  const [undeadReviveUsed, setUndeadReviveUsed] = useState(false);
  const [machineOverloadUsed, setMachineOverloadUsed] = useState(false);
  const [enhanceMessage, setEnhanceMessage] = useState('');
  const [uploading, setUploading] = useState(false);
  const [expInput, setExpInput] = useState('');
  const [showExpModal, setShowExpModal] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);
 const [showEquipmentModal, setShowEquipmentModal] = useState(false);

  const loadChar = useCallback(async () => {
    const { data: charData } = await supabase.from('characters').select('*, exp').eq('id', characterId).maybeSingle();
    const { data: eqData } = await supabase.from('equipment').select('*').eq('character_id', characterId);
    if (charData) {
          console.log('불러온 캐릭터 데이터:', { 
      level: charData.level, 
      exp: charData.exp  // ← exp 확인
    });
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

  useEffect(() => {
    if (masterMode) {
      setUnlocked(true);
    }
  }, [masterMode]);

  const maxHp = char ? getEffectiveStat(char, 'hp', equipment) : 0;
  const maxMana = char ? getEffectiveStat(char, 'mana', equipment) : 0;

const statPoints = char?.stat_points ?? 0;
const visibleStats = ALL_STATS;

async function saveChar(updates: Partial<Character>) {
  if (!char) return;
  setSaving(true);
  
  // 현재 최대 체력/마나 계산
  const currentMaxHp = getEffectiveStat(char, 'hp', equipment);
  const currentMaxMana = getEffectiveStat(char, 'mana', equipment);
  
  // 업데이트 후의 임시 캐릭터 객체 생성
  const tempChar = { ...char, ...updates };
  const newMaxHp = getEffectiveStat(tempChar, 'hp', equipment);
  const newMaxMana = getEffectiveStat(tempChar, 'mana', equipment);
  
  // 최대 체력이 증가했고, current_hp가 업데이트에 없으면 자동 조정
  let finalUpdates = { ...updates };
  if (newMaxHp > currentMaxHp && updates.current_hp === undefined) {
    const increase = newMaxHp - currentMaxHp;
    const newCurrentHp = (char.current_hp || 0) + increase;
    finalUpdates.current_hp = Math.min(newCurrentHp, newMaxHp);
    
    console.log('체력 자동 증가:', {
      oldMaxHp: currentMaxHp,
      newMaxHp,
      oldCurrentHp: char.current_hp,
      newCurrentHp: finalUpdates.current_hp
    });
  }
  
  // 최대 마나가 증가했고, current_mana가 업데이트에 없으면 자동 조정
  if (newMaxMana > currentMaxMana && updates.current_mana === undefined) {
    const increase = newMaxMana - currentMaxMana;
    const newCurrentMana = (char.current_mana || 0) + increase;
    finalUpdates.current_mana = Math.min(newCurrentMana, newMaxMana);
    
    console.log('마나 자동 증가:', {
      oldMaxMana: currentMaxMana,
      newMaxMana,
      oldCurrentMana: char.current_mana,
      newCurrentMana: finalUpdates.current_mana
    });
  }
  
  const { data } = await supabase
    .from('characters')
    .update({ ...finalUpdates, updated_at: new Date().toISOString() })
    .eq('id', char.id!)
    .select()
    .single();
    
  if (data) {
    setChar(data as Character);
    setHpInput(String(data.current_hp));
    setManaInput(String(data.current_mana));
  }
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

  async function enhanceEquipment(eq: Equipment) {
    
    if (!char || char.species !== 'dwarf') return;
    
    const currentLevel = eq.enhance_level ?? 0;
    const maxLevel = getMaxEnhanceLevel();
    
    if (currentLevel >= maxLevel) {
      setEnhanceMessage('이미 최대 강화 단계입니다!');
      return;
    }
    
    const difficulty = getEnhanceDifficulty(currentLevel);
    const roll = rollD20();
    
    if (roll >= difficulty) {
      const newLevel = currentLevel + 1;
      await updateEquipmentField(eq.id!, 'enhance_level', newLevel);
      setEnhanceMessage(`강화 성공! (주사위: ${roll} / 필요: ${difficulty}) → +${newLevel}강`);
    } else {
      if (currentLevel <= 0) {
        await removeEquipment(eq.id!);
        setEnhanceMessage(`강화 실패... 장비가 파괴되었습니다. (주사위: ${roll} / 필요: ${difficulty})`);
      } else {
        const newLevel = currentLevel - 1;
        await updateEquipmentField(eq.id!, 'enhance_level', newLevel);
        setEnhanceMessage(`강화 실패! ${currentLevel}강 → ${newLevel}강으로 하락. (주사위: ${roll} / 필요: ${difficulty})`);
      }
    }
    
    setTimeout(() => setEnhanceMessage(''), 3000);
  }

  async function updateEquipmentField(id: string, field: string, value: string | number) {
    setEquipment(prev => prev.map(e => e.id === id ? { ...e, [field]: value } : e));
    await supabase.from('equipment').update({ [field]: value }).eq('id', id);
  }
  
async function addExperience(amount: number) {
  if (!char || !unlocked) return;
  if (amount <= 0) return;
  
  // 1. 현재 경험치에 추가
  let newExp = (char.exp || 0) + amount;
  let newLevel = char.level;
  let totalStatPointsGained = 0;
  let bonusPointsTotal = 0;
  const statPointsPerLevel = char.species === 'slime' ? 4 : 3;
  
  // 2. 레벨업이 가능한지 반복 확인
  while (true) {
    const neededExp = getExpNeededForNextLevel(newLevel);
    if (newExp >= neededExp && newLevel < 40) {
      newExp -= neededExp;
      newLevel++;
      
      // 기본 스탯 포인트
      totalStatPointsGained += statPointsPerLevel;
      
      // 10레벨 달성 시 보너스 2포인트 (10, 20, 30, 40...)
      if (newLevel % 10 === 0) {
        bonusPointsTotal += 2;
        totalStatPointsGained += 2;
      }
    } else {
      break;
    }
  }
  
  console.log('변화:', {
    oldLevel: char.level,
    newLevel,
    oldExp: char.exp,
    newExp,
    statPointsGained: totalStatPointsGained,
    bonusPoints: bonusPointsTotal
  });
  
  // 3. 업데이트할 내용 준비
  const updates: Partial<Character> = {
    exp: newExp,
    level: newLevel,
    stat_points: (char.stat_points || 0) + totalStatPointsGained
  };
  
  // 4. DB 저장
  await saveChar(updates);
  
  // 5. UI 즉시 업데이트
  setChar(prev => prev ? { ...prev, ...updates } : prev);
  
  // 6. 레벨업 알림 (보너스 정보 포함)
  const levelUps = newLevel - char.level;
  if (levelUps > 0) {
    let message = `🎉 ${levelUps}레벨 업! (${char.level} → ${newLevel})\n`;
    message += `✨ 기본 스탯 포인트: +${levelUps * statPointsPerLevel}\n`;
    if (bonusPointsTotal > 0) {
      message += `🎁 10레벨 달성 보너스: +${bonusPointsTotal}`;
    }
    alert(message);
  }
}

async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
  if (!char || !e.target.files || e.target.files.length === 0) return;
  
  const file = e.target.files[0];
  console.log('선택한 파일:', file.name, file.type, file.size);
  
  setUploading(true);
  
  try {
    const publicUrl = await uploadAvatar(char.id!, file);
    console.log('받은 URL:', publicUrl);
    
    if (publicUrl) {
      await saveChar({ avatar_url: publicUrl });
      console.log('DB 저장 완료');
      alert('프로필 사진이 업데이트되었습니다!');
    } else {
      console.error('publicUrl이 null입니다');
      alert('업로드 실패');
    }
  } catch (err) {
    console.error('에러:', err);
    alert('오류 발생');
  }
  
  setUploading(false);
}

    function ExpModal() {
    const [expAmount, setExpAmount] = useState('');
    
    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
        <div className="bg-gray-900 rounded-xl border border-gray-700 p-6 w-full max-w-sm">
          <h2 className="font-bold mb-4 text-lg">경험치 추가</h2>
          <input
            type="number"
            value={expAmount}
            onChange={e => setExpAmount(e.target.value)}
            placeholder="추가할 경험치량"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 mb-4"
          />
          <div className="flex gap-2">
            <button
              onClick={() => {
                const amount = parseInt(expAmount);
                if (!isNaN(amount) && amount > 0) {
                  addExperience(amount);
                  setShowExpModal(false);
                  setExpAmount('');
                }
              }}
              className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-lg font-medium transition-colors"
            >
              추가
            </button>
            <button
              onClick={() => {
                setShowExpModal(false);
                setExpAmount('');
              }}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2.5 rounded-lg font-medium transition-colors"
            >
              취소
            </button>
          </div>
        </div>
      </div>
    );
  }

  function EquipmentModal({ equipment, onSave, onClose }: { 
  equipment: Equipment; 
  onSave: (eq: Equipment) => void; 
  onClose: () => void;
}) {
  const [editEq, setEditEq] = useState<Equipment>({ ...equipment });
  
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
      <div className="bg-gray-900 rounded-xl border border-gray-700 p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h2 className="font-bold mb-4 text-lg">장비 편집: {editEq.slot_name}</h2>
        
        {/* 아이템 이름 */}
        <div className="mb-4">
          <label className="block text-sm text-gray-400 mb-1">아이템 이름</label>
          <input
            type="text"
            value={editEq.item_name}
            onChange={e => setEditEq({ ...editEq, item_name: e.target.value })}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
            placeholder="아이템 이름"
          />
        </div>
        
        {/* 희귀도 */}
        <div className="mb-4">
          <label className="block text-sm text-gray-400 mb-1">희귀도</label>
          <select
            value={editEq.rarity}
            onChange={e => setEditEq({ ...editEq, rarity: e.target.value as ItemRarity })}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
          >
            {RARITY_LIST.map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>
        
        {/* 모든 스탯 입력 필드 */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {ALL_STATS.map(stat => (
            <div key={stat}>
              <label className="block text-xs text-gray-400 mb-1">{STAT_LABELS[stat]}</label>
              <input
                type="number"
                value={(editEq[`bonus_${stat}` as keyof Equipment] as number) || 0}
                onChange={e => setEditEq({ 
                  ...editEq, 
                  [`bonus_${stat}`]: parseInt(e.target.value) || 0 
                })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 text-white text-sm"
              />
            </div>
          ))}
        </div>
        
        {/* 강화 레벨 */}
        <div className="mb-4">
          <label className="block text-sm text-gray-400 mb-1">강화 레벨</label>
          <input
            type="number"
            value={editEq.enhance_level || 0}
            onChange={e => setEditEq({ ...editEq, enhance_level: parseInt(e.target.value) || 0 })}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
            min="0"
            max="4"
          />
        </div>
        
        {/* 버튼 */}
        <div className="flex gap-2">
          <button
            onClick={() => onSave(editEq)}
            className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-lg font-medium transition-colors"
          >
            저장
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg font-medium transition-colors"
          >
            취소
          </button>
        </div>
      </div>
    </div>
  );
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
            {passwordError && <p className="text-red-400 text-sm mt-2">{passwordError}</p>}
            <button onClick={() => setShowPasswordModal(false)} className="w-full mt-3 text-gray-500 hover:text-gray-300 text-sm transition-colors">
              취소
            </button>
          </div>
        </div>
      )}

          {showExpModal && <ExpModal />}
      {showEquipmentModal && editingEquipment && (
  <EquipmentModal
    equipment={editingEquipment}
    onSave={async (eq) => {
      await updateEquipmentField(eq.id!, 'item_name', eq.item_name);
      await updateEquipmentField(eq.id!, 'rarity', eq.rarity);
      for (const stat of ALL_STATS) {
        await updateEquipmentField(eq.id!, `bonus_${stat}`, eq[`bonus_${stat}` as keyof Equipment] as number);
      }
      await updateEquipmentField(eq.id!, 'enhance_level', eq.enhance_level || 0);
      setShowEquipmentModal(false);
      setEditingEquipment(null);
    }}
    onClose={() => {
      setShowEquipmentModal(false);
      setEditingEquipment(null);
    }}
  />
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
              onClick={() => {
                if (unlocked) {
                  setUnlocked(false);
                } else if (masterMode) {
                  setUnlocked(true);
                } else {
                  setShowPasswordModal(true);
                }
              }}
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
              <div className="w-14 h-14 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center text-2xl font-bold text-gray-200 overflow-hidden relative group">
  {char.avatar_url ? (
    <img src={char.avatar_url} alt={char.name} className="w-full h-full object-cover" />
  ) : (
    char.name[0]
  )}
  {unlocked && (
    <label className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
      <Camera size={20} className="text-white" />
      <input
        type="file"
        accept="image/*"
        onChange={handleAvatarUpload}
        className="hidden"
        disabled={uploading}
      />
    </label>
  )}
  {uploading && (
    <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
    </div>
  )}
</div>
              <div>
                <h1 className="text-xl font-bold text-white">{char.name}</h1>
                <div className="text-sm text-gray-400 mt-0.5">
                  {SPECIES_LABELS[char.species as keyof typeof SPECIES_LABELS]} · {char.job}
                </div>
{char && (
                  <div className="text-xs text-amber-400/80 mt-1">
                    {getSpeciesPassiveDescription(char, equipment)}
                  </div>
                )}
                {char && (char.species === 'undead' || char.species === 'machine') && (
                  <div className="mt-2 flex items-center gap-2">
                    <button
                      onClick={() => {
                        if (char.species === 'undead') setUndeadReviveUsed(!undeadReviveUsed);
                        if (char.species === 'machine') setMachineOverloadUsed(!machineOverloadUsed);
                      }}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                        (char.species === 'undead' && undeadReviveUsed) || (char.species === 'machine' && machineOverloadUsed)
                          ? 'bg-red-600'
                          : 'bg-gray-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                          (char.species === 'undead' && undeadReviveUsed) || (char.species === 'machine' && machineOverloadUsed)
                            ? 'translate-x-4'
                            : 'translate-x-1'
                        }`}
                      />
                    </button>
                    <span className="text-xs text-gray-400">
                      {char.species === 'undead'
                        ? (undeadReviveUsed ? '불사의 의지 사용 완료' : '불사의 의지 사용 가능')
                        : char.species === 'machine'
                        ? (machineOverloadUsed ? '과부화 사용 완료' : '과부화 사용 가능')
                        : ''}
                    </span>
                  </div>
                )}
              </div>
            </div>
<div className="text-right">
  <div className="text-2xl font-bold text-white">Lv.{char.level}</div>
  
  {/* 경험치 바 */}
  <div className="mt-2">
    <div className="flex justify-between text-xs text-gray-400 mb-1">
      <span>경험치</span>
      <span>{(char.exp || 0)} / {getExpNeededForNextLevel(char.level)}</span>
    </div>
    <div className="w-32 h-1.5 bg-gray-800 rounded-full overflow-hidden">
      <div 
        className="h-full bg-blue-500 rounded-full transition-all"
        style={{ 
          width: `${Math.min(100, ((char.exp || 0) / getExpNeededForNextLevel(char.level)) * 100)}%` 
        }}
      />
    </div>
  </div>
  
  {/* ✅ 경험치 추가 버튼 (수정 모드에서만) */}
  {unlocked && (
    <button
      onClick={() => setShowExpModal(true)}
      className="text-xs text-green-400 hover:text-green-300 mt-2 transition-colors block w-full"
    >
      + 경험치 추가
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
              {/* 클릭 가능한 장비 이름 */}
              <div 
                onClick={() => {
                  setEditingEquipment(eq);
                  setShowEquipmentModal(true);
                }}
                className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white cursor-pointer hover:bg-gray-700 transition-colors"
              >
                {eq.item_name || '클릭하여 장비 설정'}
              </div>
              
              {/* 스탯 요약 표시 (0 아닌 것만) */}
              <div className="flex flex-wrap gap-2">
                {ALL_STATS.map(s => {
                  const bonus = (eq[`bonus_${s}` as keyof Equipment] as number) || 0;
                  const totalBonus = bonus + (eq.enhance_level || 0);
                  if (totalBonus === 0) return null;
                  return (
                    <span key={s} className="text-xs px-2 py-1 rounded bg-gray-800 text-amber-400">
                      {STAT_LABELS[s]} +{totalBonus}
                    </span>
                  );
                })}
              </div>
              
              {/* 드워프 강화 버튼 */}
              {char.species === 'dwarf' && unlocked && eq.item_name && (
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-xs text-gray-500">
                    강화: +{eq.enhance_level ?? 0}강
                    {(eq.enhance_level ?? 0) < getMaxEnhanceLevel() && (
                      <span className="text-gray-600 ml-1">
                        (다음: 주사위 {getEnhanceDifficulty(eq.enhance_level ?? 0)} 이상)
                      </span>
                    )}
                  </span>
                  {(eq.enhance_level ?? 0) < getMaxEnhanceLevel() && (
                    <button
                      onClick={() => enhanceEquipment(eq)}
                      className="text-xs bg-amber-700 hover:bg-amber-600 text-white px-2 py-0.5 rounded transition-colors"
                    >
                      강화
                    </button>
                  )}
                </div>
              )}
              
              {/* 강화 결과 메시지 */}
              {enhanceMessage && (
                <div className="mt-2 text-xs text-amber-400 bg-amber-950/30 border border-amber-800/30 rounded p-2">
                  {enhanceMessage}
                </div>
              )}
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
              <label className="block text-sm text-gray-400 mb-2">성격</label>
              <textarea
                value={char.special_abilities}
                onChange={e => setChar(prev => prev ? { ...prev, special_abilities: e.target.value } : prev)}
                onBlur={e => saveChar({ special_abilities: e.target.value })}
                disabled={!unlocked}
                placeholder="이세계의 나는..."
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
