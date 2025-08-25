import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Avatar,
  Chip,
  IconButton,

  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Rating,
  Stack,
  Card,
  CardContent,

  LinearProgress,
  Tooltip,
  Fab,
} from '@mui/material';
import {
  Send as SendIcon,
  Lightbulb as LightbulbIcon,

  Star as StarIcon,

  Psychology as PsychologyIcon,
  ExitToApp as ExitToAppIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

interface Message {
  id: string;
  sender: 'user' | 'partner' | 'system';
  content: string;
  timestamp: Date;
}

const PracticeSessionPage: React.FC = () => {
  const navigate = useNavigate();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'system',
      content: 'Practice session started! You are the salesperson. Your partner is the prospect.',
      timestamp: new Date(),
    },
  ]);
  
  const [newMessage, setNewMessage] = useState('');
  const [timeRemaining, setTimeRemaining] = useState(15 * 60); // 15 minutes
  const [showPrompts, setShowPrompts] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [sessionRating, setSessionRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const partner = {
    name: 'Sarah Johnson',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
    role: 'Sales Manager',
    rating: 4.8,
  };

  const salesPrompts = [
    "Hi [Name], I noticed your company recently expanded. I help companies like yours increase sales by 30%. Would you be interested in a quick call?",
    "I understand budget is a concern. Many clients found our solution pays for itself within 3 months. Would you like to see how?",
    "Based on what we've discussed, this solution could really help you. What would be the next step to get started?",
    "What are the main challenges your company is facing right now?",
    "Tell me about your current process. What's working well and what could be improved?",
  ];

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Timer countdown
  useEffect(() => {
    if (timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            handleSessionEnd();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [timeRemaining]);

  // Simulate partner responses
  useEffect(() => {
    if (messages.length > 1) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.sender === 'user') {
        setIsTyping(true);
        
        setTimeout(() => {
          setIsTyping(false);
          const responses = [
            "I'm pretty busy right now. What's this about?",
            "We get a lot of sales calls. What makes you different?",
            "I'm not really interested in changing our current process.",
            "How did you get my number?",
            "What's the cost involved?",
          ];
          const response = responses[Math.floor(Math.random() * responses.length)];
          addMessage('partner', response);
        }, 2000 + Math.random() * 3000);
      }
    }
  }, [messages]);

  const addMessage = (sender: 'user' | 'partner' | 'system', content: string) => {
    const newMsg: Message = {
      id: Date.now().toString(),
      sender,
      content,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, newMsg]);
  };

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      addMessage('user', newMessage.trim());
      setNewMessage('');
    }
  };

  const handleSendPrompt = (prompt: string) => {
    addMessage('user', prompt);
    setShowPrompts(false);
  };

  const handleSessionEnd = () => {
    addMessage('system', 'Practice session completed! Please provide feedback.');
    setShowFeedback(true);
  };

  const handleEndSession = () => {
    addMessage('system', 'Session ended by user.');
    setShowFeedback(true);
  };

  const handleSubmitFeedback = () => {
    console.log('Feedback submitted:', { rating: sessionRating, feedback });
    setShowFeedback(false);
    navigate('/dashboard');
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Paper sx={{ p: 2, borderRadius: 0, borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar src={partner.avatar} alt={partner.name} />
            <Box>
              <Typography variant="h6" fontWeight="bold">
                {partner.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {partner.role} • Rating: {partner.rating}
              </Typography>
            </Box>
            <Chip label="COLD CALLING" color="primary" size="small" />
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" color="primary" fontWeight="bold">
                {formatTime(timeRemaining)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Time Remaining
              </Typography>
            </Box>
            
            <LinearProgress 
              variant="determinate" 
              value={(timeRemaining / (15 * 60)) * 100}
              sx={{ width: 100, height: 8, borderRadius: 4 }}
            />
            
            <IconButton onClick={handleEndSession} color="error">
              <ExitToAppIcon />
            </IconButton>
          </Box>
        </Box>
      </Paper>

      {/* Messages Area */}
      <Box sx={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: message.sender === 'user' ? 'flex-end' : 'flex-start',
                  mb: 2,
                }}
              >
                {message.sender === 'partner' && (
                  <Avatar 
                    src={partner.avatar} 
                    alt={partner.name}
                    sx={{ width: 32, height: 32, mr: 1 }}
                  />
                )}
                
                <Paper
                  sx={{
                    p: 2,
                    maxWidth: '70%',
                    bgcolor: message.sender === 'user' 
                      ? 'primary.main' 
                      : message.sender === 'system'
                      ? 'warning.light'
                      : 'grey.100',
                    color: message.sender === 'user' ? 'white' : 'text.primary',
                    borderRadius: 2,
                  }}
                >
                  <Typography variant="body1">
                    {message.content}
                  </Typography>
                  
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      display: 'block', 
                      mt: 1, 
                      opacity: 0.7 
                    }}
                  >
                    {message.timestamp.toLocaleTimeString()}
                  </Typography>
                </Paper>
              </Box>
            </motion.div>
          ))}
          
          {/* Typing indicator */}
          {isTyping && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 1 }}>
              <Avatar 
                src={partner.avatar} 
                alt={partner.name}
                sx={{ width: 32, height: 32 }}
              />
              <Paper sx={{ p: 1, bgcolor: 'grey.100' }}>
                <Typography variant="body2" color="text.secondary">
                  {partner.name} is typing...
                </Typography>
              </Paper>
            </Box>
          )}
          
          <div ref={messagesEndRef} />
        </Box>

        {/* Input Area */}
        <Paper sx={{ p: 2, borderRadius: 0, borderTop: 1, borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
            <TextField
              fullWidth
              multiline
              maxRows={3}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Type your sales pitch..."
              variant="outlined"
              size="small"
            />
            
            <Tooltip title="AI Prompts">
              <IconButton 
                onClick={() => setShowPrompts(true)}
                color="primary"
                sx={{ mb: 0.5 }}
              >
                <LightbulbIcon />
              </IconButton>
            </Tooltip>
            
            <Button
              variant="contained"
              onClick={handleSendMessage}
              disabled={!newMessage.trim()}
              endIcon={<SendIcon />}
              sx={{ mb: 0.5 }}
            >
              Send
            </Button>
          </Box>
        </Paper>
      </Box>

      {/* AI Prompts Dialog */}
      <Dialog 
        open={showPrompts} 
        onClose={() => setShowPrompts(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PsychologyIcon color="primary" />
            AI Sales Prompts
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Use these AI-generated prompts to help guide your sales conversation:
          </Typography>
          
          <Stack spacing={2}>
            {salesPrompts.map((prompt, index) => (
              <Card 
                key={index}
                sx={{ 
                  cursor: 'pointer',
                  '&:hover': { bgcolor: 'grey.50' }
                }}
                onClick={() => handleSendPrompt(prompt)}
              >
                <CardContent>
                  <Typography variant="body1">
                    {prompt}
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowPrompts(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Feedback Dialog */}
      <Dialog 
        open={showFeedback} 
        onClose={() => setShowFeedback(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <StarIcon color="primary" />
            Session Feedback
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            How would you rate this practice session?
          </Typography>
          
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
            <Rating
              value={sessionRating}
              onChange={(_, value) => setSessionRating(value || 0)}
              size="large"
            />
          </Box>
          
          <TextField
            fullWidth
            multiline
            rows={4}
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Share your thoughts about the session..."
            variant="outlined"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowFeedback(false)}>
            Skip
          </Button>
          <Button 
            onClick={handleSubmitFeedback} 
            variant="contained"
            disabled={sessionRating === 0}
          >
            Submit Feedback
          </Button>
        </DialogActions>
      </Dialog>

      {/* Floating Action Button */}
      <Fab
        color="primary"
        aria-label="AI prompts"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        onClick={() => setShowPrompts(true)}
      >
        <LightbulbIcon />
      </Fab>
    </Box>
  );
};

export default PracticeSessionPage;
