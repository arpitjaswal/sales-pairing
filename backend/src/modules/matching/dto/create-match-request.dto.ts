import { IsString, IsNotEmpty, IsOptional, IsArray, IsEnum, IsNumber, Min, Max } from 'class-validator';

export enum MatchRequestStatus {
  PENDING = 'pending',
  MATCHED = 'matched',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired'
}

export enum MatchRequestType {
  INSTANT = 'instant',
  SCHEDULED = 'scheduled'
}

export class CreateMatchRequestDto {
  @IsEnum(MatchRequestType)
  type: MatchRequestType;

  @IsString()
  @IsOptional()
  scheduledAt?: string;

  @IsNumber()
  @Min(15)
  @Max(180)
  duration: number; // in minutes

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  preferredCategories?: string[];

  @IsString()
  @IsOptional()
  notes?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];
}
