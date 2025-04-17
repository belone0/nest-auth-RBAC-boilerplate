import { ForbiddenException, Inject, Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport"
import { ExtractJwt, Strategy } from "passport-jwt"
import { Request } from "express";
import { ConfigService } from "@nestjs/config";
import { JwtPayload, JwtPayloadWithRt } from "../types";

@Injectable()
export class RtStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {

    constructor(config: ConfigService) {
        super({
            jwtFromRequest: ExtractJwt.fromExtractors([
                (req) => {
                    return req?.cookies?.refresh_token;
                }
            ]),
            secretOrKey: config.get('RT_SECRET') as string,
            passReqToCallback: true
        })
    }

    validate(req: Request, payload: JwtPayload): JwtPayloadWithRt {
        const refresh_token = req?.cookies?.refresh_token;
        
        if (!refresh_token) {
            throw new ForbiddenException('Refresh token malformed');
        }

        return {
            ...payload,
            refresh_token,
        };
    }


}