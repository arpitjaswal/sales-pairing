import React from 'react';
import {

  Container,
  Typography,
  Card,
  CardContent,
  Button,
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';

const RoleplaySessionPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 4 }}>
        Roleplay Session #{id}
      </Typography>
      
      <Card>
        <CardContent sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Session Interface Coming Soon
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            This will be the main interface for participating in roleplay sessions with video, audio, and chat functionality.
          </Typography>
          <Button
            variant="contained"
            onClick={() => navigate('/sessions')}
          >
            Back to Sessions
          </Button>
        </CardContent>
      </Card>
    </Container>
  );
};

export default RoleplaySessionPage;
