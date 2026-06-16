import { IsString, IsNumber, IsOptional } from 'class-validator';

export class CreateBoardColumnsDto {
  @IsString()
  title: string;

  @IsNumber()
  @IsOptional()
  position?: number;
}
