// Admin Dashboard functionality

let currentFilterStatus = 'all';
let currentFilterProperty = 'all';

document.addEventListener('DOMContentLoaded', function() {
  // Check admin authentication
  if (!isAuthenticated() || !isCurrentUserAdmin()) {
    window.location.href = 'signin.html';
    return;
  }

  const currentUser = getCurrentUser();
  if (!currentUser) {
    window.location.href = 'signin.html';
    return;
  }

  // Update welcome message
  const welcomeMessage = document.getElementById('welcome-message');
  if (welcomeMessage) {
    welcomeMessage.textContent = `Welcome, ${sanitizeForDisplay(currentUser.name || currentUser.email)}!`;
  }

  // Load statistics
  loadStatistics();

  // Initialize tabs
  initializeTabs();
  
  // Handle hash navigation
  const hash = window.location.hash.substring(1);
  if (hash) {
    const tabMap = {
      'calendar': 'tab-calendar',
      'users': 'tab-users',
      'form-builder': 'tab-form-builder',
      'settings': 'tab-settings',
      'analytics': 'tab-analytics'
    };
    const tabId = tabMap[hash];
    if (tabId) {
      const tabButton = document.getElementById(tabId);
      if (tabButton) {
        setTimeout(() => tabButton.click(), 100);
      }
    }
  }

  // Load initial content
  loadAllBookings();

  // Initialize filters
  const statusFilter = document.getElementById('filter-status');
  const propertyFilter = document.getElementById('filter-property');

  // Debounce utility
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  if (statusFilter) {
    statusFilter.addEventListener('change', debounce(function() {
      currentFilterStatus = this.value;
      loadAllBookings();
    }, 300));
  }

  if (propertyFilter) {
    propertyFilter.addEventListener('change', debounce(function() {
      currentFilterProperty = this.value;
      loadAllBookings();
    }, 300));
  }

  // Modal handlers
  const modal = document.getElementById('booking-modal');
  const closeModal = document.getElementById('close-modal');
  const userModal = document.getElementById('user-modal');
  const closeUserModal = document.getElementById('close-user-modal');

  if (closeModal) {
    closeModal.addEventListener('click', () => {
      if (modal) modal.classList.add('hidden');
    });
  }

  if (closeUserModal) {
    closeUserModal.addEventListener('click', () => {
      if (userModal) userModal.classList.add('hidden');
    });
  }

  // Close modals on outside click
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.add('hidden');
      }
    });
  }

  if (userModal) {
    userModal.addEventListener('click', (e) => {
      if (e.target === userModal) {
        userModal.classList.add('hidden');
      }
    });
  }
});

// Initialize tabs
function initializeTabs() {
  const tabs = ['bookings', 'calendar', 'users', 'form-builder', 'settings', 'analytics'];
  
  tabs.forEach(tab => {
    const tabButton = document.getElementById(`tab-${tab}`);
    const tabContent = document.getElementById(`content-${tab}`);
    
    if (tabButton) {
      tabButton.addEventListener('click', () => {
        // Hide all tabs
        tabs.forEach(t => {
          const btn = document.getElementById(`tab-${t}`);
          const content = document.getElementById(`content-${t}`);
          if (btn) {
            btn.classList.remove('border-blue-600', 'text-blue-600');
            btn.classList.add('border-transparent', 'text-gray-500');
          }
          if (content) content.classList.add('hidden');
        });
        
        // Show selected tab
        tabButton.classList.remove('border-transparent', 'text-gray-500');
        tabButton.classList.add('border-blue-600', 'text-blue-600');
        if (tabContent) {
          tabContent.classList.remove('hidden');
          
          // Load content based on tab
          if (tab === 'calendar') {
            const today = new Date();
            renderCalendar(today.getFullYear(), today.getMonth(), 'admin-calendar-container', handleAdminDateClick, handleAdminBookingClick);
          } else if (tab === 'users') {
            loadAllUsers();
          } else if (tab === 'form-builder') {
            loadFormBuilder();
          } else if (tab === 'settings') {
            loadSettings();
          } else if (tab === 'analytics') {
            loadAnalytics();
          }
        }
      });
    }
  });
}

// Load statistics
function loadStatistics() {
  const stats = getBookingStats();
  const userStats = getUserStats();

  document.getElementById('stat-total').textContent = stats.total;
  document.getElementById('stat-pending').textContent = stats.pending;
  document.getElementById('stat-confirmed').textContent = stats.confirmed;
  document.getElementById('stat-users').textContent = userStats.total;
}

