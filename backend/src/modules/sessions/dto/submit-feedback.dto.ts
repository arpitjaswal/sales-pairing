import { IsString, IsNotEmpty, IsOptional, IsNumber, Min, Max, IsArray, IsObject } from 'class-validator';

export class SubmitFeedbackDto {
  @IsNumber()
  @Min(1)
  @Max(5)
  overallRating: number;

  @IsString()
  @IsNotEmpty()
  feedback: string;

  @IsObject()
  @IsOptional()
  skillRatings?: {
    communication?: number;
    presentation?: number;
    objectionHandling?: number;
    closing?: number;
    productKnowledge?: number;
  };

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  strengths?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  areasForImprovement?: string[];

  @IsString()
  @IsOptional()
  suggestions?: string;

  @IsString()
  @IsOptional()
  role?: string; // seller, buyer, observer, coach
}
