import { buildUsdaSearchQueries } from './ingredient-usda-query';

describe('buildUsdaSearchQueries', () => {
  it('maps exact Polish terms to English USDA queries first', () => {
    const queries = buildUsdaSearchQueries('mąka');
    expect(queries[0]).toBe('wheat flour');
  });

  it('includes tofu without translation', () => {
    expect(buildUsdaSearchQueries('tofu')).toContain('tofu');
  });

  it('maps compound names via partial alias', () => {
    const queries = buildUsdaSearchQueries('świeża bazylia');
    expect(queries.some((q) => q.includes('basil'))).toBe(true);
  });
});
