import type { VercelRequest, VercelResponse } from '@vercel/node';
import { jwtVerify } from 'jose';

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
    // 验证 JWT token
    const token = req.cookies?.canva_token;
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const secret = new TextEncoder().encode(process.env.DATABASE_ENCRYPTION_KEY || 'fallback-secret');
    const { payload } = await jwtVerify(token, secret);
    const accessToken = (payload as any).access_token;

    if (!accessToken) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    if (req.method === 'GET' && req.url?.includes('/api/user/profile')) {
      // 获取用户配置
      const response = await fetch('https://api.canva.cn/rest/v1/users/me/profile', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch user profile');
      }

      const data = await response.json();
      res.json(data);
      
    } else if (req.method === 'GET' && req.url?.includes('/api/user/capabilities')) {
      // 获取用户能力
      const response = await fetch('https://api.canva.cn/rest/v1/users/me/capabilities', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch user capabilities');
      }

      const data = await response.json();
      res.json(data);
      
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('User API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
