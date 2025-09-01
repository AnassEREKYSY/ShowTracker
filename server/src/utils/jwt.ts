import jwt, { SignOptions } from 'jsonwebtoken';

const ACCESS_SECRET  = process.env.JWT_ACCESS_SECRET ?? '';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET ?? '';

const ACCESS_EXPIRES: SignOptions['expiresIn']  =
  (process.env.ACCESS_TOKEN_EXPIRES ?? '15m') as SignOptions['expiresIn'];
const REFRESH_EXPIRES: SignOptions['expiresIn'] =
  (process.env.REFRESH_TOKEN_EXPIRES ?? '7d')  as SignOptions['expiresIn'];

export type JwtPayload = { sub: string; tv: number };

export function signAccessToken(userId: string, tokenVersion=0) {
  return jwt.sign({ sub: userId, tv: tokenVersion }, ACCESS_SECRET, { expiresIn: ACCESS_EXPIRES });
}

export function signRefreshToken(userId: string, tokenVersion=0) {
  return jwt.sign({ sub: userId, tv: tokenVersion }, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRES });
}

export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, ACCESS_SECRET) as JwtPayload;
}

export function verifyRefreshToken(token: string): JwtPayload {
  return jwt.verify(token, REFRESH_SECRET) as JwtPayload;
}