// Load all bookings with filters
function loadAllBookings() {
  let bookings = getAllBookings();

  // Apply filters
  if (currentFilterStatus !== 'all') {
    bookings = bookings.filter(b => (b.status || 'pending') === currentFilterStatus);
  }

  if (currentFilterProperty !== 'all') {
    bookings = bookings.filter(b => b.propertyType === currentFilterProperty);
  }

  // Sort by date (newest first)
  bookings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const bookingsList = document.getElementById('all-bookings-list');
  if (!bookingsList) return;

  if (bookings.length === 0) {
    bookingsList.innerHTML = `
      <div class="bg-white rounded-lg shadow-md p-8 text-center">
        <p class="text-gray-600">No bookings found.</p>
      </div>
    `;
    return;
  }

  let html = '';
  bookings.forEach(booking => {
    const propertyType = booking.propertyType === 'commercial' ? 'Commercial' : 'Residential';
    const statusColor = getStatusColor(booking.status || 'pending');
    const bookingName = sanitizeForDisplay(booking.name || booking.businessName || 'N/A');
    const bookingEmail = sanitizeForDisplay(booking.email || 'N/A');

    html += `
      <div class="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition" 
           onclick="handleAdminBookingClick('${escapeHtml(booking.id)}')">
        <div class="flex justify-between items-start mb-4">
          <div>
            <h3 class="text-xl font-semibold mb-2">${propertyType} Cleaning Request</h3>
            <p class="text-sm text-gray-500">
              Submitted: ${formatDate(booking.createdAt)}
            </p>
            <p class="text-sm text-gray-500">
              ${bookingEmail}
            </p>
          </div>
          <div class="flex gap-2">
            <span class="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
              ${propertyType}
            </span>
            <span class="${statusColor} px-3 py-1 rounded-full text-sm font-semibold">
              ${sanitizeForDisplay(booking.status || 'pending')}
            </span>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span class="font-semibold text-gray-700">Name:</span>
            <span class="text-gray-600"> ${bookingName}</span>
          </div>
          <div>
            <span class="font-semibold text-gray-700">Complexity:</span>
            <span class="text-gray-600"> ${sanitizeForDisplay(booking.complexity || 'N/A')}</span>
          </div>
          ${booking.preferredDate ? `
          <div>
            <span class="font-semibold text-gray-700">Preferred Date:</span>
            <span class="text-gray-600"> ${formatDate(booking.preferredDate)}</span>
          </div>
          ` : ''}
        </div>
      </div>
    `;
  });

  bookingsList.innerHTML = html;
}

// Handle admin date click
function handleAdminDateClick(year, month, day) {
  const date = new Date(year, month, day);
  const dateString = date.toISOString().split('T')[0];
  window.location.href = `book-deep-clean.html?date=${dateString}`;
}

