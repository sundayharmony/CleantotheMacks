// Authentication utility module for localStorage-based auth

// Constants
const ADMIN_EMAIL = 'admin@example.com';

// Simple hash function (for demo purposes - not cryptographically secure)
async function hashPassword(password) {
  // Use Web Crypto API if available, otherwise simple hash
  if (window.crypto && window.crypto.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } else {
    // Fallback simple hash (not secure, but works for demo)
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
      const char = password.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
  }
}

// Generate unique ID
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

// Get users from localStorage
function getUsers() {
  const usersJson = localStorage.getItem('cttm_users');
  if (!usersJson) return [];
  try {
    return JSON.parse(usersJson);
  } catch (e) {
    console.error('Error parsing users from localStorage:', e);
    return [];
  }
}

// Save users to localStorage
function saveUsers(users) {
  try {
    localStorage.setItem('cttm_users', JSON.stringify(users));
  } catch (e) {
    console.error('Error saving users to localStorage:', e);
    throw new Error('Unable to save data. Please clear some space and try again.');
  }
}

// Get bookings from localStorage
function getBookings() {
  const bookingsJson = localStorage.getItem('cttm_bookings');
  if (!bookingsJson) return [];
  try {
    return JSON.parse(bookingsJson);
  } catch (e) {
    console.error('Error parsing bookings from localStorage:', e);
    return [];
  }
}

// Save bookings to localStorage
function saveBookings(bookings) {
  try {
    localStorage.setItem('cttm_bookings', JSON.stringify(bookings));
  } catch (e) {
    console.error('Error saving bookings to localStorage:', e);
    throw new Error('Unable to save booking. Please clear some space and try again.');
  }
}

// Get signups from localStorage
function getSignups() {
  const signupsJson = localStorage.getItem('cttm_userSignups');
  if (!signupsJson) return [];
  try {
    return JSON.parse(signupsJson);
  } catch (e) {
    console.error('Error parsing signups from localStorage:', e);
    return [];
  }
}

// Save signups to localStorage
function saveSignups(signups) {
  try {
    localStorage.setItem('cttm_userSignups', JSON.stringify(signups));
  } catch (e) {
    console.error('Error saving signups to localStorage:', e);
    // Non-critical, don't throw
  }
}

// Create a new user
async function createUser(name, email, password, role = null) {
  const users = getUsers();
  
  // Check if user already exists (case-insensitive)
  if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
    throw new Error('User with this email already exists');
  }
  
  // Automatically set admin role for admin@example.com
  let userRole = role;
  if (!userRole) {
    userRole = (email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) ? 'admin' : 'user';
  }
  
  // Validate role
  if (userRole !== 'user' && userRole !== 'admin') {
    throw new Error('Invalid role. Must be "user" or "admin"');
  }
  
  // Hash password
  const hashedPassword = await hashPassword(password);
  
  // Create user object
  const user = {
    id: generateId(),
    name: name,
    email: email,
    password: hashedPassword,
    role: userRole,
    createdAt: new Date().toISOString()
  };
  
  // Add to users array
  users.push(user);
  saveUsers(users);
  
  // Track signup
  trackSignup(user.id, email);
  
  return user;
}

// Ensure admin@example.com has admin role
function ensureAdminUser() {
  const users = getUsers();
  const adminUser = users.find(u => u.email.toLowerCase() === ADMIN_EMAIL.toLowerCase());
  
  // If admin user exists but doesn't have admin role, update it
  if (adminUser && adminUser.role !== 'admin') {
    adminUser.role = 'admin';
    const userIndex = users.findIndex(u => u.id === adminUser.id);
    if (userIndex !== -1) {
      users[userIndex].role = 'admin';
      saveUsers(users);
    }
  }
}

// Initialize admin user when script loads
if (typeof window !== 'undefined') {
  // Use DOMContentLoaded to ensure localStorage is available
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ensureAdminUser);
  } else {
    ensureAdminUser();
  }
}

