import { PrismaClient } from '@prisma/client';
import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
export const prisma = new PrismaClient();
const secret = new TextEncoder().encode(process.env.SESSION_SECRET || 'development-secret-change-me');
const isSecure = process.env.COOKIE_SECURE === 'true';

export async function setSession(userId: string, sessionVersion: number = 0) {
  const token = await new SignJWT({ userId, sessionVersion })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1y')
    .sign(secret);
  (await cookies()).set('session', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: isSecure,
    maxAge: 60 * 60 * 24 * 365,
    path: '/',
  });
}

export async function clearSession() {
  (await cookies()).set('session', '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: isSecure,
    maxAge: 0,
    path: '/',
  });
}
export async function getSession(){const token=(await cookies()).get('session')?.value;if(!token)return null;try{const {payload}=await jwtVerify(token,secret);const id=String(payload.userId);const version=Number(payload.sessionVersion||0);const user=await prisma.user.findUnique({where:{id}});if(!user||!user.isActive||user.sessionVersion!==version)return null;return user;}catch{return null;}}
export async function requireUser(){const user=await getSession();if(!user)throw new Error('UNAUTHORIZED');return user;}
export async function requireAdmin(){const user=await requireUser();if(user.role!=='ADMIN')throw new Error('FORBIDDEN');return user;}