// Handle admin booking click - show editable form
function handleAdminBookingClick(bookingId) {
  const booking = getBookingById(bookingId);
  if (!booking) return;

  const modal = document.getElementById('booking-modal');
  const modalTitle = document.getElementById('modal-title');
  const modalContent = document.getElementById('modal-content');

  if (!modal || !modalContent) return;

  if (modalTitle) {
    modalTitle.textContent = 'Edit Booking (Admin)';
  }

  // Build editable booking form
  const propertyType = booking.propertyType || 'residential';
  const isResidential = propertyType === 'residential';
  
  let html = `
    <form id="edit-booking-form" class="space-y-4">
      <input type="hidden" id="edit-booking-id" value="${escapeHtml(booking.id)}">
      
      <!-- Property Type -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">Property Type *</label>
        <div class="flex gap-4">
          <label class="flex items-center">
            <input type="radio" name="edit-propertyType" value="residential" ${isResidential ? 'checked' : ''} class="mr-2">
            <span>Residential</span>
          </label>
          <label class="flex items-center">
            <input type="radio" name="edit-propertyType" value="commercial" ${!isResidential ? 'checked' : ''} class="mr-2">
            <span>Commercial</span>
          </label>
        </div>
      </div>

      <!-- Name and Email -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label for="edit-name" class="block text-sm font-medium text-gray-700 mb-2">${getFieldLabel('name')} *</label>
          <input type="text" id="edit-name" name="edit-name" required 
                 value="${escapeHtml(booking.name || booking.businessName || '')}"
                 class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600">
        </div>
        <div>
          <label for="edit-email" class="block text-sm font-medium text-gray-700 mb-2">${getFieldLabel('email')} *</label>
          <input type="email" id="edit-email" name="edit-email" required 
                 value="${escapeHtml(booking.email || '')}"
                 class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600">
        </div>
      </div>

      <!-- Phone and Address -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label for="edit-phone" class="block text-sm font-medium text-gray-700 mb-2">${getFieldLabel('phone')}</label>
          <input type="tel" id="edit-phone" name="edit-phone" 
                 value="${escapeHtml(booking.phone || '')}"
                 class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600">
        </div>
        <div>
          <label for="edit-address" class="block text-sm font-medium text-gray-700 mb-2">${getFieldLabel('address')}</label>
          <input type="text" id="edit-address" name="edit-address" 
                 value="${escapeHtml(booking.address || '')}"
                 class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600">
        </div>
      </div>

      <!-- Complexity -->
      <div>
        <label for="edit-complexity" class="block text-sm font-medium text-gray-700 mb-2">${getComplexityLabel()} *</label>
        <select id="edit-complexity" name="edit-complexity" required 
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600">
          <option value="">Select complexity</option>
          ${getComplexityOptions(booking.complexity)}
        </select>
      </div>

      <!-- Status -->
      <div>
        <label for="edit-status" class="block text-sm font-medium text-gray-700 mb-2">Status</label>
        <select id="edit-status" name="edit-status" 
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600">
          <option value="pending" ${(booking.status || 'pending') === 'pending' ? 'selected' : ''}>Pending</option>
          <option value="confirmed" ${booking.status === 'confirmed' ? 'selected' : ''}>Confirmed</option>
          <option value="completed" ${booking.status === 'completed' ? 'selected' : ''}>Completed</option>
          <option value="cancelled" ${booking.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
        </select>
      </div>

      <!-- Preferred Date -->
      <div>
        <label for="edit-preferredDate" class="block text-sm font-medium text-gray-700 mb-2">${getFieldLabel('preferredDate')}</label>
        <input type="date" id="edit-preferredDate" name="edit-preferredDate" 
               value="${booking.preferredDate ? formatDateForInput(booking.preferredDate) : ''}"
               class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600">
      </div>

      <!-- Residential Fields -->
      <div id="edit-residential-fields" style="display: ${isResidential ? 'block' : 'none'};">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label for="edit-homeSize" class="block text-sm font-medium text-gray-700 mb-2">${getHomeSizeLabel()}</label>
            <select id="edit-homeSize" name="edit-homeSize" 
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600">
              <option value="">Select home size</option>
              ${getHomeSizeOptions(booking.homeSize)}
            </select>
          </div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div>
            <label for="edit-bedrooms" class="block text-sm font-medium text-gray-700 mb-2">${getFieldLabel('bedrooms')}</label>
            <input type="number" id="edit-bedrooms" name="edit-bedrooms" min="0" 
                   value="${booking.bedrooms || ''}"
                   class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600">
          </div>
          <div>
            <label for="edit-bathrooms" class="block text-sm font-medium text-gray-700 mb-2">${getFieldLabel('bathrooms')}</label>
            <input type="number" id="edit-bathrooms" name="edit-bathrooms" min="0" 
                   value="${booking.bathrooms || ''}"
                   class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600">
          </div>
          <div>
            <label for="edit-squareFootage" class="block text-sm font-medium text-gray-700 mb-2">${getFieldLabel('squareFootage')}</label>
            <input type="number" id="edit-squareFootage" name="edit-squareFootage" min="0" 
                   value="${booking.squareFootage || ''}"
                   class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600">
          </div>
        </div>
      </div>

      <!-- Commercial Fields -->
      <div id="edit-commercial-fields" style="display: ${!isResidential ? 'block' : 'none'};">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label for="edit-businessName" class="block text-sm font-medium text-gray-700 mb-2">${getFieldLabel('businessName')}</label>
            <input type="text" id="edit-businessName" name="edit-businessName" 
                   value="${escapeHtml(booking.businessName || '')}"
                   class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600">
          </div>
          <div>
            <label for="edit-officeType" class="block text-sm font-medium text-gray-700 mb-2">${getOfficeTypeLabel()}</label>
            <select id="edit-officeType" name="edit-officeType" 
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600">
              <option value="">Select office type</option>
              ${getOfficeTypeOptions(booking.officeType)}
            </select>
          </div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <label for="edit-numberOfFloors" class="block text-sm font-medium text-gray-700 mb-2">${getFieldLabel('numberOfFloors')}</label>
            <input type="number" id="edit-numberOfFloors" name="edit-numberOfFloors" min="1" 
                   value="${booking.numberOfFloors || ''}"
                   class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600">
          </div>
          <div>
            <label for="edit-numberOfEmployees" class="block text-sm font-medium text-gray-700 mb-2">${getFieldLabel('numberOfEmployees')}</label>
            <input type="number" id="edit-numberOfEmployees" name="edit-numberOfEmployees" min="0" 
                   value="${booking.numberOfEmployees || ''}"
                   class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600">
          </div>
        </div>
        <div class="mt-4">
          <label for="edit-squareFootageCommercial" class="block text-sm font-medium text-gray-700 mb-2">${getFieldLabel('squareFootage')}</label>
          <input type="number" id="edit-squareFootageCommercial" name="edit-squareFootageCommercial" min="0" 
                 value="${booking.squareFootage || ''}"
                 class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600">
        </div>
      </div>

      <!-- Additional Info -->
      <div>
        <label for="edit-additionalInfo" class="block text-sm font-medium text-gray-700 mb-2">${getFieldLabel('additionalInfo')}</label>
        <textarea id="edit-additionalInfo" name="edit-additionalInfo" rows="4" 
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600">${escapeHtml(booking.additionalInfo || '')}</textarea>
      </div>

      <!-- Error Message -->
      <div id="edit-error-message" class="hidden bg-red-100 text-red-800 p-4 rounded-lg"></div>

      <!-- Action Buttons -->
      <div class="flex gap-4 pt-4 border-t">
        <button type="submit" 
                class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold">
          Save Changes
        </button>
        <button type="button" onclick="deleteAdminBooking('${escapeHtml(booking.id)}')" 
                class="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-semibold">
          Delete Booking
        </button>
        <button type="button" onclick="document.getElementById('booking-modal').classList.add('hidden')" 
                class="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition font-semibold">
          Cancel
        </button>
      </div>
    </form>
  `;

  modalContent.innerHTML = html;
  modal.classList.remove('hidden');

  // Handle property type change
  const propertyTypeRadios = modalContent.querySelectorAll('input[name="edit-propertyType"]');
  const residentialFields = document.getElementById('edit-residential-fields');
  const commercialFields = document.getElementById('edit-commercial-fields');

  propertyTypeRadios.forEach(radio => {
    radio.addEventListener('change', function() {
      if (this.value === 'residential') {
        if (residentialFields) residentialFields.style.display = 'block';
        if (commercialFields) commercialFields.style.display = 'none';
      } else {
        if (residentialFields) residentialFields.style.display = 'none';
        if (commercialFields) commercialFields.style.display = 'block';
      }
    });
  });

  // Handle form submission
  const editForm = document.getElementById('edit-booking-form');
  if (editForm) {
    editForm.addEventListener('submit', function(e) {
      e.preventDefault();
      saveBookingChanges(bookingId);
    });
  }
}

