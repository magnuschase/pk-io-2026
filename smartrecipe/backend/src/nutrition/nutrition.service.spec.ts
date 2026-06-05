import { NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { of, throwError } from 'rxjs';
import { NutritionService } from './nutrition.service';
import { DeeplTranslationService } from './deepl-translation.service';
import { Ingredient } from '../domain/entities/ingredient.entity';

const ING_ID = 'ing-uuid';

const makeIngredient = (overrides: Partial<Ingredient> = {}): Ingredient =>
  ({
    id: ING_ID,
    name: 'Chicken breast',
    externalFoodId: null,
    kcalPer100g: null,
    ...overrides,
  }) as Ingredient;

const mockHttp = { get: jest.fn() };

const mockConfig = {
  get: jest.fn().mockImplementation((key: string) => {
    if (key === 'NUTRITION_API_KEY') return '';
    return undefined;
  }),
  getOrThrow: jest.fn(),
};

const mockIngredientRepo = {
  findOne: jest.fn(),
  save: jest.fn((r: Ingredient) => Promise.resolve(r)),
};

const mockDeepl = {
  translatePlToEn: jest.fn().mockResolvedValue('chicken breast'),
};

const usdaSearchResponse = {
  foods: [
    {
      fdcId: 2187885,
      description: 'CHICKEN BREAST',
      dataType: 'Branded',
      foodNutrients: [
        {
          nutrientId: 1008,
          nutrientName: 'Energy',
          value: 165,
          unitName: 'KCAL',
        },
        { nutrientId: 1003, nutrientName: 'Protein', value: 31, unitName: 'G' },
      ],
    },
    {
      fdcId: 2092152,
      description: 'Chicken, breast, raw',
      dataType: 'SR Legacy',
      foodNutrients: [
        {
          nutrientId: 1008,
          nutrientName: 'Energy',
          value: 143,
          unitName: 'KCAL',
        },
      ],
    },
  ],
  totalHits: 2,
};

describe('NutritionService', () => {
  let service: NutritionService;

  beforeEach(async () => {
    jest.resetAllMocks();
    mockIngredientRepo.save.mockImplementation((r: Ingredient) =>
      Promise.resolve(r),
    );
    const module = await Test.createTestingModule({
      providers: [
        NutritionService,
        { provide: HttpService, useValue: mockHttp },
        { provide: ConfigService, useValue: mockConfig },
        {
          provide: getRepositoryToken(Ingredient),
          useValue: mockIngredientRepo,
        },
        { provide: DeeplTranslationService, useValue: mockDeepl },
      ],
    }).compile();
    service = module.get(NutritionService);
  });

  // ── searchFoods ───────────────────────────────────────────────────────
  describe('searchFoods', () => {
    it('returns proposed reference hit and remaining hits', async () => {
      mockHttp.get.mockReturnValue(of({ data: usdaSearchResponse }));
      const result = await service.searchFoods('chicken breast', 5);
      expect(result.proposed).toEqual({
        fdcId: 2092152,
        description: 'Chicken, breast, raw',
        kcalPer100g: 143,
        dataType: 'SR Legacy',
      });
      expect(result.hits).toHaveLength(1);
      expect(result.hits[0]).toEqual({
        fdcId: 2187885,
        description: 'CHICKEN BREAST',
        kcalPer100g: 165,
        dataType: 'Branded',
      });
    });

    it('returns empty result for empty query without calling API', async () => {
      const result = await service.searchFoods('  ');
      expect(mockHttp.get).not.toHaveBeenCalled();
      expect(mockDeepl.translatePlToEn).not.toHaveBeenCalled();
      expect(result).toEqual({ proposed: null, hits: [] });
    });

    it('translates Polish query via DeepL before USDA search', async () => {
      mockDeepl.translatePlToEn.mockResolvedValueOnce('wheat flour');
      mockHttp.get.mockReturnValue(of({ data: usdaSearchResponse }));
      await service.searchFoods('mąka', 5);
      expect(mockDeepl.translatePlToEn).toHaveBeenCalledWith('mąka');
    });

    it('uses DEMO_KEY when NUTRITION_API_KEY is not configured', async () => {
      mockConfig.get.mockReturnValue('');
      mockHttp.get.mockReturnValue(of({ data: usdaSearchResponse }));
      await service.searchFoods('pasta');
      const [[, config]] = mockHttp.get.mock.calls as [
        [string, { params: { api_key: string } }],
      ];
      expect(config.params.api_key).toBe('DEMO_KEY');
    });

    it('uses real key when NUTRITION_API_KEY is set', async () => {
      mockConfig.get.mockImplementation((key: string) =>
        key === 'NUTRITION_API_KEY' ? 'my-real-key' : undefined,
      );
      mockHttp.get.mockReturnValue(of({ data: usdaSearchResponse }));
      await service.searchFoods('pasta');
      const [[, config]] = mockHttp.get.mock.calls as [
        [string, { params: { api_key: string } }],
      ];
      expect(config.params.api_key).toBe('my-real-key');
    });

    it('throws ServiceUnavailableException on API error', async () => {
      mockHttp.get.mockReturnValue(
        throwError(() => new Error('network error')),
      );
      await expect(service.searchFoods('chicken')).rejects.toBeInstanceOf(
        ServiceUnavailableException,
      );
    });

    it('returns null kcalPer100g when energy nutrient is absent', async () => {
      mockHttp.get.mockReturnValue(
        of({
          data: {
            foods: [
              { fdcId: 999, description: 'Mystery food', foodNutrients: [] },
            ],
            totalHits: 1,
          },
        }),
      );
      const result = await service.searchFoods('mystery');
      expect(result.proposed?.kcalPer100g).toBeNull();
    });

    it('searches reference data types before unfiltered results', async () => {
      mockHttp.get.mockReturnValue(of({ data: usdaSearchResponse }));
      await service.searchFoods('chicken breast', 5);
      const calls = mockHttp.get.mock.calls as [
        [string, { params: { dataType?: string } }],
      ];
      expect(calls[0][1].params.dataType).toEqual([
        'Foundation',
        'SR Legacy',
        'Survey (FNDDS)',
      ]);
    });
  });

  describe('enrichIngredientByFdcId', () => {
    it('overwrites manual kcal using USDA food detail nutrient shape', async () => {
      const ing = makeIngredient({ kcalPer100g: 5, externalFoodId: null });
      mockIngredientRepo.findOne.mockResolvedValue(ing);
      mockHttp.get.mockReturnValueOnce(
        of({
          data: {
            fdcId: 2710186,
            description: 'Olive oil',
            foodNutrients: [
              {
                nutrient: { id: 1008, name: 'Energy' },
                amount: 900,
              },
            ],
            foodPortions: [{ amount: 1, gramWeight: 14 }],
          },
        }),
      );
      const result = await service.enrichIngredientByFdcId(ING_ID, 2710186);
      expect(result.kcalPer100g).toBe(900);
      expect(result.externalFoodId).toBe('2710186');
      expect(mockIngredientRepo.save).toHaveBeenCalled();
    });
  });

  describe('setManualKcal', () => {
    it('throws NotFoundException for unknown ingredient', async () => {
      mockIngredientRepo.findOne.mockResolvedValue(null);
      await expect(service.setManualKcal('bad-uuid', 120)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('saves manual kcal and clears externalFoodId', async () => {
      const ing = makeIngredient({ externalFoodId: '12345', kcalPer100g: 50 });
      mockIngredientRepo.findOne.mockResolvedValue(ing);
      const result = await service.setManualKcal(ING_ID, 884);
      expect(result.kcalPer100g).toBe(884);
      expect(result.externalFoodId).toBeNull();
      expect(mockIngredientRepo.save).toHaveBeenCalled();
    });
  });

  // ── enrichIngredient ──────────────────────────────────────────────────
  describe('enrichIngredient', () => {
    it('throws NotFoundException for unknown ingredient', async () => {
      mockIngredientRepo.findOne.mockResolvedValue(null);
      await expect(service.enrichIngredient('bad-uuid')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('saves fdcId, kcalPer100g and gramsPerPiece from food detail', async () => {
      const ing = makeIngredient();
      mockIngredientRepo.findOne.mockResolvedValue(ing);
      mockHttp.get
        .mockReturnValueOnce(of({ data: usdaSearchResponse }))
        .mockReturnValueOnce(of({ data: usdaSearchResponse }))
        .mockReturnValueOnce(
          of({
            data: {
              fdcId: 2092152,
              foodNutrients: usdaSearchResponse.foods[1].foodNutrients,
              foodPortions: [{ amount: 1, modifier: 'medium', gramWeight: 85 }],
            },
          }),
        );
      const result = await service.enrichIngredient(ING_ID);
      expect(result.externalFoodId).toBe('2092152');
      expect(result.kcalPer100g).toBe(143);
      expect(result.gramsPerPiece).toBe(85);
      expect(mockIngredientRepo.save).toHaveBeenCalled();
    });

    it('returns ingredient unchanged when USDA returns no hits', async () => {
      const ing = makeIngredient();
      mockIngredientRepo.findOne.mockResolvedValue(ing);
      mockHttp.get.mockReturnValue(of({ data: { foods: [], totalHits: 0 } }));
      const result = await service.enrichIngredient(ING_ID);
      expect(result.externalFoodId).toBeNull();
      expect(mockIngredientRepo.save).not.toHaveBeenCalled();
    });
  });
});
