export type Species =
  | 'human'
  | 'orc'
  | 'elf'
  | 'lizardman'
  | 'birdman'
  | 'slime'
  | 'vampire'
  | 'gnome'
  | 'undead'
  | 'dwarf'
  | 'beastkin'
  | 'machine';

export type Job = '광전사' | '몽크' | '탱커' | '바드' | '마법사' | '궁수';

export interface JobBonus {
  label: string;
  statModifiers: Partial<Stats>;
}

export const JOB_BONUSES: Record<Job, JobBonus> = {
  몽크: {
    label: '몽크',
    statModifiers: { agility: 2, hp: 2, spell: 2, attack: 2 },
  },
  바드: {
    label: '바드',
    statModifiers: { mana: 4, charm: 5 },
  },
  궁수: {
    label: '궁수',
    statModifiers: { attack: 2, mana: 2, agility: 4 },
  },
  탱커: {
    label: '탱커',
    statModifiers: { hp: 5, defense: 3, magic_resist: 3 },
  },
  광전사: {
    label: '광전사',
    statModifiers: { hp: 3, attack: 3, defense: 1, magic_resist: 1 },
  },
  마법사: {
    label: '마법사',
    statModifiers: { mana: 3, intelligence: 3, spell: 3 },
  },
};

export interface Stats {
  hp: number;
  attack: number;
  spell: number;
  mana: number;
  intelligence: number;
  agility: number;
  defense: number;
  magic_resist: number;
  charm: number;
}

export type ItemRarity = '저급' | '일반' | '고급' | '희귀' | '전설';

export interface Equipment {
  id?: string;
  character_id?: string;
  slot_name: string;
  item_name: string;
  rarity: ItemRarity;
  bonus_hp: number;
  bonus_attack: number;
  bonus_spell: number;
  bonus_mana: number;
  bonus_intelligence: number;
  bonus_agility: number;
  bonus_defense: number;
  bonus_magic_resist: number;
  bonus_charm: number;
}

export interface Character {
  id?: string;
  name: string;
  species: Species;
  job: Job;
  level: number;
  stat_hp: number;
  stat_attack: number;
  stat_spell: number;
  stat_mana: number;
  stat_intelligence: number;
  stat_agility: number;
  stat_defense: number;
  stat_magic_resist: number;
  stat_charm: number;
  spent_hp: number;
  spent_attack: number;
  spent_spell: number;
  spent_mana: number;
  spent_intelligence: number;
  spent_agility: number;
  spent_charm: number;
  stat_points: number;
  current_hp: number;
  current_mana: number;
  special_abilities: string;
  notes: string;
  password_hash: string;
  equipment?: Equipment[];
}

export const SPECIES_LABELS: Record<Species, string> = {
  human: '인간',
  orc: '오크',
  elf: '엘프',
  lizardman: '리자드 맨',
  birdman: '익인',
  slime: '슬라임',
  vampire: '흡혈귀',
  gnome: '노움',
  undead: '언데드',
  dwarf: '드워프',
  beastkin: '반인반수',
  machine: '기계 생명체',
};

export const JOB_LIST: Job[] = ['광전사', '몽크', '탱커', '바드', '마법사', '궁수'];

export const STAT_LABELS: Record<string, string> = {
  hp: '체력',
  attack: '공격력',
  spell: '주문력',
  mana: '마나',
  intelligence: '지능',
  agility: '민첩',
  defense: '방어력',
  magic_resist: '마법 저항력',
  charm: '매력',
};

// 찍을 수 없는 고정 기본값 스탯 (방어력, 마법저항력은 기본값 5 고정)
export const FIXED_BASE_STATS = ['defense', 'magic_resist'];
export const ALL_STATS_LIST = ['hp', 'attack', 'spell', 'mana', 'intelligence', 'agility', 'defense', 'magic_resist', 'charm'] as const;

export interface SpeciesBonus {
  label: string;
  description: string;
  statModifiers: Partial<Stats>;
  specialNote?: string;
}

export const SPECIES_BONUSES: Record<Species, SpeciesBonus> = {
  human: {
    label: '인간',
    description: '모든 스탯 +1, 원하는 스탯에 +5 추가 가능 (시작 20 초과 가능)',
    statModifiers: { hp: 1, attack: 1, spell: 1, mana: 1, intelligence: 1, agility: 1, defense: 1, magic_resist: 1, charm: 1 },
    specialNote: '시작 시 원하는 스탯에 +5 추가 (20 초과 가능)',
  },
  orc: {
    label: '오크',
    description: '주문력/마나 -2, 힘(공격력)/체력/방어력/민첩 +2',
    statModifiers: { spell: -2, mana: -2, attack: 2, hp: 2, defense: 2, agility: 2 },
  },
  elf: {
    label: '엘프',
    description: '공격력/방어력 -2, 마나/주문력 +2',
    statModifiers: { attack: -2, defense: -2, mana: 2, spell: 2 },
  },
  lizardman: {
    label: '리자드 맨',
    description: '마나/주문력/공격력 -2, 체력/방어력/마법저항력 +2',
    statModifiers: { mana: -2, spell: -2, attack: -2, hp: 2, defense: 2, magic_resist: 2 },
  },
  birdman: {
    label: '익인',
    description: '방어력/마법저항력 -2, 민첩 +5',
    statModifiers: { defense: -2, magic_resist: -2, agility: 5 },
    specialNote: '대성공(1d20=20) 필요 주사위 값이 1 감소',
  },
  slime: {
    label: '슬라임',
    description: '시작 스탯 총합 -1 후 원하는 스탯에 자유 분배',
    statModifiers: {},
    specialNote: '고속성장: 레벨업마다 얻는 스탯 +1 추가',
  },
  vampire: {
    label: '흡혈귀',
    description: '체력/공격력/주문력 중 최고값이 체력으로 설정되며 세 스탯이 동일해짐',
    statModifiers: {},
    specialNote: '체력이 낮아지면 공격력과 주문력도 낮아짐',
  },
  gnome: {
    label: '노움',
    description: '마나/체력 -2, 매력 +2, 방어력/마법저항력 +1',
    statModifiers: { mana: -2, hp: -2, charm: 2, defense: 1, magic_resist: 1 },
    specialNote: '행운아: 1d20에서 1이 뜰 경우 한 번의 기회 추가',
  },
  undead: {
    label: '언데드',
    description: '체력/매력 -2, 주문력/공격력 +2',
    statModifiers: { hp: -2, charm: -2, spell: 2, attack: 2 },
  },
  dwarf: {
    label: '드워프',
    description: '마나/주문력 -2, 체력/방어력/지능/공격력 +1',
    statModifiers: { mana: -2, spell: -2, hp: 1, defense: 1, intelligence: 1, attack: 1 },
  },
  beastkin: {
    label: '반인반수',
    description: '지능/마나/주문력 -2, 민첩/체력/공격력 +2',
    statModifiers: { intelligence: -2, mana: -2, spell: -2, agility: 2, hp: 2, attack: 2 },
    specialNote: '현재 체력 50% 이하 시 민첩/공격력 +3',
  },
  machine: {
    label: '기계 생명체',
    description: '체력 -3, 공격력/주문력/방어력/마법저항력 +1',
    statModifiers: { hp: -3, attack: 1, spell: 1, defense: 1, magic_resist: 1 },
  },
};
