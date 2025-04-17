// auth.controller.ts
import { Controller, Post, Body, HttpStatus, HttpCode, UseGuards, UseInterceptors } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthDto } from './dto';
import { Tokens } from './types';
import { RtGuard } from 'src/common/guards';
import { getCurrentUser, getCurrentUserId, Public } from 'src/common/decorators';
import { AuthCookieInterceptor } from 'src/common/interceptors';
@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    @Public()
    @Post('signup')
    @HttpCode(HttpStatus.CREATED)
    @UseInterceptors(AuthCookieInterceptor)
    signupLocal(@Body() dto: AuthDto): Promise<Tokens> {
        // Return the tokens from the service
        return this.authService.signupLocal(dto);
    }

    @Public()
    @Post('signin')
    @HttpCode(HttpStatus.OK)
    @UseInterceptors(AuthCookieInterceptor)
    signinLocal(@Body() dto: AuthDto): Promise<Tokens> {
        return this.authService.signinLocal(dto);
    }

    @Post('logout')
    @HttpCode(HttpStatus.OK)
    @UseInterceptors(AuthCookieInterceptor)
    async logout(@getCurrentUserId() user_id: number) {
        return await this.authService.logout(user_id);
    }

    @Public()
    //not public, this is just for overriding the ATGUARD so that this method can use RT
    @UseGuards(RtGuard)
    @Post('refresh')
    @HttpCode(HttpStatus.OK)
    @UseInterceptors(AuthCookieInterceptor)
    refreshTokens(
        @getCurrentUserId() user_id: number,
        @getCurrentUser('refresh_token') refresh_token: string,
    ): Promise<Tokens> {
        return this.authService.refreshTokens(user_id, refresh_token);
    }
}
