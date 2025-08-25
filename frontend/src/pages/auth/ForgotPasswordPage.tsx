import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Link,
  InputAdornment,
  CircularProgress,
  Alert,
} from '@mui/material';
import { Email } from '@mui/icons-material';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useSnackbar } from 'notistack';

const validationSchema = yup.object({
  email: yup
    .string()
    .email('Enter a valid email')
    .required('Email is required'),
});

const ForgotPasswordPage: React.FC = () => {
  const { forgotPassword } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const formik = useFormik({
    initialValues: {
      email: '',
    },
    validationSchema: validationSchema,
    onSubmit: async (values) => {
      setIsLoading(true);
      try {
        await forgotPassword(values.email);
        setIsSubmitted(true);
        enqueueSnackbar('Password reset email sent!', { variant: 'success' });
      } catch (error: any) {
        enqueueSnackbar(error.message || 'Failed to send reset email', { variant: 'error' });
      } finally {
        setIsLoading(false);
      }
    },
  });

  if (isSubmitted) {
    return (
      <Paper
        elevation={3}
        sx={{
          p: { xs: 3, sm: 6 },
          borderRadius: 3,
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          border: '1px solid rgba(0,0,0,0.05)',
        }}
      >
        <Box sx={{ textAlign: 'center' }}>
          <Typography
            component="h1"
            variant="h4"
            sx={{
              fontWeight: 700,
              mb: 2,
              background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Check Your Email
          </Typography>
          
          <Alert severity="success" sx={{ mb: 3 }}>
            We've sent a password reset link to your email address.
          </Alert>
          
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Click the link in the email to reset your password. The link will expire in 1 hour.
          </Typography>
          
          <Button
            variant="outlined"
            onClick={() => setIsSubmitted(false)}
            sx={{ mr: 2 }}
          >
            Try Another Email
          </Button>
          
          <Button
            component={RouterLink}
            to="/login"
            variant="contained"
            sx={{
              background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #1565c0 0%, #1976d2 100%)',
              },
            }}
          >
            Back to Login
          </Button>
        </Box>
      </Paper>
    );
  }

  return (
    <Paper
      elevation={3}
      sx={{
        p: { xs: 3, sm: 6 },
        borderRadius: 3,
        background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
        border: '1px solid rgba(0,0,0,0.05)',
      }}
    >
      {/* Header */}
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography
          component="h1"
          variant="h4"
          sx={{
            fontWeight: 700,
            mb: 1,
            background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          Forgot Password?
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Enter your email address and we'll send you a link to reset your password.
        </Typography>
      </Box>

      {/* Form */}
      <Box component="form" onSubmit={formik.handleSubmit} noValidate>
        <TextField
          fullWidth
          id="email"
          name="email"
          label="Email Address"
          value={formik.values.email}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.touched.email && Boolean(formik.errors.email)}
          helperText={formik.touched.email && formik.errors.email}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Email color="action" />
              </InputAdornment>
            ),
          }}
          sx={{
            mb: 3,
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
            },
          }}
        />

        <Button
          type="submit"
          fullWidth
          variant="contained"
          disabled={isLoading}
          sx={{
            py: 1.5,
            borderRadius: 2,
            fontSize: '1.1rem',
            fontWeight: 600,
            background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #1565c0 0%, #1976d2 100%)',
              transform: 'translateY(-1px)',
              boxShadow: '0 8px 25px rgba(25, 118, 210, 0.3)',
            },
            transition: 'all 0.3s ease',
          }}
        >
          {isLoading ? (
            <CircularProgress size={24} color="inherit" />
          ) : (
            'Send Reset Link'
          )}
        </Button>
      </Box>

      {/* Links */}
      <Box sx={{ textAlign: 'center', mt: 4 }}>
        <Typography variant="body2" color="text.secondary">
          Remember your password?{' '}
          <Link
            component={RouterLink}
            to="/login"
            sx={{
              textDecoration: 'none',
              color: 'primary.main',
              fontWeight: 600,
              '&:hover': {
                textDecoration: 'underline',
              },
            }}
          >
            Sign in
          </Link>
        </Typography>
      </Box>
    </Paper>
  );
};

export default ForgotPasswordPage;
