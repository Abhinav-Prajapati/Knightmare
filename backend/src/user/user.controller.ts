import {
  Body,
  Controller,
  Get,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { User } from '@prisma/client';
import { UserDto, UserSignInDto } from './dto/user_dto';
import { AuthGuard } from './auth.guard';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) { }

  @Post('register')
  async createUser(@Body() userData: UserDto): Promise<User> {
    return this.userService.createUser(userData);
  }

  @Get('signin')
  async getUser(@Body() signInData: UserSignInDto) {
    return this.userService.signIn(signInData);
  }

  @UseGuards(AuthGuard)
  @Get('profile')
  async getUserProfile(@Request() req) {
    return this.userService.getUserProfile(req.id);
  }
}
