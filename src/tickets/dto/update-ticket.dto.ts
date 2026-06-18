import { IsString, IsNumber, IsOptional, IsEnum } from 'class-validator';
import { Priority } from '../types/priority.enums';

export class UpdateTicketDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @IsOptional()
  assigneeId?: number;

  @IsNumber()
  @IsOptional()
  position?: number;

  @IsNumber()
  @IsOptional()
  columnId?: number;

  @IsEnum(Priority)
  @IsOptional()
  priority?: Priority;
}