// Save booking changes
function saveBookingChanges(bookingId) {
  const errorMessage = document.getElementById('edit-error-message');
  if (errorMessage) {
    errorMessage.classList.add('hidden');
  }

  // Get form values
  const propertyType = document.querySelector('input[name="edit-propertyType"]:checked')?.value;
  const name = document.getElementById('edit-name')?.value;
  const email = document.getElementById('edit-email')?.value;
  const phone = document.getElementById('edit-phone')?.value;
  const address = document.getElementById('edit-address')?.value;
  const complexity = document.getElementById('edit-complexity')?.value;
  const status = document.getElementById('edit-status')?.value;
  const preferredDate = document.getElementById('edit-preferredDate')?.value;
  const additionalInfo = document.getElementById('edit-additionalInfo')?.value;

  // Validate required fields
  if (!propertyType || !name || !email || !complexity) {
    if (errorMessage) {
      errorMessage.textContent = 'Please fill in all required fields';
      errorMessage.classList.remove('hidden');
    }
    return;
  }

  // Validate email
  if (!isValidEmail(email)) {
    if (errorMessage) {
      errorMessage.textContent = 'Please enter a valid email address';
      errorMessage.classList.remove('hidden');
    }
    return;
  }

  // Build update object
  const updates = {
    propertyType: propertyType,
    email: email,
    phone: phone || null,
    address: address || null,
    complexity: complexity,
    status: status || 'pending',
    preferredDate: preferredDate || null,
    additionalInfo: additionalInfo || null
  };

  // Add property-specific fields
  if (propertyType === 'residential') {
    const homeSize = document.getElementById('edit-homeSize')?.value;
    const bedrooms = document.getElementById('edit-bedrooms')?.value;
    const bathrooms = document.getElementById('edit-bathrooms')?.value;
    const squareFootage = document.getElementById('edit-squareFootage')?.value;

    updates.name = name;
    updates.homeSize = homeSize || null;
    updates.bedrooms = bedrooms ? parseInt(bedrooms) : null;
    updates.bathrooms = bathrooms ? parseInt(bathrooms) : null;
    updates.squareFootage = squareFootage ? parseInt(squareFootage) : null;
    
    // Clear commercial fields
    updates.businessName = null;
    updates.officeType = null;
    updates.numberOfFloors = null;
    updates.numberOfEmployees = null;
  } else {
    const businessName = document.getElementById('edit-businessName')?.value;
    const officeType = document.getElementById('edit-officeType')?.value;
    const numberOfFloors = document.getElementById('edit-numberOfFloors')?.value;
    const numberOfEmployees = document.getElementById('edit-numberOfEmployees')?.value;
    const squareFootage = document.getElementById('edit-squareFootageCommercial')?.value;

    updates.businessName = businessName || null;
    updates.officeType = officeType || null;
    updates.numberOfFloors = numberOfFloors ? parseInt(numberOfFloors) : null;
    updates.numberOfEmployees = numberOfEmployees ? parseInt(numberOfEmployees) : null;
    updates.squareFootage = squareFootage ? parseInt(squareFootage) : null;
    
    // Clear residential fields
    updates.name = null;
    updates.homeSize = null;
    updates.bedrooms = null;
    updates.bathrooms = null;
  }

  // Update booking
  try {
    updateBooking(bookingId, updates);
    
    // Reload data
    loadStatistics();
    loadAllBookings();
    
    // Reload calendar if visible
    const calendarTab = document.getElementById('content-calendar');
    if (calendarTab && !calendarTab.classList.contains('hidden')) {
      const today = new Date();
      renderCalendar(today.getFullYear(), today.getMonth(), 'admin-calendar-container', handleAdminDateClick, handleAdminBookingClick);
    }
    
    // Close modal
    const modal = document.getElementById('booking-modal');
    if (modal) modal.classList.add('hidden');
    
    alert('Booking updated successfully!');
  } catch (error) {
    if (errorMessage) {
      errorMessage.textContent = 'Error updating booking: ' + error.message;
      errorMessage.classList.remove('hidden');
    }
  }
}

// Update admin booking status (kept for backward compatibility)
function updateAdminBookingStatus(bookingId, status) {
  updateBooking(bookingId, { status: status });
  
  // Reload data
  loadStatistics();
  loadAllBookings();
  
  // Reload calendar if visible
  const calendarTab = document.getElementById('content-calendar');
  if (calendarTab && !calendarTab.classList.contains('hidden')) {
    const today = new Date();
    renderCalendar(today.getFullYear(), today.getMonth(), 'admin-calendar-container', handleAdminDateClick, handleAdminBookingClick);
  }
  
  // Close modal
  const modal = document.getElementById('booking-modal');
  if (modal) modal.classList.add('hidden');
}

// Delete admin booking
function deleteAdminBooking(bookingId) {
  if (confirm('Are you sure you want to delete this booking?')) {
    deleteBooking(bookingId);
    
    // Reload data
    loadStatistics();
    loadAllBookings();
    
    // Reload calendar if visible
    const calendarTab = document.getElementById('content-calendar');
    if (calendarTab && !calendarTab.classList.contains('hidden')) {
      const today = new Date();
      renderCalendar(today.getFullYear(), today.getMonth(), 'admin-calendar-container', handleAdminDateClick, handleAdminBookingClick);
    }
    
    // Close modal
    const modal = document.getElementById('booking-modal');
    if (modal) modal.classList.add('hidden');
  }
}

