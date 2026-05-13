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
    specialNote: '우월함: 시작 시 본인이 원하는 스탯에 +5를 추가할 수 있으며 이는 시작 스탯 20을 초과할 수 있다.',
  },
  orc: {
    label: '오크',
    description: '주문력/마나 -2, 힘(공격력)/체력/방어력/민첩 +2',
    statModifiers: { spell: -2, mana: -2, attack: 2, hp: 2, defense: 2, agility: 2 },
    specialNote: '재생: 오크는 매턴 체력을 1씩 회복한다. 최대체력 10당 재생력이 +1씩 증가한다.',
  },
  elf: {
    label: '엘프',
    description: '공격력/방어력 -2, 마나/주문력 +2',
    statModifiers: { attack: -2, defense: -2, mana: 2, spell: 2 },
    specialNote: '마나의 흐름: 엘프는 매턴 마나를 +1씩 회복한다. 최대마다 10당 마나재생이 +1씩 증가한다.',
  },
  lizardman: {
    label: '리자드 맨',
    description: '마나/주문력/공격력 -2, 체력/방어력/마법저항력 +2',
    statModifiers: { mana: -2, spell: -2, attack: -2, hp: 2, defense: 2, magic_resist: 2 },
    specialNote: '견고함: 리자드 맨은 모든 공격으로 부터 받는 피해가 1 감소한다. 이 수치는 방어력 마법저항력의 합이 10이 될 때마다 1씩 증가한다.',
  },
  birdman: {
    label: '익인',
    description: '방어력/마법저항력 -2, 민첩 +5',
    statModifiers: { defense: -2, magic_resist: -2, agility: 5 },
    specialNote: '대성공(1d20=20) 필요 주사위 값이 1 감소',
    specialNote: '맹금의 눈: 대성공에 필요한 주사위 값이 1 줄어든다.',
  },
  slime: {
    label: '슬라임',
    description: '시작 스탯 총합 -1 후 원하는 스탯에 자유 분배',
    statModifiers: {},
    specialNote: '고속성장: 레벨업마다 얻는 스탯 +1 추가한다',
  },
  vampire: {
    label: '흡혈귀',
    description: '체력/공격력/주문력 중 최고값이 체력으로 설정되며 세 스탯이 동일해짐',
    statModifiers: {},
    specialNote: '체력이 낮아지면 공격력과 주문력 또한 낮아진다. 흡혈: 흡혈귀는 본인이 가한 피해량의 10%를 흡혈한다.',
  },
  gnome: {
    label: '노움',
    description: '마나/체력 -2, 매력 +2, 방어력/마법저항력 +1',
    statModifiers: { mana: -2, hp: -2, charm: 2, defense: 1, magic_resist: 1 },
    specialNote: '행운아: 한 번의 기회 추가 모든 선택지에서 실패 (1d20에서 1이 뜰 경우도 포함) 시 한번의 기회가 더 주어진다.',
  },
  undead: {
    label: '언데드',
    description: '체력/매력 -2, 주문력/공격력 +2',
    statModifiers: { hp: -2, charm: -2, spell: 2, attack: 2 },
    specialNote: '불사의 의지: 전투 당 1번 사망 시 최대체력에 20%에 해당하는 체력으로 부활한다.',
  },
  dwarf: {
    label: '드워프',
    description: '마나/주문력 -2, 체력/방어력/지능/공격력 +1',
    statModifiers: { mana: -2, spell: -2, hp: 1, defense: 1, intelligence: 1, attack: 1 },
    specialNote: '완고한 장인: 본인 이 착용한 장비를 강화하여 원하는 장비 스탯을 +1 씩 추가 할 수 있다. 강화 단계가 높아질 수록 난이도가 상승한다.',
  },
  beastkin: {
    label: '반인반수',
    description: '지능/마나/주문력 -2, 민첩/체력/공격력 +2',
    statModifiers: { intelligence: -2, mana: -2, spell: -2, agility: 2, hp: 2, attack: 2 },
    specialNote: '야성: 체력이 50% 이하로 내려가면 민첩과 공격력이 +3씩 상승하며 아군을 포함한 모든 대상에게 공포를 건다.',
  },
  machine: {
    label: '기계 생명체',
    description: '체력 -3, 공격력/주문력/방어력/마법저항력 +1',
    statModifiers: { hp: -3, attack: 1, spell: 1, defense: 1, magic_resist: 1 },
    specialNote: '과부화: 전투 당 한번, 현재 사용 가능한 스킬을 코스트 소모 없이 사용 가능하다. 다음 1턴동안 기절상태가 됩니다. 과부화로 인한 기절은 해제할 수 없다.',
  },
};
