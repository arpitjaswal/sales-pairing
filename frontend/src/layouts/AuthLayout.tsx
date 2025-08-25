import React from 'react';
import { Box, Container, Typography, Link } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

interface AuthLayoutProps {
  children: React.ReactNode;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background decoration */}
      <Box
        sx={{
          position: 'absolute',
          top: -100,
          right: -100,
          width: 300,
          height: 300,
          background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
          borderRadius: '50%',
          filter: 'blur(60px)',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: -100,
          left: -100,
          width: 400,
          height: 400,
          background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
          borderRadius: '50%',
          filter: 'blur(80px)',
        }}
      />

      {/* Header */}
      <Box sx={{ p: 3, position: 'relative', zIndex: 2 }}>
        <Link
          component={RouterLink}
          to="/"
          sx={{
            textDecoration: 'none',
            color: 'white',
            display: 'inline-flex',
            alignItems: 'center',
          }}
        >
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              background: 'linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            SalesPair Pro
          </Typography>
        </Link>
      </Box>

      {/* Main Content */}
      <Container
        component="main"
        maxWidth="sm"
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          position: 'relative',
          zIndex: 2,
        }}
      >
        {children}
      </Container>

      {/* Footer */}
      <Box
        sx={{
          p: 3,
          textAlign: 'center',
          color: 'rgba(255,255,255,0.8)',
          position: 'relative',
          zIndex: 2,
        }}
      >
        <Typography variant="body2">
          © 2024 SalesPair Pro. All rights reserved.
        </Typography>
        <Box sx={{ mt: 1 }}>
          <Link
            href="#"
            sx={{
              color: 'rgba(255,255,255,0.8)',
              textDecoration: 'none',
              mx: 1,
              '&:hover': {
                color: 'white',
              },
            }}
          >
            Privacy Policy
          </Link>
          <Link
            href="#"
            sx={{
              color: 'rgba(255,255,255,0.8)',
              textDecoration: 'none',
              mx: 1,
              '&:hover': {
                color: 'white',
              },
            }}
          >
            Terms of Service
          </Link>
        </Box>
      </Box>
    </Box>
  );
};

export default AuthLayout;