// Authenticate user
async function authenticateUser(email, password) {
  const users = getUsers();
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  
  if (!user) {
    throw new Error('Invalid email or password');
  }
  
  // Hash provided password and compare
  const hashedPassword = await hashPassword(password);
  
  if (user.password !== hashedPassword) {
    throw new Error('Invalid email or password');
  }
  
  // Ensure admin@example.com has admin role (in case it was created before this update)
  if (user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase() && user.role !== 'admin') {
    user.role = 'admin';
    const allUsers = getUsers();
    const userIndex = allUsers.findIndex(u => u.id === user.id);
    if (userIndex !== -1) {
      allUsers[userIndex].role = 'admin';
      saveUsers(allUsers);
    }
  }
  
  return user;
}

// Get current logged-in user
function getCurrentUser() {
  // Ensure admin user has correct role
  ensureAdminUser();
  
  const userId = localStorage.getItem('cttm_currentUser');
  if (!userId) return null;
  
  const users = getUsers();
  const user = users.find(u => u.id === userId) || null;
  
  // Double-check admin role for admin@example.com
  if (user && user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase() && user.role !== 'admin') {
    user.role = 'admin';
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex !== -1) {
      users[userIndex].role = 'admin';
      saveUsers(users);
    }
  }
  
  return user;
}

// Set current user (login)
function setCurrentUser(userId) {
  localStorage.setItem('cttm_currentUser', userId);
}

// Sign out
function signOut() {
  localStorage.removeItem('cttm_currentUser');
}

// Check if user is authenticated
function isAuthenticated() {
  return getCurrentUser() !== null;
}

// Track user signup
function trackSignup(userId, email) {
  const signups = getSignups();
  signups.push({
    userId: userId,
    email: email,
    timestamp: new Date().toISOString()
  });
  saveSignups(signups);
}

// Create a booking
function createBooking(bookingData) {
  const bookings = getBookings();
  const booking = {
    id: generateId(),
    ...bookingData,
    createdAt: new Date().toISOString()
  };
  bookings.push(booking);
  saveBookings(bookings);
  return booking;
}

// Get bookings for a user
function getUserBookings(userId) {
  const bookings = getBookings();
  return bookings.filter(b => b.userId === userId);
}

// Get booking by ID
function getBookingById(bookingId) {
  const bookings = getBookings();
  return bookings.find(b => b.id === bookingId);
}

// Update booking
function updateBooking(bookingId, updates) {
  const bookings = getBookings();
  const index = bookings.findIndex(b => b.id === bookingId);
  if (index !== -1) {
    bookings[index] = { ...bookings[index], ...updates };
    saveBookings(bookings);
    return bookings[index];
  }
  return null;
}

// Delete booking
function deleteBooking(bookingId) {
  const bookings = getBookings();
  const filtered = bookings.filter(b => b.id !== bookingId);
  saveBookings(filtered);
  return filtered.length < bookings.length;
}

// Check if user is admin
function isAdmin(userId) {
  const user = getUsers().find(u => u.id === userId);
  return user && user.role === 'admin';
}

// Check if current user is admin
function isCurrentUserAdmin() {
  const currentUser = getCurrentUser();
  return currentUser && currentUser.role === 'admin';
}

// Get all users
function getAllUsers() {
  return getUsers();
}

// Update user role
function updateUserRole(userId, newRole) {
  if (newRole !== 'user' && newRole !== 'admin') {
    throw new Error('Invalid role. Must be "user" or "admin"');
  }
  
  const users = getUsers();
  const userIndex = users.findIndex(u => u.id === userId);
  
  if (userIndex === -1) {
    throw new Error('User not found');
  }
  
  users[userIndex].role = newRole;
  saveUsers(users);
  return users[userIndex];
}

// Delete user
function deleteUser(userId) {
  const users = getUsers();
  const filtered = users.filter(u => u.id !== userId);
  
  if (filtered.length === users.length) {
    return false; // User not found
  }
  
  saveUsers(filtered);
  
  // Also delete user's bookings
  const bookings = getBookings();
  const filteredBookings = bookings.filter(b => b.userId !== userId);
  saveBookings(filteredBookings);
  
  return true;
}

// Get all bookings (for admin)
function getAllBookings() {
  return getBookings();
}

