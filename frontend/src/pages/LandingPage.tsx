import {
  Box,
  Container,
  Typography,
  Button,

  Card,
  CardContent,
  Stack,
  Chip,
  Avatar,
  Paper,
  AppBar,
  Toolbar,
} from '@mui/material';
import {
  PlayArrow,
  Download,
  People,
  Timer,
  EmojiEvents,
  Chat,
  Shuffle,
  Notifications,
  Analytics,
  Star,
} from '@mui/icons-material';

const features = [
  {
    icon: <People sx={{ fontSize: 40 }} />,
    title: 'Human-to-Human Practice',
    description: 'Connect with real sales professionals for authentic practice sessions. No AI, just real people helping each other improve.',
    color: '#1976d2',
  },
  {
    icon: <Shuffle sx={{ fontSize: 40 }} />,
    title: 'One-Click Matching',
    description: 'Get instantly matched with available sales professionals based on your skill level and preferences.',
    color: '#dc004e',
  },
  {
    icon: <Timer sx={{ fontSize: 40 }} />,
    title: 'Timed Practice Sessions',
    description: 'Structured 10-30 minute sessions with built-in timers, prompts, and feedback systems.',
    color: '#2e7d32',
  },
  {
    icon: <Chat sx={{ fontSize: 40 }} />,
    title: 'Real-time Text Chat',
    description: 'Practice sales conversations through live text chat with instant messaging and typing indicators.',
    color: '#ed6c02',
  },
  {
    icon: <EmojiEvents sx={{ fontSize: 40 }} />,
    title: 'Gamification & Leaderboards',
    description: 'Earn points, build streaks, and compete on leaderboards. Track your progress and achievements.',
    color: '#9c27b0',
  },
  {
    icon: <Notifications sx={{ fontSize: 40 }} />,
    title: 'Instant Notifications',
    description: 'Get real-time notifications for matches, invitations, and session updates across all devices.',
    color: '#d32f2f',
  },
];

const skills = [
  'Cold Calling',
  'Objection Handling', 
  'Closing Techniques',
  'Value Proposition',
  'Discovery Calls',
  'Price Negotiation',
  'Follow-up Strategies',
  'Relationship Building'
];

const testimonials = [
  {
    name: 'Sarah Johnson',
    role: 'Sales Manager',
    company: 'TechCorp',
    avatar: 'SJ',
    rating: 5,
    comment: 'This platform transformed our sales training. Our team\'s performance improved by 40% in just 3 months.',
  },
  {
    name: 'Michael Chen',
    role: 'Account Executive',
    company: 'SalesForce',
    avatar: 'MC',
    rating: 5,
    comment: 'The real-time feedback and peer practice sessions are game-changers for sales professionals.',
  },
  {
    name: 'Emily Rodriguez',
    role: 'Sales Director',
    company: 'GrowthCo',
    avatar: 'ER',
    rating: 5,
    comment: 'Finally, a platform that makes sales training engaging and effective. Highly recommended!',
  },
];

const stats = [
  { number: '10,000+', label: 'Active Users' },
  { number: '50,000+', label: 'Sessions Completed' },
  { number: '95%', label: 'Satisfaction Rate' },
  { number: '40%', label: 'Performance Improvement' },
];

const howItWorks = [
  {
    step: '1',
    title: 'Set Your Availability',
    description: 'Toggle your status to available and set your preferences for skill level and session duration.',
    icon: <Notifications sx={{ fontSize: 30 }} />,
  },
  {
    step: '2',
    title: 'Get Matched Instantly',
    description: 'Our system finds the perfect practice partner based on your skills and availability.',
    icon: <Shuffle sx={{ fontSize: 30 }} />,
  },
  {
    step: '3',
    title: 'Practice & Improve',
    description: 'Engage in real-time sales conversations with structured prompts and feedback.',
    icon: <Chat sx={{ fontSize: 30 }} />,
  },
  {
    step: '4',
    title: 'Track Your Progress',
    description: 'Monitor your improvement with detailed analytics, ratings, and achievement tracking.',
    icon: <Analytics sx={{ fontSize: 30 }} />,
  },
];