// Load all users
function loadAllUsers() {
  const users = getAllUsers();
  const usersList = document.getElementById('users-list');

  if (!usersList) return;

  if (users.length === 0) {
    usersList.innerHTML = `
      <div class="bg-white rounded-lg shadow-md p-8 text-center">
        <p class="text-gray-600">No users found.</p>
      </div>
    `;
    return;
  }

  // Sort by creation date (newest first)
  users.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  let html = '';
  users.forEach(user => {
    const userBookings = getUserBookings(user.id);
    const userName = sanitizeForDisplay(user.name || 'N/A');
    const userEmail = sanitizeForDisplay(user.email);
    const roleBadge = user.role === 'admin' 
      ? '<span class="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-semibold">Admin</span>'
      : '<span class="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">User</span>';

    html += `
      <div class="bg-white rounded-lg shadow-md p-6">
        <div class="flex justify-between items-start mb-4">
          <div>
            <h3 class="text-xl font-semibold mb-2">${userName}</h3>
            <p class="text-sm text-gray-500">${userEmail}</p>
            <p class="text-sm text-gray-500">Joined: ${formatDate(user.createdAt)}</p>
          </div>
          <div class="flex gap-2">
            ${roleBadge}
            <span class="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm font-semibold">
              ${userBookings.length} Booking${userBookings.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        <div class="flex gap-4 pt-4 border-t">
          <button onclick="viewUserBookings('${escapeHtml(user.id)}')" 
                  class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
            View Bookings
          </button>
          ${user.role !== 'admin' ? `
          <button onclick="promoteToAdmin('${escapeHtml(user.id)}')" 
                  class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition">
            Make Admin
          </button>
          ` : ''}
          <button onclick="deleteAdminUser('${escapeHtml(user.id)}')" 
                  class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition">
            Delete User
          </button>
        </div>
      </div>
    `;
  });

  usersList.innerHTML = html;
}

// View user bookings
function viewUserBookings(userId) {
  const bookings = getUserBookings(userId);
  const user = getAllUsers().find(u => u.id === userId);
  
  if (!user) return;

  const modal = document.getElementById('user-modal');
  const modalContent = document.getElementById('user-modal-content');

  if (!modal || !modalContent) return;

  let html = `
    <div class="space-y-4">
      <div>
        <h4 class="font-semibold text-gray-700 mb-2">User: ${sanitizeForDisplay(user.name || user.email)}</h4>
        <p class="text-sm text-gray-500">${sanitizeForDisplay(user.email)}</p>
      </div>
      <div class="border-t pt-4">
        <h4 class="font-semibold text-gray-700 mb-4">Bookings (${bookings.length})</h4>
  `;

  if (bookings.length === 0) {
    html += '<p class="text-gray-600">No bookings found.</p>';
  } else {
    bookings.forEach(booking => {
      const propertyType = booking.propertyType === 'commercial' ? 'Commercial' : 'Residential';
      const statusColor = getStatusColor(booking.status || 'pending');
      html += `
        <div class="bg-gray-50 p-4 rounded-lg mb-2">
          <div class="flex justify-between items-center">
            <div>
              <p class="font-semibold">${propertyType} - ${formatDate(booking.preferredDate || booking.createdAt)}</p>
              <p class="text-sm text-gray-600">${sanitizeForDisplay(booking.complexity || 'N/A')}</p>
            </div>
            <span class="${statusColor} px-3 py-1 rounded-full text-sm font-semibold">
              ${sanitizeForDisplay(booking.status || 'pending')}
            </span>
          </div>
        </div>
      `;
    });
  }

  html += `
      </div>
    </div>
  `;

  modalContent.innerHTML = html;
  modal.classList.remove('hidden');
}

// Promote user to admin
function promoteToAdmin(userId) {
  if (confirm('Are you sure you want to promote this user to admin?')) {
    try {
      updateUserRole(userId, 'admin');
      loadAllUsers();
      alert('User promoted to admin successfully!');
    } catch (error) {
      alert('Error: ' + error.message);
    }
  }
}

// Delete admin user
function deleteAdminUser(userId) {
  const user = getAllUsers().find(u => u.id === userId);
  if (!user) return;

  if (confirm(`Are you sure you want to delete user "${user.name || user.email}"? This will also delete all their bookings.`)) {
    try {
      deleteUser(userId);
      loadStatistics();
      loadAllUsers();
      alert('User deleted successfully!');
    } catch (error) {
      alert('Error: ' + error.message);
    }
  }
}

// Load analytics
function loadAnalytics() {
  const stats = getBookingStats();
  const userStats = getUserStats();
  const signups = getSignups();

  // Status chart
  const statusChart = document.getElementById('status-chart');
  if (statusChart) {
    statusChart.innerHTML = `
      <div class="flex items-center justify-between">
        <span>Pending</span>
        <span class="font-semibold">${stats.pending}</span>
      </div>
      <div class="flex items-center justify-between">
        <span>Confirmed</span>
        <span class="font-semibold">${stats.confirmed}</span>
      </div>
      <div class="flex items-center justify-between">
        <span>Completed</span>
        <span class="font-semibold">${stats.completed}</span>
      </div>
      <div class="flex items-center justify-between">
        <span>Cancelled</span>
        <span class="font-semibold">${stats.cancelled || 0}</span>
      </div>
    `;
  }

  // Type chart
  const typeChart = document.getElementById('type-chart');
  if (typeChart) {
    typeChart.innerHTML = `
      <div class="flex items-center justify-between">
        <span>Residential</span>
        <span class="font-semibold">${stats.residential}</span>
      </div>
      <div class="flex items-center justify-between">
        <span>Commercial</span>
        <span class="font-semibold">${stats.commercial}</span>
      </div>
    `;
  }

  // User stats
  const userStatsDiv = document.getElementById('user-stats');
  if (userStatsDiv) {
    userStatsDiv.innerHTML = `
      <div class="flex items-center justify-between">
        <span>Total Users</span>
        <span class="font-semibold">${userStats.total}</span>
      </div>
      <div class="flex items-center justify-between">
        <span>Admins</span>
        <span class="font-semibold">${userStats.admins}</span>
      </div>
      <div class="flex items-center justify-between">
        <span>Regular Users</span>
        <span class="font-semibold">${userStats.regular}</span>
      </div>
      <div class="flex items-center justify-between">
        <span>Signups Today</span>
        <span class="font-semibold">${userStats.signupsToday}</span>
      </div>
      <div class="flex items-center justify-between">
        <span>Signups This Week</span>
        <span class="font-semibold">${userStats.signupsThisWeek}</span>
      </div>
    `;
  }

  // Recent signups
  const recentSignups = document.getElementById('recent-signups');
  if (recentSignups) {
    const recent = signups.slice(-5).reverse();
    if (recent.length === 0) {
      recentSignups.innerHTML = '<p class="text-gray-600">No recent signups.</p>';
    } else {
      let html = '';
      recent.forEach(signup => {
        const user = getAllUsers().find(u => u.id === signup.userId);
        html += `
          <div class="text-sm">
            <p class="font-semibold">${sanitizeForDisplay(user ? (user.name || user.email) : signup.email)}</p>
            <p class="text-gray-500">${formatDate(signup.timestamp)}</p>
          </div>
        `;
      });
      recentSignups.innerHTML = html;
    }
  }
}

