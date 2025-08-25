import { IsEmail, IsString, MinLength, MaxLength, Matches, IsOptional, IsIn } from 'class-validator';
import { UserRole, UserExperienceLevel } from '../../users/user.entity';

export class RegisterDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @IsString()
  @MinLength(2, { message: 'First name must be at least 2 characters long' })
  @MaxLength(50, { message: 'First name cannot be longer than 50 characters' })
  firstName: string;

  @IsString()
  @MinLength(2, { message: 'Last name must be at least 2 characters long' })
  @MaxLength(50, { message: 'Last name cannot be longer than 50 characters' })
  lastName: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @MaxLength(100, { message: 'Password cannot be longer than 100 characters' })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/,
    {
      message:
        'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
    }
  )
  password: string;

  @IsOptional()
  @IsString()
  @MaxLength(50, { message: 'Timezone cannot be longer than 50 characters' })
  timezone?: string;

  @IsOptional()
  @IsIn(Object.values(UserRole))
  role?: UserRole;

  @IsOptional()
  @IsIn(Object.values(UserExperienceLevel))
  experienceLevel?: UserExperienceLevel;

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Bio cannot be longer than 500 characters' })
  bio?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'Job title cannot be longer than 100 characters' })
  jobTitle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'Company cannot be longer than 100 characters' })
  company?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200, { message: 'Profile image URL cannot be longer than 200 characters' })
  profileImageUrl?: string;
}
