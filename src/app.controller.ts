import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { AppService } from './app.service';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { RolesGuard } from './auth/roles.guard';
import { Roles } from './auth/roles.decorator';
import { Request as ExpressRequest } from 'express';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('protected')
  @UseGuards(JwtAuthGuard)
  getProtected(@Request() req: ExpressRequest) {
    return {
      message: 'Accès autorisé !',
      user: req.user,
    };
  }

  @Get('dashboard')
  @UseGuards(JwtAuthGuard)
  getDashboard(): string {
    return 'Bienvenue sur le dashboard protégé';
  }

  @Get('admin/users')
  @Roles('SUPER_ADMIN') // d'abord le décorateur
  @UseGuards(JwtAuthGuard, RolesGuard) // ensuite les guards
  getAdminUsers(): string {
    return 'Espace SUPER_ADMIN uniquement';
  }
}