// Load Form Builder
function loadFormBuilder() {
  const config = getFormConfig();
  
  // Load field labels editor
  loadFieldLabelsEditor(config.fieldLabels);
  
  // Load complexity options editor
  loadOptionsEditor('complexity', config.complexity);
  
  // Load home size options editor
  loadOptionsEditor('homeSize', config.homeSize);
  
  // Load office type options editor
  loadOptionsEditor('officeType', config.officeType);
  
  // Set up save button
  const saveButton = document.getElementById('save-form-config');
  if (saveButton) {
    saveButton.onclick = saveFormConfiguration;
  }
  
  // Set up reset button
  const resetButton = document.getElementById('reset-form-config');
  if (resetButton) {
    resetButton.onclick = resetFormConfiguration;
  }
  
  // Set up preview button
  const previewButton = document.getElementById('preview-form');
  if (previewButton) {
    previewButton.onclick = previewForm;
  }
}

// Load field labels editor
function loadFieldLabelsEditor(fieldLabels) {
  const container = document.getElementById('field-labels-editor');
  if (!container) return;
  
  const fields = [
    { key: 'name', label: 'Name Label' },
    { key: 'email', label: 'Email Label' },
    { key: 'phone', label: 'Phone Label' },
    { key: 'address', label: 'Address Label' },
    { key: 'complexity', label: 'Complexity Label' },
    { key: 'preferredDate', label: 'Preferred Date Label' },
    { key: 'additionalInfo', label: 'Additional Information Label' },
    { key: 'homeSize', label: 'Home Size Label' },
    { key: 'bedrooms', label: 'Bedrooms Label' },
    { key: 'bathrooms', label: 'Bathrooms Label' },
    { key: 'squareFootage', label: 'Square Footage Label' },
    { key: 'businessName', label: 'Business Name Label' },
    { key: 'officeType', label: 'Office Type Label' },
    { key: 'numberOfFloors', label: 'Number of Floors Label' },
    { key: 'numberOfEmployees', label: 'Number of Employees Label' }
  ];
  
  let html = '';
  fields.forEach(field => {
    const value = fieldLabels[field.key] || field.key;
    html += `
      <div>
        <label for="label-${field.key}" class="block text-sm font-medium text-gray-700 mb-2">
          ${field.label}
        </label>
        <input
          type="text"
          id="label-${field.key}"
          data-field="${field.key}"
          value="${escapeHtml(value)}"
          class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600"
        />
      </div>
    `;
  });
  
  container.innerHTML = html;
}

// Load options editor for dropdown fields
function loadOptionsEditor(fieldName, config) {
  const container = document.getElementById(`${fieldName}-editor`);
  if (!container) return;
  
  const label = config.label || fieldName;
  const options = config.options || [];
  
  let html = `
    <div class="mb-4">
      <label for="${fieldName}-label" class="block text-sm font-medium text-gray-700 mb-2">
        Field Label
      </label>
      <input
        type="text"
        id="${fieldName}-label"
        value="${escapeHtml(label)}"
        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 mb-4"
      />
    </div>
    <div class="mb-4">
      <label class="flex items-center">
        <input
          type="checkbox"
          id="${fieldName}-required"
          ${config.required ? 'checked' : ''}
          class="mr-2"
        />
        <span class="text-sm font-medium text-gray-700">Required Field</span>
      </label>
    </div>
    <div>
      <div class="flex items-center justify-between mb-2">
        <label class="block text-sm font-medium text-gray-700">Options</label>
        <button
          type="button"
          onclick="addOption('${fieldName}')"
          class="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition"
        >
          + Add Option
        </button>
      </div>
      <div id="${fieldName}-options-list" class="space-y-2">
  `;
  
  options.forEach((option, index) => {
    html += `
      <div class="flex gap-2 items-center" data-option-index="${index}">
        <input
          type="text"
          placeholder="Option Value"
          value="${escapeHtml(option.value || '')}"
          class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 option-value"
        />
        <input
          type="text"
          placeholder="Display Label"
          value="${escapeHtml(option.label || option.value || '')}"
          class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 option-label"
        />
        <button
          type="button"
          onclick="removeOption('${fieldName}', ${index})"
          class="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
        >
          Remove
        </button>
      </div>
    `;
  });
  
  html += `
      </div>
    </div>
  `;
  
  container.innerHTML = html;
}

