import { JwtPayload } from '.';

export type JwtPayloadWithRt = JwtPayload & { refresh_token: string };