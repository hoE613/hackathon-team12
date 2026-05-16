export default function LevelGauge({ levelProgress, className = "" }) {
  const segmentCount = Math.max(1, levelProgress.segmentCount ?? 1);
  const filledSegments = Math.max(0, Math.min(segmentCount, levelProgress.filledSegments ?? segmentCount));

  return (
    <div
      className={`level-segment-gauge ${className}`}
      style={{ "--segment-count": segmentCount }}
      aria-label={`다음 레벨까지 ${levelProgress.remainingKg}kg`}
    >
      {Array.from({ length: segmentCount }, (_, index) => (
        <i
          key={index}
          className={index < filledSegments ? "filled" : ""}
        />
      ))}
    </div>
  );
}
