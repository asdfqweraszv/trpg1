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
