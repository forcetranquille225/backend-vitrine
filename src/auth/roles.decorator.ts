import { SetMetadata } from '@nestjs/common';
import { Role } from '../../generated/prisma'; // ou le chemin correct selon ton arborescence

export const ROLES_KEY = 'roles';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
