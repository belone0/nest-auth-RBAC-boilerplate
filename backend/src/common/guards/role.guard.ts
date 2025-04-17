import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { Permissions } from '../rules/permission.rules';

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(private reflector: Reflector) { }

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const is_public = this.reflector.getAllAndOverride('isPublic', [context.getHandler(), context.getClass()]);
    if (is_public) { return true; }

    const target_actions = this.reflector.getAllAndOverride<string[]>('action', [
      context.getHandler(),
      context.getClass()
    ]);

    if (!target_actions) { return true; }

    const req = context.switchToHttp().getRequest();
    const user = req.user;

    if (!user) { return false; }

    if (!Permissions[user.role]) { return false; }

    const user_permissions = Permissions[user.role];

    const has_permissions = target_actions.some(action => user_permissions.includes(action))

    return has_permissions;
  }
}
