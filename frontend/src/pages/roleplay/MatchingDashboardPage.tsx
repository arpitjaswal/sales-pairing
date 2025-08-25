import React, { useState } from 'react';
import {
  Box,

  Card,
  CardContent,
  Typography,
  Button,
  Avatar,
  Chip,
  IconButton,
  Badge,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Switch,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Stack,
  Paper,
  Snackbar,
} from '@mui/material';
import {
  People as PeopleIcon,
  PlayArrow as PlayArrowIcon,
  Shuffle as ShuffleIcon,

  Star as StarIcon,
  EmojiEvents as EmojiEventsIcon,
  Settings as SettingsIcon,
  Notifications as NotificationsIcon,
  Chat as ChatIcon,

} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useMatching } from '../../contexts/MatchingContext';


const MatchingDashboardPage: React.FC = () => {
  // Request notification permissions on component mount
  React.useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Check WebSocket connection status
  React.useEffect(() => {
    const checkConnection = () => {
      const socket = (window as any).websocketService?.getSocket();
      setIsConnected(socket?.connected || false);
    };
    
    checkConnection();
    const interval = setInterval(checkConnection, 2000);
    
    return () => clearInterval(interval);
  }, []);


  const {
    isAvailable,
    setIsAvailable,
    onlineUsers,
    userPreferences,
    updatePreferences,
    currentMatchRequest,
    startRandomMatching,
    inviteUser,
    cancelMatching,
    userStats,
    leaderboard,
    pendingInvitations,
    sessionUserId,
  } = useMatching();
  
  const [showPreferences, setShowPreferences] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [isConnected, setIsConnected] = useState(false);



  const handleStartRandomMatching = async () => {
    if (!isAvailable) {
      setNotification({ message: 'Please set yourself as available first', type: 'error' });
      return;
    }
    
    try {
      await startRandomMatching();
      setNotification({ message: 'Looking for a match...', type: 'info' });
    } catch (error) {
      setNotification({ message: 'Failed to start matching', type: 'error' });
    }
  };

  const handleInviteUser = async (userId: string) => {
    if (!isAvailable) {
      setNotification({ message: 'Please set yourself as available first', type: 'error' });
      return;
    }
    
    try {
      console.log('Sending invitation to user:', userId);
      await inviteUser(userId);
      setNotification({ message: 'Invitation sent!', type: 'success' });
    } catch (error) {
      console.error('Error sending invitation:', error);
      setNotification({ message: 'Failed to send invitation', type: 'error' });
    }
  };



  const getSkillLevelColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'success';
      case 'intermediate': return 'warning';
      case 'advanced': return 'error';
      default: return 'default';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Typography variant="h4" fontWeight="bold">
                Sales Practice Matching
              </Typography>
              <Chip
                label={isConnected ? 'Connected' : 'Disconnected'}
                color={isConnected ? 'success' : 'error'}
                size="small"
                icon={isConnected ? <NotificationsIcon /> : <NotificationsIcon />}
              />
            </Box>
            <Typography variant="body1" color="text.secondary">
              Connect with other sales professionals for real-time practice
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Available
              </Typography>
              <Switch
                checked={isAvailable}
                onChange={(e) => setIsAvailable(e.target.checked)}
                color="success"
              />
            </Box>
            
            <IconButton onClick={() => setShowPreferences(true)}>
              <SettingsIcon />
            </IconButton>
            
            <IconButton>
              <Badge badgeContent={pendingInvitations.length} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>
          </Box>
        </Box>
      </motion.div>

      <Stack spacing={3}>
        <Stack direction="row" spacing={3} sx={{ flexWrap: 'wrap' }}>
          {/* Quick Match */}
          <Card sx={{ flex: 1, minWidth: 300 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PlayArrowIcon color="primary" />
                Quick Match
              </Typography>
              
              <Stack spacing={2} sx={{ mt: 2 }}>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<ShuffleIcon />}
                  onClick={handleStartRandomMatching}
                  disabled={!isAvailable || !!currentMatchRequest}
                  fullWidth
                  sx={{ py: 1.5 }}
                >
                  {currentMatchRequest ? 'Finding Match...' : 'One-Click Match'}
                </Button>
                
                {currentMatchRequest && (
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={cancelMatching}
                    fullWidth
                  >
                    Cancel
                  </Button>
                )}
                
                <Alert severity="info">
                  <Typography variant="body2">
                    <strong>Your Preferences:</strong>
                    <br />• {userPreferences.sessionLength} minutes
                    <br />• {userPreferences.skillLevel} level
                    <br />• {userPreferences.preferredSkillLevel} partners
                  </Typography>
                </Alert>
              </Stack>
            </CardContent>
          </Card>

          {/* Online Users */}
          <Card sx={{ flex: 1, minWidth: 300 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PeopleIcon color="primary" />
                Online Now
                <Chip 
                  label={onlineUsers.filter(u => u.isAvailable).length} 
                  size="small" 
                  color="primary" 
                />
              </Typography>
              
              <List sx={{ mt: 1 }}>
                {onlineUsers
                  .filter(user => {
                    console.log('Filtering user:', user.id, 'current session user:', sessionUserId);
                    return user.id !== sessionUserId;
                  }) // Filter out current user
                  .slice(0, 4)
                  .map((user) => (
                  <ListItem key={user.id} sx={{ px: 0 }}>
                    <ListItemAvatar>
                      <Badge
                        overlap="circular"
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                        badgeContent={
                          <Box
                            sx={{
                              width: 12,
                              height: 12,
                              borderRadius: '50%',
                              bgcolor: user.isAvailable ? 'success.main' : 'grey.400',
                              border: '2px solid white',
                            }}
                          />
                        }
                      >
                        <Avatar src={user.avatar} alt={user.name} />
                      </Badge>
                    </ListItemAvatar>
                                                    <ListItemText
                                  primary={user.name}
                                  secondary={
                                    <Box component="span">
                                      <Box component="span" sx={{ display: 'block' }}>
                                        {user.role} • {user.practiceCount} sessions
                                      </Box>
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                        <StarIcon sx={{ fontSize: 16, color: 'warning.main' }} />
                                        <Box component="span">
                                          {user.rating} • {user.streak} day streak
                                        </Box>
                                      </Box>
                                      <Chip
                                        label={user.skillLevel}
                                        size="small"
                                        color={getSkillLevelColor(user.skillLevel) as any}
                                        sx={{ mt: 0.5 }}
                                      />
                                    </Box>
                                  }
                                />
                    {user.isAvailable && (
                      <IconButton
                        onClick={() => handleInviteUser(user.id)}
                        color="primary"
                        size="small"
                      >
                        <ChatIcon />
                      </IconButton>
                    )}
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>

          {/* Leaderboard */}
          <Card sx={{ flex: 1, minWidth: 300 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <EmojiEventsIcon color="primary" />
                Leaderboard
              </Typography>
              
              <List sx={{ mt: 1 }}>
                {leaderboard.slice(0, 5).map((player, index) => (
                  <ListItem key={player.userId} sx={{ px: 0 }}>
                    <ListItemAvatar>
                      <Avatar
                        sx={{
                          bgcolor: index === 0 ? 'warning.main' : 
                                 index === 1 ? 'grey.400' : 
                                 index === 2 ? 'orange.700' : 'primary.main',
                          width: 32,
                          height: 32,
                          fontSize: '0.875rem',
                        }}
                      >
                        {index + 1}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={player.name}
                      secondary={
                        <Typography variant="body2" color="text.secondary">
                          {player.totalSessions} sessions • {player.averageRating.toFixed(1)}⭐ • {player.currentStreak}🔥
                        </Typography>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Stack>

        {/* Your Stats */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Your Practice Stats
            </Typography>
            
            <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap' }}>
              <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'primary.light', color: 'white', flex: 1, minWidth: 200 }}>
                <Typography variant="h4" fontWeight="bold">
                  {userStats.totalSessions}
                </Typography>
                <Typography variant="body2">
                  Total Sessions
                </Typography>
              </Paper>
              
              <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'error.light', color: 'white', flex: 1, minWidth: 200 }}>
                <Typography variant="h4" fontWeight="bold">
                  {userStats.currentStreak}
                </Typography>
                <Typography variant="body2">
                  Day Streak
                </Typography>
              </Paper>
              
              <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'warning.light', color: 'white', flex: 1, minWidth: 200 }}>
                <Typography variant="h4" fontWeight="bold">
                  {userStats.totalPracticeTime}m
                </Typography>
                <Typography variant="body2">
                  Practice Time
                </Typography>
              </Paper>
              
              <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'success.light', color: 'white', flex: 1, minWidth: 200 }}>
                <Typography variant="h4" fontWeight="bold">
                  {userStats.averageRating.toFixed(1)}
                </Typography>
                <Typography variant="body2">
                  Avg Rating
                </Typography>
              </Paper>
            </Stack>
          </CardContent>
        </Card>
      </Stack>

      {/* Preferences Dialog */}
      <Dialog 
        open={showPreferences} 
        onClose={() => setShowPreferences(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Practice Preferences</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Your Skill Level</InputLabel>
              <Select
                value={userPreferences.skillLevel}
                onChange={(e) => updatePreferences({ skillLevel: e.target.value as any })}
                label="Your Skill Level"
              >
                <MenuItem value="beginner">Beginner</MenuItem>
                <MenuItem value="intermediate">Intermediate</MenuItem>
                <MenuItem value="advanced">Advanced</MenuItem>
              </Select>
            </FormControl>
            
            <FormControl fullWidth>
              <InputLabel>Preferred Partner Level</InputLabel>
              <Select
                value={userPreferences.preferredSkillLevel}
                onChange={(e) => updatePreferences({ preferredSkillLevel: e.target.value as any })}
                label="Preferred Partner Level"
              >
                <MenuItem value="any">Any Level</MenuItem>
                <MenuItem value="similar">Similar Level</MenuItem>
                <MenuItem value="advanced">More Advanced</MenuItem>
              </Select>
            </FormControl>
            
            <FormControl fullWidth>
              <InputLabel>Session Length</InputLabel>
              <Select
                value={userPreferences.sessionLength}
                onChange={(e) => updatePreferences({ sessionLength: e.target.value as number })}
                label="Session Length"
              >
                <MenuItem value={10}>10 minutes</MenuItem>
                <MenuItem value={15}>15 minutes</MenuItem>
                <MenuItem value={20}>20 minutes</MenuItem>
                <MenuItem value={30}>30 minutes</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowPreferences(false)}>
            Cancel
          </Button>
          <Button onClick={() => setShowPreferences(false)} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notification Snackbar */}
      <Snackbar
        open={!!notification}
        autoHideDuration={6000}
        onClose={() => setNotification(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setNotification(null)} 
          severity={notification?.type || 'info'}
          sx={{ width: '100%' }}
        >
          {notification?.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default MatchingDashboardPage;
