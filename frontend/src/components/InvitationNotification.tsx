import React, { useState, useEffect } from 'react';
import {
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
  IconButton,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { useMatching } from '../contexts/MatchingContext';

const InvitationNotification: React.FC = () => {
  const [open, setOpen] = useState(false);
  const { pendingInvitations, acceptInvitation, declineInvitation } = useMatching();

  useEffect(() => {
    console.log('InvitationNotification: pendingInvitations changed:', pendingInvitations);
    
    // Listen for invitation events
    const handleShowInvitations = () => {
      console.log('InvitationNotification: show-invitations event received');
      setOpen(true);
    };

    window.addEventListener('show-invitations', handleShowInvitations);
    
    // Auto-show when there are pending invitations
    if (pendingInvitations.length > 0) {
      console.log('InvitationNotification: Auto-showing dialog for', pendingInvitations.length, 'invitations');
      setOpen(true);
    }

    return () => {
      window.removeEventListener('show-invitations', handleShowInvitations);
    };
  }, [pendingInvitations.length]);

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
          <IconButton
            onClick={() => setOpen(false)}
            sx={{ ml: 'auto' }}
          >
            <CloseIcon />
          </IconButton>
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
                  </Box>
                  <Chip
                    label={invitation.status}
                    color={invitation.status === 'pending' ? 'warning' : 'default'}
                    size="small"
                  />
                </Box>
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
                    Accept
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
  );
};

export default InvitationNotification;
