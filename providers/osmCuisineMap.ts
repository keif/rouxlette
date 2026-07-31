// Maps common OSM `cuisine=*` values into the canonical (Yelp-style) alias space
// used by COMMON_CUISINES and the Dealbreakers filter. Unknown values pass
// through lowercased so they still display (they just won't match a curated chip).
const OSM_CUISINE_TO_ALIAS: Record<string, string> = {
  indian: 'indpak',
  sushi: 'sushi',
  japanese: 'japanese',
  pizza: 'pizza',
  italian: 'italian',
  mexican: 'mexican',
  chinese: 'chinese',
  thai: 'thai',
  burger: 'burgers',
  seafood: 'seafood',
  vegan: 'vegan',
  american: 'tradamerican',
  coffee_shop: 'coffee',
};

export function mapCuisineToAliases(cuisine: string | undefined): string[] {
  if (!cuisine) return [];
  return cuisine
    .split(';')
    .map(c => c.trim().toLowerCase())
    .filter(Boolean)
    .map(c => OSM_CUISINE_TO_ALIAS[c] ?? c);
}
