import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PantryItem } from '../domain/entities/pantry-item.entity';
import { UnitNormalizationService } from '../shared/unit-normalization.service';
import { UpsertPantryItemDto } from './dto/pantry.dto';

@Injectable()
export class PantryService {
  constructor(
    @InjectRepository(PantryItem)
    private readonly repo: Repository<PantryItem>,
    private readonly units: UnitNormalizationService,
  ) {}

  listPantry(userId: string): Promise<PantryItem[]> {
    return this.repo.find({
      where: { userId },
      relations: { ingredient: true },
      order: { ingredient: { name: 'ASC' } },
    });
  }

  async upsertItem(
    userId: string,
    ingredientId: string,
    dto: UpsertPantryItemDto,
  ): Promise<PantryItem> {
    const mode = dto.mode ?? 'set';
    let item = await this.repo.findOne({ where: { userId, ingredientId } });
    if (item) {
      if (mode === 'add') {
        try {
          item.quantity = this.units.addQuantities(
            Number(item.quantity),
            item.unit,
            dto.quantity,
            dto.unit,
            item.unit,
          );
        } catch {
          throw new BadRequestException(
            'Nie można dodać — jednostki są niezgodne z tym, co już jest w spiżarni',
          );
        }
      } else {
        item.quantity = dto.quantity;
        item.unit = dto.unit;
      }
    } else {
      item = this.repo.create({
        userId,
        ingredientId,
        quantity: dto.quantity,
        unit: dto.unit,
      });
    }
    return this.repo.save(item);
  }

  async removeItem(userId: string, ingredientId: string): Promise<void> {
    const item = await this.repo.findOne({ where: { userId, ingredientId } });
    if (!item) throw new NotFoundException('Pantry item not found');
    await this.repo.remove(item);
  }
}
