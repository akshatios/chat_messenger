const express = require('express');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// Search users by username or email
router.get('/search', auth, async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query || query.length < 2) {
      return res.status(400).json({ message: 'Search query must be at least 2 characters' });
    }

    const users = await User.find({
      $and: [
        { _id: { $ne: req.user._id } }, // Exclude current user
        {
          $or: [
            { username: { $regex: query, $options: 'i' } },
            { email: { $regex: query, $options: 'i' } }
          ]
        }
      ]
    })
    .select('username email avatar status isOnline lastSeen')
    .limit(20);

    res.json({ users });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user profile by ID
router.get('/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId)
      .select('username email avatar status isOnline lastSeen');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user profile
router.put('/profile', auth, async (req, res) => {
  try {
    const { username, status, avatar } = req.body;
    
    const updateData = {};
    if (username) updateData.username = username;
    if (status) updateData.status = status;
    if (avatar) updateData.avatar = avatar;

    // Check if username is already taken (if updating username)
    if (username && username !== req.user.username) {
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        return res.status(400).json({ message: 'Username already taken' });
      }
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true }
    ).select('-password');

    res.json({
      message: 'Profile updated successfully',
      user
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add user to contacts
router.post('/contacts/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (userId === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot add yourself as a contact' });
    }

    const contact = await User.findById(userId);
    if (!contact) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if already a contact
    if (req.user.contacts.includes(userId)) {
      return res.status(400).json({ message: 'User already in contacts' });
    }

    req.user.contacts.push(userId);
    await req.user.save();

    res.json({ message: 'Contact added successfully' });
  } catch (error) {
    console.error('Add contact error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's contacts
router.get('/contacts/list', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('contacts', 'username email avatar status isOnline lastSeen');
    
    res.json({ contacts: user.contacts });
  } catch (error) {
    console.error('Get contacts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Remove user from contacts
router.delete('/contacts/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    
    req.user.contacts = req.user.contacts.filter(
      contact => contact.toString() !== userId
    );
    await req.user.save();

    res.json({ message: 'Contact removed successfully' });
  } catch (error) {
    console.error('Remove contact error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
