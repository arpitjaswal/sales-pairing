import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,

  Chip,
  Avatar,
  Stack,
  TextField,
  InputAdornment,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import {
  Search,
  FilterList,
  Add,
  VideoCall,
  People,
  Schedule,
  MoreVert,
  Edit,
  Delete,
  PlayArrow,
  Star,
  AccessTime,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

// Mock data
const mockSessions = [
  {
    id: 1,
    title: 'Objection Handling Practice',
    description: 'Practice handling common sales objections with realistic scenarios.',
    category: 'Objection Handling',
    status: 'scheduled',
    startTime: '2024-01-20T10:00:00Z',
    duration: 30,
    participants: [
      { id: 1, name: 'Sarah Johnson', avatar: 'SJ' },
      { id: 2, name: 'Mike Chen', avatar: 'MC' },
    ],
    maxParticipants: 4,
    rating: 4.5,
    createdBy: 'John Doe',
  },
  {
    id: 2,
    title: 'Discovery Call Simulation',
    description: 'Master the art of discovery calls with interactive roleplay scenarios.',
    category: 'Discovery',
    status: 'active',
    startTime: '2024-01-19T14:00:00Z',
    duration: 45,
    participants: [
      { id: 3, name: 'Alex Rodriguez', avatar: 'AR' },
    ],
    maxParticipants: 3,
    rating: 4.8,
    createdBy: 'Jane Smith',
  },
  {
    id: 3,
    title: 'Closing Techniques Workshop',
    description: 'Learn and practice effective closing techniques for sales success.',
    category: 'Closing',
    status: 'completed',
    startTime: '2024-01-18T09:00:00Z',
    duration: 60,
    participants: [
      { id: 4, name: 'Emma Wilson', avatar: 'EW' },
      { id: 5, name: 'David Kim', avatar: 'DK' },
    ],
    maxParticipants: 5,
    rating: 4.2,
    createdBy: 'Bob Johnson',
  },
  {
    id: 4,
    title: 'Value Proposition Practice',
    description: 'Craft and deliver compelling value propositions in various scenarios.',
    category: 'Value Proposition',
    status: 'scheduled',
    startTime: '2024-01-21T16:00:00Z',
    duration: 40,
    participants: [],
    maxParticipants: 4,
    rating: null,
    createdBy: 'Alice Brown',
  },
];

const categories = [
  'All Categories',
  'Objection Handling',
  'Discovery',
  'Closing',
  'Value Proposition',
  'Negotiation',
  'Presentation',
];

const SessionListPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(null);
  const [sessionMenuAnchorEl, setSessionMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleFilterClick = (event: React.MouseEvent<HTMLElement>) => {
    setFilterAnchorEl(event.currentTarget);
  };

  const handleFilterClose = () => {
    setFilterAnchorEl(null);
  };

  const handleSessionMenuClick = (event: React.MouseEvent<HTMLElement>, session: any) => {
    setSessionMenuAnchorEl(event.currentTarget);
    setSelectedSession(session);
  };

  const handleSessionMenuClose = () => {
    setSessionMenuAnchorEl(null);
    setSelectedSession(null);
  };

  const handleJoinSession = (sessionId: number) => {
    navigate(`/sessions/${sessionId}`);
  };

  const handleEditSession = (sessionId: number) => {
    navigate(`/sessions/${sessionId}/edit`);
  };

  const handleDeleteSession = () => {
    // TODO: Implement delete session
    setDeleteDialogOpen(false);
    handleSessionMenuClose();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'scheduled':
        return 'primary';
      case 'completed':
        return 'default';
      default:
        return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Live';
      case 'scheduled':
        return 'Scheduled';
      case 'completed':
        return 'Completed';
      default:
        return status;
    }
  };

  const filteredSessions = mockSessions.filter(session => {
    const matchesSearch = session.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         session.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All Categories' || session.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Sessions
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => navigate('/sessions/create')}
            sx={{
              background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #1565c0 0%, #1976d2 100%)',
              },
            }}
          >
            Create Session
          </Button>
        </Box>

        {/* Filters */}
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3, alignItems: "center" }}>
              <Box sx={{ flex: { xs: "1 1 100%", md: "0 0 calc(50% - 12px)" } }}>
                <TextField
                  fullWidth
                  placeholder="Search sessions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search />
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>
              <Box sx={{ flex: { xs: "1 1 100%", md: "0 0 calc(33.33% - 16px)" } }}>
                <FormControl fullWidth>
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={selectedCategory}
                    label="Category"
                    onChange={(e) => setSelectedCategory(e.target.value)}
                  >
                    {categories.map((category) => (
                      <MenuItem key={category} value={category}>
                        {category}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
              <Box sx={{ flex: { xs: "1 1 100%", md: "0 0 calc(16.67% - 20px)" } }}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<FilterList />}
                  onClick={handleFilterClick}
                >
                  Filters
                </Button>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Sessions Grid */}
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
          {filteredSessions.map((session) => (
            <Box sx={{ flex: { xs: "1 1 100%", md: "0 0 50%", lg: "0 0 calc(33.33% - 16px)" } }}>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'transform 0.2s ease-in-out',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                    },
                  }}
                >
                  <CardContent sx={{ flexGrow: 1, p: 3 }}>
                    {/* Header */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Chip
                        label={getStatusText(session.status)}
                        color={getStatusColor(session.status) as any}
                        size="small"
                      />
                      <IconButton
                        size="small"
                        onClick={(e) => handleSessionMenuClick(e, session)}
                      >
                        <MoreVert />
                      </IconButton>
                    </Box>

                    {/* Title and Description */}
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                      {session.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {session.description}
                    </Typography>

                    {/* Category */}
                    <Chip
                      label={session.category}
                      variant="outlined"
                      size="small"
                      sx={{ mb: 2 }}
                    />

                    {/* Session Details */}
                    <Stack spacing={1} sx={{ mb: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Schedule sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary">
                          {new Date(session.startTime).toLocaleDateString()} at{' '}
                          {new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <AccessTime sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary">
                          {session.duration} minutes
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <People sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary">
                          {session.participants.length}/{session.maxParticipants} participants
                        </Typography>
                      </Box>
                    </Stack>

                    {/* Participants */}
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        Participants:
                      </Typography>
                      <Stack direction="row" spacing={1}>
                        {session.participants.map((participant: any) => (
                          <Avatar key={participant.id} sx={{ width: 32, height: 32, fontSize: '0.875rem' }}>
                            {participant.avatar}
                          </Avatar>
                        ))}
                        {session.participants.length === 0 && (
                          <Typography variant="body2" color="text.secondary">
                            No participants yet
                          </Typography>
                        )}
                      </Stack>
                    </Box>

                    {/* Rating */}
                    {session.rating && (
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Star sx={{ fontSize: 16, color: '#ffd700', mr: 0.5 }} />
                        <Typography variant="body2" color="text.secondary">
                          {session.rating}/5.0
                        </Typography>
                      </Box>
                    )}

                    {/* Action Button */}
                    <Button
                      fullWidth
                      variant="contained"
                      startIcon={<PlayArrow />}
                      onClick={() => handleJoinSession(session.id)}
                      disabled={session.status === 'completed'}
                      sx={{
                        background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #1565c0 0%, #1976d2 100%)',
                        },
                      }}
                    >
                      {session.status === 'completed' ? 'Completed' : 'Join Session'}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            </Box>
          ))}
        </Box>

        {/* Empty State */}
        {filteredSessions.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
              No sessions found
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Try adjusting your search or filters to find what you're looking for.
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => navigate('/sessions/create')}
            >
              Create Your First Session
            </Button>
          </Box>
        )}
      </motion.div>

      {/* Filter Menu */}
      <Menu
        anchorEl={filterAnchorEl}
        open={Boolean(filterAnchorEl)}
        onClose={handleFilterClose}
      >
        <MenuItem onClick={handleFilterClose}>
          <ListItemIcon>
            <VideoCall fontSize="small" />
          </ListItemIcon>
          <ListItemText>All Sessions</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleFilterClose}>
          <ListItemIcon>
            <Schedule fontSize="small" />
          </ListItemIcon>
          <ListItemText>Scheduled</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleFilterClose}>
          <ListItemIcon>
            <PlayArrow fontSize="small" />
          </ListItemIcon>
          <ListItemText>Active</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleFilterClose}>
          <ListItemIcon>
            <Star fontSize="small" />
          </ListItemIcon>
          <ListItemText>Completed</ListItemText>
        </MenuItem>
      </Menu>

      {/* Session Menu */}
      <Menu
        anchorEl={sessionMenuAnchorEl}
        open={Boolean(sessionMenuAnchorEl)}
        onClose={handleSessionMenuClose}
      >
        <MenuItem onClick={() => { handleEditSession(selectedSession?.id); handleSessionMenuClose(); }}>
          <ListItemIcon>
            <Edit fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit Session</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { setDeleteDialogOpen(true); }}>
          <ListItemIcon>
            <Delete fontSize="small" />
          </ListItemIcon>
          <ListItemText>Delete Session</ListItemText>
        </MenuItem>
      </Menu>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Session</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{selectedSession?.title}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteSession} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Floating Action Button */}
      <Fab
        color="primary"
        aria-label="add"
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
          '&:hover': {
            background: 'linear-gradient(135deg, #1565c0 0%, #1976d2 100%)',
          },
        }}
        onClick={() => navigate('/sessions/create')}
      >
        <Add />
      </Fab>
    </Container>
  );
};

export default SessionListPage;
