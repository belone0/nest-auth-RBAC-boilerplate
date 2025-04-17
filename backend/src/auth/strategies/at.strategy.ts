import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport"
import { ExtractJwt, Strategy } from "passport-jwt"
import { JwtPayload } from "../types";

@Injectable()
export class AtStrategy extends PassportStrategy(Strategy, 'jwt') {

    constructor(config: ConfigService) {
        super({
            jwtFromRequest: ExtractJwt.fromExtractors([
                (req) => {                    
                    return req?.cookies?.access_token;
                }
            ]),
            secretOrKey: config.get('AT_SECRET') as string
        })
    }

    validate(payload: JwtPayload) {
        
        return payload;
    }

}