// Add option to dropdown
function addOption(fieldName) {
  const optionsList = document.getElementById(`${fieldName}-options-list`);
  if (!optionsList) return;
  
  const index = optionsList.children.length;
  const optionDiv = document.createElement('div');
  optionDiv.className = 'flex gap-2 items-center';
  optionDiv.setAttribute('data-option-index', index);
  optionDiv.innerHTML = `
    <input
      type="text"
      placeholder="Option Value"
      class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 option-value"
    />
    <input
      type="text"
      placeholder="Display Label"
      class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 option-label"
    />
    <button
      type="button"
      onclick="removeOption('${fieldName}', ${index})"
      class="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
    >
      Remove
    </button>
  `;
  
  optionsList.appendChild(optionDiv);
}

// Remove option from dropdown
function removeOption(fieldName, index) {
  const optionsList = document.getElementById(`${fieldName}-options-list`);
  if (!optionsList) return;
  
  const optionDiv = optionsList.querySelector(`[data-option-index="${index}"]`);
  if (optionDiv) {
    optionDiv.remove();
    // Re-index remaining options
    const remainingOptions = optionsList.querySelectorAll('[data-option-index]');
    remainingOptions.forEach((div, newIndex) => {
      div.setAttribute('data-option-index', newIndex);
      const removeBtn = div.querySelector('button');
      if (removeBtn) {
        removeBtn.setAttribute('onclick', `removeOption('${fieldName}', ${newIndex})`);
      }
    });
  }
}

// Save form configuration
function saveFormConfiguration() {
  const config = {
    fieldLabels: {},
    complexity: {},
    homeSize: {},
    officeType: {}
  };
  
  // Collect field labels
  const labelInputs = document.querySelectorAll('#field-labels-editor input[data-field]');
  labelInputs.forEach(input => {
    const fieldKey = input.getAttribute('data-field');
    config.fieldLabels[fieldKey] = input.value.trim();
  });
  
  // Collect complexity options
  const complexityLabel = document.getElementById('complexity-label')?.value || 'Complexity';
  const complexityRequired = document.getElementById('complexity-required')?.checked || false;
  const complexityOptions = [];
  const complexityOptionsList = document.getElementById('complexity-options-list');
  if (complexityOptionsList) {
    complexityOptionsList.querySelectorAll('[data-option-index]').forEach(div => {
      const value = div.querySelector('.option-value')?.value.trim();
      const label = div.querySelector('.option-label')?.value.trim();
      if (value) {
        complexityOptions.push({ value, label: label || value });
      }
    });
  }
  config.complexity = {
    label: complexityLabel,
    required: complexityRequired,
    options: complexityOptions
  };
  
  // Collect home size options
  const homeSizeLabel = document.getElementById('homeSize-label')?.value || 'Home Size';
  const homeSizeRequired = document.getElementById('homeSize-required')?.checked || false;
  const homeSizeOptions = [];
  const homeSizeOptionsList = document.getElementById('homeSize-options-list');
  if (homeSizeOptionsList) {
    homeSizeOptionsList.querySelectorAll('[data-option-index]').forEach(div => {
      const value = div.querySelector('.option-value')?.value.trim();
      const label = div.querySelector('.option-label')?.value.trim();
      if (value) {
        homeSizeOptions.push({ value, label: label || value });
      }
    });
  }
  config.homeSize = {
    label: homeSizeLabel,
    required: homeSizeRequired,
    options: homeSizeOptions
  };
  
  // Collect office type options
  const officeTypeLabel = document.getElementById('officeType-label')?.value || 'Office Type';
  const officeTypeRequired = document.getElementById('officeType-required')?.checked || false;
  const officeTypeOptions = [];
  const officeTypeOptionsList = document.getElementById('officeType-options-list');
  if (officeTypeOptionsList) {
    officeTypeOptionsList.querySelectorAll('[data-option-index]').forEach(div => {
      const value = div.querySelector('.option-value')?.value.trim();
      const label = div.querySelector('.option-label')?.value.trim();
      if (value) {
        officeTypeOptions.push({ value, label: label || value });
      }
    });
  }
  config.officeType = {
    label: officeTypeLabel,
    required: officeTypeRequired,
    options: officeTypeOptions
  };
  
  // Save configuration
  saveFormConfig(config);
  alert('Form configuration saved successfully! Changes will apply to new bookings.');
}

// Reset form configuration
function resetFormConfiguration() {
  if (confirm('Are you sure you want to reset the form to default settings? This will lose all customizations.')) {
    const defaultConfig = getDefaultFormConfig();
    saveFormConfig(defaultConfig);
    loadFormBuilder();
    alert('Form configuration reset to defaults.');
  }
}

// Preview form
function previewForm() {
  window.open('book-deep-clean.html', '_blank');
}

// Helper function to get field label from config
function getFieldLabel(fieldKey) {
  if (typeof getFormConfig === 'undefined') {
    const defaults = {
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
    };
    return defaults[fieldKey] || fieldKey;
  }
  const config = getFormConfig();
  return config.fieldLabels?.[fieldKey] || fieldKey;
}

// Helper functions to get labels and options from config
function getComplexityLabel() {
  if (typeof getFormConfig === 'undefined') return 'Complexity';
  const config = getFormConfig();
  return config.complexity?.label || 'Complexity';
}

