export interface CompetitionRank {
  rank: number;
}

/**
 * Sort entries by score and assign standard competition ranks.
 * Equal scores share a rank; the next rank skips the size of the tie.
 * Example: 100, 90, 90, 80 becomes 1, 2, 2, 4.
 */
export function rankByScore<T>(
  entries: readonly T[],
  getScore: (entry: T) => number
): Array<T & CompetitionRank> {
  const sorted = [...entries].sort((left, right) => getScore(right) - getScore(left));
  let previousScore: number | undefined;
  let rank = 0;

  return sorted.map((entry, index) => {
    const score = getScore(entry);
    if (index === 0 || score !== previousScore) rank = index + 1;
    previousScore = score;
    return { ...entry, rank };
  });
}
