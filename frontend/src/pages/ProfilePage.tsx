import React, { useState } from 'react';
import {
  Box,
  Container,

  Card,
  CardContent,
  Typography,
  Avatar,
  Button,
  TextField,
  Stack,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
} from '@mui/material';
import {
  Edit,
  Save,
  Cancel,
  PhotoCamera,
  Email,
  Phone,
  LocationOn,
  Business,
  Person,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useSnackbar } from 'notistack';
import { motion } from 'framer-motion';

const ProfilePage: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [avatarDialogOpen, setAvatarDialogOpen] = useState(false);

  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    company: user?.company || '',
    location: user?.location || '',
    bio: user?.bio || '',
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await updateProfile(formData);
      setIsEditing(false);
      enqueueSnackbar('Profile updated successfully!', { variant: 'success' });
    } catch (error: any) {
      enqueueSnackbar(error.message || 'Failed to update profile', { variant: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      phone: user?.phone || '',
      company: user?.company || '',
      location: user?.location || '',
      bio: user?.bio || '',
    });
    setIsEditing(false);
  };

  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // TODO: Implement avatar upload
      enqueueSnackbar('Avatar upload coming soon!', { variant: 'info' });
    }
    setAvatarDialogOpen(false);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 4 }}>
          Profile
        </Typography>

        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
          {/* Profile Header */}
          <Box sx={{ flex: "1 1 100%" }}>
            <Card>
              <CardContent sx={{ p: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <Box sx={{ position: 'relative', mr: 3 }}>
                    <Avatar
                      src={user?.avatar}
                      sx={{
                        width: 120,
                        height: 120,
                        fontSize: '3rem',
                        bgcolor: 'primary.main',
                      }}
                    >
                      {user?.firstName?.[0]}{user?.lastName?.[0]}
                    </Avatar>
                    <IconButton
                      sx={{
                        position: 'absolute',
                        bottom: 0,
                        right: 0,
                        bgcolor: 'primary.main',
                        color: 'white',
                        '&:hover': {
                          bgcolor: 'primary.dark',
                        },
                      }}
                      onClick={() => setAvatarDialogOpen(true)}
                    >
                      <PhotoCamera />
                    </IconButton>
                  </Box>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
                      {user?.firstName} {user?.lastName}
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                      {user?.email}
                    </Typography>
                    <Stack direction="row" spacing={1}>
                      <Chip
                        label={user?.role || 'User'}
                        color="primary"
                        size="small"
                      />
                      <Chip
                        label={user?.isEmailVerified ? 'Verified' : 'Unverified'}
                        color={user?.isEmailVerified ? 'success' : 'warning'}
                        size="small"
                      />
                    </Stack>
                  </Box>
                  <Button
                    variant={isEditing ? 'outlined' : 'contained'}
                    startIcon={isEditing ? <Cancel /> : <Edit />}
                    onClick={isEditing ? handleCancel : () => setIsEditing(true)}
                    sx={{
                      background: isEditing ? 'transparent' : 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
                      '&:hover': {
                        background: isEditing ? 'rgba(0,0,0,0.04)' : 'linear-gradient(135deg, #1565c0 0%, #1976d2 100%)',
                      },
                    }}
                  >
                    {isEditing ? 'Cancel' : 'Edit Profile'}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Box>

          {/* Profile Details */}
          <Box sx={{ flex: { xs: "1 1 100%", md: "0 0 calc(66.67% - 8px)" } }}>
            <Card>
              <CardContent sx={{ p: 4 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                  Personal Information
                </Typography>

                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
                                     <Box sx={{ flex: { xs: "1 1 100%", sm: "0 0 50%" } }}>
                    <TextField
                      fullWidth
                      label="First Name"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      disabled={!isEditing}
                      InputProps={{
                        startAdornment: (
                          <Person sx={{ mr: 1, color: 'action.active' }} />
                        ),
                      }}
                    />
                  </Box>
                                     <Box sx={{ flex: { xs: "1 1 100%", sm: "0 0 50%" } }}>
                    <TextField
                      fullWidth
                      label="Last Name"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      disabled={!isEditing}
                      InputProps={{
                        startAdornment: (
                          <Person sx={{ mr: 1, color: 'action.active' }} />
                        ),
                      }}
                    />
                  </Box>
                  <Box sx={{ flex: "1 1 100%" }}>
                    <TextField
                      fullWidth
                      label="Email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      disabled={!isEditing}
                      InputProps={{
                        startAdornment: (
                          <Email sx={{ mr: 1, color: 'action.active' }} />
                        ),
                      }}
                    />
                  </Box>
                                     <Box sx={{ flex: { xs: "1 1 100%", sm: "0 0 50%" } }}>
                    <TextField
                      fullWidth
                      label="Phone"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      disabled={!isEditing}
                      InputProps={{
                        startAdornment: (
                          <Phone sx={{ mr: 1, color: 'action.active' }} />
                        ),
                      }}
                    />
                  </Box>
                                     <Box sx={{ flex: { xs: "1 1 100%", sm: "0 0 50%" } }}>
                    <TextField
                      fullWidth
                      label="Company"
                      value={formData.company}
                      onChange={(e) => handleInputChange('company', e.target.value)}
                      disabled={!isEditing}
                      InputProps={{
                        startAdornment: (
                          <Business sx={{ mr: 1, color: 'action.active' }} />
                        ),
                      }}
                    />
                  </Box>
                  <Box sx={{ flex: "1 1 100%" }}>
                    <TextField
                      fullWidth
                      label="Location"
                      value={formData.location}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                      disabled={!isEditing}
                      InputProps={{
                        startAdornment: (
                          <LocationOn sx={{ mr: 1, color: 'action.active' }} />
                        ),
                      }}
                    />
                  </Box>
                  <Box sx={{ flex: "1 1 100%" }}>
                    <TextField
                      fullWidth
                      label="Bio"
                      value={formData.bio}
                      onChange={(e) => handleInputChange('bio', e.target.value)}
                      disabled={!isEditing}
                      multiline
                      rows={4}
                      placeholder="Tell us about yourself..."
                    />
                  </Box>
                </Box>

                {isEditing && (
                  <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                    <Button
                      variant="contained"
                      startIcon={isLoading ? <CircularProgress size={20} /> : <Save />}
                      onClick={handleSave}
                      disabled={isLoading}
                      sx={{
                        background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #1565c0 0%, #1976d2 100%)',
                        },
                      }}
                    >
                      {isLoading ? 'Saving...' : 'Save Changes'}
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={handleCancel}
                      disabled={isLoading}
                    >
                      Cancel
                    </Button>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Box>

          {/* Sidebar */}
          <Box sx={{ flex: { xs: "1 1 100%", md: "0 0 calc(33.33% - 16px)" } }}>
            <Stack spacing={3}>
              {/* Account Stats */}
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                    Account Statistics
                  </Typography>
                  <Stack spacing={2}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">
                        Member Since
                      </Typography>
                      <Typography variant="body2" fontWeight={500}>
                        {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">
                        Last Updated
                      </Typography>
                      <Typography variant="body2" fontWeight={500}>
                        {user?.updatedAt ? new Date(user.updatedAt).toLocaleDateString() : 'N/A'}
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                    Quick Actions
                  </Typography>
                  <Stack spacing={2}>
                    <Button
                      variant="outlined"
                      fullWidth
                      onClick={() => {/* TODO: Navigate to change password */}}
                    >
                      Change Password
                    </Button>
                    <Button
                      variant="outlined"
                      fullWidth
                      onClick={() => {/* TODO: Navigate to preferences */}}
                    >
                      Preferences
                    </Button>
                    <Button
                      variant="outlined"
                      fullWidth
                      onClick={() => {/* TODO: Navigate to notifications */}}
                    >
                      Notification Settings
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            </Stack>
          </Box>
        </Box>
      </motion.div>

      {/* Avatar Upload Dialog */}
      <Dialog open={avatarDialogOpen} onClose={() => setAvatarDialogOpen(false)}>
        <DialogTitle>Update Profile Picture</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Choose a new profile picture from your device.
          </Typography>
          <input
            accept="image/*"
            style={{ display: 'none' }}
            id="avatar-upload"
            type="file"
            onChange={handleAvatarUpload}
          />
          <label htmlFor="avatar-upload">
            <Button variant="contained" component="span" fullWidth>
              Choose File
            </Button>
          </label>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAvatarDialogOpen(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ProfilePage;
