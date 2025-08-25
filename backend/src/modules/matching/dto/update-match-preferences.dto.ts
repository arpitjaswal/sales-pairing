import { IsString, IsOptional, IsArray, IsNumber, Min, Max, IsBoolean } from 'class-validator';

export class UpdateMatchPreferencesDto {
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  preferredCategories?: string[];

  @IsNumber()
  @Min(15)
  @Max(180)
  @IsOptional()
  preferredDuration?: number;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  preferredRoles?: string[];

  @IsBoolean()
  @IsOptional()
  allowRecording?: boolean;

  @IsString()
  @IsOptional()
  timezone?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  availability?: string[];

  @IsString()
  @IsOptional()
  skillLevel?: 'beginner' | 'intermediate' | 'advanced';

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  interests?: string[];
}
