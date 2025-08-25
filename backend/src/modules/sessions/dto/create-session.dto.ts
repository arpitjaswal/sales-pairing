import { IsString, IsNotEmpty, IsOptional, IsNumber, Min, Max, IsDateString, IsArray, IsEnum } from 'class-validator';

export enum SessionStatus {
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export enum SessionCategory {
  SALES_PRESENTATION = 'sales_presentation',
  NEGOTIATION = 'negotiation',
  OBJECTION_HANDLING = 'objection_handling',
  CLOSING = 'closing',
  DISCOVERY = 'discovery',
  DEMO = 'demo',
  FOLLOW_UP = 'follow_up'
}

export enum SessionRole {
  SELLER = 'seller',
  BUYER = 'buyer',
  OBSERVER = 'observer',
  COACH = 'coach'
}

export class CreateSessionDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsEnum(SessionCategory)
  category: SessionCategory;

  @IsDateString()
  scheduledAt: string;

  @IsNumber()
  @Min(15)
  @Max(180)
  duration: number; // in minutes

  @IsNumber()
  @Min(2)
  @Max(10)
  maxParticipants: number;

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
}
