import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Character, SPECIES_LABELS, Equipment } from '../types/character';
import { verifyPassword, getEffectiveStat, getHpRegen, getManaRegen } from '../utils/stats';
import { Shield, Swords, Zap, Heart, User, Plus, ChevronRight, Sparkles, Wind, Star } from 'lucide-react';  

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

  async function handleCombatEnd() {
    if (!masterMode) {
      alert('GM 모드에서만 사용 가능합니다.');
      return;
    }
    
    for (const char of characters) {
      // 장비 정보 가져오기
      const { data: equipmentData } = await supabase
        .from('equipment')
        .select('*')
        .eq('character_id', char.id);
      
      const equipmentList = (equipmentData as Equipment[]) || [];
      
      // 최대 체력/마나 계산
      const maxHp = getEffectiveStat(char, 'hp', equipmentList);
      const maxMana = getEffectiveStat(char, 'mana', equipmentList);
      
      // 체력: 오크만 재생량만큼 회복
      let newCurrentHp = char.current_hp;
      if (char.species === 'orc') {
        const hpRegen = getHpRegen(char, equipmentList);
        newCurrentHp = Math.min(maxHp, (char.current_hp || 0) + hpRegen);
      }
      
      // 마나: 50% + 엘프 재생 회복
      let newCurrentMana = Math.min(maxMana, (char.current_mana || 0) + Math.floor(maxMana * 0.5));
      if (char.species === 'elf') {
        const manaRegen = getManaRegen(char, equipmentList);
        newCurrentMana = Math.min(maxMana, newCurrentMana + manaRegen);
      }
      
      // ✅ updates 객체 생성
      const updates: any = {
        current_hp: newCurrentHp,
        current_mana: newCurrentMana,
        updated_at: new Date().toISOString()
      };
      
      // 언데드: 불사의 의지 사용 여부 초기화
      if (char.species === 'undead') {
        updates.undead_revive_used = false;
      }
      
      // 기계 생명체: 과부화 사용 여부 초기화
      if (char.species === 'machine') {
        updates.machine_overload_used = false;
      }
      
      // DB 업데이트
      await supabase
        .from('characters')
        .update(updates)
        .eq('id', char.id);
    }
  
    await loadCharacters();
    alert('전투가 종료되었습니다! 모든 캐릭터는 마나를 회복했습니다.');
  }

  const jobColors: Record<string, string> = {
    '광전사': 'text-red-400 bg-red-950/40 border-red-800/50',
    '몽크': 'text-amber-400 bg-amber-950/40 border-amber-800/50',
    '탱커': 'text-blue-400 bg-blue-950/40 border-blue-800/50',
    '바드': 'text-pink-400 bg-pink-950/40 border-pink-800/50',
    '마법사': 'text-cyan-400 bg-cyan-950/40 border-cyan-800/50',
    '궁수': 'text-green-400 bg-green-950/40 border-green-800/50',
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">TRPG 캐릭터</h1>
            <p className="text-gray-400 mt-1 text-sm">캐릭터를 선택하거나 새로 만드세요</p>
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
            <button onClick={onCreate} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-lg font-medium transition-colors text-sm">
              <Plus size={16} />새 캐릭터
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : characters.length === 0 ? (
          <div className="text-center py-20 text-gray-500"><User size={48} className="mx-auto mb-4 opacity-30" /><p className="text-lg">캐릭터가 없습니다</p><p className="text-sm mt-1">새 캐릭터를 만들어보세요</p></div>
        ) : (
          <div className="grid gap-3">
            {characters.map((char) => (
              <button key={char.id} onClick={() => onSelect(char.id!)} className="w-full text-left bg-gray-900 hover:bg-gray-800 border border-gray-800 hover:border-gray-700 rounded-xl p-5 transition-all group">
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
            ))}
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