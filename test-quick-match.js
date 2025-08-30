// Quick Match Test Script
// This script helps test the multi-user quick match functionality

const io = require('socket.io-client');

// Test configuration
const TEST_USERS = [
  { email: 'user1@test.com', name: 'User One' },
  { email: 'user2@test.com', name: 'User Two' },
  { email: 'user3@test.com', name: 'User Three' },
  { email: 'user4@test.com', name: 'User Four' }
];

const SOCKET_URL = 'http://localhost:5001';

class QuickMatchTester {
  constructor() {
    this.sockets = [];
    this.testResults = [];
  }

  async runTest() {
    console.log('🚀 Starting Quick Match Multi-User Test...\n');
    
    // Connect all users
    await this.connectUsers();
    
    // Set all users to available
    await this.setUsersAvailable();
    
    // Start quick match with user 1
    await this.startQuickMatch(0);
    
    // Wait for invitations and simulate responses
    await this.simulateResponses();
    
    // Cleanup
    await this.cleanup();
    
    // Show results
    this.showResults();
  }

  async connectUsers() {
    console.log('📡 Connecting users...');
    
    for (let i = 0; i < TEST_USERS.length; i++) {
      const user = TEST_USERS[i];
      const socket = io(SOCKET_URL);
      
      socket.on('connect', () => {
        console.log(`✅ ${user.name} connected`);
      });
      
      socket.on('disconnect', () => {
        console.log(`❌ ${user.name} disconnected`);
      });
      
      // Join with user data
      socket.emit('user-join', {
        id: `user-${user.email.replace(/[^a-zA-Z0-9]/g, '')}`,
        firstName: user.name.split(' ')[0],
        lastName: user.name.split(' ')[1] || '',
        email: user.email
      });
      
      this.sockets.push({ socket, user, index: i });
      
      // Wait a bit between connections
      await this.delay(500);
    }
    
    console.log(`✅ All ${TEST_USERS.length} users connected\n`);
  }

  async setUsersAvailable() {
    console.log('🟢 Setting users to available...');
    
    for (const { socket, user } of this.sockets) {
      socket.emit('update-availability', {
        userId: `user-${user.email.replace(/[^a-zA-Z0-9]/g, '')}`,
        isAvailable: true
      });
      
      await this.delay(200);
    }
    
    console.log('✅ All users set to available\n');
  }

  async startQuickMatch(userIndex) {
    const { socket, user } = this.sockets[userIndex];
    
    console.log(`🎯 ${user.name} starting quick match...`);
    
    socket.emit('quick-match', {
      userId: `user-${user.email.replace(/[^a-zA-Z0-9]/g, '')}`,
      topic: 'Test Practice Session',
      skillLevel: 'intermediate',
      preferredSkillLevel: 'any',
      sessionLength: 15
    });
    
    // Set up event listeners for this user
    this.setupEventListeners(userIndex);
  }

  setupEventListeners(userIndex) {
    const { socket, user } = this.sockets[userIndex];
    
    // Quick match events
    socket.on('quick-match-found', (data) => {
      console.log(`🎉 ${user.name}: Quick match found!`);
      this.testResults.push({
        user: user.name,
        event: 'quick-match-found',
        data: data.message
      });
    });
    
    socket.on('quick-match-queued', (data) => {
      console.log(`⏳ ${user.name}: Queued for matching`);
      this.testResults.push({
        user: user.name,
        event: 'quick-match-queued',
        data: data.message
      });
    });
    
    socket.on('quick-match-timeout', (data) => {
      console.log(`⏰ ${user.name}: Quick match timeout`);
      this.testResults.push({
        user: user.name,
        event: 'quick-match-timeout',
        data: data.message
      });
    });
    
    socket.on('quick-match-no-users', (data) => {
      console.log(`🚫 ${user.name}: No users available`);
      this.testResults.push({
        user: user.name,
        event: 'quick-match-no-users',
        data: data.message
      });
    });
    
    // Invitation events
    socket.on('invitation-received', (data) => {
      console.log(`📨 ${user.name}: Received invitation from ${data.requesterName}`);
      this.testResults.push({
        user: user.name,
        event: 'invitation-received',
        data: `From: ${data.requesterName}, Topic: ${data.topic}`
      });
      
      // Simulate response based on user
      this.simulateInvitationResponse(userIndex, data);
    });
    
    socket.on('invitation-declined', (data) => {
      console.log(`❌ ${user.name}: Invitation declined`);
      this.testResults.push({
        user: user.name,
        event: 'invitation-declined',
        data: `Request ID: ${data.requestId}`
      });
    });
    
    socket.on('session-started', (data) => {
      console.log(`🎬 ${user.name}: Session started!`);
      this.testResults.push({
        user: user.name,
        event: 'session-started',
        data: `Session ID: ${data.sessionId}`
      });
    });
  }

  async simulateInvitationResponse(userIndex, invitationData) {
    const { socket, user } = this.sockets[userIndex];
    
    // Simulate different responses based on user
    let response;
    
    if (userIndex === 1) {
      // User 2 always declines
      response = 'decline';
      console.log(`❌ ${user.name}: Declining invitation`);
    } else if (userIndex === 2) {
      // User 3 always declines
      response = 'decline';
      console.log(`❌ ${user.name}: Declining invitation`);
    } else if (userIndex === 3) {
      // User 4 always accepts
      response = 'accept';
      console.log(`✅ ${user.name}: Accepting invitation`);
    } else {
      // User 1 (requester) doesn't respond to invitations
      return;
    }
    
    await this.delay(1000); // Wait a bit before responding
    
    if (response === 'accept') {
      socket.emit('accept-invitation', {
        requestId: invitationData.id,
        userId: `user-${user.email.replace(/[^a-zA-Z0-9]/g, '')}`
      });
    } else {
      socket.emit('decline-invitation', {
        requestId: invitationData.id,
        userId: `user-${user.email.replace(/[^a-zA-Z0-9]/g, '')}`
      });
    }
  }

  async simulateResponses() {
    console.log('⏳ Waiting for invitation responses...');
    
    // Wait for the entire matching process to complete
    await this.delay(10000);
  }

  async cleanup() {
    console.log('🧹 Cleaning up connections...');
    
    for (const { socket } of this.sockets) {
      socket.disconnect();
    }
    
    await this.delay(1000);
    console.log('✅ Cleanup complete\n');
  }

  showResults() {
    console.log('📊 Test Results:');
    console.log('================');
    
    for (const result of this.testResults) {
      console.log(`${result.user}: ${result.event} - ${result.data}`);
    }
    
    console.log('\n🎯 Expected Flow:');
    console.log('1. User One starts quick match');
    console.log('2. User Two receives invitation → Declines');
    console.log('3. User Three receives invitation → Declines');
    console.log('4. User Four receives invitation → Accepts');
    console.log('5. Session starts between User One and User Four');
    
    console.log('\n✅ Test completed! Check the backend console for detailed logs.');
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Run the test
if (require.main === module) {
  const tester = new QuickMatchTester();
  tester.runTest().catch(console.error);
}

module.exports = QuickMatchTester;
