import { Character, Equipment, Species, SPECIES_BONUSES, FIXED_BASE_STATS, JOB_BONUSES, Job } from '../types/character';

export function rollD20(): number {
  return Math.floor(Math.random() * 20) + 1;
}

export function getBaseStatPoints(level: number, species: Species): number {
  const isSlime = species === 'slime';
  const bonusPerLevel = isSlime ? 4 : 3;
  return (level - 1) * bonusPerLevel;
}

export function getTotalStat(char: Character, statKey: string, equipment: Equipment[]): number {
  const baseKey = `stat_${statKey}` as keyof Character;
  const spentKey = `spent_${statKey}` as keyof Character;

  const base = (char[baseKey] as number) ?? 0;
  const spent = FIXED_BASE_STATS.includes(statKey) ? 0 : ((char[spentKey] as number) ?? 0);
  const equipBonus = equipment.reduce((sum, eq) => {
    const key = `bonus_${statKey}` as keyof Equipment;
    return sum + ((eq[key] as number) ?? 0);
  }, 0);

  return base + spent + equipBonus;
}

export function getMaxHP(char: Character, equipment: Equipment[]): number {
  return getTotalStat(char, 'hp', equipment);
}

export function getMaxMana(char: Character, equipment: Equipment[]): number {
  return getTotalStat(char, 'mana', equipment);
}

export function applySpeciesBonus(baseStats: Record<string, number>, species: Species): Record<string, number> {
  const bonus = SPECIES_BONUSES[species];
  const result = { ...baseStats };
  for (const [key, val] of Object.entries(bonus.statModifiers)) {
    result[key] = (result[key] ?? 0) + (val ?? 0);
  }
  return result;
}

export function applyJobBonus(baseStats: Record<string, number>, job: Job): Record<string, number> {
  const bonus = JOB_BONUSES[job];
  if (!bonus) return baseStats;
  
  const result = { ...baseStats };
  for (const [key, val] of Object.entries(bonus.statModifiers)) {
    result[key] = (result[key] ?? 0) + (val ?? 0);
  }
  return result;
}

export function getVampireStats(hp: number, attack: number, spell: number): { hp: number; attack: number; spell: number } {
  const max = Math.max(hp, attack, spell);
  return { hp: max, attack: max, spell: max };
}

export function isBeastkinEnraged(currentHp: number, maxHp: number): boolean {
  return maxHp > 0 && currentHp <= maxHp * 0.5;
}

export function getEffectiveStat(char: Character, statKey: string, equipment: Equipment[]): number {
  let base = getTotalStat(char, statKey, equipment);

  if (char.species === 'vampire' && ['hp', 'attack', 'spell'].includes(statKey)) { 
    const hpTotal = getTotalStat(char, 'hp', equipment);
    const attackTotal = getTotalStat(char, 'attack', equipment);
    const spellTotal = getTotalStat(char, 'spell', equipment);
    const max = Math.max(hpTotal, attackTotal, spellTotal);

    if (statKey === 'hp') {
      return max;
    }

    if (char.current_hp <= 0) return 0;

    const currentHp = Math.min(char.current_hp, max); 
    const ratio = currentHp / max; 

    return Math.floor(max * ratio); 
  }

  if (char.species === 'beastkin' && ['agility', 'attack'].includes(statKey)) {
    const maxHp = getTotalStat(char, 'hp', equipment);
    if (isBeastkinEnraged(char.current_hp, maxHp)) {
      base += 3;
    }
  }

  return base;
}

export function hashPassword(password: string): string {
  return password;
}

export function verifyPassword(input: string, stored: string): boolean {
  return input === stored;
}


// ★ 턴당 체력 회복량 (오크)
export function getHpRegen(char: Character, equipment: Equipment[]): number {
  if (char.species !== 'orc') return 0;
  const maxHp = getEffectiveStat(char, 'hp', equipment);
  return 1 + Math.floor(maxHp / 10);
}

// ★ 턴당 마나 회복량 (엘프)
export function getManaRegen(char: Character, equipment: Equipment[]): number {
  if (char.species !== 'elf') return 0;
  const maxMana = getEffectiveStat(char, 'mana', equipment);
  return 1 + Math.floor(maxMana / 10);
}

// ★ 받는 피해 감소량 (리자드맨)
export function getDamageReduction(char: Character, equipment: Equipment[]): number {
  if (char.species !== 'lizardman') return 0;
  const defense = getEffectiveStat(char, 'defense', equipment);
  const magicResist = getEffectiveStat(char, 'magic_resist', equipment);
  return 1 + Math.floor((defense + magicResist) / 10);
}

// ★ 불사의 의지 발동 여부 (언데드) - On/Off
export function canUndeadRevive(char: Character): boolean {
  return char.species === 'undead';
}

// ★ 불사의 의지 부활 시 회복 체력량 (언데드)
export function getUndeadReviveHp(char: Character, equipment: Equipment[]): number {
  if (char.species !== 'undead') return 0;
  const maxHp = getEffectiveStat(char, 'hp', equipment);
  return Math.floor(maxHp * 0.2);
}

// ★ 기계 생명체: 과부화 발동 여부 (On/Off)
export function canMachineOverload(char: Character): boolean {
  return char.species === 'machine';
}

// ★ 과부화 사용 시 효과 설명
export function getMachineOverloadDescription(): string {
  return '과부화: 전투 당 한번, 현재 사용 가능한 스킬을 코스트 소모 없이 사용 가능합니다. 다음 1턴간 기절상태가 됩니다.';
}

// ★ 패시브 효과 설명 통합 (UI 표시용)
export function getSpeciesPassiveDescription(char: Character, equipment: Equipment[]): string {
  switch (char.species) {
    case 'orc':
      return `재생: 매 턴 체력을 ${getHpRegen(char, equipment)} 회복합니다.`;
    case 'elf':
      return `마나의 흐름: 매 턴 마나를 ${getManaRegen(char, equipment)} 회복합니다.`;
    case 'lizardman':
      return `견고함: 받는 피해가 ${getDamageReduction(char, equipment)} 감소합니다.`;
    case 'undead':
      return `불사의 의지: 사망 시 최대 체력의 20%(${getUndeadReviveHp(char, equipment)})로 부활합니다.`;
    case 'machine':  // ★ 추가
      return getMachineOverloadDescription();
    default:
      return '';
  }
}