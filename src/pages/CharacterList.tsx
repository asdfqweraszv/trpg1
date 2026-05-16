import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Character, SPECIES_LABELS, Equipment } from '../types/character';
import { verifyPassword, getEffectiveStat, getHpRegen, getManaRegen } from '../utils/stats';
import { Shield, Swords, Zap, Heart, User, Plus, ChevronRight, Sparkles, Wind, Star, Package, Users } from 'lucide-react';

interface Props {
  onSelect: (id: string) => void;
  onCreate: () => void;
  masterMode: boolean;
  setMasterMode: (mode: boolean) => void;
}

export default function CharacterList({ onSelect, onCreate, masterMode, setMasterMode }: Props) {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMasterLogin, setShowMasterLogin] = useState(false);
  const [masterPassword, setMasterPassword] = useState('');
  const [masterError, setMasterError] = useState('');
  const [showInactive, setShowInactive] = useState(false); // 보관함 표시 여부

  async function loadCharacters() {
    const { data } = await supabase
      .from('characters')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setCharacters(data as Character[]);
    setLoading(false);
  }
  
  useEffect(() => {
    loadCharacters();
  }, []);

  async function tryMasterLogin() {
    const { data } = await supabase
      .from('master_settings')
      .select('master_password_hash')
      .eq('id', 1)
      .maybeSingle();
      
    if (data && verifyPassword(masterPassword, data.master_password_hash)) {
      setMasterMode(true);
      setShowMasterLogin(false);
      setMasterPassword('');
      setMasterError('');
    } else {
      setMasterError('비밀번호가 틀렸습니다');
    }
  }

  // 캐릭터 활성화/비활성화 토글
  async function toggleCharacterActive(char: Character) {
    if (!masterMode) {
      alert('GM 모드에서만 가능합니다.');
      return;
    }
    
    const newActiveState = !char.is_active;
    await supabase
      .from('characters')
      .update({ is_active: newActiveState, updated_at: new Date().toISOString() })
      .eq('id', char.id);
    
    await loadCharacters();
  }

  async function handleCombatEnd() {
    if (!masterMode) {
      alert('GM 모드에서만 사용 가능합니다.');
      return;
    }
    
    const activeCharacters = characters.filter(char => char.is_active !== false);
    
    if (activeCharacters.length === 0) {
      alert('활성화된 캐릭터가 없습니다.');
      return;
    }
    
    const updatePromises = activeCharacters.map(async (char) => {
      const { data: equipmentData } = await supabase
        .from('equipment')
        .select('*')
        .eq('character_id', char.id);
      
      const equipmentList = (equipmentData as Equipment[]) || [];
      
      const maxHp = getEffectiveStat(char, 'hp', equipmentList);
      const maxMana = getEffectiveStat(char, 'mana', equipmentList);
      
      let newCurrentHp = char.current_hp;
      if (char.species === 'orc') {
        const hpRegen = getHpRegen(char, equipmentList);
        newCurrentHp = Math.min(maxHp, (char.current_hp || 0) + hpRegen);
      }
      
      let newCurrentMana = Math.min(maxMana, (char.current_mana || 0) + Math.floor(maxMana * 0.5));
      if (char.species === 'elf') {
        const manaRegen = getManaRegen(char, equipmentList);
        newCurrentMana = Math.min(maxMana, newCurrentMana + manaRegen);
      }
      
      const updates: any = {
        current_hp: newCurrentHp,
        current_mana: newCurrentMana,
        updated_at: new Date().toISOString()
      };
      
      if (char.species === 'undead') updates.undead_revive_used = false;
      if (char.species === 'machine') updates.machine_overload_used = false;
      
      return supabase.from('characters').update(updates).eq('id', char.id);
    });
    
    await Promise.all(updatePromises);
    await loadCharacters();
    alert(`전투가 종료되었습니다`);
  }

  const jobColors: Record<string, string> = {
    '광전사': 'text-red-400 bg-red-950/40 border-red-800/50',
    '몽크': 'text-amber-400 bg-amber-950/40 border-amber-800/50',
    '탱커': 'text-blue-400 bg-blue-950/40 border-blue-800/50',
    '바드': 'text-pink-400 bg-pink-950/40 border-pink-800/50',
    '마법사': 'text-cyan-400 bg-cyan-950/40 border-cyan-800/50',
    '궁수': 'text-green-400 bg-green-950/40 border-green-800/50',
  };

  const activeCharacters = characters.filter(char => char.is_active !== false);
  const inactiveCharacters = characters.filter(char => char.is_active === false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-amber-950/20 text-gray-100">
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-10">
<div>
  <div className="flex items-center gap-2">
    <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-400 to-yellow-500 bg-clip-text text-transparent">
      던전
    </h1>
  </div>
  <p className="text-amber-600/70 mt-1 text-sm ml-10">끝까지 살아남으세요</p>
</div>
          <div className="flex items-center gap-2">
            {masterMode && (
              <>
                <span className="text-xs text-amber-400 bg-amber-950/50 border border-amber-800/50 px-2 py-1 rounded">GM 모드</span>
                <button
                  onClick={handleCombatEnd}
                  className="bg-red-600 hover:bg-red-500 text-white px-3 py-2 rounded-lg font-medium transition-colors text-sm"
                >
                  전투 종료
                </button>
              </>
            )}
            <button onClick={() => setShowMasterLogin(true)} className="text-xs text-gray-500 hover:text-amber-400 transition-colors">GM 로그인</button>
            <button onClick={onCreate} className="flex items-center gap-2 bg-amber-700 hover:bg-amber-600 text-white px-4 py-2.5 rounded-lg font-medium transition-colors text-sm shadow-md">
  <Plus size={16} /> 새 용사 모집
</button>
          </div>
        </div>

        {/* 활성 캐릭터 목록 */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Users size={18} className="text-green-400" />
            <h2 className="text-lg font-semibold text-white">Dungeon Explorer</h2>
            <span className="text-xs text-gray-500">({activeCharacters.length}명)</span>
          </div>
          
          {activeCharacters.length === 0 ? (
            <div className="text-center py-10 text-gray-500 bg-gray-900/50 rounded-xl border border-gray-800">
              <Users size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">활성화된 캐릭터가 없습니다</p>
              <p className="text-xs mt-1">GM 모드에서 캐릭터를 활성화하세요</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {activeCharacters.map((char) => (
                <div key={char.id} className="flex items-center gap-2">
                  <button onClick={() => onSelect(char.id!)} className="flex-1 w-full text-left bg-gray-900 hover:bg-gray-800 border border-amber-800/30 hover:border-amber-600/50 rounded-xl p-5 transition-all duration-300 group shadow-lg hover:shadow-amber-900/20">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center text-xl font-bold text-gray-300 overflow-hidden">
                          {char.avatar_url ? <img src={char.avatar_url} alt={char.name} className="w-full h-full object-cover" /> : char.name[0]}
                        </div>
                        <div>
                          <div className="flex items-center gap-2"><span className="font-semibold text-white text-lg">{char.name}</span><span className="text-xs text-gray-500">Lv.{char.level}</span></div>
                          <div className="flex items-center gap-2 mt-1"><span className="text-xs text-gray-400">{SPECIES_LABELS[char.species as keyof typeof SPECIES_LABELS]}</span><span className="text-gray-600">·</span><span className={`text-xs px-2 py-0.5 rounded border font-medium ${jobColors[char.job] ?? 'text-gray-400 bg-gray-800 border-gray-700'}`}>{char.job}</span></div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-xs">
                          <div className="flex items-center gap-1 text-red-400"><Heart size={10} /><span>{char.current_hp}/{char.stat_hp + char.spent_hp}</span></div>
                          <div className="flex items-center gap-1 text-blue-400"><Zap size={10} /><span>{char.current_mana}/{char.stat_mana + char.spent_mana}</span></div>
                          <div className="flex items-center gap-1 text-orange-400"><Swords size={10} /><span>{char.stat_attack + char.spent_attack}</span></div>
                          <div className="flex items-center gap-1 text-cyan-400"><Sparkles size={10} /><span>{char.stat_spell + char.spent_spell}</span></div>
                          <div className="flex items-center gap-1 text-green-400"><Wind size={10} /><span>{char.stat_agility + char.spent_agility}</span></div>
                          <div className="flex items-center gap-1 text-sky-400"><Shield size={10} /><span>{char.stat_defense}</span></div>
                          <div className="flex items-center gap-1 text-teal-400"><Star size={10} /><span>{char.stat_magic_resist}</span></div>
                        </div>
                        <ChevronRight size={16} className="text-gray-600 group-hover:text-gray-400 transition-colors" />
                      </div>
                    </div>
                  </button>
                  {masterMode && (
                    <button
                      onClick={() => toggleCharacterActive(char)}
                      className="p-3 bg-gray-800 hover:bg-gray-700 rounded-xl transition-colors"
                      title="보관함으로 이동"
                    >
                      <Package size={18} className="text-gray-400" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 보관함 (비활성 캐릭터) - GM 모드에서만 표시 */}
        {masterMode && inactiveCharacters.length > 0 && (
          <div className="mt-8 pt-4 border-t border-gray-800">
            <div className="flex items-center gap-2 mb-4">
              <Package size={18} className="text-gray-500" />
              <h2 className="text-lg font-semibold text-gray-400">보관함</h2>
              <span className="text-xs text-gray-600">({inactiveCharacters.length}명)</span>
              <button
                onClick={() => setShowInactive(!showInactive)}
                className="text-xs text-gray-500 hover:text-gray-300"
              >
                {showInactive ? '접기' : '펼치기'}
              </button>
            </div>
            
            {showInactive && (
              <div className="grid gap-2">
                {inactiveCharacters.map((char) => (
                  <div key={char.id} className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-900/50 border border-gray-800 rounded-xl p-4 opacity-60">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-lg font-bold text-gray-500">
                            {char.name[0]}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-gray-400">{char.name}</span>
                              <span className="text-xs text-gray-600">Lv.{char.level}</span>
                            </div>
                            <div className="text-xs text-gray-600 mt-0.5">{SPECIES_LABELS[char.species as keyof typeof SPECIES_LABELS]} · {char.job}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleCharacterActive(char)}
                      className="p-3 bg-gray-800 hover:bg-green-800 rounded-xl transition-colors"
                      title="활성화"
                    >
                      <Users size={18} className="text-green-500" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {showMasterLogin && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
            <div className="bg-gray-900 rounded-xl border border-gray-700 p-6 w-full max-w-sm">
              <h2 className="font-bold mb-4 text-lg">GM 로그인</h2>
              <input type="password" value={masterPassword} onChange={e => { setMasterPassword(e.target.value); setMasterError(''); }} placeholder="비밀번호" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-amber-500 mb-2" onKeyDown={e => e.key === 'Enter' && tryMasterLogin()} />
              <button onClick={tryMasterLogin} className="w-full bg-amber-700 hover:bg-amber-600 text-white py-2.5 rounded-lg font-medium transition-colors">로그인</button>
              {masterError && <p className="text-red-400 text-sm mt-2">{masterError}</p>}
              <button onClick={() => { setShowMasterLogin(false); setMasterPassword(''); setMasterError(''); }} className="w-full mt-3 text-gray-500 hover:text-gray-300 text-sm transition-colors">취소</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}