// Get booking statistics
function getBookingStats() {
  const bookings = getBookings();
  const stats = {
    total: bookings.length,
    pending: 0,
    confirmed: 0,
    completed: 0,
    cancelled: 0,
    residential: 0,
    commercial: 0
  };
  
  bookings.forEach(booking => {
    const status = booking.status || 'pending';
    stats[status] = (stats[status] || 0) + 1;
    
    if (booking.propertyType === 'residential') {
      stats.residential++;
    } else if (booking.propertyType === 'commercial') {
      stats.commercial++;
    }
  });
  
  return stats;
}

// Get user statistics
function getUserStats() {
  const users = getUsers();
  const signups = getSignups();
  
  return {
    total: users.length,
    admins: users.filter(u => u.role === 'admin').length,
    regular: users.filter(u => u.role === 'user').length,
    signupsToday: signups.filter(s => {
      const signupDate = new Date(s.timestamp);
      const today = new Date();
      return signupDate.toDateString() === today.toDateString();
    }).length,
    signupsThisWeek: signups.filter(s => {
      const signupDate = new Date(s.timestamp);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return signupDate >= weekAgo;
    }).length
  };
}

// Form Configuration Management
function getFormConfig() {
  const configJson = localStorage.getItem('cttm_formConfig');
  if (!configJson) {
    return getDefaultFormConfig();
  }
  try {
    return JSON.parse(configJson);
  } catch (e) {
    console.error('Error parsing form config from localStorage:', e);
    return getDefaultFormConfig();
  }
}

function saveFormConfig(config) {
  try {
    localStorage.setItem('cttm_formConfig', JSON.stringify(config));
  } catch (e) {
    console.error('Error saving form config to localStorage:', e);
    throw new Error('Unable to save form configuration. Please clear some space and try again.');
  }
}

// Navigation Settings Management
function getNavigationSettings() {
  const settingsJson = localStorage.getItem('cttm_navigationSettings');
  if (!settingsJson) {
    return {
      showMembership: false
    };
  }
  try {
    return JSON.parse(settingsJson);
  } catch (e) {
    console.error('Error parsing navigation settings from localStorage:', e);
    return {
      showMembership: false
    };
  }
}

function saveNavigationSettings(settings) {
  try {
    localStorage.setItem('cttm_navigationSettings', JSON.stringify(settings));
  } catch (e) {
    console.error('Error saving navigation settings to localStorage:', e);
    throw new Error('Unable to save navigation settings. Please clear some space and try again.');
  }
}

function getDefaultFormConfig() {
  return {
    complexity: {
      label: 'Complexity',
      required: true,
      options: [
        { value: 'Simple', label: 'Simple' },
        { value: 'Moderate', label: 'Moderate' },
        { value: 'Complex', label: 'Complex' }
      ]
    },
    homeSize: {
      label: 'Home Size',
      required: true,
      options: [
        { value: '1-2 bedrooms', label: '1-2 bedrooms' },
        { value: '3-4 bedrooms', label: '3-4 bedrooms' },
        { value: '5+ bedrooms', label: '5+ bedrooms' },
        { value: 'Studio', label: 'Studio' }
      ]
    },
    officeType: {
      label: 'Office Type',
      required: true,
      options: [
        { value: 'Office', label: 'Office' },
        { value: 'Retail', label: 'Retail' },
        { value: 'Warehouse', label: 'Warehouse' },
        { value: 'Restaurant', label: 'Restaurant' },
        { value: 'Other', label: 'Other' }
      ]
    },
    fieldLabels: {
      name: 'Name',
      email: 'Email',
      phone: 'Phone',
      address: 'Address',
      complexity: 'Complexity',
      preferredDate: 'Preferred Date',
      additionalInfo: 'Additional Information',
      homeSize: 'Home Size',
      bedrooms: 'Bedrooms',
      bathrooms: 'Bathrooms',
      squareFootage: 'Square Footage',
      businessName: 'Business Name',
      officeType: 'Office Type',
      numberOfFloors: 'Number of Floors',
      numberOfEmployees: 'Number of Employees'
    }
  };
}

// Export functions for use in other scripts

