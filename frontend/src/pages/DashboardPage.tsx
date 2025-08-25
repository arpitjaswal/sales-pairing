import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Avatar,
  Chip,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Badge,
  Paper,
  Stack,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';

import {
  People as PeopleIcon,

  TrendingUp as TrendingUpIcon,
  EmojiEvents as EmojiEventsIcon,
  PlayArrow as PlayArrowIcon,
  PersonAdd as PersonAddIcon,
  Shuffle as ShuffleIcon,

  Star as StarIcon,

} from '@mui/icons-material';
import { motion } from 'framer-motion';

// Mock data for online users
const mockOnlineUsers = [
  {
    id: '1',
    name: 'Sarah Johnson',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
    role: 'Sales Rep',
    status: 'available',
    rating: 4.8,
    practiceCount: 45,
    lastActive: '2 min ago',
  },
  {
    id: '2',
    name: 'Mike Chen',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    role: 'Account Manager',
    status: 'in-practice',
    rating: 4.6,
    practiceCount: 32,
    lastActive: '5 min ago',
  },
  {
    id: '3',
    name: 'Emily Rodriguez',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
    role: 'Sales Director',
    status: 'available',
    rating: 4.9,
    practiceCount: 67,
    lastActive: '1 min ago',
  },
  {
    id: '4',
    name: 'David Kim',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    role: 'Business Development',
    status: 'available',
    rating: 4.7,
    practiceCount: 28,
    lastActive: '3 min ago',
  },
];

// Mock leaderboard data
const mockLeaderboard = [
  { rank: 1, name: 'Emily Rodriguez', points: 1250, sessions: 67, winRate: '89%' },
  { rank: 2, name: 'Sarah Johnson', points: 1180, sessions: 45, winRate: '85%' },
  { rank: 3, name: 'Mike Chen', points: 1050, sessions: 32, winRate: '82%' },
  { rank: 4, name: 'David Kim', points: 920, sessions: 28, winRate: '78%' },
  { rank: 5, name: 'Alex Thompson', points: 890, sessions: 25, winRate: '76%' },
];



