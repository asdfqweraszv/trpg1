import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Species, Job, JOB_LIST, SPECIES_LABELS, SPECIES_BONUSES, STAT_LABELS, FIXED_BASE_STATS } from '../types/character';
import { rollD20, applySpeciesBonus, applyJobBonus } from '../utils/stats';
import { Dice5, ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react';

interface Props {
  onBack: () => void;
  onCreated: (id: string) => void;
}

const ROLLABLE_STATS = ['hp', 'attack', 'spell', 'mana', 'intelligence', 'agility', 'charm'];
const FIXED_STATS = ['defense', 'magic_resist'];
const ALL_STATS = ['hp', 'attack', 'spell', 'mana', 'intelligence', 'agility', 'defense', 'magic_resist', 'charm'];

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

export default function CreateCharacter({ onBack, onCreated }: Props) {
  const [step, setStep] = useState<'info' | 'roll' | 'human_bonus' | 'slime_distribute' | 'review'>('info');
  const [name, setName] = useState('');
  const [species, setSpecies] = useState<Species>('human');
  const [job, setJob] = useState<Job>('광전사');
  const [password, setPassword] = useState('');
  const [rolledStats, setRolledStats] = useState<Record<string, number>>({});
  const [finalStats, setFinalStats] = useState<Record<string, number>>({});
  const [humanBonusStat, setHumanBonusStat] = useState<string>('hp');
  const [slimePool, setSlimePool] = useState(0);
  const [slimeDistrib, setSlimeDistrib] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSpeciesInfo, setShowSpeciesInfo] = useState<Species | null>(null);

  // One-by-one rolling state
  const [rollingIndex, setRollingIndex] = useState(0);
  const [rollingAnim, setRollingAnim] = useState(false);
  const [rollingDisplay, setRollingDisplay] = useState(0);
  const [rollResults, setRollResults] = useState<Record<string, number>>({});
  const [allRolled, setAllRolled] = useState(false);
  const animRef = useRef<number | null>(null);

  const speciesList = Object.keys(SPECIES_LABELS) as Species[];

  const statsToRoll = ROLLABLE_STATS;

  // Reset rolling when species changes
  useEffect(() => {
    setRollResults({});
    setAllRolled(false);
    setRollingIndex(0);
  }, [species]);

  function animateRoll(finalValue: number, onComplete: () => void) {
    setRollingAnim(true);
    let count = 0;
    const maxCount = 12;
    const tick = () => {
      setRollingDisplay(Math.floor(Math.random() * 20) + 1);
      count++;
      if (count < maxCount) {
        animRef.current = requestAnimationFrame(tick);
      } else {
        setRollingDisplay(finalValue);
        setRollingAnim(false);
        onComplete();
      }
    };
    animRef.current = requestAnimationFrame(tick);
  }

  function rollCurrentStat() {
    if (rollingAnim) return;
    const statKey = statsToRoll[rollingIndex];
    const result = rollD20();
    animateRoll(result, () => {
      setRollResults(prev => ({ ...prev, [statKey]: result }));
      if (rollingIndex + 1 < statsToRoll.length) {
        setRollingIndex(prev => prev + 1);
      } else {
        setAllRolled(true);
      }
    });
  }

  function proceedAfterRoll() {
    const rolled = { ...rollResults };
    rolled['defense'] = 5;
    rolled['magic_resist'] = 5;
    setRolledStats(rolled);

    const withBonus = applySpeciesBonus(rolled, species);
    setFinalStats(withBonus);

    if (species === 'slime') {
      const total = Object.values(withBonus).reduce((a, b) => a + b, 0);
      setSlimePool(total - 1);
      const init: Record<string, number> = {};
      ALL_STATS.forEach((s) => (init[s] = 0));
      setSlimeDistrib(init);
      setStep('slime_distribute');
    } else if (species === 'human') {
      setStep('human_bonus');
    } else {
      setStep('review');
    }
  }

  function handleHumanBonus() {
    const updated = { ...finalStats };
    updated[humanBonusStat] = (updated[humanBonusStat] ?? 0) + 5;
    setFinalStats(updated);
    setStep('review');
  }

  const slimeRemaining = slimePool - Object.values(slimeDistrib).reduce((a, b) => a + b, 0);

  function adjustSlime(stat: string, delta: number) {
    const curr = slimeDistrib[stat] ?? 0;
    const newVal = curr + delta;
    if (newVal < 0) return;
    if (delta > 0 && slimeRemaining <= 0) return;
    setSlimeDistrib(prev => ({ ...prev, [stat]: newVal }));
  }

  function handleSlimeConfirm() {
    const result: Record<string, number> = {};
    ALL_STATS.forEach((s) => {
      result[s] = slimeDistrib[s] ?? 0;
    });
    setFinalStats(result);
    setStep('review');
  }

  async function handleCreate() {
    setLoading(true);
    setError('');
    try {
      let statsToSave: Record<string, number> = {};
      ALL_STATS.forEach((s) => {
        statsToSave[s] = finalStats[s] ?? 0;
      });
        statsToSave = applyJobBonus(statsToSave, job);

      if (species === 'vampire') {
        const max = Math.max(statsToSave['hp'], statsToSave['attack'], statsToSave['spell']);
        statsToSave['hp'] = max;
        statsToSave['attack'] = max;
        statsToSave['spell'] = max;
      }

      const { data, error: err } = await supabase.from('characters').insert({
        name,
        species,
        job,
        level: 1,
        stat_hp: statsToSave['hp'],
        stat_attack: statsToSave['attack'],
        stat_spell: statsToSave['spell'],
        stat_mana: statsToSave['mana'],
        stat_intelligence: statsToSave['intelligence'],
        stat_agility: statsToSave['agility'],
        stat_defense: statsToSave['defense'],
        stat_magic_resist: statsToSave['magic_resist'],
        stat_charm: statsToSave['charm'],
        spent_hp: 0,
        spent_attack: 0,
        spent_spell: 0,
        spent_mana: 0,
        spent_intelligence: 0,
        spent_agility: 0,
        spent_charm: 0,
        stat_points: 0,
        current_hp: statsToSave['hp'],
        current_mana: statsToSave['mana'],
        special_abilities: '',
        notes: '',
        password_hash: password,
      }).select().single();

      if (err) throw err;
      if (data) onCreated(data.id);
    } catch (e: unknown) {
      setError((e as Error).message ?? '오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  }

  const visibleStats = ALL_STATS;
  const slimeSpendableStats = ALL_STATS.filter(s => !FIXED_BASE_STATS.includes(s));

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <div className="max-w-2xl mx-auto px-4 py-10">
        <button onClick={onBack} className="flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors text-sm">
          <ArrowLeft size={16} /> 목록으로
        </button>

        <h1 className="text-2xl font-bold mb-8">새 캐릭터 만들기</h1>

        {/* STEP: Info */}
        {step === 'info' && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm text-gray-400 mb-2">캐릭터 이름</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="이름 입력"
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">비밀번호 (캐릭터 수정 시 필요)</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호 설정"
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-3">종족 선택</label>
              <div className="grid grid-cols-2 gap-2">
                {speciesList.map((s) => {
  const bonus = SPECIES_BONUSES[s];
  const isSelected = species === s;
  const isInfoShown = showSpeciesInfo === s;
  
  return (
    <div key={s} className="relative">
      <button
        onClick={() => {
          setSpecies(s); 
          setShowSpeciesInfo(isSelected ? (isInfoShown ? null : s) : s);
        }}
        className={`w-full text-left p-3 rounded-lg border transition-all ${
          isSelected
            ? 'border-blue-500 bg-blue-950/30 text-white'
            : 'border-gray-800 bg-gray-900 text-gray-300 hover:border-gray-600'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="font-medium text-sm">{bonus.label}</div>
          <div className="text-gray-500">
            {isInfoShown ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </div>
        </div>
        <div className="text-xs text-gray-500 mt-0.5 leading-relaxed">
          {bonus.description.length > 40 ? bonus.description.slice(0, 40) + '...' : bonus.description}
        </div>
      </button>
      {isInfoShown && (
        <div className="mt-1 p-3 bg-gray-800 rounded-lg border border-gray-700 text-xs text-gray-300 space-y-1">
          <p>{bonus.description}</p>
          {bonus.specialNote && <p className="text-amber-400">{bonus.specialNote}</p>}
        </div>
      )}
    </div>
  );
})}
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-3">직업 선택</label>
              <div className="grid grid-cols-3 gap-2">
                {JOB_LIST.map((j) => (
                  <button
                    key={j}
                    onClick={() => setJob(j)}
                    className={`py-2.5 rounded-lg border font-medium text-sm transition-all ${
                      job === j
                        ? 'border-blue-500 bg-blue-950/30 text-white'
                        : 'border-gray-800 bg-gray-900 text-gray-300 hover:border-gray-600'
                    }`}
                  >
                    {j}
                  </button>
                ))}
              </div>
            </div>

            <button
              disabled={!name || !password}
              onClick={() => setStep('roll')}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-gray-800 disabled:text-gray-600 text-white py-3 rounded-lg font-medium transition-colors"
            >
              다음: 스탯 굴리기
            </button>
          </div>
        )}

        {/* STEP: Roll one by one */}
        {step === 'roll' && (
          <div className="space-y-6">
            {/* Already rolled results */}
            <div className="grid grid-cols-2 gap-2">
              {statsToRoll.map((s, i) => {
                const isCurrent = i === rollingIndex && !allRolled;
                const isDone = i < rollingIndex || allRolled;
                const value = rollResults[s];

                return (
                  <div
                    key={s}
                    className={`rounded-xl border p-4 transition-all ${
                      isCurrent
                        ? `${STAT_BG[s]} ring-2 ring-blue-500/50 scale-[1.02]`
                        : isDone
                        ? STAT_BG[s]
                        : 'bg-gray-900 border-gray-800 opacity-40'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-sm font-medium ${STAT_COLOR[s]}`}>{STAT_LABELS[s]}</span>
                      {isCurrent && rollingAnim && (
                        <span className="text-2xl font-bold text-white animate-pulse">{rollingDisplay}</span>
                      )}
                      {isCurrent && !rollingAnim && (
                        <span className="text-sm text-blue-400 font-medium">1d20</span>
                      )}
                      {isDone && (
                        <span className="text-2xl font-bold text-white">{value}</span>
                      )}
                      {!isCurrent && !isDone && (
                        <span className="text-lg text-gray-700">?</span>
                      )}
                    </div>
                    {isCurrent && (
                      <div className="text-xs text-gray-400 text-center">
                        {rollingAnim ? '굴리는 중...' : '아래 버튼을 누르세요'}
                      </div>
                    )}
                  </div>
                );
              })}
              {/* Fixed stats display */}
              {FIXED_STATS.map(s => (
                <div key={s} className={`rounded-xl border p-4 ${STAT_BG[s]} opacity-60`}>
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-medium ${STAT_COLOR[s]}`}>{STAT_LABELS[s]}</span>
                    <span className="text-2xl font-bold text-white">5</span>
                  </div>
                  <div className="text-xs text-gray-500 text-center mt-1">고정</div>
                </div>
              ))}
            </div>

            {/* Roll button */}
            {!allRolled && (
              <button
                onClick={rollCurrentStat}
                disabled={rollingAnim}
                className="w-full flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white py-4 rounded-lg font-bold text-lg transition-colors"
              >
                <Dice5 size={24} className={rollingAnim ? 'animate-spin' : ''} />
                {rollingAnim
                  ? `${STAT_LABELS[statsToRoll[rollingIndex]]} 굴리는 중...`
                  : `${STAT_LABELS[statsToRoll[rollingIndex]]} 1d20 굴리기 (${rollingIndex + 1}/${statsToRoll.length})`
                }
              </button>
            )}

            {/* Proceed after all rolled */}
            {allRolled && (
              <div className="space-y-3">
                <div className="text-center text-green-400 font-medium">
                  모든 스탯 굴리기 완료!
                </div>
                <button
                  onClick={proceedAfterRoll}
                  className="w-full bg-green-600 hover:bg-green-500 text-white py-3 rounded-lg font-medium transition-colors"
                >
                  종족 보너스 적용 후 계속
                </button>
              </div>
            )}

            <button onClick={() => { setStep('info'); setRollResults({}); setAllRolled(false); setRollingIndex(0); }} className="text-gray-500 hover:text-gray-300 text-sm transition-colors">
              이전으로
            </button>
          </div>
        )}

        {/* STEP: Human bonus */}
        {step === 'human_bonus' && (
          <div className="space-y-6">
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
              <h2 className="font-semibold mb-1">인간 특성: 스탯 +5</h2>
              <p className="text-gray-400 text-sm mb-5">원하는 스탯 하나에 +5를 추가할 수 있습니다. (시작 20 초과 가능)</p>
              <div className="grid grid-cols-2 gap-2">
                {visibleStats.map((s) => (
                  <button
                    key={s}
                    onClick={() => setHumanBonusStat(s)}
                    className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                      humanBonusStat === s
                        ? 'border-blue-500 bg-blue-950/30'
                        : 'border-gray-800 bg-gray-800 hover:border-gray-600'
                    }`}
                  >
                    <span className={`text-sm font-medium ${STAT_COLOR[s]}`}>{STAT_LABELS[s]}</span>
                    <span className="text-white font-bold">{finalStats[s] ?? 0}</span>
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={handleHumanBonus}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-lg font-medium transition-colors"
            >
              {STAT_LABELS[humanBonusStat]}에 +5 적용
            </button>
          </div>
        )}

        {/* STEP: Slime distribute */}
        {step === 'slime_distribute' && (
          <div className="space-y-6">
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
              <h2 className="font-semibold mb-1">슬라임 특성: 스탯 자유 분배</h2>
              <p className="text-gray-400 text-sm mb-2">굴린 스탯 총합에서 1을 뺀 값을 원하는 스탯에 분배하세요.</p>
              <div className="text-center mb-5">
                <span className="text-2xl font-bold text-blue-400">{slimeRemaining}</span>
                <span className="text-gray-400 text-sm ml-2">포인트 남음</span>
              </div>
              <div className="space-y-2">
                {slimeSpendableStats.map((s) => (
                  <div key={s} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                    <span className={`text-sm font-medium ${STAT_COLOR[s]}`}>{STAT_LABELS[s]}</span>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => adjustSlime(s, -1)}
                        className="w-7 h-7 rounded bg-gray-700 hover:bg-gray-600 flex items-center justify-center text-white font-bold transition-colors"
                      >
                        -
                      </button>
                      <span className="w-8 text-center font-bold text-white">{slimeDistrib[s] ?? 0}</span>
                      <button
                        onClick={() => adjustSlime(s, 1)}
                        disabled={slimeRemaining <= 0}
                        className="w-7 h-7 rounded bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-600 flex items-center justify-center text-white font-bold transition-colors"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <button
              onClick={handleSlimeConfirm}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-lg font-medium transition-colors"
            >
              분배 완료
            </button>
          </div>
        )}

        {/* STEP: Review */}
        {step === 'review' && (
          <div className="space-y-6">
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center text-xl font-bold">
                  {name[0]}
                </div>
                <div>
                  <div className="font-bold text-lg text-white">{name}</div>
                  <div className="text-sm text-gray-400">{SPECIES_LABELS[species]} · {job} · Lv.1</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {visibleStats.map((s) => (
                  <div key={s} className="flex justify-between items-center bg-gray-800 rounded-lg px-3 py-2">
                    <span className={`text-sm ${STAT_COLOR[s]}`}>{STAT_LABELS[s]}</span>
                    <span className="font-bold text-white">{finalStats[s] ?? 0}</span>
                  </div>
                ))}
              </div>
              {species === 'vampire' && (
                <p className="mt-3 text-amber-400 text-xs">
                  흡혈귀 특성: 체력/공격력/주문력이 최고값({Math.max(finalStats['hp'] ?? 0, finalStats['attack'] ?? 0, finalStats['spell'] ?? 0)})으로 통일됩니다.
                </p>
              )}
              {SPECIES_BONUSES[species].specialNote && (
                <p className="mt-3 text-amber-400 text-xs">{SPECIES_BONUSES[species].specialNote}</p>
              )}
            </div>

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <div className="flex gap-3">
              <button
                onClick={() => { setStep('roll'); setRollResults({}); setAllRolled(false); setRollingIndex(0); }}
                className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 py-3 rounded-lg font-medium transition-colors"
              >
                다시 굴리기
              </button>
              <button
                onClick={handleCreate}
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 text-white py-3 rounded-lg font-medium transition-colors"
              >
                {loading ? '생성 중...' : '캐릭터 생성'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
