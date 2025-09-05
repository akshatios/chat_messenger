const axios = require('axios');

const API_URL = 'http://localhost:8000/api';

// Test users
const testUser1 = {
  username: 'testuser1',
  email: 'test1@example.com',
  password: 'password123'
};

const testUser2 = {
  username: 'testuser2', 
  email: 'test2@example.com',
  password: 'password123'
};

let user1Token, user2Token;
let user1Data, user2Data;

async function testAPIMessaging() {
  try {
    console.log('🚀 Starting API Message Testing...\n');

    // Step 1: Register two users
    console.log('📝 Registering test users...');
    
    try {
      const user1Response = await axios.post(`${API_URL}/auth/register`, testUser1);
      user1Token = user1Response.data.token;
      user1Data = user1Response.data.user;
      console.log(`✅ User 1 registered: ${user1Data.username} (ID: ${user1Data._id})`);
    } catch (error) {
      if (error.response?.status === 400) {
        // User already exists, try to login
        const loginResponse = await axios.post(`${API_URL}/auth/login`, {
          email: testUser1.email,
          password: testUser1.password
        });
        user1Token = loginResponse.data.token;
        user1Data = loginResponse.data.user;
        console.log(`✅ User 1 logged in: ${user1Data.username} (ID: ${user1Data._id})`);
      }
    }

    try {
      const user2Response = await axios.post(`${API_URL}/auth/register`, testUser2);
      user2Token = user2Response.data.token;
      user2Data = user2Response.data.user;
      console.log(`✅ User 2 registered: ${user2Data.username} (ID: ${user2Data._id})`);
    } catch (error) {
      if (error.response?.status === 400) {
        // User already exists, try to login
        const loginResponse = await axios.post(`${API_URL}/auth/login`, {
          email: testUser2.email,
          password: testUser2.password
        });
        user2Token = loginResponse.data.token;
        user2Data = loginResponse.data.user;
        console.log(`✅ User 2 logged in: ${user2Data.username} (ID: ${user2Data._id})`);
      }
    }

    // Step 2: User 1 searches for User 2
    console.log('\n🔍 Testing user search...');
    const searchResponse = await axios.get(
      `${API_URL}/users/search?query=${testUser2.username}`,
      { headers: { Authorization: `Bearer ${user1Token}` } }
    );
    console.log(`✅ Search found ${searchResponse.data.users.length} users`);

    // Step 3: Send a message from User 1 to User 2
    console.log('\n💬 Sending test message...');
    const messageData = {
      recipientId: user2Data._id,
      content: 'Hello from User 1! This is a test message.'
    };

    const messageResponse = await axios.post(
      `${API_URL}/messages/send`,
      messageData,
      { headers: { Authorization: `Bearer ${user1Token}` } }
    );

    console.log(`✅ Message sent successfully!`);
    console.log(`   Message ID: ${messageResponse.data.data._id}`);
    console.log(`   Content: "${messageResponse.data.data.content}"`);

    // Step 4: User 2 retrieves messages
    console.log('\n📥 Retrieving messages for User 2...');
    const messagesResponse = await axios.get(
      `${API_URL}/messages/${user1Data._id}`,
      { headers: { Authorization: `Bearer ${user2Token}` } }
    );

    console.log(`✅ Retrieved ${messagesResponse.data.messages.length} messages`);
    if (messagesResponse.data.messages.length > 0) {
      const lastMessage = messagesResponse.data.messages[messagesResponse.data.messages.length - 1];
      console.log(`   Last message: "${lastMessage.content}"`);
      console.log(`   From: ${lastMessage.sender.username}`);
      console.log(`   To: ${lastMessage.recipient.username}`);
    }

    // Step 5: Test conversations list
    console.log('\n📋 Testing conversations list...');
    const conversationsResponse = await axios.get(
      `${API_URL}/messages/conversations/list`,
      { headers: { Authorization: `Bearer ${user2Token}` } }
    );

    console.log(`✅ Found ${conversationsResponse.data.conversations.length} conversations`);
    if (conversationsResponse.data.conversations.length > 0) {
      const conv = conversationsResponse.data.conversations[0];
      console.log(`   Conversation with: ${conv.contact.username}`);
      console.log(`   Last message: "${conv.lastMessage.content}"`);
    }

    console.log('\n🎉 All API tests passed! Messages are working correctly via API.');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    console.error('Stack:', error.stack);
  }
}

testAPIMessaging();
