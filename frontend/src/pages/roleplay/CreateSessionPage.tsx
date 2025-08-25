import React from 'react';
import {

  Container,
  Typography,
  Card,
  CardContent,
  Button,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

const CreateSessionPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 4 }}>
        Create New Session
      </Typography>
      
      <Card>
        <CardContent sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Session Creation Coming Soon
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            This feature will allow you to create new roleplay sessions with detailed configuration options.
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

export default CreateSessionPage;