const LandingPage = () => {
  const navigate = (path: string) => {
    console.log(`Navigating to ${path}`);
  };

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      bgcolor: '#0a0a0a',
      color: 'white',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background Gradient */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '100vh',
          background: 'radial-gradient(ellipse at top, rgba(255, 215, 0, 0.1) 0%, transparent 50%)',
          zIndex: 0,
        }}
      />

      {/* Header */}
      <AppBar 
        position="static" 
        sx={{ 
          bgcolor: 'rgba(10, 10, 10, 0.95)', 
          boxShadow: 'none',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          backdropFilter: 'blur(10px)',
          zIndex: 10
        }}
      >
        <Container maxWidth="lg">
          <Toolbar sx={{ justifyContent: 'space-between', py: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  background: 'linear-gradient(135deg, #ffd700, #ffed4e)',
                  borderRadius: 2,
                  mr: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 15px rgba(255, 215, 0, 0.3)',
                }}
              >
                <Typography variant="h6" sx={{ color: 'black', fontSize: '1rem', fontWeight: 700 }}>
                  SP
                </Typography>
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 700, letterSpacing: '0.5px' }}>
                SALES PAIRING
              </Typography>
            </Box>

            <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 4 }}>
              <Typography sx={{ 
                cursor: 'pointer', 
                transition: 'all 0.3s ease',
                '&:hover': { color: '#ffd700', transform: 'translateY(-2px)' } 
              }}>
                Features
              </Typography>
              <Typography sx={{ 
                cursor: 'pointer', 
                transition: 'all 0.3s ease',
                '&:hover': { color: '#ffd700', transform: 'translateY(-2px)' }
              }}>
                How It Works
              </Typography>
              <Typography sx={{ 
                cursor: 'pointer', 
                transition: 'all 0.3s ease',
                '&:hover': { color: '#ffd700', transform: 'translateY(-2px)' }
              }}>
                Community
              </Typography>
              <Typography sx={{ 
                cursor: 'pointer', 
                transition: 'all 0.3s ease',
                '&:hover': { color: '#ffd700', transform: 'translateY(-2px)' }
              }}>
                Support
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="outlined"
                sx={{
                  borderColor: 'rgba(255,255,255,0.3)',
                  color: 'white',
                  px: 3,
                  py: 1,
                  borderRadius: 2,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    borderColor: '#ffd700',
                    color: '#ffd700',
                    bgcolor: 'rgba(255,215,0,0.1)',
                    transform: 'translateY(-2px)'
                  }
                }}
                onClick={() => navigate('/login')}
              >
                Sign in
              </Button>
              <Button
                variant="contained"
                startIcon={<Download />}
                sx={{
                  background: 'linear-gradient(135deg, #ffd700, #ffed4e)',
                  color: 'black',
                  px: 3,
                  py: 1,
                  borderRadius: 2,
                  fontWeight: 600,
                  boxShadow: '0 4px 15px rgba(255, 215, 0, 0.3)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #ffed4e, #fff59d)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 6px 20px rgba(255, 215, 0, 0.4)'
                  }
                }}
                onClick={() => navigate('/register')}
              >
                Get Started
              </Button>
            </Box>
          </Toolbar>
        </Container>
      </AppBar>

      {/* Hero Section */}
      <Container maxWidth="lg" sx={{ py: { xs: 8, md: 12 }, position: 'relative', zIndex: 1 }}>
        <Box sx={{ textAlign: 'center', mb: 10 }}>
          <Typography
            variant="h1"
            sx={{
              fontSize: { xs: '3rem', md: '5rem', lg: '6rem' },
              fontWeight: 800,
              mb: 4,
              background: 'linear-gradient(135deg, #fff 0%, #ccc 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              lineHeight: 1.1,
              letterSpacing: '-2px'
            }}
          >
            Practice Sales with{' '}
            <Box component="span" sx={{ 
              background: 'linear-gradient(135deg, #ffd700, #ffed4e)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              Real People
            </Box>
          </Typography>
          <Typography
            variant="h5"
            sx={{
              mb: 8,
              opacity: 0.9,
              fontWeight: 300,
              maxWidth: 900,
              mx: 'auto',
              lineHeight: 1.6,
              fontSize: { xs: '1.2rem', md: '1.5rem' }
            }}
          >
            Connect with sales professionals worldwide for authentic practice sessions. 
            No AI, no scripts—just real conversations that make you better.
          </Typography>
          <Stack 
            direction={{ xs: 'column', sm: 'row' }} 
            spacing={3} 
            justifyContent="center"
            alignItems="center"
          >
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate('/register')}
              sx={{
                background: 'linear-gradient(135deg, #ffd700, #ffed4e)',
                color: 'black',
                px: 6,
                py: 2,
                fontSize: '1.2rem',
                fontWeight: 700,
                borderRadius: 3,
                boxShadow: '0 8px 25px rgba(255, 215, 0, 0.4)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  background: 'linear-gradient(135deg, #ffed4e, #fff59d)',
                  transform: 'translateY(-4px)',
                  boxShadow: '0 12px 35px rgba(255, 215, 0, 0.5)'
                },
              }}
            >
              Start Practicing Free
            </Button>
            <Button
              variant="outlined"
              size="large"
              startIcon={<PlayArrow />}
              sx={{
                borderColor: 'rgba(255,255,255,0.4)',
                color: 'white',
                px: 6,
                py: 2,
                fontSize: '1.2rem',
                borderRadius: 3,
                borderWidth: 2,
                transition: 'all 0.3s ease',
                '&:hover': {
                  borderColor: '#ffd700',
                  color: '#ffd700',
                  bgcolor: 'rgba(255,215,0,0.1)',
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 25px rgba(255, 215, 0, 0.2)'
                },
              }}
            >
              Watch Demo
            </Button>
          </Stack>
        </Box>

        {/* Stats Section */}
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
          {stats.map((stat, _index) => (
            <Box sx={{ flex: { xs: "0 0 50%", md: "0 0 25%" } }}>
              <Box textAlign="center">
                <Typography
                  variant="h2"
                  sx={{
                    fontWeight: 800,
                    background: 'linear-gradient(135deg, #ffd700, #ffed4e)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    mb: 1,
                    fontSize: { xs: '2.5rem', md: '3.5rem' }
                  }}
                >
                  {stat.number}
                </Typography>
                <Typography variant="h6" sx={{ opacity: 0.8, fontWeight: 300 }}>
                  {stat.label}
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>
      </Container>

      {/* How It Works Section */}
      <Box sx={{ py: 12, bgcolor: 'rgba(17, 17, 17, 0.8)', backdropFilter: 'blur(10px)' }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 10 }}>
            <Typography
              variant="h2"
              sx={{
                fontWeight: 700,
                mb: 3,
                fontSize: { xs: '2.5rem', md: '3.5rem' }
              }}
            >
              How It Works
            </Typography>
            <Typography
              variant="h5"
              sx={{
                mb: 6,
                opacity: 0.8,
                fontWeight: 300,
                maxWidth: 600,
                mx: 'auto'
              }}
            >
              Get started in minutes, not hours. Simple, effective, powerful.
            </Typography>
          </Box>

          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
            {howItWorks.map((step, _index) => (
              <Box sx={{ flex: { xs: "1 1 100%", sm: "0 0 50%", md: "0 0 50%" } }}>
                <Card
                  sx={{
                    height: '100%',
                    bgcolor: 'rgba(42, 42, 42, 0.8)',
                    borderRadius: 4,
                    border: '1px solid rgba(255,255,255,0.15)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                    backdropFilter: 'blur(10px)',
                    transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                    '&:hover': {
                      transform: 'translateY(-12px) scale(1.02)',
                      boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
                      border: '1px solid rgba(255,215,0,0.3)',
                      bgcolor: 'rgba(42, 42, 42, 0.9)',
                    },
                  }}
                >
                  <CardContent sx={{ p: 4, textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <Box
                      sx={{
                        width: 80,
                        height: 80,
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #ffd700, #ffed4e)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mx: 'auto',
                        mb: 4,
                        color: 'black',
                        boxShadow: '0 8px 25px rgba(255, 215, 0, 0.4)',
                      }}
                    >
                      <Typography variant="h3" sx={{ fontWeight: 800 }}>
                        {step.step}
                      </Typography>
                    </Box>
                    <Typography variant="h4" sx={{ mb: 3, fontWeight: 700, color: 'white' }}>
                      {step.title}
                    </Typography>
                    <Typography variant="body1" sx={{ 
                      color: 'rgba(255,255,255,0.85)', 
                      lineHeight: 1.8, 
                      fontSize: '1.1rem',
                      fontWeight: 300
                    }}>
                      {step.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Box>
            ))}
          </Box>
        </Container>
      </Box>

      {/* Skills Section */}
      <Box sx={{ py: 12 }}>
        <Container maxWidth="lg">
          <Typography
            variant="h2"
            textAlign="center"
            sx={{ mb: 3, fontWeight: 700, fontSize: { xs: '2.5rem', md: '3.5rem' } }}
          >
            Practice Any Sales Skill
          </Typography>
          <Typography
            variant="h5"
            textAlign="center"
            sx={{ mb: 10, opacity: 0.8, fontWeight: 300, maxWidth: 700, mx: 'auto' }}
          >
            From cold calling to closing, practice the skills that matter most in your sales journey
          </Typography>

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, justifyContent: 'center', maxWidth: 800, mx: 'auto' }}>
            {skills.map((skill, index) => (
              <Chip
                key={index}
                label={skill}
                sx={{
                  bgcolor: 'rgba(26, 26, 26, 0.8)',
                  color: 'white',
                  border: '2px solid rgba(255,255,255,0.2)',
                  fontSize: '1.1rem',
                  px: 3,
                  py: 1.5,
                  height: 'auto',
                  borderRadius: 3,
                  fontWeight: 500,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #ffd700, #ffed4e)',
                    color: 'black',
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 20px rgba(255, 215, 0, 0.3)',
                    border: '2px solid #ffd700',
                  }
                }}
              />
            ))}
          </Box>
        </Container>
      </Box>

      {/* Features Section */}
      <Box sx={{ py: 12, bgcolor: 'rgba(17, 17, 17, 0.8)', backdropFilter: 'blur(10px)' }}>
        <Container maxWidth="lg">
          <Typography
            variant="h2"
            textAlign="center"
            sx={{ mb: 3, fontWeight: 700, fontSize: { xs: '2.5rem', md: '3.5rem' } }}
          >
            Everything You Need to Excel
          </Typography>
          <Typography
            variant="h5"
            textAlign="center"
            sx={{ mb: 10, opacity: 0.8, fontWeight: 300, maxWidth: 700, mx: 'auto' }}
          >
            Powerful features designed specifically for modern sales professionals
          </Typography>

          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
            {features.map((feature, _index) => (
              <Box sx={{ flex: { xs: "1 1 100%", sm: "0 0 50%", md: "0 0 50%" } }}>
                <Card
                  sx={{
                    height: '100%',
                    bgcolor: 'rgba(42, 42, 42, 0.8)',
                    borderRadius: 4,
                    border: '1px solid rgba(255,255,255,0.15)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                    backdropFilter: 'blur(10px)',
                    transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                    '&:hover': {
                      transform: 'translateY(-12px) scale(1.02)',
                      boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
                      border: `1px solid ${feature.color}40`,
                      bgcolor: 'rgba(42, 42, 42, 0.9)',
                    },
                  }}
                >
                  <CardContent sx={{ p: 4, textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <Box
                      sx={{
                        width: 100,
                        height: 100,
                        borderRadius: '50%',
                        bgcolor: `${feature.color}15`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mx: 'auto',
                        mb: 4,
                        color: feature.color,
                        border: `3px solid ${feature.color}30`,
                        transition: 'all 0.3s ease',
                      }}
                    >
                      {feature.icon}
                    </Box>
                    <Typography variant="h4" sx={{ mb: 3, fontWeight: 700, color: 'white' }}>
                      {feature.title}
                    </Typography>
                    <Typography variant="body1" sx={{ 
                      color: 'rgba(255,255,255,0.85)', 
                      lineHeight: 1.8, 
                      fontSize: '1.1rem',
                      fontWeight: 300
                    }}>
                      {feature.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Box>
            ))}
          </Box>
        </Container>
      </Box>

      {/* Testimonials Section */}
      <Box sx={{ py: 12 }}>
        <Container maxWidth="lg">
          <Typography
            variant="h2"
            textAlign="center"
            sx={{ mb: 3, fontWeight: 700, fontSize: { xs: '2.5rem', md: '3.5rem' } }}
          >
            What Sales Professionals Say
          </Typography>
          <Typography
            variant="h5"
            textAlign="center"
            sx={{ mb: 10, opacity: 0.8, fontWeight: 300, maxWidth: 700, mx: 'auto' }}
          >
            Join thousands of satisfied sales professionals who've transformed their careers
          </Typography>

          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
            {testimonials.map((testimonial, _index) => (
              <Box sx={{ flex: { xs: "1 1 100%", md: "0 0 calc(33.33% - 16px)" } }}>
                <Paper
                  sx={{
                    p: 4,
                    height: '100%',
                    bgcolor: 'rgba(42, 42, 42, 0.8)',
                    borderRadius: 4,
                    border: '1px solid rgba(255,255,255,0.15)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                    backdropFilter: 'blur(10px)',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: '0 16px 40px rgba(0,0,0,0.4)',
                      border: '1px solid rgba(255,215,0,0.3)',
                    },
                  }}
                >
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, justifyContent: 'center' }}>
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} sx={{ color: '#ffd700', fontSize: 24, mx: 0.2 }} />
                      ))}
                    </Box>
                    <Typography
                      variant="body1"
                      sx={{ 
                        mb: 4, 
                        fontStyle: 'italic', 
                        lineHeight: 1.8, 
                        color: 'rgba(255,255,255,0.9)',
                        fontSize: '1.1rem',
                        textAlign: 'center'
                      }}
                    >
                      "{testimonial.comment}"
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Avatar sx={{ 
                      mr: 2, 
                      bgcolor: '#ffd700', 
                      color: 'black',
                      width: 50,
                      height: 50,
                      fontSize: '1.2rem',
                      fontWeight: 700
                    }}>
                      {testimonial.avatar}
                    </Avatar>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h6" fontWeight={700} sx={{ color: 'white' }}>
                        {testimonial.name}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                        {testimonial.role} at {testimonial.company}
                      </Typography>
                    </Box>
                  </Box>
                </Paper>
              </Box>
            ))}
          </Box>
        </Container>
      </Box>

      {/* CTA Section */}
      <Box
        sx={{
          py: 12,
          bgcolor: 'rgba(26, 26, 26, 0.9)',
          borderTop: '1px solid rgba(255,255,255,0.1)',
          backdropFilter: 'blur(10px)',
          position: 'relative'
        }}
      >
        <Container maxWidth="md">
          <Typography
            variant="h2"
            textAlign="center"
            sx={{ mb: 4, fontWeight: 700, fontSize: { xs: '2.5rem', md: '4rem' } }}
          >
            Ready to Transform Your Sales Skills?
          </Typography>
          <Typography
            variant="h5"
            textAlign="center"
            sx={{ mb: 8, opacity: 0.8, fontWeight: 300, lineHeight: 1.6 }}
          >
            Join thousands of sales professionals who are already improving their performance with real practice sessions.
          </Typography>
          <Box textAlign="center">
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate('/register')}
              sx={{
                background: 'linear-gradient(135deg, #ffd700, #ffed4e)',
                color: 'black',
                px: 8,
                py: 3,
                fontSize: '1.3rem',
                fontWeight: 700,
                borderRadius: 4,
                boxShadow: '0 12px 35px rgba(255, 215, 0, 0.4)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  background: 'linear-gradient(135deg, #ffed4e, #fff59d)',
                  transform: 'translateY(-6px)',
                  boxShadow: '0 20px 50px rgba(255, 215, 0, 0.5)'
                },
              }}
            >
              Start Practicing Free Today
            </Button>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default LandingPage;