function getComplexityOptions(selectedValue) {
  if (typeof getFormConfig === 'undefined') {
    return `
      <option value="Simple" ${selectedValue === 'Simple' ? 'selected' : ''}>Simple</option>
      <option value="Moderate" ${selectedValue === 'Moderate' ? 'selected' : ''}>Moderate</option>
      <option value="Complex" ${selectedValue === 'Complex' ? 'selected' : ''}>Complex</option>
    `;
  }
  const config = getFormConfig();
  const options = config.complexity?.options || [
    { value: 'Simple', label: 'Simple' },
    { value: 'Moderate', label: 'Moderate' },
    { value: 'Complex', label: 'Complex' }
  ];
  
  return options.map(opt => 
    `<option value="${escapeHtml(opt.value)}" ${selectedValue === opt.value ? 'selected' : ''}>${escapeHtml(opt.label || opt.value)}</option>`
  ).join('');
}

function getHomeSizeLabel() {
  if (typeof getFormConfig === 'undefined') return 'Home Size';
  const config = getFormConfig();
  return config.homeSize?.label || 'Home Size';
}

function getHomeSizeOptions(selectedValue) {
  if (typeof getFormConfig === 'undefined') {
    return `
      <option value="1-2 bedrooms" ${selectedValue === '1-2 bedrooms' ? 'selected' : ''}>1-2 bedrooms</option>
      <option value="3-4 bedrooms" ${selectedValue === '3-4 bedrooms' ? 'selected' : ''}>3-4 bedrooms</option>
      <option value="5+ bedrooms" ${selectedValue === '5+ bedrooms' ? 'selected' : ''}>5+ bedrooms</option>
      <option value="Studio" ${selectedValue === 'Studio' ? 'selected' : ''}>Studio</option>
    `;
  }
  const config = getFormConfig();
  const options = config.homeSize?.options || [
    { value: '1-2 bedrooms', label: '1-2 bedrooms' },
    { value: '3-4 bedrooms', label: '3-4 bedrooms' },
    { value: '5+ bedrooms', label: '5+ bedrooms' },
    { value: 'Studio', label: 'Studio' }
  ];
  
  return options.map(opt => 
    `<option value="${escapeHtml(opt.value)}" ${selectedValue === opt.value ? 'selected' : ''}>${escapeHtml(opt.label || opt.value)}</option>`
  ).join('');
}

function getOfficeTypeLabel() {
  if (typeof getFormConfig === 'undefined') return 'Office Type';
  const config = getFormConfig();
  return config.officeType?.label || 'Office Type';
}

function getOfficeTypeOptions(selectedValue) {
  if (typeof getFormConfig === 'undefined') {
    return `
      <option value="Office" ${selectedValue === 'Office' ? 'selected' : ''}>Office</option>
      <option value="Retail" ${selectedValue === 'Retail' ? 'selected' : ''}>Retail</option>
      <option value="Warehouse" ${selectedValue === 'Warehouse' ? 'selected' : ''}>Warehouse</option>
      <option value="Restaurant" ${selectedValue === 'Restaurant' ? 'selected' : ''}>Restaurant</option>
      <option value="Other" ${selectedValue === 'Other' ? 'selected' : ''}>Other</option>
    `;
  }
  const config = getFormConfig();
  const options = config.officeType?.options || [
    { value: 'Office', label: 'Office' },
    { value: 'Retail', label: 'Retail' },
    { value: 'Warehouse', label: 'Warehouse' },
    { value: 'Restaurant', label: 'Restaurant' },
    { value: 'Other', label: 'Other' }
  ];
  
  return options.map(opt => 
    `<option value="${escapeHtml(opt.value)}" ${selectedValue === opt.value ? 'selected' : ''}>${escapeHtml(opt.label || opt.value)}</option>`
  ).join('');
}

// Load Settings
function loadSettings() {
  const settings = getNavigationSettings();
  
  // Set toggle state
  const membershipToggle = document.getElementById('toggle-membership');
  if (membershipToggle) {
    membershipToggle.checked = settings.showMembership || false;
  }
  
  // Set up save button
  const saveButton = document.getElementById('save-settings');
  if (saveButton) {
    saveButton.onclick = saveSettings;
  }
}

// Save Settings
function saveSettings() {
  const membershipToggle = document.getElementById('toggle-membership');
  if (!membershipToggle) {
    alert('Error: Could not find membership toggle. Please refresh the page and try again.');
    return;
  }
  
  const settings = {
    showMembership: membershipToggle.checked
  };
  
  try {
    saveNavigationSettings(settings);
    
    // Update navigation immediately on this page
    if (typeof updateNavbar === 'function') {
      updateNavbar();
    }
    
    // Show success message
    const saveButton = document.getElementById('save-settings');
    const originalText = saveButton ? saveButton.textContent : 'Save Settings';
    if (saveButton) {
      saveButton.textContent = 'Saved!';
      saveButton.classList.remove('bg-blue-600', 'hover:bg-blue-700');
      saveButton.classList.add('bg-green-600', 'hover:bg-green-700');
      setTimeout(() => {
        saveButton.textContent = originalText;
        saveButton.classList.remove('bg-green-600', 'hover:bg-green-700');
        saveButton.classList.add('bg-blue-600', 'hover:bg-blue-700');
      }, 2000);
    }
    
    // Show alert for other pages
    alert('Settings saved successfully! The membership link will be ' + (settings.showMembership ? 'visible' : 'hidden') + ' in the navigation bar.');
  } catch (error) {
    console.error('Error saving settings:', error);
    alert('Error saving settings. Please try again.');
  }
}
