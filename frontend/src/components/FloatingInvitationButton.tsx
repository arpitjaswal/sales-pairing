import React, { useState, useEffect } from 'react';
import {
  Fab,
  Badge,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Chip,
  Card,
  CardContent,
  Stack,
  Alert,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  PlayArrow as PlayArrowIcon,
} from '@mui/icons-material';
import { useMatching } from '../contexts/MatchingContext';

const FloatingInvitationButton: React.FC = () => {
  const [open, setOpen] = useState(false);
  const { pendingInvitations, acceptInvitation, declineInvitation } = useMatching();

  useEffect(() => {
    // Auto-show when there are pending invitations
    if (pendingInvitations.length > 0) {
      setOpen(true);
    }
  }, [pendingInvitations.length]);

  const handleClick = () => {
    if (pendingInvitations.length > 0) {
      setOpen(true);
    }
  };

  const handleAccept = (invitationId: string) => {
    acceptInvitation(invitationId);
    setOpen(false);
  };

  const handleDecline = (invitationId: string) => {
    declineInvitation(invitationId);
    setOpen(false);
  };

  if (pendingInvitations.length === 0) {
    return null;
  }

  return (
    <>
      <Tooltip title={`${pendingInvitations.length} pending invitation${pendingInvitations.length > 1 ? 's' : ''}`}>
        <Fab
          color="primary"
          aria-label="invitations"
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            zIndex: 1000,
          }}
          onClick={handleClick}
        >
          <Badge badgeContent={pendingInvitations.length} color="error">
            <NotificationsIcon />
          </Badge>
        </Fab>
      </Tooltip>

      <Dialog 
        open={open} 
        onClose={() => setOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <NotificationsIcon color="primary" />
            <Typography variant="h6">Practice Invitations</Typography>
            <Chip label={pendingInvitations.length} color="error" size="small" />
          </Box>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2}>
            {pendingInvitations.map((invitation) => (
              <Card key={invitation.id} variant="outlined">
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box>
                      <Typography variant="h6" color="primary">
                        {invitation.requesterName || 'Unknown User'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Topic: {invitation.topic}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Duration: {invitation.duration} minutes
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Skill Level: {invitation.skillLevel}
                      </Typography>
                      {invitation.isQuickMatch && (
                        <Chip
                          label="Quick Match"
                          color="success"
                          size="small"
                          icon={<PlayArrowIcon />}
                          sx={{ mt: 1 }}
                        />
                      )}
                    </Box>
                    <Chip
                      label={invitation.status}
                      color={invitation.status === 'pending' ? 'warning' : 'default'}
                      size="small"
                    />
                  </Box>
                  
                  {invitation.isQuickMatch && (
                    <Alert severity="info" sx={{ mb: 2 }}>
                      <Typography variant="body2">
                        This is a quick match invitation. Accept to start practicing immediately!
                      </Typography>
                    </Alert>
                  )}
                  
                  <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                    <Button
                      variant="outlined"
                      color="error"
                      size="small"
                      onClick={() => handleDecline(invitation.id)}
                    >
                      Decline
                    </Button>
                    <Button
                      variant="contained"
                      color="success"
                      size="small"
                      onClick={() => handleAccept(invitation.id)}
                    >
                      Accept & Start
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default FloatingInvitationButton;
