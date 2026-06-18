import { IsNumber, IsString } from 'class-validator';

export class InviteDto {
  @IsString()
  email: string;
}
