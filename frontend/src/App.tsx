import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Paper, 
  Typography, 
  Button, 
  Box, 
  Alert,
  CircularProgress 
} from '@mui/material';
import { CheckCircle, LinkOff } from '@mui/icons-material';

interface AppState {
  isAuthorized: boolean;
  displayName: string;
  isLoading: boolean;
  error: string | null;
}

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    isAuthorized: false,
    displayName: '',
    isLoading: false,
    error: null
  });

  useEffect(() => {
    // 检查是否已认证
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const response = await fetch('/api/user/profile', {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        setState(prev => ({
          ...prev,
          isAuthorized: true,
          displayName: data.profile?.display_name || 'Demo User'
        }));
      }
    } catch (error) {
      console.log('Not authenticated');
    }
  };

  const handleConnect = async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const clientId = process.env.CANVA_CLIENT_ID || 'OC-AZbW7d5jk2-P';
      const redirectUrl = window.location.origin + '/return-nav';
      
      // 生成 PKCE code challenge
      const codeChallenge = await generateCodeChallenge();
      
      // 生成随机 state
      const state = btoa(crypto.getRandomValues(new Uint8Array(32)).toString())
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
      
      localStorage.setItem('canva_oauth_state', state);
      
      // 正确的 scope 列表
      const scopes = [
        'asset:read',
        'asset:write', 
        'brandtemplate:content:read',
        'brandtemplate:meta:read',
        'design:content:read',
        'design:content:write',
        'design:meta:read',
        'profile:read'
      ];
      
      const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUrl,
        response_type: 'code',
        scope: scopes.join(' '),
        code_challenge: codeChallenge,
        code_challenge_method: 'S256',
        state: state
      });
      
      const authUrl = `https://www.canva.cn/api/oauth/authorize?${params.toString()}`;
      
      // 跳转到认证页面
      window.location.href = authUrl;
      
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to start authorization'
      }));
    }
  };

  const handleDisconnect = async () => {
    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      await fetch('/api/auth/revoke', {
        method: 'GET',
        credentials: 'include',
      });
      
      setState(prev => ({
        ...prev,
        isAuthorized: false,
        displayName: '',
        isLoading: false
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to disconnect'
      }));
    }
  };

  // 生成 PKCE code challenge
  const generateCodeChallenge = async (): Promise<string> => {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    const codeVerifier = btoa(String.fromCharCode.apply(null, Array.from(array)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');

    localStorage.setItem('canva_code_verifier', codeVerifier);

    const encoder = new TextEncoder();
    const data = encoder.encode(codeVerifier);
    const hash = await crypto.subtle.digest('SHA-256', data);
    const hashArray = new Uint8Array(hash);
    return btoa(String.fromCharCode.apply(null, Array.from(hashArray)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h3" component="h1" gutterBottom>
          🎨 Canva Connect API Demo
        </Typography>
        
        <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
          Minimal Version - Full Stack on Vercel
        </Typography>

        {state.error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {state.error}
          </Alert>
        )}

        {state.isAuthorized ? (
          <Box>
            <CheckCircle color="success" sx={{ fontSize: 64, mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              ✅ Connected to Canva
            </Typography>
            <Typography variant="body1" sx={{ mb: 3 }}>
              Welcome, {state.displayName}!
            </Typography>
            <Button
              variant="outlined"
              color="error"
              startIcon={<LinkOff />}
              onClick={handleDisconnect}
              disabled={state.isLoading}
              size="large"
            >
              {state.isLoading ? <CircularProgress size={24} /> : 'Disconnect'}
            </Button>
          </Box>
        ) : (
          <Box>
            <Typography variant="h5" gutterBottom>
              Connect to Canva
            </Typography>
            <Typography variant="body1" sx={{ mb: 3 }}>
              Click the button below to connect your Canva account and start using the API.
            </Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={handleConnect}
              disabled={state.isLoading}
              size="large"
              sx={{ px: 4, py: 1.5 }}
            >
              {state.isLoading ? <CircularProgress size={24} /> : 'Connect to Canva'}
            </Button>
          </Box>
        )}

        <Box sx={{ mt: 4, pt: 3, borderTop: 1, borderColor: 'divider' }}>
          <Typography variant="body2" color="text.secondary">
            This is a minimal demonstration of the Canva Connect API running on Vercel.
            <br />
            Frontend: React + Material-UI | Backend: Vercel Functions
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default App;
