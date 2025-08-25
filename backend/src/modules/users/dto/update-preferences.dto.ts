import { IsOptional, IsBoolean, IsString, IsArray, IsNumber, Min, Max } from 'class-validator';

export class UpdatePreferencesDto {
  @IsOptional()
  @IsBoolean()
  emailNotifications?: boolean;

  @IsOptional()
  @IsBoolean()
  pushNotifications?: boolean;

  @IsOptional()
  @IsBoolean()
  smsNotifications?: boolean;

  @IsOptional()
  @IsString()
  language?: string;

  @IsOptional()
  @IsString()
  theme?: 'light' | 'dark' | 'auto';

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  preferredTopics?: string[];

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  sessionDuration?: number; // in minutes

  @IsOptional()
  @IsBoolean()
  autoJoinSessions?: boolean;

  @IsOptional()
  @IsBoolean()
  allowRecording?: boolean;

  @IsOptional()
  @IsBoolean()
  publicProfile?: boolean;

  @IsOptional()
  @IsString()
  availabilityStatus?: 'available' | 'busy' | 'away' | 'offline';
}
