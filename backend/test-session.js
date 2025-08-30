const io = require('socket.io-client');

const socket1 = io('http://localhost:5001');
const socket2 = io('http://localhost:5001');

let sessionData = null;

socket1.on('connect', () => {
  console.log('✅ Socket 1 connected');
  
  // Join with user data
  socket1.emit('user-join', {
    id: 'user-test1',
    firstName: 'Test',
    lastName: 'User1',
    email: 'test1@example.com'
  });
  
  // Set availability
  setTimeout(() => {
    console.log('🟢 Setting user 1 to available');
    socket1.emit('update-availability', {
      userId: 'user-test1',
      isAvailable: true
    });
  }, 1000);
});

socket2.on('connect', () => {
  console.log('✅ Socket 2 connected');
  
  // Join with user data
  socket2.emit('user-join', {
    id: 'user-test2',
    firstName: 'Test',
    lastName: 'User2',
    email: 'test2@example.com'
  });
  
  // Set availability
  setTimeout(() => {
    console.log('🟢 Setting user 2 to available');
    socket2.emit('update-availability', {
      userId: 'user-test2',
      isAvailable: true
    });
  }, 1000);
});

// Set up event listeners for both sockets
socket1.on('session-started', (session) => {
  console.log('🎬 Socket 1: Session started!');
  console.log('Session data:', JSON.stringify(session, null, 2));
  sessionData = session;
});

socket2.on('session-started', (session) => {
  console.log('🎬 Socket 2: Session started!');
  console.log('Session data:', JSON.stringify(session, null, 2));
  sessionData = session;
});

socket1.on('invitation-received', (invitation) => {
  console.log('📨 Socket 1: Received invitation');
  console.log('Invitation data:', JSON.stringify(invitation, null, 2));
  
  // Accept the invitation
  setTimeout(() => {
    console.log('✅ Socket 1: Accepting invitation');
    socket1.emit('accept-invitation', {
      requestId: invitation.id,
      userId: 'user-test1'
    });
  }, 1000);
});

socket2.on('invitation-received', (invitation) => {
  console.log('📨 Socket 2: Received invitation');
  console.log('Invitation data:', JSON.stringify(invitation, null, 2));
  
  // Accept the invitation
  setTimeout(() => {
    console.log('✅ Socket 2: Accepting invitation');
    socket2.emit('accept-invitation', {
      requestId: invitation.id,
      userId: 'user-test2'
    });
  }, 1000);
});

// Start quick match after both users are available
setTimeout(() => {
  console.log('🎯 Starting quick match with user 1');
  socket1.emit('quick-match', {
    userId: 'user-test1',
    topic: 'Test Session',
    skillLevel: 'intermediate',
    preferredSkillLevel: 'any',
    sessionLength: 15
  });
}, 3000);

// Cleanup after 10 seconds
setTimeout(() => {
  console.log('🧹 Cleaning up');
  console.log('Final session data:', sessionData);
  socket1.disconnect();
  socket2.disconnect();
  process.exit(0);
}, 10000);
