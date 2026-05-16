// 다음 레벨까지 필요한 경험치 테이블
const EXP_TABLE: Record<number, number> = {
  1: 100,
  2: 180,
  3: 280,
  4: 400,
  5: 550,
  6: 750,
  7: 1000,
  8: 1300,
  9: 1700,
  10: 2200,
  11: 2800,
  12: 3500,
  13: 4300,
  14: 5200,
  15: 6300,
  16: 7500,
  17: 8800,
  18: 10200,
  19: 12000,
  20: 14000,
  21: 16500,
  22: 19000,
  23: 22000,
  24: 25500,
  25: 29500,
  26: 34000,
  27: 39000,
  28: 45000,
  29: 52000,
  30: 59000,
  31: 67000,
  32: 75000,
  33: 84000,
  34: 93000,
  35: 103000,
  36: 113000,
  37: 114000,
  38: 115000,
};

// 필요한 경험치 테이블에 없으면 기본값 반환
export function getExpNeededForNextLevel(currentLevel: number): number {
  return EXP_TABLE[currentLevel] || 999999;
}

// 현재 경험치로 다음 레벨까지 필요한 경험치
export function getExpToNextLevel(currentExp: number, currentLevel: number): number {
  const needed = getExpNeededForNextLevel(currentLevel);
  return Math.max(0, needed - currentExp);
}

// 레벨업 가능한지 확인 (경험치가 충분하면 여러 번 레벨업)
export function calculateLevelUp(currentExp: number, currentLevel: number): { newLevel: number; remainingExp: number } {
  let level = currentLevel;
  let remainingExp = currentExp;
  
  while (level <= 38) {
    const needed = getExpNeededForNextLevel(level);
    if (remainingExp >= needed) {
      remainingExp -= needed;
      level++;
    } else {
      break;
    }
  }
  
  return { newLevel: level, remainingExp: remainingExp };
}

// 레벨업 시 얻는 스탯 포인트 (슬라임은 4, 나머지는 3)
export function getStatPointsPerLevel(species: string): number {
  return species === 'slime' ? 4 : 3;
}

// 10레벨마다 추가로 받는 보너스 스탯 포인트
export function getBonusStatPointsAtLevel(newLevel: number, oldLevel: number): number {
  let bonusPoints = 0;
  
  for (let level = oldLevel + 1; level <= newLevel; level++) {
    if (level % 10 === 0) {
      bonusPoints += 5;
    }
  }
  
  return bonusPoints;
}

// 경험치 추가 시 레벨업 처리
export function addExp(
  currentExp: number,
  currentLevel: number,
  addedExp: number,
  species: string
): { newExp: number; newLevel: number; totalStatPointsGained: number } {
  const newExpTotal = currentExp + addedExp;
  const { newLevel, remainingExp } = calculateLevelUp(newExpTotal, currentLevel);
  
  const levelUpCount = newLevel - currentLevel;
  const statPointsPerLevel = getStatPointsPerLevel(species);
  
  // 기본 스탯 포인트
  const baseStatPoints = levelUpCount * statPointsPerLevel;
  
  // 10레벨마다 받는 보너스 스탯 포인트
  const bonusStatPoints = getBonusStatPointsAtLevel(newLevel, currentLevel);
  
  // 총 스탯 포인트 (이 변수 하나만 사용)
  const totalStatPointsGained = baseStatPoints + bonusStatPoints;
  
  return {
    newExp: remainingExp,
    newLevel: newLevel,
    totalStatPointsGained: totalStatPointsGained
  };
}