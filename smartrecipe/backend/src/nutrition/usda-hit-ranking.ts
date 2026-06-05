import type { NutritionSearchHit } from './nutrition.service';

const DATA_TYPE_RANK: Record<string, number> = {
  Foundation: 4,
  'SR Legacy': 3,
  'Survey (FNDDS)': 2,
  Branded: 1,
};

const COMPOUND_FOOD_WORDS = [
  'canned',
  'with',
  'without',
  'drained',
  'prepared',
  'cooked',
  'pickled',
  'smoked',
  'breaded',
  'frozen',
];

function normalizeForMatch(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenize(text: string): string[] {
  return normalizeForMatch(text).split(' ').filter(Boolean);
}

export function scoreQueryMatch(query: string, description: string): number {
  const qNorm = normalizeForMatch(query);
  const dNorm = normalizeForMatch(description);
  if (!qNorm || !dNorm) return 0;

  if (dNorm === qNorm) {
    const letters = description.replace(/[^a-zA-Z]/g, '');
    if (letters.length > 0 && letters === letters.toUpperCase()) {
      return 45;
    }
    return 100;
  }

  const qTokens = tokenize(query);
  const dTokens = tokenize(description);

  if (
    qTokens.length > 0 &&
    dTokens.length === qTokens.length &&
    [...qTokens].sort().join(' ') === [...dTokens].sort().join(' ')
  ) {
    return 95;
  }

  if (dNorm.startsWith(qNorm)) return 85;

  if (dNorm.includes(qNorm)) {
    const extraLen = dNorm.length - qNorm.length;
    return Math.max(45, 75 - Math.floor(extraLen / 4));
  }

  const allPresent = qTokens.every((token) => dNorm.includes(token));
  if (!allPresent) return 0;

  const extraTokens = dTokens.filter((token) => !qTokens.includes(token));
  let score = 55 - extraTokens.length * 10;

  for (const word of COMPOUND_FOOD_WORDS) {
    if (dNorm.includes(word)) score -= 18;
  }

  if (dNorm.includes(' and ')) score -= 12;

  return score;
}

function bestQueryMatchScore(
  hit: NutritionSearchHit,
  query: string,
  englishQuery?: string | null,
): number {
  const scores = [scoreQueryMatch(query, hit.description)];
  if (englishQuery?.trim()) {
    scores.push(scoreQueryMatch(englishQuery, hit.description));
  }
  return Math.max(...scores);
}

export function scoreNutritionHit(
  hit: NutritionSearchHit,
  query?: string,
  englishQuery?: string | null,
): number {
  let score = 0;

  if (query?.trim()) {
    const matchScore = bestQueryMatchScore(hit, query, englishQuery);
    score += matchScore * 3;

    if (matchScore < 20) {
      score -= 80;
    }
  }

  score += (DATA_TYPE_RANK[hit.dataType ?? ''] ?? 0) * 6;

  const letters = hit.description.replace(/[^a-zA-Z]/g, '');
  if (letters.length > 0 && letters === letters.toUpperCase()) {
    score -= 8;
  }

  if (hit.kcalPer100g == null) {
    score -= 60;
  } else {
    if (hit.kcalPer100g > 950) score -= 25;
    if (hit.kcalPer100g > 1500) score -= 60;
    if (hit.kcalPer100g < 0) score -= 100;
  }

  return score;
}

export function pickProposedHit(
  hits: NutritionSearchHit[],
  query?: string,
  englishQuery?: string | null,
): NutritionSearchHit | null {
  if (!hits.length) return null;

  const ranked = [...hits].sort(
    (a, b) =>
      scoreNutritionHit(b, query, englishQuery) -
      scoreNutritionHit(a, query, englishQuery),
  );

  const withKcal = ranked.filter((hit) => hit.kcalPer100g != null);
  const pool = withKcal.length > 0 ? withKcal : ranked;

  if (query?.trim()) {
    const relevant = pool.filter(
      (hit) => bestQueryMatchScore(hit, query, englishQuery) >= 25,
    );
    if (relevant.length > 0) return relevant[0];
  }

  return pool[0] ?? null;
}

export function splitProposedAndHits(
  hits: NutritionSearchHit[],
  query = '',
  englishQuery?: string | null,
): { proposed: NutritionSearchHit | null; hits: NutritionSearchHit[] } {
  const proposed = pickProposedHit(hits, query, englishQuery);
  if (!proposed) return { proposed: null, hits };

  return {
    proposed,
    hits: hits.filter((hit) => hit.fdcId !== proposed.fdcId),
  };
}
