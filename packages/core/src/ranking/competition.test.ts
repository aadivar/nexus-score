import { describe, expect, it } from 'vitest';
import { rankByScore } from './competition.js';

describe('rankByScore', () => {
  it('assigns standard competition ranks to tied scores', () => {
    const ranked = rankByScore(
      [
        { id: 'a', score: 100 },
        { id: 'b', score: 90 },
        { id: 'c', score: 90 },
        { id: 'd', score: 80 },
      ],
      (entry) => entry.score
    );

    expect(ranked.map(({ id, rank }) => ({ id, rank }))).toEqual([
      { id: 'a', rank: 1 },
      { id: 'b', rank: 2 },
      { id: 'c', rank: 2 },
      { id: 'd', rank: 4 },
    ]);
  });

  it('sorts without mutating the source and preserves tie order', () => {
    const source = [
      { id: 1, score: 20 },
      { id: 2, score: 30 },
      { id: 3, score: 30 },
    ];

    const ranked = rankByScore(source, (entry) => entry.score);

    expect(source.map((entry) => entry.id)).toEqual([1, 2, 3]);
    expect(ranked.map(({ id, rank }) => [id, rank])).toEqual([
      [2, 1],
      [3, 1],
      [1, 3],
    ]);
  });
});
