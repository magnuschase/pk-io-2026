/**
 * USDA FDC is English-first. Map common Polish pantry/recipe terms to search queries.
 * Order: exact alias → partial alias → normalized Polish name (last resort).
 */
const PL_TO_USDA: Readonly<Record<string, string>> = {
  mąka: 'wheat flour',
  maka: 'wheat flour',
  'mąka pszenna': 'wheat flour',
  cukier: 'sugar',
  sól: 'salt',
  sol: 'salt',
  pieprz: 'black pepper',
  masło: 'butter',
  maslo: 'butter',
  mleko: 'milk',
  śmietana: 'heavy cream',
  smietana: 'heavy cream',
  jogurt: 'yogurt',
  ser: 'cheese',
  'ser zolty': 'cheddar cheese',
  'ser żółty': 'cheddar cheese',
  mozzarella: 'mozzarella cheese',
  parmezan: 'parmesan cheese',
  jajko: 'egg',
  jajka: 'eggs',
  'jajko kurze': 'chicken egg',
  kurczak: 'chicken',
  'pierś z kurczaka': 'chicken breast',
  'pierś kurczaka': 'chicken breast',
  wołowina: 'beef',
  wieprzowina: 'pork',
  schab: 'pork loin',
  boczek: 'bacon',
  łosoś: 'salmon',
  losos: 'salmon',
  tuńczyk: 'tuna',
  tunczyk: 'tuna',
  krewetki: 'shrimp',
  tofu: 'tofu',
  ryż: 'rice',
  ryz: 'rice',
  makaron: 'pasta',
  spaghetti: 'spaghetti',
  ziemniak: 'potato',
  ziemniaki: 'potato',
  cebula: 'onion',
  czosnek: 'garlic',
  marchew: 'carrot',
  marchewka: 'carrot',
  pomidor: 'tomato',
  pomidory: 'tomato',
  ogórek: 'cucumber',
  ogorek: 'cucumber',
  papryka: 'bell pepper',
  cukinia: 'zucchini',
  brokuł: 'broccoli',
  brokul: 'broccoli',
  szpinak: 'spinach',
  grzyby: 'mushrooms',
  pieczarki: 'white mushrooms',
  oliwa: 'olive oil',
  olej: 'vegetable oil',
  ocet: 'vinegar',
  miód: 'honey',
  miod: 'honey',
  cynamon: 'cinnamon',
  bazylia: 'basil',
  oregano: 'oregano',
  tymianek: 'thyme',
  majeranek: 'marjoram',
  'proszek do pieczenia': 'baking powder',
  drożdże: 'yeast',
  drozdze: 'yeast',
  'bulion warzywny': 'vegetable broth',
  'sos sojowy': 'soy sauce',
  'koncentrat pomidorowy': 'tomato paste',
};

function normalizeKey(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ');
}

/** Up to 4 distinct USDA search strings for one Polish ingredient name. */
export function buildUsdaSearchQueries(polishName: string): string[] {
  const key = normalizeKey(polishName);
  if (!key) return [];

  const out: string[] = [];

  const exact = PL_TO_USDA[key];
  if (exact) out.push(exact);

  for (const [pl, en] of Object.entries(PL_TO_USDA)) {
    if (key.includes(pl) || pl.includes(key)) {
      if (!out.includes(en)) out.push(en);
    }
  }

  if (!out.includes(key)) out.push(key);

  return out.slice(0, 4);
}
