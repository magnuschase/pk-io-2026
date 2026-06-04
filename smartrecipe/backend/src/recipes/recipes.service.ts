import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Recipe } from '../domain/entities/recipe.entity';
import { RecipeIngredient } from '../domain/entities/recipe-ingredient.entity';
import { RecipeLifecycleStatus } from '../domain/enums';
import {
  CreateRecipeDto,
  RecipeFilterDto,
  SetIngredientsDto,
  UpdateRecipeDto,
} from './dto/recipe.dto';
import { PantryService } from '../pantry/pantry.service';
import { PantryItem } from '../domain/entities/pantry-item.entity';

export type RecipeDetail = Recipe & { pantryMissingCount?: number };

type AllowedTransition = Record<RecipeLifecycleStatus, RecipeLifecycleStatus[]>;

const ALLOWED_TRANSITIONS: AllowedTransition = {
  [RecipeLifecycleStatus.DRAFT]: [RecipeLifecycleStatus.ACTIVE],
  [RecipeLifecycleStatus.ACTIVE]: [
    RecipeLifecycleStatus.DRAFT,
    RecipeLifecycleStatus.ARCHIVED,
  ],
  [RecipeLifecycleStatus.ARCHIVED]: [RecipeLifecycleStatus.ACTIVE],
};

@Injectable()
export class RecipesService {
  constructor(
    @InjectRepository(Recipe)
    private readonly recipeRepo: Repository<Recipe>,
    @InjectRepository(RecipeIngredient)
    private readonly riRepo: Repository<RecipeIngredient>,
    private readonly pantryService: PantryService,
  ) {}

  async findAll(userId: string, filters: RecipeFilterDto): Promise<Recipe[]> {
    const qb = this.recipeRepo
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.ingredients', 'ri')
      .leftJoinAndSelect('ri.ingredient', 'i')
      .where('r.userId = :userId', { userId });

    if (filters.diet) qb.andWhere('r.dietType = :diet', { diet: filters.diet });
    if (filters.cuisine)
      qb.andWhere('r.cuisineType = :cuisine', { cuisine: filters.cuisine });
    if (filters.kcalMin)
      qb.andWhere('r.estimatedKcalPerServing >= :kcalMin', {
        kcalMin: filters.kcalMin,
      });
    if (filters.kcalMax)
      qb.andWhere('r.estimatedKcalPerServing <= :kcalMax', {
        kcalMax: filters.kcalMax,
      });

    return qb.orderBy('r.createdAt', 'DESC').getMany();
  }

  async findOne(userId: string, id: string): Promise<RecipeDetail> {
    const recipe = await this.recipeRepo.findOne({
      where: { id },
      relations: { ingredients: { ingredient: true } },
    });
    if (!recipe) throw new NotFoundException('Recipe not found');
    if (recipe.userId !== userId) throw new ForbiddenException();
    return this.withPantryStatus(userId, recipe);
  }

  private async withPantryStatus(
    userId: string,
    recipe: Recipe,
  ): Promise<RecipeDetail> {
    const detail: RecipeDetail = { ...recipe };
    if (recipe.lifecycleStatus !== RecipeLifecycleStatus.ACTIVE) {
      return detail;
    }
    const lines = (recipe.ingredients ?? []).map((ri) => ({
      ingredientId: ri.ingredientId,
      quantity: Number(ri.quantity),
      unit: ri.unit,
    }));
    const pantryItems = await this.pantryService.listPantry(userId);
    const pantryMap = new Map(
      pantryItems.map((p) => [
        p.ingredientId,
        { quantity: Number(p.quantity), unit: p.unit },
      ]),
    );
    detail.pantryMissingCount =
      this.pantryService.countMissingIngredients(lines, pantryMap);
    return detail;
  }

  async cookRecipe(userId: string, id: string): Promise<PantryItem[]> {
    const recipe = await this.findOne(userId, id);
    if (recipe.lifecycleStatus !== RecipeLifecycleStatus.ACTIVE) {
      throw new UnprocessableEntityException(
        'Tylko opublikowany przepis można oznaczyć jako ugotowany',
      );
    }
    const lines = (recipe.ingredients ?? []).map((ri) => ({
      ingredientId: ri.ingredientId,
      quantity: Number(ri.quantity),
      unit: ri.unit,
    }));
    if (lines.length === 0) {
      throw new UnprocessableEntityException(
        'Przepis nie ma składników do odjęcia ze spiżarni',
      );
    }
    if ((recipe.pantryMissingCount ?? lines.length) > 0) {
      throw new UnprocessableEntityException(
        'Nie masz wszystkich składników w spiżarni',
      );
    }
    return this.pantryService.consumeIngredients(userId, lines);
  }

  async create(userId: string, dto: CreateRecipeDto): Promise<Recipe> {
    const recipe = this.recipeRepo.create({
      ...dto,
      userId,
      lifecycleStatus: RecipeLifecycleStatus.DRAFT,
    });
    return this.recipeRepo.save(recipe);
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateRecipeDto,
  ): Promise<Recipe> {
    const recipe = await this.findOne(userId, id);
    Object.assign(recipe, dto);
    return this.recipeRepo.save(recipe);
  }

  async setIngredients(
    userId: string,
    id: string,
    dto: SetIngredientsDto,
  ): Promise<Recipe> {
    await this.findOne(userId, id);
    await this.riRepo.delete({ recipeId: id });
    const lines = dto.ingredients.map((line) =>
      this.riRepo.create({
        recipeId: id,
        ingredientId: line.ingredientId,
        quantity: line.quantity,
        unit: line.unit,
      }),
    );
    await this.riRepo.save(lines);
    return this.findOne(userId, id);
  }

  async transition(
    userId: string,
    id: string,
    to: RecipeLifecycleStatus,
  ): Promise<Recipe> {
    const recipe = await this.findOne(userId, id);
    const allowed = ALLOWED_TRANSITIONS[recipe.lifecycleStatus];
    if (!allowed.includes(to)) {
      throw new UnprocessableEntityException(
        `Cannot transition from ${recipe.lifecycleStatus} to ${to}`,
      );
    }
    if (to === RecipeLifecycleStatus.ACTIVE) {
      const count = await this.riRepo.count({ where: { recipeId: id } });
      if (count === 0)
        throw new UnprocessableEntityException(
          'Cannot publish a recipe with no ingredients',
        );
    }
    recipe.lifecycleStatus = to;
    return this.recipeRepo.save(recipe);
  }

  async remove(userId: string, id: string): Promise<void> {
    const recipe = await this.findOne(userId, id);
    await this.recipeRepo.remove(recipe);
  }
}
