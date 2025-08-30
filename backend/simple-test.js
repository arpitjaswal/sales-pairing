const io = require('socket.io-client');

const socket = io('http://localhost:5001');

socket.on('connect', () => {
  console.log('✅ Connected to server');
  
  // Join with user data
  socket.emit('user-join', {
    id: 'user-testuser',
    firstName: 'Test',
    lastName: 'User',
    email: 'test@example.com'
  });
  
  // Set availability
  setTimeout(() => {
    console.log('🟢 Setting user to available');
    socket.emit('update-availability', {
      userId: 'user-testuser',
      isAvailable: true
    });
  }, 1000);
  
  // Start quick match
  setTimeout(() => {
    console.log('🎯 Starting quick match');
    socket.emit('quick-match', {
      userId: 'user-testuser',
      topic: 'Test Session',
      skillLevel: 'intermediate',
      preferredSkillLevel: 'any',
      sessionLength: 15
    });
  }, 2000);
});

socket.on('disconnect', () => {
  console.log('❌ Disconnected from server');
});

socket.on('quick-match-found', (data) => {
  console.log('🎉 Quick match found:', data.message);
});

socket.on('quick-match-error', (data) => {
  console.log('❌ Quick match error:', data.message);
});

socket.on('invitation-received', (data) => {
  console.log('📨 Invitation received:', data);
});

// Cleanup after 10 seconds
setTimeout(() => {
  console.log('🧹 Cleaning up');
  socket.disconnect();
  process.exit(0);
}, 10000);
