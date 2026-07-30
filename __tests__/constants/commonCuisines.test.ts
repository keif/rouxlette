import { COMMON_CUISINES } from '../../constants/foodCategories';

describe('COMMON_CUISINES', () => {
  it('is a non-empty list of {alias,label} with unique aliases', () => {
    expect(COMMON_CUISINES.length).toBeGreaterThan(5);
    for (const c of COMMON_CUISINES) {
      expect(typeof c.alias).toBe('string');
      expect(typeof c.label).toBe('string');
    }
    const aliases = COMMON_CUISINES.map(c => c.alias);
    expect(new Set(aliases).size).toBe(aliases.length);
  });
});
