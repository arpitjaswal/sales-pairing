import React from 'react';
import {
  Fab,
  Badge,
  Tooltip,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
} from '@mui/icons-material';
import { useMatching } from '../contexts/MatchingContext';

const FloatingInvitationButton: React.FC = () => {
  const { pendingInvitations } = useMatching();

  console.log('FloatingInvitationButton: pendingInvitations:', pendingInvitations);

  if (pendingInvitations.length === 0) {
    return null;
  }

  const handleClick = () => {
    const event = new CustomEvent('show-invitations');
    window.dispatchEvent(event);
  };

  return (
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
  );
};

export default FloatingInvitationButton;
