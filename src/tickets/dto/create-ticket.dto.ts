import { IsString, IsNumber, IsOptional, IsEnum } from 'class-validator';
import { Priority } from '../types/priority.enums';

export class CreateTicketDto {
  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @IsOptional()
  assigneeId?: number;

  @IsNumber()
  @IsOptional()
  position?: number;

  @IsEnum(Priority)
  @IsOptional()
  priority?: Priority;
}
