import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  InputAdornment,
  IconButton,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Lock,
} from '@mui/icons-material';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useSnackbar } from 'notistack';

const validationSchema = yup.object({
  password: yup
    .string()
    .min(8, 'Password should be of minimum 8 characters length')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    )
    .required('Password is required'),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('password')], 'Passwords must match')
    .required('Confirm password is required'),
});

const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { resetPassword } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const token = searchParams.get('token');

  const formik = useFormik({
    initialValues: {
      password: '',
      confirmPassword: '',
    },
    validationSchema: validationSchema,
    onSubmit: async (values) => {
      if (!token) {
        enqueueSnackbar('Invalid reset token', { variant: 'error' });
        return;
      }

      setIsLoading(true);
      try {
        await resetPassword(token, values.password);
        setIsSuccess(true);
        enqueueSnackbar('Password reset successfully!', { variant: 'success' });
      } catch (error: any) {
        enqueueSnackbar(error.message || 'Failed to reset password', { variant: 'error' });
      } finally {
        setIsLoading(false);
      }
    },
  });

  if (!token) {
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
              color: 'error.main',
            }}
          >
            Invalid Reset Link
          </Typography>
          
          <Alert severity="error" sx={{ mb: 3 }}>
            The password reset link is invalid or has expired.
          </Alert>
          
          <Button
            variant="contained"
            onClick={() => navigate('/forgot-password')}
            sx={{
              background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #1565c0 0%, #1976d2 100%)',
              },
            }}
          >
            Request New Reset Link
          </Button>
        </Box>
      </Paper>
    );
  }

  if (isSuccess) {
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
            Password Reset Successfully!
          </Typography>
          
          <Alert severity="success" sx={{ mb: 3 }}>
            Your password has been reset successfully.
          </Alert>
          
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            You can now sign in with your new password.
          </Typography>
          
          <Button
            variant="contained"
            onClick={() => navigate('/login')}
            sx={{
              background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #1565c0 0%, #1976d2 100%)',
              },
            }}
          >
            Sign In
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
          Reset Your Password
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Enter your new password below.
        </Typography>
      </Box>

      {/* Form */}
      <Box component="form" onSubmit={formik.handleSubmit} noValidate>
        <TextField
          fullWidth
          id="password"
          name="password"
          label="New Password"
          type={showPassword ? 'text' : 'password'}
          value={formik.values.password}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.touched.password && Boolean(formik.errors.password)}
          helperText={formik.touched.password && formik.errors.password}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Lock color="action" />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  aria-label="toggle password visibility"
                  onClick={() => setShowPassword(!showPassword)}
                  edge="end"
                >
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
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

        <TextField
          fullWidth
          id="confirmPassword"
          name="confirmPassword"
          label="Confirm New Password"
          type={showConfirmPassword ? 'text' : 'password'}
          value={formik.values.confirmPassword}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.touched.confirmPassword && Boolean(formik.errors.confirmPassword)}
          helperText={formik.touched.confirmPassword && formik.errors.confirmPassword}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Lock color="action" />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  aria-label="toggle confirm password visibility"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  edge="end"
                >
                  {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
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
            'Reset Password'
          )}
        </Button>
      </Box>
    </Paper>
  );
};

export default ResetPasswordPage;
