export const levelThresholds = [
  { title: "새내기", minKg: 0, maxKg: 5 },
  { title: "쩝쩝 학사", minKg: 6, maxKg: 10 },
  { title: "쩝쩝 석사", minKg: 11, maxKg: 30 },
  { title: "쩝쩝 박사", minKg: 31, maxKg: 50 },
  { title: "쩝쩝 교수", minKg: 51, maxKg: 70 },
  { title: "쩝쩝 총장", minKg: 71, maxKg: 90 },
  { title: "쩝신", minKg: 91, maxKg: null },
];

export function getLevelProgress(kg) {
  const current = levelThresholds.find((level) => kg >= level.minKg && (level.maxKg === null || kg <= level.maxKg)) ?? levelThresholds[0];
  const next = levelThresholds.find((level) => level.minKg > kg) ?? null;

  if (!next) {
    return {
      current,
      next: null,
      remainingKg: 0,
      progress: 100,
    };
  }

  const span = Math.max(1, next.minKg - current.minKg);
  const gainedInLevel = Math.max(0, kg - current.minKg);

  return {
    current,
    next,
    remainingKg: Math.max(0, next.minKg - kg),
    segmentCount: span,
    filledSegments: Math.min(span, gainedInLevel),
    progress: Math.min(100, Math.round((gainedInLevel / span) * 100)),
  };
}
