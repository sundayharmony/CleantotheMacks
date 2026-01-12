// Utility functions for the application

// Escape HTML to prevent XSS attacks
function escapeHtml(text) {
  if (!text) return '';
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
    '`': '&#096;',
    '/': '&#047;'
  };
  return String(text).replace(/[&<>"'`\/]/g, m => map[m]);
}

// Format date for display
function formatDate(dateString) {
  if (!dateString) return 'Not set';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid date';
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  } catch (e) {
    return 'Invalid date';
  }
}

// Format date for input field (YYYY-MM-DD)
function formatDateForInput(dateString) {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return date.toISOString().split('T')[0];
  } catch (e) {
    return '';
  }
}

// Get status color classes
function getStatusColor(status) {
  switch (status) {
    case 'confirmed':
      return 'bg-green-100 text-green-800';
    case 'completed':
      return 'bg-gray-100 text-gray-800';
    case 'cancelled':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-blue-100 text-blue-800';
  }
}

// Get status badge color for calendar
function getStatusBadgeColor(status) {
  switch (status) {
    case 'confirmed':
      return 'bg-green-500';
    case 'completed':
      return 'bg-gray-500';
    case 'cancelled':
      return 'bg-red-500';
    default:
      return 'bg-blue-500';
  }
}

// Check if function exists
function functionExists(funcName) {
  return typeof window[funcName] === 'function';
}

// Safe get current user
function safeGetCurrentUser() {
  if (functionExists('getCurrentUser')) {
    return getCurrentUser();
  }
  return null;
}

// Safe check authentication
function safeIsAuthenticated() {
  if (functionExists('isAuthenticated')) {
    return isAuthenticated();
  }
  return false;
}

// Validate email format
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Validate date string
function isValidDate(dateString) {
  if (!dateString) return false;
  const date = new Date(dateString);
  return !isNaN(date.getTime());
}

// Sanitize user input for display
function sanitizeForDisplay(text) {
  return escapeHtml(String(text || ''));
}