const DashboardPage: React.FC = () => {
  const [onlineUsers] = useState(mockOnlineUsers);
  const [leaderboard] = useState(mockLeaderboard);
  const [showPracticeDialog, setShowPracticeDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [practiceMode, setPracticeMode] = useState<'random' | 'specific'>('random');
  const [practiceTopic, setPracticeTopic] = useState('');



  const handleInviteUser = (user: any) => {
    setSelectedUser(user);
    setPracticeMode('specific');
    setShowPracticeDialog(true);
  };

  const startPracticeSession = () => {
    // Navigate to practice session
    const sessionId = Date.now().toString();
    window.location.href = `/practice/${sessionId}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'success';
      case 'in-practice':
        return 'warning';
      case 'busy':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'available':
        return 'Available';
      case 'in-practice':
        return 'In Practice';
      case 'busy':
        return 'Busy';
      default:
        return 'Unknown';
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
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
          Sales Practice Dashboard
        </Typography>
      </motion.div>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
        {/* Quick Actions */}
        <Box sx={{ flex: { xs: '1 1 100%', md: '0 0 calc(33.33% - 16px)' } }}>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PlayArrowIcon color="primary" />
                  Quick Practice
                </Typography>
                
                <Stack spacing={2} sx={{ mt: 2 }}>
                  <Button
                    variant="contained"
                    size="large"
                    startIcon={<ShuffleIcon />}
                    onClick={() => window.location.href = '/matching'}
                    fullWidth
                    sx={{ py: 1.5 }}
                  >
                    Go to Matching
                  </Button>
                  
                  <Button
                    variant="outlined"
                    size="large"
                    startIcon={<PlayArrowIcon />}
                    fullWidth
                    sx={{ py: 1.5 }}
                  >
                    Practice Timer
                  </Button>
                  
                  <Button
                    variant="outlined"
                    size="large"
                    startIcon={<StarIcon />}
                    fullWidth
                    sx={{ py: 1.5 }}
                  >
                    View Prompts
                  </Button>
                </Stack>

                <Alert severity="info" sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    <strong>Your Status:</strong> Available
                  </Typography>
                </Alert>
              </CardContent>
            </Card>
          </motion.div>
        </Box>

        {/* Online Users */}
        <Box sx={{ flex: { xs: "1 1 100%", md: "0 0 calc(33.33% - 16px)" } }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PeopleIcon color="primary" />
                  Online for Practice
                  <Chip 
                    label={onlineUsers.filter(u => u.status === 'available').length} 
                    size="small" 
                    color="primary" 
                  />
                </Typography>
                
                <List sx={{ mt: 1 }}>
                  {onlineUsers.slice(0, 4).map((user) => (
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
                                bgcolor: user.status === 'available' ? 'success.main' : 'warning.main',
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
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              {user.role} • {user.lastActive}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                              <StarIcon sx={{ fontSize: 16, color: 'warning.main' }} />
                              <Typography variant="body2" color="text.secondary">
                                {user.rating} • {user.practiceCount} sessions
                              </Typography>
                            </Box>
                          </Box>
                        }
                      />
                      <ListItemSecondaryAction>
                        {user.status === 'available' && (
                          <IconButton
                            edge="end"
                            onClick={() => handleInviteUser(user)}
                            color="primary"
                            size="small"
                          >
                            <PersonAddIcon />
                          </IconButton>
                        )}
                        <Chip
                          label={getStatusText(user.status)}
                          size="small"
                          color={getStatusColor(user.status) as any}
                          sx={{ ml: 1 }}
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
                
                <Button
                  variant="text"
                  fullWidth
                  sx={{ mt: 1 }}
                >
                  View All Online Users
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </Box>

        {/* Leaderboard */}
        <Box sx={{ flex: { xs: "1 1 100%", md: "0 0 calc(33.33% - 16px)" } }}>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <EmojiEventsIcon color="primary" />
                  Leaderboard
                </Typography>
                
                <List sx={{ mt: 1 }}>
                  {leaderboard.slice(0, 5).map((player, index) => (
                    <ListItem key={player.rank} sx={{ px: 0 }}>
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
                          {player.rank}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={player.name}
                        secondary={
                          <Typography variant="body2" color="text.secondary">
                            {player.points} pts • {player.sessions} sessions • {player.winRate} win rate
                          </Typography>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
                
                <Button
                  variant="text"
                  fullWidth
                  sx={{ mt: 1 }}
                >
                  View Full Leaderboard
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </Box>

        {/* Recent Activity */}
        <Box sx={{ flex: "1 1 100%" }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TrendingUpIcon color="primary" />
                  Recent Practice Sessions
                </Typography>
                
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
                  <Box sx={{ flex: { xs: "1 1 100%", md: "0 0 calc(50% - 12px)" } }}>
                    <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                      <Typography variant="subtitle2" color="primary" gutterBottom>
                        Today's Stats
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">Sessions Completed:</Typography>
                        <Typography variant="body2" fontWeight="bold">3</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">Total Practice Time:</Typography>
                        <Typography variant="body2" fontWeight="bold">45 min</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2">Average Rating:</Typography>
                        <Typography variant="body2" fontWeight="bold">4.7/5</Typography>
                      </Box>
                    </Paper>
                  </Box>
                  
                  <Box sx={{ flex: { xs: "1 1 100%", md: "0 0 calc(50% - 12px)" } }}>
                    <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                      <Typography variant="subtitle2" color="primary" gutterBottom>
                        This Week
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">Sessions Completed:</Typography>
                        <Typography variant="body2" fontWeight="bold">12</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">Total Practice Time:</Typography>
                        <Typography variant="body2" fontWeight="bold">3h 20m</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2">Points Earned:</Typography>
                        <Typography variant="body2" fontWeight="bold">+85</Typography>
                      </Box>
                    </Paper>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Box>
      </Box>

      {/* Practice Session Dialog */}
      <Dialog 
        open={showPracticeDialog} 
        onClose={() => setShowPracticeDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {practiceMode === 'random' ? 'Start Random Practice Session' : 'Invite to Practice Session'}
        </DialogTitle>
        <DialogContent>
          {practiceMode === 'specific' && selectedUser && (
            <Box sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar src={selectedUser.avatar} alt={selectedUser.name} />
                <Box>
                  <Typography variant="subtitle1" fontWeight="bold">
                    {selectedUser.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedUser.role} • Rating: {selectedUser.rating}
                  </Typography>
                </Box>
              </Box>
            </Box>
          )}
          
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Practice Topic</InputLabel>
            <Select
              value={practiceTopic}
              onChange={(e) => setPracticeTopic(e.target.value)}
              label="Practice Topic"
            >
              <MenuItem value="cold-calling">Cold Calling</MenuItem>
              <MenuItem value="objection-handling">Objection Handling</MenuItem>
              <MenuItem value="closing-techniques">Closing Techniques</MenuItem>
              <MenuItem value="value-proposition">Value Proposition</MenuItem>
              <MenuItem value="discovery-call">Discovery Call</MenuItem>
              <MenuItem value="general-practice">General Practice</MenuItem>
            </Select>
          </FormControl>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {practiceMode === 'random' 
              ? 'You will be randomly paired with another available user for a 15-minute practice session.'
              : `You are inviting ${selectedUser?.name} to a 15-minute practice session.`
            }
          </Typography>
          
          <Alert severity="info">
            <Typography variant="body2">
              <strong>Session Features:</strong>
              <br />• Real-time text chat
              <br />• AI-powered sales prompts
              <br />• Session timer and feedback
              <br />• Points and rating system
            </Typography>
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowPracticeDialog(false)}>
            Cancel
          </Button>
          <Button 
            onClick={startPracticeSession} 
            variant="contained"
            startIcon={<PlayArrowIcon />}
          >
            Start Session
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DashboardPage;
