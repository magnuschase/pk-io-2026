import {
  pickProposedHit,
  scoreQueryMatch,
  splitProposedAndHits,
} from './usda-hit-ranking';
import type { NutritionSearchHit } from './nutrition.service';

const hit = (
  partial: Partial<NutritionSearchHit> & Pick<NutritionSearchHit, 'fdcId' | 'description'>,
): NutritionSearchHit => ({
  kcalPer100g: 100,
  dataType: null,
  ...partial,
});

describe('usda-hit-ranking', () => {
  it('prefers exact query match over compound foods', () => {
    const oliveOil = hit({
      fdcId: 1,
      description: 'Olive oil',
      dataType: 'Survey (FNDDS)',
      kcalPer100g: 900,
    });
    const anchovies = hit({
      fdcId: 2,
      description: 'Anchovies, canned in olive oil, with salt, drained',
      dataType: 'SR Legacy',
      kcalPer100g: 206,
    });
    const blend = hit({
      fdcId: 3,
      description: 'Oil, corn, peanut, and olive',
      dataType: 'SR Legacy',
      kcalPer100g: 3700,
    });

    expect(scoreQueryMatch('olive oil', oliveOil.description)).toBeGreaterThan(
      scoreQueryMatch('olive oil', anchovies.description),
    );
    expect(pickProposedHit([anchovies, blend, oliveOil], 'olive oil')).toEqual(
      oliveOil,
    );
  });

  it('prefers Foundation reference over Branded when query matches', () => {
    const foundation = hit({
      fdcId: 1,
      description: 'Oil, olive',
      dataType: 'Foundation',
      kcalPer100g: 884,
    });
    const branded = hit({
      fdcId: 2,
      description: 'OLIVE OIL',
      dataType: 'Branded',
      kcalPer100g: 800,
    });

    expect(
      pickProposedHit([branded, foundation], 'olive oil', 'olive oil'),
    ).toEqual(foundation);
  });

  it('prefers SR Legacy comma-style descriptions over all-caps branded for water', () => {
    const legacy = hit({
      fdcId: 3,
      description: 'Water, tap',
      dataType: 'SR Legacy',
      kcalPer100g: 0,
    });
    const branded = hit({
      fdcId: 4,
      description: 'WATER',
      dataType: 'Branded',
      kcalPer100g: 42,
    });

    expect(pickProposedHit([branded, legacy], 'water')).toEqual(legacy);
  });

  it('splits proposed from remaining hits', () => {
    const proposed = hit({
      fdcId: 1,
      description: 'Olive oil',
      dataType: 'Survey (FNDDS)',
      kcalPer100g: 900,
    });
    const other = hit({
      fdcId: 2,
      description: 'OLIVE OIL',
      dataType: 'Branded',
      kcalPer100g: 800,
    });

    expect(splitProposedAndHits([other, proposed], 'olive oil')).toEqual({
      proposed,
      hits: [other],
    });
  });
});
