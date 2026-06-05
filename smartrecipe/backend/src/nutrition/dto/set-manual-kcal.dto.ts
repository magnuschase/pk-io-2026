import { IsNumber, Max, Min } from 'class-validator';

export class SetManualKcalDto {
  @IsNumber()
  @Min(0)
  @Max(9999)
  kcalPer100g: number;
}
