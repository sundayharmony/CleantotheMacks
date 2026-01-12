// Calendar component for booking management

// Get bookings for a specific month
function getBookingsForMonth(year, month) {
  if (typeof getBookings === 'undefined') return [];
  
  const bookings = getBookings();
  return bookings.filter(booking => {
    if (!booking.preferredDate) return false;
    const bookingDate = new Date(booking.preferredDate);
    return bookingDate.getFullYear() === year && bookingDate.getMonth() === month;
  });
}

// Get bookings for a specific date
function getBookingsForDate(year, month, day) {
  if (typeof getBookings === 'undefined') return [];
  
  const bookings = getBookings();
  const targetDate = new Date(year, month, day).toISOString().split('T')[0];
  
  return bookings.filter(booking => {
    if (!booking.preferredDate) return false;
    const bookingDate = new Date(booking.preferredDate).toISOString().split('T')[0];
    return bookingDate === targetDate;
  });
}

// Render calendar for a given month/year
function renderCalendar(year, month, containerId, onDateClick, onBookingClick) {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  // Get bookings for this month
  const bookings = getBookingsForMonth(year, month);
  
  // Get first day of month and number of days
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  // Get current date for highlighting
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;
  const todayDate = isCurrentMonth ? today.getDate() : null;
  
  // Build calendar HTML
  let html = `
    <div class="calendar-header mb-6">
      <div class="flex items-center justify-between">
        <button id="prev-month" class="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition">
          ← Previous
        </button>
        <h2 class="text-2xl font-bold">${monthNames[month]} ${year}</h2>
        <button id="next-month" class="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition">
          Next →
        </button>
      </div>
    </div>
    <div class="calendar-grid grid grid-cols-7 gap-2">
  `;
  
  // Day headers
  dayNames.forEach(day => {
    html += `<div class="text-center font-semibold text-gray-700 py-2">${day}</div>`;
  });
  
  // Empty cells for days before month starts
  for (let i = 0; i < firstDay; i++) {
    html += `<div class="calendar-day empty"></div>`;
  }
  
  // Days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const dateBookings = getBookingsForDate(year, month, day);
    const isToday = day === todayDate;
    
    html += `
      <div class="calendar-day border border-gray-200 rounded-lg p-2 min-h-[80px] cursor-pointer hover:bg-blue-50 transition ${
        isToday ? 'bg-blue-100 border-blue-400' : ''
      }" data-year="${year}" data-month="${month}" data-day="${day}">
        <div class="font-semibold mb-1 ${isToday ? 'text-blue-600' : ''}">${day}</div>
        <div class="booking-indicators space-y-1">
    `;
    
    // Show up to 3 booking indicators
    dateBookings.slice(0, 3).forEach(booking => {
      const propertyType = booking.propertyType === 'commercial' ? 'Commercial' : 'Residential';
      const statusColor = booking.status === 'confirmed' ? 'bg-green-500' : 
                         booking.status === 'completed' ? 'bg-gray-500' :
                         booking.status === 'cancelled' ? 'bg-red-500' : 'bg-blue-500';
      
      html += `
        <div class="booking-dot ${statusColor} text-white text-xs px-2 py-1 rounded cursor-pointer hover:opacity-80 transition"
             data-booking-id="${booking.id}" title="${propertyType} - ${escapeHtml(booking.name || booking.businessName || 'Booking')}">
          ${propertyType.charAt(0)}
        </div>
      `;
    });
    
    if (dateBookings.length > 3) {
      html += `<div class="text-xs text-gray-500">+${dateBookings.length - 3} more</div>`;
    }
    
    html += `
        </div>
      </div>
    `;
  }
  
  html += `</div>`;
  
  container.innerHTML = html;
  
  // Add event listeners
  const prevButton = document.getElementById('prev-month');
  const nextButton = document.getElementById('next-month');
  const dayCells = container.querySelectorAll('.calendar-day[data-day]');
  
  if (prevButton) {
    prevButton.addEventListener('click', () => {
      const newDate = new Date(year, month - 1, 1);
      renderCalendar(newDate.getFullYear(), newDate.getMonth(), containerId, onDateClick, onBookingClick);
    });
  }
  
  if (nextButton) {
    nextButton.addEventListener('click', () => {
      const newDate = new Date(year, month + 1, 1);
      renderCalendar(newDate.getFullYear(), newDate.getMonth(), containerId, onDateClick, onBookingClick);
    });
  }
  
  // Day click handlers
  dayCells.forEach(cell => {
    cell.addEventListener('click', (e) => {
      // If clicking on a booking dot, trigger booking click
      if (e.target.classList.contains('booking-dot')) {
        const bookingId = e.target.getAttribute('data-booking-id');
        if (onBookingClick && bookingId) {
          onBookingClick(bookingId);
        }
      } else {
        // Otherwise, trigger date click
        const day = parseInt(cell.getAttribute('data-day'));
        const month = parseInt(cell.getAttribute('data-month'));
        const year = parseInt(cell.getAttribute('data-year'));
        if (onDateClick) {
          onDateClick(year, month, day);
        }
      }
    });
  });
}

// Note: formatDate and formatDateForInput are provided by utils.js

