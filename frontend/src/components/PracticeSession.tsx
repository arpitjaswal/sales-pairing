import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  IconButton,
  Chip,

  List,
  ListItem,

  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Rating,
  TextareaAutosize,

  Card,
  CardContent,
  LinearProgress,
  Alert,
} from '@mui/material';
import {
  Send as SendIcon,
  Close as CloseIcon,
  Timer as TimerIcon,
  Star as StarIcon,

  Stop as StopIcon,
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { websocketService } from '../services/websocket';

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: Date;
  type: 'message' | 'system' | 'prompt';
}

interface PracticeSessionProps {
  session: {
    id: string;
    participants: string[];
    topic: string;
    skillLevel: string;
    duration: number;
    startTime: Date;
    status: string;
  };
  currentUserId: string;
  currentUserName: string;
  onEndSession: (sessionId: string, feedback?: any) => void;
  onClose: () => void;
}

const PracticeSession: React.FC<PracticeSessionProps> = ({
  session,
  currentUserId,
  currentUserName,
  onEndSession,
  onClose,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [timeRemaining, setTimeRemaining] = useState(session.duration * 60); // in seconds
  const [isPaused, setIsPaused] = useState(false);
  const [showEndDialog, setShowEndDialog] = useState(false);
  const [feedback, setFeedback] = useState({
    rating: 0,
    notes: '',
    skillsPracticed: [] as string[],
  });
  const [sessionPhase, setSessionPhase] = useState<'introduction' | 'practice' | 'feedback'>('introduction');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Timer countdown
  useEffect(() => {
    if (sessionPhase === 'practice' && !isPaused && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            setSessionPhase('feedback');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [timeRemaining, isPaused, sessionPhase]);

  // Initialize session with welcome messages
  useEffect(() => {
    const welcomeMessages: Message[] = [
      {
        id: '1',
        senderId: 'system',
        senderName: 'System',
        content: `Welcome to your ${session.duration}-minute practice session!`,
        timestamp: new Date(),
        type: 'system',
      },
      {
        id: '2',
        senderId: 'system',
        senderName: 'System',
        content: `Topic: ${session.topic} | Skill Level: ${session.skillLevel}`,
        timestamp: new Date(),
        type: 'system',
      },
      {
        id: '3',
        senderId: 'system',
        senderName: 'System',
        content: 'Take a moment to introduce yourselves and discuss your goals for this session.',
        timestamp: new Date(),
        type: 'system',
      },
    ];
    setMessages(welcomeMessages);

    // Set up WebSocket listeners for session messages
    websocketService.onSessionMessageReceived((data) => {
      if (data.sessionId === session.id) {
        // Ensure timestamp is a Date object
        const messageWithDate = {
          ...data.message,
          timestamp: new Date(data.message.timestamp)
        };
        setMessages(prev => [...prev, messageWithDate]);
      }
    });

    websocketService.onSessionEnded((data) => {
      if (data.sessionId === session.id) {
        setSessionPhase('feedback');
      }
    });

    return () => {
      websocketService.off('session-message-received');
      websocketService.off('session-ended');
    };
  }, [session]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSendMessage = () => {
    if (newMessage.trim() && sessionPhase === 'practice') {
      console.log('Sending message with session ID:', session.id);
      console.log('Current user ID:', currentUserId);
      console.log('Session participants:', session.participants);
      
      // Send message via WebSocket - don't add locally, let WebSocket handle it
      websocketService.sendSessionMessage(
        session.id,
        newMessage.trim(),
        currentUserId,
        currentUserName
      );
      
      setNewMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const startPractice = () => {
    setSessionPhase('practice');
    setMessages(prev => [
      ...prev,
      {
        id: Date.now().toString(),
        senderId: 'system',
        senderName: 'System',
        content: '🎯 Practice session started! Begin your roleplay now.',
        timestamp: new Date(),
        type: 'system',
      },
    ]);
  };

  const togglePause = () => {
    setIsPaused(!isPaused);
  };

  const handleEndSession = () => {
    setShowEndDialog(true);
  };

  const confirmEndSession = () => {
    onEndSession(session.id, feedback);
    setShowEndDialog(false);
  };

  const getPrompt = () => {
    const prompts = {
      'cold-calling': [
        'Start with a compelling opening that addresses the prospect\'s pain point',
        'Handle the first objection with empathy and understanding',
        'Ask qualifying questions to understand their needs better',
        'Present your solution in terms of their specific situation',
      ],
      'objection-handling': [
        'Acknowledge the objection and show you understand their concern',
        'Ask clarifying questions to better understand their objection',
        'Provide a relevant example or case study',
        'Offer a trial or demonstration to address their concerns',
      ],
      'closing': [
        'Summarize the key benefits and value proposition',
        'Ask for the sale with confidence',
        'Handle any final objections',
        'Create urgency with a limited-time offer',
      ],
      'general-practice': [
        'Build rapport by finding common ground',
        'Listen actively and ask follow-up questions',
        'Present your solution clearly and concisely',
        'Ask for next steps or commitment',
      ],
    };
    
    const topicPrompts = prompts[session.topic as keyof typeof prompts] || prompts['general-practice'];
    return topicPrompts[Math.floor(Math.random() * topicPrompts.length)];
  };

  const addPrompt = () => {
    const promptMessage: Message = {
      id: Date.now().toString(),
      senderId: 'system',
      senderName: 'AI Assistant',
      content: `💡 Tip: ${getPrompt()}`,
      timestamp: new Date(),
      type: 'prompt',
    };
    setMessages(prev => [...prev, promptMessage]);
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Paper sx={{ p: 2, borderRadius: 0, borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h6" fontWeight="bold">
              Practice Session
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {session.topic} • {session.skillLevel} • {session.duration} min
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {sessionPhase === 'practice' && (
              <>
                <Chip
                  icon={<TimerIcon />}
                  label={formatTime(timeRemaining)}
                  color={timeRemaining < 300 ? 'error' : 'default'}
                  variant="outlined"
                />
                <IconButton onClick={togglePause} color="primary">
                  {isPaused ? <PlayIcon /> : <PauseIcon />}
                </IconButton>
              </>
            )}
            
            <IconButton onClick={handleEndSession} color="error">
              <StopIcon />
            </IconButton>
            
            <IconButton onClick={onClose}>
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>
        
        {sessionPhase === 'practice' && (
          <Box sx={{ mt: 2 }}>
            <LinearProgress
              variant="determinate"
              value={((session.duration * 60 - timeRemaining) / (session.duration * 60)) * 100}
              sx={{ height: 4, borderRadius: 2 }}
            />
          </Box>
        )}
      </Paper>

      {/* Session Phase Content */}
      <Box sx={{ flex: 1, overflow: 'hidden' }}>
        {sessionPhase === 'introduction' && (
          <Box sx={{ p: 3, textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Typography variant="h4" gutterBottom>
                🎯 Ready to Practice?
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                You're about to start a {session.duration}-minute practice session focused on {session.topic}.
              </Typography>
              
              <Card sx={{ mb: 3, maxWidth: 400, mx: 'auto' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Session Details
                  </Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Topic</Typography>
                      <Typography variant="body1">{session.topic}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Level</Typography>
                      <Typography variant="body1">{session.skillLevel}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Duration</Typography>
                      <Typography variant="body1">{session.duration} minutes</Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Participants</Typography>
                      <Typography variant="body1">{session.participants.length}</Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
              
              <Button
                variant="contained"
                size="large"
                onClick={startPractice}
                sx={{ px: 4, py: 1.5 }}
              >
                Start Practice Session
              </Button>
            </motion.div>
          </Box>
        )}

        {sessionPhase === 'practice' && (
          <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Messages */}
            <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
              <List sx={{ p: 0 }}>
                <AnimatePresence>
                  {messages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3 }}
                    >
                      <ListItem sx={{ px: 0, py: 0.5 }}>
                        <Box sx={{ width: '100%' }}>
                          {message.type === 'system' ? (
                            <Alert severity="info" sx={{ mb: 1 }}>
                              {message.content}
                            </Alert>
                          ) : message.type === 'prompt' ? (
                            <Alert severity="success" sx={{ mb: 1 }}>
                              {message.content}
                            </Alert>
                          ) : (
                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                              <Avatar sx={{ width: 32, height: 32, fontSize: '0.875rem' }}>
                                {message.senderName.charAt(0)}
                              </Avatar>
                              <Box sx={{ flex: 1 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                  <Typography variant="subtitle2" fontWeight="bold">
                                    {message.senderName}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {message.timestamp.toLocaleTimeString()}
                                  </Typography>
                                </Box>
                                <Typography variant="body1">{message.content}</Typography>
                              </Box>
                            </Box>
                          )}
                        </Box>
                      </ListItem>
                    </motion.div>
                  ))}
                </AnimatePresence>
                <div ref={messagesEndRef} />
              </List>
            </Box>

            {/* Input Area */}
            <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={addPrompt}
                  startIcon={<StarIcon />}
                >
                  Get Tip
                </Button>
                <TextField
                  fullWidth
                  variant="outlined"
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  size="small"
                  disabled={isPaused}
                />
                <IconButton
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || isPaused}
                  color="primary"
                >
                  <SendIcon />
                </IconButton>
              </Box>
            </Box>
          </Box>
        )}

        {sessionPhase === 'feedback' && (
          <Box sx={{ p: 3, height: '100%', overflow: 'auto' }}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Typography variant="h5" gutterBottom>
                Session Complete! 🎉
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                Great job! Please provide feedback on your practice session.
              </Typography>

              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Rate Your Session
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Rating
                      value={feedback.rating}
                      onChange={(_, value) => setFeedback(prev => ({ ...prev, rating: value || 0 }))}
                      size="large"
                    />
                    <Typography variant="body2" color="text.secondary">
                      {feedback.rating}/5 stars
                    </Typography>
                  </Box>
                </CardContent>
              </Card>

              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Session Notes
                  </Typography>
                  <TextareaAutosize
                    minRows={4}
                    placeholder="What did you learn? What went well? What could you improve?"
                    value={feedback.notes}
                    onChange={(e) => setFeedback(prev => ({ ...prev, notes: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      fontFamily: 'inherit',
                      fontSize: '14px',
                    }}
                  />
                </CardContent>
              </Card>

              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  variant="contained"
                  onClick={confirmEndSession}
                  sx={{ px: 4 }}
                >
                  End Session
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => setSessionPhase('practice')}
                >
                  Continue Practice
                </Button>
              </Box>
            </motion.div>
          </Box>
        )}
      </Box>

      {/* End Session Dialog */}
      <Dialog open={showEndDialog} onClose={() => setShowEndDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>End Practice Session?</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to end this practice session? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowEndDialog(false)}>Cancel</Button>
          <Button onClick={confirmEndSession} color="error" variant="contained">
            End Session
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PracticeSession;
