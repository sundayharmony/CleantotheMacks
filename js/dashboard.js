// Dashboard functionality

document.addEventListener('DOMContentLoaded', function() {
  // Load utility functions if available
  if (typeof sanitizeForDisplay === 'undefined') {
    console.warn('utils.js not loaded. Some features may not work correctly.');
  }
  // Check authentication
  if (!isAuthenticated()) {
    window.location.href = 'signin.html';
    return;
  }

  const currentUser = getCurrentUser();
  if (!currentUser) {
    window.location.href = 'signin.html';
    return;
  }

  // Redirect admins to admin dashboard
  if (currentUser.role === 'admin') {
    window.location.href = 'admin-dashboard.html';
    return;
  }

  // Update welcome message
  const welcomeMessage = document.getElementById('welcome-message');
  if (welcomeMessage) {
    welcomeMessage.textContent = `Welcome, ${currentUser.name || currentUser.email}!`;
  }

  // Initialize calendar
  const today = new Date();
  renderCalendar(today.getFullYear(), today.getMonth(), 'calendar-container', handleDateClick, handleBookingClick);

  // Load and display bookings
  loadBookings();

  // Modal handlers
  const modal = document.getElementById('booking-modal');
  const closeModal = document.getElementById('close-modal');
  
  if (closeModal) {
    closeModal.addEventListener('click', () => {
      if (modal) modal.classList.add('hidden');
    });
  }

  // Close modal on outside click
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.add('hidden');
      }
    });
  }
});

// Handle date click - create new booking
function handleDateClick(year, month, day) {
  const date = new Date(year, month, day);
  const dateString = date.toISOString().split('T')[0];
  
  // Redirect to booking form with date pre-filled
  window.location.href = `book-deep-clean.html?date=${dateString}`;
}

// Handle booking click - view/edit/delete
function handleBookingClick(bookingId) {
  const booking = getBookingById(bookingId);
  if (!booking) return;

  const modal = document.getElementById('booking-modal');
  const modalTitle = document.getElementById('modal-title');
  const modalContent = document.getElementById('modal-content');

  if (!modal || !modalContent) return;

  // Set title
  if (modalTitle) {
    modalTitle.textContent = 'Booking Details';
  }

  // Build booking details HTML (with XSS protection)
  const propertyType = sanitizeForDisplay(booking.propertyType === 'commercial' ? 'Commercial' : 'Residential');
  const statusText = sanitizeForDisplay(booking.status || 'pending');
  const statusColor = getStatusColor(booking.status || 'pending');
  const name = sanitizeForDisplay(booking.name || booking.businessName || 'N/A');
  const email = sanitizeForDisplay(booking.email || 'N/A');
  
  let html = `
    <div class="space-y-4">
      <div class="grid grid-cols-2 gap-4">
        <div>
          <span class="font-semibold text-gray-700">Property Type:</span>
          <span class="text-gray-600 ml-2">${propertyType}</span>
        </div>
        <div>
          <span class="font-semibold text-gray-700">Status:</span>
          <span class="ml-2 px-3 py-1 rounded-full text-sm ${statusColor}">${statusText}</span>
        </div>
      </div>

      <div>
        <span class="font-semibold text-gray-700">Name:</span>
        <span class="text-gray-600 ml-2">${name}</span>
      </div>

      <div>
        <span class="font-semibold text-gray-700">Email:</span>
        <span class="text-gray-600 ml-2">${email}</span>
      </div>

      ${booking.phone ? `
      <div>
        <span class="font-semibold text-gray-700">Phone:</span>
        <span class="text-gray-600 ml-2">${sanitizeForDisplay(booking.phone)}</span>
      </div>
      ` : ''}

      ${booking.address ? `
      <div>
        <span class="font-semibold text-gray-700">Address:</span>
        <span class="text-gray-600 ml-2">${sanitizeForDisplay(booking.address)}</span>
      </div>
      ` : ''}

      <div>
        <span class="font-semibold text-gray-700">Complexity:</span>
        <span class="text-gray-600 ml-2">${sanitizeForDisplay(booking.complexity || 'N/A')}</span>
      </div>

      ${booking.preferredDate ? `
      <div>
        <span class="font-semibold text-gray-700">Preferred Date:</span>
        <span class="text-gray-600 ml-2">${formatDate(booking.preferredDate)}</span>
      </div>
      ` : ''}
  `;

  // Property-specific fields
  if (booking.propertyType === 'residential') {
    html += `
      ${booking.homeSize ? `
      <div>
        <span class="font-semibold text-gray-700">Home Size:</span>
        <span class="text-gray-600 ml-2">${sanitizeForDisplay(booking.homeSize)}</span>
      </div>
      ` : ''}
      ${booking.bedrooms ? `
      <div>
        <span class="font-semibold text-gray-700">Bedrooms:</span>
        <span class="text-gray-600 ml-2">${booking.bedrooms}</span>
      </div>
      ` : ''}
      ${booking.bathrooms ? `
      <div>
        <span class="font-semibold text-gray-700">Bathrooms:</span>
        <span class="text-gray-600 ml-2">${booking.bathrooms}</span>
      </div>
      ` : ''}
    `;
  } else {
    html += `
      ${booking.businessName ? `
      <div>
        <span class="font-semibold text-gray-700">Business Name:</span>
        <span class="text-gray-600 ml-2">${sanitizeForDisplay(booking.businessName)}</span>
      </div>
      ` : ''}
      ${booking.officeType ? `
      <div>
        <span class="font-semibold text-gray-700">Office Type:</span>
        <span class="text-gray-600 ml-2">${sanitizeForDisplay(booking.officeType)}</span>
      </div>
      ` : ''}
      ${booking.numberOfFloors ? `
      <div>
        <span class="font-semibold text-gray-700">Number of Floors:</span>
        <span class="text-gray-600 ml-2">${booking.numberOfFloors}</span>
      </div>
      ` : ''}
      ${booking.numberOfEmployees ? `
      <div>
        <span class="font-semibold text-gray-700">Number of Employees:</span>
        <span class="text-gray-600 ml-2">${booking.numberOfEmployees}</span>
      </div>
      ` : ''}
    `;
  }

  html += `
      ${booking.squareFootage ? `
      <div>
        <span class="font-semibold text-gray-700">Square Footage:</span>
        <span class="text-gray-600 ml-2">${booking.squareFootage.toLocaleString()}</span>
      </div>
      ` : ''}
      ${booking.additionalInfo ? `
      <div>
        <span class="font-semibold text-gray-700">Additional Info:</span>
        <p class="text-gray-600 mt-1">${sanitizeForDisplay(booking.additionalInfo)}</p>
      </div>
      ` : ''}
      <div>
        <span class="font-semibold text-gray-700">Submitted:</span>
        <span class="text-gray-600 ml-2">${formatDate(booking.createdAt)}</span>
      </div>

      <div class="flex gap-4 pt-4 border-t">
        <button onclick="updateBookingStatus('${booking.id}', 'confirmed')" 
                class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
          Mark Confirmed
        </button>
        <button onclick="updateBookingStatus('${booking.id}', 'completed')" 
                class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition">
          Mark Completed
        </button>
        <button onclick="deleteBookingById('${booking.id}')" 
                class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition">
          Delete
        </button>
      </div>
    </div>
  `;

  modalContent.innerHTML = html;
  modal.classList.remove('hidden');
}

