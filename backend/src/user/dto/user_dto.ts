import { IsEmail, IsOptional, IsString } from 'class-validator';
export class UserDto {
  @IsString()
  user_name: string;

  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  password_hash: string;

  @IsOptional()
  is_active?: boolean;

  @IsOptional()
  role?: string;
}

export class UserSignInDto {
  @IsString()
  username: string;

  @IsString()
  password: string;
}
