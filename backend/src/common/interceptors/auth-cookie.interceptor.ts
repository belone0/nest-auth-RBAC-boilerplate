import { Injectable, NestInterceptor, ExecutionContext, CallHandler, } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Response } from 'express';

@Injectable()
export class AuthCookieInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const ctx = context.switchToHttp();
        const response = ctx.getResponse<Response>();

        return next.handle().pipe(
            map((data) => {
                if (!data) {
                    return data;
                }

                // 1) If we have tokens, set them as cookies
                if (data.access_token && data.refresh_token) {
                    
                    response.cookie('access_token', data.access_token, {
                        httpOnly: true,
                        secure: process.env.NODE_ENV === 'production',
                        sameSite: 'strict',
                        maxAge: 15 * 60 * 1000,
                    });

                    response.cookie('refresh_token', data.refresh_token, {
                        httpOnly: true,
                        secure: process.env.NODE_ENV === 'production',
                        sameSite: 'strict',
                        maxAge: 7 * 24 * 60 * 60 * 1000
                    });

                    delete data.access_token;
                    delete data.refresh_token;

                    return {
                        ...data,
                        message: data.message || 'Tokens set.',
                    };
                }

                // 2) If this is a logout action (or if data.logout === true), clear cookies
                if (data.logout) {
                    response.clearCookie('access_token');
                    response.clearCookie('refresh_token');
                    return { message: 'Logged out.' };
                }

                // Otherwise, just return data as is
                return data;
            }),
        );
    }
}
