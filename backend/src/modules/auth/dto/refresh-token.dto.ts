import { IsString, MinLength } from 'class-validator';

export class RefreshTokenDto {
  @IsString({ message: 'Refresh token is required' })
  @MinLength(1, { message: 'Refresh token cannot be empty' })
  refreshToken: string;
}
