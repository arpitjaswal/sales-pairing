import { IsString, IsOptional, IsNumber, Min, Max, IsDateString, IsArray, IsEnum } from 'class-validator';
import { SessionStatus, SessionCategory } from './create-session.dto';

export class UpdateSessionDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(SessionCategory)
  @IsOptional()
  category?: SessionCategory;

  @IsDateString()
  @IsOptional()
  scheduledAt?: string;

  @IsNumber()
  @Min(15)
  @Max(180)
  @IsOptional()
  duration?: number;

  @IsNumber()
  @Min(2)
  @Max(10)
  @IsOptional()
  maxParticipants?: number;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  objectives?: string[];

  @IsString()
  @IsOptional()
  scenario?: string;

  @IsString()
  @IsOptional()
  script?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  talkingPoints?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  evaluationCriteria?: string[];

  @IsString()
  @IsOptional()
  notes?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @IsEnum(SessionStatus)
  @IsOptional()
  status?: SessionStatus;
}