// Load and display user's bookings
function loadBookings() {
  const currentUser = getCurrentUser();
  if (!currentUser) return;

  const bookings = getUserBookings(currentUser.id);
  const bookingsList = document.getElementById('bookings-list');

  if (!bookingsList) return;

  if (bookings.length === 0) {
    bookingsList.innerHTML = `
      <div class="bg-white rounded-lg shadow-md p-8 text-center">
        <p class="text-gray-600 mb-4">You haven't submitted any booking requests yet.</p>
        <a href="book-deep-clean.html" class="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition">
          Book a Deep Clean
        </a>
      </div>
    `;
    return;
  }

  // Sort bookings by date (newest first)
  bookings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  let html = '';
  bookings.forEach(booking => {
    const propertyType = booking.propertyType === 'commercial' ? 'Commercial' : 'Residential';
    const statusColor = booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                       booking.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                       booking.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                       'bg-blue-100 text-blue-800';

    const bookingName = sanitizeForDisplay(booking.name || booking.businessName || 'N/A');
    const bookingComplexity = sanitizeForDisplay(booking.complexity || 'N/A');
    const bookingHomeSize = booking.homeSize ? sanitizeForDisplay(booking.homeSize) : '';
    const bookingOfficeType = booking.officeType ? sanitizeForDisplay(booking.officeType) : '';
    
    html += `
      <div class="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition" 
           onclick="handleBookingClick('${escapeHtml(booking.id)}')">
        <div class="flex justify-between items-start mb-4">
          <div>
            <h3 class="text-xl font-semibold mb-2">${propertyType} Cleaning Request</h3>
            <p class="text-sm text-gray-500">
              Submitted: ${formatDate(booking.createdAt)}
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
            <span class="text-gray-600"> ${bookingComplexity}</span>
          </div>
          ${booking.preferredDate ? `
          <div>
            <span class="font-semibold text-gray-700">Preferred Date:</span>
            <span class="text-gray-600"> ${formatDate(booking.preferredDate)}</span>
          </div>
          ` : ''}
          ${booking.propertyType === 'residential' && bookingHomeSize ? `
          <div>
            <span class="font-semibold text-gray-700">Home Size:</span>
            <span class="text-gray-600"> ${bookingHomeSize}</span>
          </div>
          ` : ''}
          ${booking.propertyType === 'commercial' && bookingOfficeType ? `
          <div>
            <span class="font-semibold text-gray-700">Office Type:</span>
            <span class="text-gray-600"> ${bookingOfficeType}</span>
          </div>
          ` : ''}
        </div>
      </div>
    `;
  });

  bookingsList.innerHTML = html;
}

// Update booking status
function updateBookingStatus(bookingId, status) {
  updateBooking(bookingId, { status: status });
  
  // Reload calendar and bookings
  const today = new Date();
  renderCalendar(today.getFullYear(), today.getMonth(), 'calendar-container', handleDateClick, handleBookingClick);
  loadBookings();
  
  // Close modal
  const modal = document.getElementById('booking-modal');
  if (modal) modal.classList.add('hidden');
}

// Delete booking
function deleteBookingById(bookingId) {
  if (confirm('Are you sure you want to delete this booking?')) {
    deleteBooking(bookingId);
    
    // Reload calendar and bookings
    const today = new Date();
    renderCalendar(today.getFullYear(), today.getMonth(), 'calendar-container', handleDateClick, handleBookingClick);
    loadBookings();
    
    // Close modal
    const modal = document.getElementById('booking-modal');
    if (modal) modal.classList.add('hidden');
  }
}

