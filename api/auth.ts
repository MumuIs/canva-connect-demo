import type { VercelRequest, VercelResponse } from '@vercel/node';
import { SignJWT } from 'jose';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 设置 CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_URL || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    if (req.method === 'GET' && req.url?.includes('/api/auth/canva')) {
      // Canva OAuth 认证
      const { code, state } = req.query;
      
      if (!code) {
        return res.status(400).json({ error: 'Missing authorization code' });
      }

      // 交换 code 获取 access token
      const tokenResponse = await fetch('https://www.canva.cn/api/oauth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          client_id: process.env.CANVA_CLIENT_ID!,
          client_secret: process.env.CANVA_CLIENT_SECRET!,
          code: code as string,
          redirect_uri: `${process.env.FRONTEND_URL}/return-nav`,
        }),
      });

      if (!tokenResponse.ok) {
        throw new Error('Failed to exchange code for token');
      }

      const tokenData = await tokenResponse.json();
      
      // 创建 JWT token
      const secret = new TextEncoder().encode(process.env.DATABASE_ENCRYPTION_KEY || 'fallback-secret');
      const jwt = await new SignJWT({ access_token: tokenData.access_token })
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime('1h')
        .sign(secret);

      // 设置 cookie 并重定向
      res.setHeader('Set-Cookie', `canva_token=${jwt}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=3600`);
      res.redirect(`${process.env.FRONTEND_URL}/return-nav?success=true`);
      
    } else if (req.method === 'GET' && req.url?.includes('/api/auth/revoke')) {
      // 撤销认证
      res.setHeader('Set-Cookie', 'canva_token=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0');
      res.json({ success: true });
      
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
