import { PassportStrategy } from '@nestjs/passport';
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { JwtConfig } from '../configs/jwt.config';
import { IAM_DI_TOKENS } from '../constants';

export interface PassportJwtPayload {
  userId: string;
  accountId: string;
  email: string;
  provider: string;
  jti: string;
}

@Injectable()
export class JwtAccessStrategy extends PassportStrategy(Strategy, 'jwt-access') {
  constructor(@Inject(IAM_DI_TOKENS.CONFIGS.JWT) config: JwtConfig) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.jwtSecret,
      algorithms: [config.jwtAlgorithm],
    });
  }

  async validate(payload: PassportJwtPayload): Promise<PassportJwtPayload> {
    if (!payload.userId || !payload.email || !payload.accountId) {
      throw new UnauthorizedException('Invalid token payload');
    }
    return payload;
  }
}

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(@Inject(IAM_DI_TOKENS.CONFIGS.JWT) config: JwtConfig) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.jwtSecret,
      algorithms: [config.jwtAlgorithm],
    });
  }

  async validate(payload: PassportJwtPayload): Promise<PassportJwtPayload> {
    if (!payload.userId || !payload.jti || !payload.accountId) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    return payload;
  }
}
