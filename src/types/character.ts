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

export interface JobSkill {
  requiredIntelligence: number;
  name: string;
  description: string;
  cost?: string;
}

export interface JobBonus {
  label: string;
  description: string; 
  statModifiers: Partial<Stats>;
  skills: JobSkill[]; 
}

export const JOB_BONUSES: Record<Job, JobBonus> = {
  몽크: {
    label: '몽크',
    description: '민첩+2, 체력+2, 주문력+2, 공격력+2',
    statModifiers: { agility: 2, hp: 2, spell: 2, attack: 2 },
    skills: [
      {
        requiredIntelligence: 5,
        name: '재빠른 주먹',
        description: '공격력에 70%에 해당하는 데미지로 적을 1회 공격해 물리 피해를 입힙니다. 민첩이 8 증가할 때마다 주먹질의 횟수가 1회씩 늘어납니다.',
        cost: '마나-6',
      },
      {
        requiredIntelligence: 10,
        name: '타오르는 정신',
        description: '자신의 체력을 불태워 3턴간 주먹에 불꽃을 두릅니다. 이후 몽크의 공격은 추가적으로 주문력에 70%에 해당하는 피해량을 갖습니다. 타오르는 정신을 사용하고 적에게 공격을 적중 시 마나를 1회복합니다.',
        cost: '체력-10',
      },
      {
        requiredIntelligence: 12,
        name: '영혼의 공명',
        description: '적에게 공격 적중 시 표식을 남깁니다. 표식은 최대 5개까지 중첩됩니다. 적의 턴이 종료되고 다시 본인의 턴으로 돌아왔을 때 남아있는 표식 1당 체력을 1씩 회복합니다.',
        cost: '패시브',
      },
      {
        requiredIntelligence: 15,
        name: '영혼의 발현',
        description: '영혼의 공명이 쌓여있는 모든 적의 영혼을 한번에 폭발시킵니다. 영혼의 공명이 폭발 시 주문력에 40% × 표식의 수 만큼에 마법피해를 한번에 넣습니다.',
        cost: '마나-15',
      },
      {
        requiredIntelligence: 18,
        name: '급소타격',
        description: '적 1명의 급소에 주먹을 강하게 내질러 공격력에 100%에 해당하는 피해를 입히며 1턴간 기절시킵니다.',
        cost: '마나-12',
      },
      {
        requiredIntelligence: 20,
        name: '금강변환',
        description: '3턴간 자신의 무장을 해제하며 공격에 모든 힘을 투자합니다. 가지고 있는 방어력과 마법저항력을 50% 각각 공격력, 주문력으로 전환됩니다.',
        cost: '마나-10',
      },
      {
        requiredIntelligence: 23,
        name: '기류의 보호',
        description: '적의 공격을 회피 성공 시 최대체력에 20% 해당하는 보호막을 얻습니다.',
        cost: '패시브',
      },
      {
        requiredIntelligence: 25,
        name: '찬란한 후광',
        description: '매력에 30%에 해당하는 방어력과 마법저항력을 얻습니다.',
        cost: '패시브',
      },
      {
        requiredIntelligence: 27,
        name: '명상',
        description: '1턴간 명상에 돌입하며 명상 상태에 돌입하고 다음 턴이 돌아올 때까지 어떠한 행동도 할 수 없습니다. 명상이 끝난 후에는 자신의 몸에 걸려있는 모든 디버프를 제거하며 1턴간 다음 첫 일반 공격이 고정피해로 들어갑니다.',
        cost: '마나-12',
      },
      {
        requiredIntelligence: 30,
        name: '심기체',
        description: '심.기.체 중 하나의 상태에 몰입하며 몰입시 각기다른 효과를 얻습니다.\n\n심: "타오르는 정신"과 "영혼의 공명"으로 얻는 회복량이 2로 증가.\n\n기: "영혼의 발현"이 50%로 증가하며 "재빠른 주먹"이 80%로 상승.\n\n체: "찬란한 후광"으로 얻는 수치가 30%→40%로 증가하며 "기류의 보호"로 얻는 보호막이 최대체력 30%로 증가.',
        cost: '마나-?',
      },
    ],
  },
  바드: {
    label: '바드',
    description: '마나+4, 매력+5',
    statModifiers: { mana: 4, charm: 5 },
    skills: [
      { requiredIntelligence: 5, name: '힐', description: '원하는 아군 1명의 체력을 4회복시킵니다. 마나 10당 이 수치가 1 증가합니다.', cost: '마나-4' },
      { requiredIntelligence: 10, name: '승리의 빵파레', description: '자신을 포함한 아군 모두에게 1턴간 공격력과 주문력을 +3씩 부여합니다. 주문력과 공격력 10당 이 수치가 각 속성에 맞게 1씩 증가합니다.', cost: '마나-10' },
      { requiredIntelligence: 15, name: '정화', description: '원하는 아군 1명에게 걸린 모든 상태이상을 해제합니다.', cost: '마나-10' },
      { requiredIntelligence: 18, name: '별의 분노', description: '모든 적에게 파쇄와 파열을 3스택 부여합니다. 주문력과 공격력 10당 이 수치가 각 속성에 맞게 1씩 증가합니다.', cost: '마나-10' },
      { requiredIntelligence: 20, name: '빛의 결속', description: '자신과 아군 1명을 결속하며 한 쪽이 사망 시 살아남은 결속인이 사망한 결속인에게 자신의 현재 체력의 50%를 나누어주며 사망한 결속인을 부활시킵니다.', cost: '마나-15' },
      { requiredIntelligence: 23, name: '바람의 재즈', description: '이번턴 동안 아군의 민첩을 4 증가시킵니다. 매력 10당 해당 수치가 1씩 증가합니다.', cost: '마나-10' },
      { requiredIntelligence: 26, name: '공명하는 화음', description: '1턴간 아군 1명을 지정하여 해당 아군의 "공격"을 50% 효율로 한 번 더 시전합니다.', cost: '마나-10' },
      { requiredIntelligence: 30, name: '앵콜!', description: '바드는 이제 모든 스킬을 2번씩 시전합니다.', cost: '패시브' },
    ],
  },
 궁수: {
    label: '궁수',
    description: '공격력+2, 마나+2, 민첩+4',
    statModifiers: { attack: 2, mana: 2, agility: 4 },
    skills: [
      { requiredIntelligence: 5, name: '퀵샷', description: '각각 "공격력"에 60% 해당하는 화살 3발을 발사합니다.', cost: '마나-5' },
      { requiredIntelligence: 10, name: '강철화살', description: '적 1명에게 "공격력" 100% 데미지를 주며 이 공격은 적의 방어력을 무시합니다.', cost: '마나-8' },
      { requiredIntelligence: 12, name: '회피', description: '1회 사용당 1명의 공격을 확정적으로 회피합니다.', cost: '마나-8' },
      { requiredIntelligence: 15, name: '표식', description: '1명의 대상에게 표식을 3턴간 남기며 해당 대상이 받는 피해량을 20% 증가시킵니다. 표식은 아군에게도 공유되며 궁수가 표식이 있는 적을 공격할 시 추가피해량이 고정딜로 들어갑니다. 표식은 여러 대상에게 걸 수 있습니다.', cost: '마나-14' },
      { requiredIntelligence: 20, name: '재빠른 몸놀림', description: '한턴에 두개의 행동이 가능해집니다.', cost: '패시브' },
      { requiredIntelligence: 23, name: '도탄사격', description: '적에게 가한 데미지에 70%가 가장 방어력이 낮은 적에게 튕겨져 추가적으로 피해를 입힙니다.', cost: '패시브' },
      { requiredIntelligence: 27, name: '대룡사격', description: '공격력에 200%에 해당하는 물리 데미지를 주며 민첩에 절반에 해당하는 확률로 해당 기술은 시전됩니다. 줄어든 적중률의 수치만큼 공격력으로 전환되어 데미지를 줍니다. <(공격력 + 민첩50%) × 200%>', cost: '마나-20' },
      { requiredIntelligence: 30, name: '집요함', description: '만일 이전 공격이 빚나갔다면 다음 공격은 반드시 적중합니다.', cost: '패시브' },
    ],
  },
  탱커: {
    label: '탱커',
    description: '체력+5, 방어력+3, 마법 저항력+3',
    statModifiers: { hp: 5, defense: 3, magic_resist: 3 },
    skills: [
      { requiredIntelligence: 5, name: '도발', description: '1턴간 적들의 공격순위를 자신으로 바꿉니다.', cost: '마나-5' },
      { requiredIntelligence: 10, name: '단단해지기', description: '1턴간 현재 방어력과 마법 저항력 수치의 50%를 얻습니다.', cost: '마나-8' },
      { requiredIntelligence: 15, name: '불굴', description: '3턴간 상태이상에 면역이 되며 현재 걸려있는 상태이상의 영향 또한 받지 않습니다.', cost: '마나-10' },
      { requiredIntelligence: 20, name: '흡수의 오라', description: '1턴간 모든 공격을 본인이 흡수합니다. 흡수한 데미지는 축적됩니다.', cost: '마나-10' },
      { requiredIntelligence: 22, name: '방출의 오라', description: '흡수의 오라로 받았던 데미지를 모두 축적하며 한 명에게 방출하여 고정딜을 입힙니다.', cost: '마나-10' },
      { requiredIntelligence: 25, name: '적응형 피부', description: '전투의 돌입 후 매 턴마다 받는 피해가 고정적으로 1씩 감소합니다.', cost: '패시브' },
      { requiredIntelligence: 27, name: '영웅등장', description: '전투 당 1번 죽을 위기에 처한 아군에게 날라들어 해당 공격을 막아내며 아군을 지킵니다. 이후 방패로 땅을 내리쳐 지진을 일으키며 모든 적에게 최대체력에 100%에 해당하는 물리피해를 입히고, 1턴간 비틀거림 10을 부여합니다.', cost: '패시브' },
      { requiredIntelligence: 30, name: '성역의 방패', description: '3턴간 아군을 수호하는 강력한 영역을 전개합니다. 해당 영역이 전개된 동안 모든 아군에게 자신의 최대체력에 30%에 해당하는 보호막을 씌우며 탱커의 방어력과 마법저항력의 20%가 아군에게 적용됩니다. 또한 탱커에게 적용되는 회복량에 50%가 모든 아군에게 턴 상관없이 적용됩니다.', cost: '마나-20' },
    ],
  },
  광전사: {
    label: '광전사',
    description: '체력+3, 공격력+3, 방어력+1, 마법 저항력+1',
    statModifiers: { hp: 3, attack: 3, defense: 1, magic_resist: 1 },
    skills: [
      { requiredIntelligence: 5, name: '강타', description: '"공격력"에 120% 데미지로 적을 공격합니다. 적은 출혈 3스택을 얻습니다.', cost: '마나-7' },
      { requiredIntelligence: 10, name: '연속베기', description: '각각 "공격력"에 70% 데미지로 적을 공격하며 각 공격은 적에게 "출혈"을 2스택 부여합니다.', cost: '마나-9' },
      { requiredIntelligence: 15, name: '광기의 발악', description: '적에게 공격을 받았을 때 해당 스킬을 사용할 수 있으며 주사위를 굴려 11이상이 뜰 시 적에게 공격력에 130%에 물리 피해를 주며 출혈 5스택을 적용합니다. 만일 실패했을 경우에는 20% 증가된 적의 피해를 받습니다.', cost: '마나-6' },
      { requiredIntelligence: 18, name: '전사의 심장', description: '잃은 체력 -5마다 공격력을 +2 얻습니다.', cost: '패시브' },
      { requiredIntelligence: 20, name: '무자비한 일격', description: '적에게 "공격력"에 100%에 해당하는 물리피해를 주며 "출혈"을 3스택 부여합니다. 만일 적이 이미 "출혈" 상태라면 쌓인 출혈 스택을 모두 제거하며 130% + 제거한 "출혈" 당 데미지가 10%씩 증가하여 데미지가 들어갑니다. 해당 스킬은 "심장 추적자"의 효과를 받습니다.', cost: '마나-15' },
      { requiredIntelligence: 23, name: '심장 추적자', description: '전사의 모든 공격은 이제 적의 방어력을 20% 무시합니다. 만약 적이 "출혈" 상태라면 무시 수치가 50%로 증가합니다.', cost: '패시브' },
      { requiredIntelligence: 25, name: '심장 파괴자', description: '공격력에 100%에 해당하는 물리피해를 1명에게 줍니다. 이때 사용자의 잃은 체력만큼 데미지에 추가가 되어 들어갑니다.', cost: '마나-15' },
      { requiredIntelligence: 28, name: '혈무', description: '체력을 소모하여 소모한 만큼 마나를 얻으며 1턴에 전환한 마나 10당 다음 공격이 피해흡혈 10%를 얻습니다.', cost: '마나-0' },
      { requiredIntelligence: 30, name: '광전사의 분노', description: '전투 당 1번 즉사급의 피해를 받을 시 체력이 1미만으로 내려가지 않습니다. 전사의 긍지가 발동하고 이후에 방어력과 마법저항력을 포함한 모든 스탯이 해당 전투동안 +5 증가합니다.', cost: '패시브' },
    ],
  },
  마법사: {
    label: '마법사',
    description: '마나+3, 지능+3, 주문력+3',
    statModifiers: { mana: 3, intelligence: 3, spell: 3 },
    skills: [
      { requiredIntelligence: 5, name: '파이어볼', description: '적에게 화염구를 발사해 "주문력"에 110% 데미지를 입힙니다.', cost: '마나-3' },
      { requiredIntelligence: 10, name: '아이스샷', description: '적에게 얼음 탄을 2발 날려 "주문력"에 70% 데미지를 입힙니다. 같은 대상에게 3번 적중 시 대상은 얼어붙으며 "빙결" 상태가 됩니다.', cost: '마나-7' },
      { requiredIntelligence: 15, name: '스톤 쉴드', description: '원하는 아군 1명에게 "주문력" 50%에 해당하는 보호막을 씌웁니다.', cost: '마나-7' },
      { requiredIntelligence: 20, name: '대영창', description: '전투당 0번 주문을 강화하여 더욱 강력한 주문을 시전합니다. 최대 마나 20마다 대영창 횟수가 1씩 증가합니다.\n\n• 파이어볼 → 메테오: 모든 적에게 "주문력" 150%에 해당하는 데미지를 줍니다. 이후 적들은 3턴간 주문력에 30%에 해당하는 화상 데미지를 받습니다.\n• 아이스샷 → 엡솔루트 제로: 모든 적에게 "주문력"에 100% 데미지를 입히며 모든 적에게 "빙결" 상태이상을 부여합니다.\n• 스톤 쉴드 → 테라포스 가디언: 강력한 힘을 지닌 가디언을 소환합니다. (체력: 주문력 150%, 공격력: 주문력 100%, 방어력: 주문력 50%, 마법저항력: 주문력 50%)\n• 섬멸의 빛 → 종언의 섬광: 주문력에 200% 데미지, 적 마법저항력 50% 무시, 3턴간 비틀거림 9 부여.\n• 체인 라이트닝 → 템페스트: 5명에게 주문력 140% 데미지, 1턴 기절, "감전" 상태 부여 (받는 피해 30% 증가).', cost: '기존스킬 + 마나-10' },
      { requiredIntelligence: 22, name: '마나 드레인', description: '가한 데미지의 50%를 마나로 회복합니다.', cost: '패시브' },
      { requiredIntelligence: 25, name: '섬멸의 빛', description: '1명의 대상에게 주문력 170% 데미지를 주고 2턴간 비틀거림 6을 부여합니다.', cost: '마나-15' },
      { requiredIntelligence: 28, name: '체인 라이트닝', description: '3명의 적에게 주문력에 120% 데미지를 주며 1턴간 기절 시킵니다.', cost: '마나-20' },
      { requiredIntelligence: 30, name: '퍼펙트 에리어', description: '적이 시전 중이거나 시전할 예정인 적의 공격을 해제시킵니다.', cost: '마나-25' },
    ],
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
  enhance_level?: number;
}

export interface Character {
  id?: string;
  name: string;
  species: Species;
  job: Job;
  level: number;
  exp: number;
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
  avatar_url?: string; 
  gold?: number;
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
