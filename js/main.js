// Helper function to generate dropdown content
function generateDropdownContent(userRole) {
  if (userRole === 'admin') {
    return `
      <a href="admin-dashboard.html" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">All Bookings</a>
      <a href="admin-dashboard.html#calendar" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Calendar</a>
      <a href="admin-dashboard.html#users" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Users</a>
      <a href="admin-dashboard.html#form-builder" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Form Builder</a>
      <a href="admin-dashboard.html#settings" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Settings</a>
      <a href="admin-dashboard.html#analytics" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Analytics</a>
      <div class="border-t border-gray-200 my-1"></div>
      <a href="#" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 sign-out-link">Sign Out</a>
    `;
  } else {
    return `
      <a href="dashboard.html" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Dashboard</a>
      <div class="border-t border-gray-200 my-1"></div>
      <a href="#" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 sign-out-link">Sign Out</a>
    `;
  }
}

// Update navbar based on auth state
function updateNavbar() {
  try {
    const isAuth = safeIsAuthenticated();
    const currentUser = safeGetCurrentUser();
    
    // Get navigation settings
    const navSettings = typeof getNavigationSettings === 'function' ? getNavigationSettings() : { showMembership: false };
    
    // Update desktop nav
    const desktopNav = document.querySelector('[data-desktop-nav]');
    if (desktopNav) {
      // Show/hide membership link based on settings
      const membershipLink = desktopNav.querySelector('a[href="membership.html"]');
      if (membershipLink) {
        membershipLink.style.display = navSettings.showMembership ? '' : 'none';
      }
      
      // Remove any existing dynamic elements
      const existingDropdown = desktopNav.querySelector('.user-dropdown-container');
      const existingSignIn = desktopNav.querySelector('a[href="signin.html"]');
      const existingDashboard = desktopNav.querySelector('a[href="dashboard.html"]');
      const existingAdmin = desktopNav.querySelector('a[href="admin-dashboard.html"]');
      
      if (existingDropdown) existingDropdown.remove();
      if (existingSignIn && isAuth) existingSignIn.remove();
      if (existingDashboard) existingDashboard.remove();
      if (existingAdmin) existingAdmin.remove();
      
      // Get book link for positioning
      const bookLink = desktopNav.querySelector('a[href="book-deep-clean.html"]');
      
      if (isAuth && currentUser) {
        // User is signed in - show dropdown with icon
        const userDropdown = document.createElement('div');
        userDropdown.className = 'user-dropdown-container relative';
        
        const userButton = document.createElement('button');
        userButton.className = 'flex items-center focus:outline-none';
        userButton.setAttribute('aria-label', 'Account menu');
        userButton.innerHTML = '<img src="images/icon.png" alt="Account" class="w-6 h-6 hover:opacity-80 transition" />';
        
        const dropdownMenu = document.createElement('div');
        dropdownMenu.className = 'user-dropdown-menu hidden absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-50';
        
        // Build dropdown content based on user role
        const dropdownContent = generateDropdownContent(currentUser.role);
        dropdownMenu.innerHTML = dropdownContent;
        
        // Handle dropdown toggle
        userButton.addEventListener('click', function(e) {
          e.preventDefault();
          e.stopPropagation();
          dropdownMenu.classList.toggle('hidden');
        });
        userButton.addEventListener('keydown', function(e) {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            dropdownMenu.classList.toggle('hidden');
          }
        });
        
        // Close dropdown when clicking outside (use once to prevent leaks)
        let clickHandler = null;
        const setupClickHandler = () => {
          if (clickHandler) {
            document.removeEventListener('click', clickHandler);
          }
          clickHandler = function(e) {
            if (!userDropdown.contains(e.target)) {
              dropdownMenu.classList.add('hidden');
              document.removeEventListener('click', clickHandler);
              clickHandler = null;
            }
          };
          setTimeout(() => document.addEventListener('click', clickHandler), 0);
        };
        setupClickHandler();
        
        // Handle sign out
        const signOutLink = dropdownMenu.querySelector('.sign-out-link');
        if (signOutLink) {
          signOutLink.addEventListener('click', function(e) {
            e.preventDefault();
            if (functionExists('signOut')) {
              signOut();
              window.location.href = 'index.html';
            }
          });
        }
        
        userDropdown.appendChild(userButton);
        userDropdown.appendChild(dropdownMenu);
        
        // Insert after book link or append to end
        if (bookLink) {
          desktopNav.insertBefore(userDropdown, bookLink.nextSibling);
        } else {
          desktopNav.appendChild(userDropdown);
        }
      } else {
        // User is not signed in - show sign in dropdown
        const signInDropdown = document.createElement('div');
        signInDropdown.className = 'user-dropdown-container relative';
        
        const signInButton = document.createElement('button');
        signInButton.className = 'flex items-center focus:outline-none';
        signInButton.setAttribute('aria-label', 'Sign in menu');
        signInButton.innerHTML = '<img src="images/icon.png" alt="Sign In" class="w-6 h-6 hover:opacity-80 transition" />';
        
        const dropdownMenu = document.createElement('div');
        dropdownMenu.className = 'user-dropdown-menu hidden absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-50';
        dropdownMenu.innerHTML = `
          <a href="signin.html" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Sign In</a>
        `;
        
        signInButton.addEventListener('click', function(e) {
          e.preventDefault();
          e.stopPropagation();
          dropdownMenu.classList.toggle('hidden');
        });
        signInButton.addEventListener('keydown', function(e) {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            dropdownMenu.classList.toggle('hidden');
          }
        });
        
        // Close dropdown when clicking outside (use once to prevent leaks)
        let signInClickHandler = null;
        const setupSignInClickHandler = () => {
          if (signInClickHandler) {
            document.removeEventListener('click', signInClickHandler);
          }
          signInClickHandler = function(e) {
            if (!signInDropdown.contains(e.target)) {
              dropdownMenu.classList.add('hidden');
              document.removeEventListener('click', signInClickHandler);
              signInClickHandler = null;
            }
          };
          setTimeout(() => document.addEventListener('click', signInClickHandler), 0);
        };
        setupSignInClickHandler();
        
        signInDropdown.appendChild(signInButton);
        signInDropdown.appendChild(dropdownMenu);
        
        // Insert after book link or append to end
        if (bookLink) {
          desktopNav.insertBefore(signInDropdown, bookLink.nextSibling);
        } else {
          desktopNav.appendChild(signInDropdown);
        }
      }
    }
    
    // Update mobile nav
    const mobileNav = document.querySelector('[data-mobile-nav]') || document.getElementById('mobile-menu');
    if (mobileNav) {
      const mobileContainer = mobileNav.querySelector('.flex.flex-col.space-y-4');
      if (mobileContainer) {
        // Show/hide membership link based on settings
        const mobileMembershipLink = mobileContainer.querySelector('a[href="membership.html"]');
        if (mobileMembershipLink) {
          mobileMembershipLink.style.display = navSettings.showMembership ? '' : 'none';
        }
        
        // Remove any existing dynamic elements
        const existingMobileDropdown = mobileContainer.querySelector('.mobile-user-dropdown-container');
        const existingMobileSignIn = mobileContainer.querySelector('a[href="signin.html"]');
        const existingMobileDashboard = mobileContainer.querySelector('a[href="dashboard.html"]');
        const existingMobileAdmin = mobileContainer.querySelector('a[href="admin-dashboard.html"]');
        
        if (existingMobileDropdown) existingMobileDropdown.remove();
        if (existingMobileSignIn && isAuth) existingMobileSignIn.remove();
        if (existingMobileDashboard) existingMobileDashboard.remove();
        if (existingMobileAdmin) existingMobileAdmin.remove();
        
        if (isAuth && currentUser) {
          // User is signed in - show dropdown
          const mobileUserDropdown = document.createElement('div');
          mobileUserDropdown.className = 'mobile-user-dropdown-container';
          
          const mobileUserButton = document.createElement('button');
          mobileUserButton.className = 'flex items-center text-gray-700 hover:text-blue-600 transition font-medium';
          mobileUserButton.setAttribute('aria-label', 'Account menu');
          mobileUserButton.innerHTML = `
            <img src="images/icon.png" alt="Account" class="w-6 h-6 mr-2" />
            <span>Account</span>
          `;
          
          const mobileDropdownMenu = document.createElement('div');
          mobileDropdownMenu.className = 'mobile-user-dropdown-menu hidden mt-2 pl-8';
          
          // Use generateDropdownContent but adapt for mobile styling
          const desktopContent = generateDropdownContent(currentUser.role);
          const mobileDropdownContent = desktopContent
            .replace(/px-4 py-2 text-sm text-gray-700 hover:bg-gray-100/g, 'text-sm text-gray-700 hover:text-blue-600 transition mb-1')
            .replace(/sign-out-link/g, 'mobile-sign-out-link');
          mobileDropdownMenu.innerHTML = mobileDropdownContent;
          
          mobileUserButton.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            mobileDropdownMenu.classList.toggle('hidden');
          });
          
          const mobileSignOutLink = mobileDropdownMenu.querySelector('.mobile-sign-out-link');
          if (mobileSignOutLink) {
            mobileSignOutLink.addEventListener('click', function(e) {
              e.preventDefault();
              if (functionExists('signOut')) {
                signOut();
                window.location.href = 'index.html';
              }
            });
          }
          
          mobileUserDropdown.appendChild(mobileUserButton);
          mobileUserDropdown.appendChild(mobileDropdownMenu);
          mobileContainer.appendChild(mobileUserDropdown);
        } else {
          // User is not signed in - show sign in dropdown
          const mobileSignInDropdown = document.createElement('div');
          mobileSignInDropdown.className = 'mobile-user-dropdown-container';
          
          const mobileSignInButton = document.createElement('button');
          mobileSignInButton.className = 'flex items-center text-gray-700 hover:text-blue-600 transition font-medium';
          mobileSignInButton.setAttribute('aria-label', 'Sign in menu');
          mobileSignInButton.innerHTML = `
            <img src="images/icon.png" alt="Sign In" class="w-6 h-6 mr-2" />
            <span>Sign In</span>
          `;
          
          const mobileDropdownMenu = document.createElement('div');
          mobileDropdownMenu.className = 'mobile-user-dropdown-menu hidden mt-2 pl-8';
          mobileDropdownMenu.innerHTML = `
            <a href="signin.html" class="block text-sm text-gray-700 hover:text-blue-600 transition">Sign In</a>
          `;
          
          mobileSignInButton.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            mobileDropdownMenu.classList.toggle('hidden');
          });
          
          mobileSignInDropdown.appendChild(mobileSignInButton);
          mobileSignInDropdown.appendChild(mobileDropdownMenu);
          mobileContainer.appendChild(mobileSignInDropdown);
        }
      }
    }
  } catch (error) {
    console.error('Error updating navbar:', error.message || 'Unknown error');
  }
}

// Mobile menu toggle
document.addEventListener('DOMContentLoaded', function() {
  // Update navbar on page load
  updateNavbar();
  
  const mobileMenuButton = document.getElementById('mobile-menu-button');
  const mobileMenu = document.querySelector('[data-mobile-nav]') || document.getElementById('mobile-menu');
  
  if (mobileMenuButton && mobileMenu) {
    mobileMenuButton.addEventListener('click', function() {
      mobileMenu.classList.toggle('hidden');
      // Toggle icon
      const icon = mobileMenuButton.querySelector('svg');
      if (icon) {
        const isOpen = !mobileMenu.classList.contains('hidden');
        icon.innerHTML = isOpen 
          ? '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />'
          : '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />';
      }
    });
  }

  // Close mobile menu when clicking a link
  const mobileLinks = document.querySelectorAll('[data-mobile-nav] a, #mobile-menu a');
  mobileLinks.forEach(link => {
    link.addEventListener('click', function() {
      if (mobileMenu) {
        mobileMenu.classList.add('hidden');
        // Reset icon
        const icon = mobileMenuButton?.querySelector('svg');
        if (icon) {
          icon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />';
        }
      }
    });
  });
});

// Load form configuration and update form fields
function loadFormConfiguration() {
  if (typeof getFormConfig === 'undefined') return;
  
  try {
    const config = getFormConfig();
    
    // Update field labels
    if (config.fieldLabels) {
      const labelCache = {};
      Object.keys(config.fieldLabels).forEach(fieldKey => {
        const label = config.fieldLabels[fieldKey];
        if (!labelCache[fieldKey]) {
          labelCache[fieldKey] = document.querySelector(`label[for="${fieldKey}"]`);
        }
        const labelElement = labelCache[fieldKey];
        if (labelElement) {
          // Update label text, preserving required asterisk if present
          const currentText = labelElement.textContent.trim();
          const isRequired = currentText.includes('*');
          labelElement.textContent = label + (isRequired ? ' *' : '');
        }
      });
    }
    
    // Update complexity dropdown
    if (config.complexity) {
      const complexitySelect = document.getElementById('complexity');
      const complexityLabel = document.querySelector('label[for="complexity"]');
      
      if (complexityLabel && config.complexity.label) {
        const isRequired = complexityLabel.textContent.includes('*');
        complexityLabel.textContent = config.complexity.label + (config.complexity.required || isRequired ? ' *' : '');
      }
      
      if (complexitySelect && config.complexity.options) {
        // Clear existing options except the first "Select" option
        complexitySelect.innerHTML = '<option value="">Select complexity</option>';
        
        // Add configured options
        config.complexity.options.forEach(option => {
          const optionElement = document.createElement('option');
          optionElement.value = option.value;
          optionElement.textContent = option.label || option.value;
          complexitySelect.appendChild(optionElement);
        });
        
        // Update required attribute
        if (config.complexity.required) {
          complexitySelect.setAttribute('required', 'required');
        } else {
          complexitySelect.removeAttribute('required');
        }
      }
    }
    
    // Update home size dropdown
    if (config.homeSize) {
      const homeSizeSelect = document.getElementById('homeSize');
      const homeSizeLabel = document.querySelector('label[for="homeSize"]');
      
      if (homeSizeLabel && config.homeSize.label) {
        const isRequired = homeSizeLabel.textContent.includes('*');
        homeSizeLabel.textContent = config.homeSize.label + (config.homeSize.required || isRequired ? ' *' : '');
      }
      
      if (homeSizeSelect && config.homeSize.options) {
        // Clear existing options except the first "Select" option
        homeSizeSelect.innerHTML = '<option value="">Select home size</option>';
        
        // Add configured options
        config.homeSize.options.forEach(option => {
          const optionElement = document.createElement('option');
          optionElement.value = option.value;
          optionElement.textContent = option.label || option.value;
          homeSizeSelect.appendChild(optionElement);
        });
        
        // Update required attribute
        if (config.homeSize.required) {
          homeSizeSelect.setAttribute('required', 'required');
        } else {
          homeSizeSelect.removeAttribute('required');
        }
      }
    }
    
    // Update office type dropdown
    if (config.officeType) {
      const officeTypeSelect = document.getElementById('officeType');
      const officeTypeLabel = document.querySelector('label[for="officeType"]');
      
      if (officeTypeLabel && config.officeType.label) {
        const isRequired = officeTypeLabel.textContent.includes('*');
        officeTypeLabel.textContent = config.officeType.label + (config.officeType.required || isRequired ? ' *' : '');
      }
      
      if (officeTypeSelect && config.officeType.options) {
        // Clear existing options except the first "Select" option
        officeTypeSelect.innerHTML = '<option value="">Select office type</option>';
        
        // Add configured options
        config.officeType.options.forEach(option => {
          const optionElement = document.createElement('option');
          optionElement.value = option.value;
          optionElement.textContent = option.label || option.value;
          officeTypeSelect.appendChild(optionElement);
        });
        
        // Update required attribute
        if (config.officeType.required) {
          officeTypeSelect.setAttribute('required', 'required');
        } else {
          officeTypeSelect.removeAttribute('required');
        }
      }
    }
  } catch (error) {
    console.error('Error loading form configuration:', error.message || 'Unknown error');
  }
}

// Property type toggle for booking form
document.addEventListener('DOMContentLoaded', function() {
  // Property type toggle
  const propertyTypeRadios = document.querySelectorAll('input[name="propertyType"]');
  const residentialFields = document.getElementById('residential-fields');
  const commercialFields = document.getElementById('commercial-fields');
  
  if (propertyTypeRadios.length > 0) {
    propertyTypeRadios.forEach(radio => {
      radio.addEventListener('change', function() {
        if (this.value === 'residential') {
          if (residentialFields) residentialFields.style.display = 'block';
          if (commercialFields) commercialFields.style.display = 'none';
          
          // Update required attributes
          const residentialRequired = residentialFields?.querySelectorAll('.residential-field[required]');
          const commercialRequired = commercialFields?.querySelectorAll('.commercial-field[required]');
          if (residentialRequired) {
            residentialRequired.forEach(field => field.setAttribute('required', 'required'));
          }
          if (commercialRequired) {
            commercialRequired.forEach(field => field.removeAttribute('required'));
          }
        } else if (this.value === 'commercial') {
          if (residentialFields) residentialFields.style.display = 'none';
          if (commercialFields) commercialFields.style.display = 'block';
          
          // Update required attributes
          const residentialRequired = residentialFields?.querySelectorAll('.residential-field[required]');
          const commercialRequired = commercialFields?.querySelectorAll('.commercial-field[required]');
          if (residentialRequired) {
            residentialRequired.forEach(field => field.removeAttribute('required'));
          }
          if (commercialRequired) {
            commercialRequired.forEach(field => field.setAttribute('required', 'required'));
          }
        }
      });
    });
  }

  // Auto-fill form if user is logged in
  const currentUser = safeGetCurrentUser();
  if (currentUser) {
    const nameField = document.getElementById('name');
    const emailField = document.getElementById('email');
    if (nameField) nameField.value = currentUser.name || '';
    if (emailField) emailField.value = currentUser.email || '';
  }

  // Pre-fill date from URL parameter
  const urlParams = new URLSearchParams(window.location.search);
  const dateParam = urlParams.get('date');
  if (dateParam) {
    const preferredDateField = document.getElementById('preferredDate');
    if (preferredDateField) {
      preferredDateField.value = dateParam;
    }
  }

  // Load form configuration and update labels/options
  loadFormConfiguration();

  // Form handling
  const intakeForm = document.getElementById('intake-form');
  if (intakeForm) {
    intakeForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      // Hide error message if shown
      const errorMessage = document.getElementById('error-message');
      if (errorMessage) {
        errorMessage.classList.add('hidden');
      }
      
      // Get form data
      const formData = new FormData(this);
      const propertyType = formData.get('propertyType');
      const currentUser = safeGetCurrentUser();
      
      // Validate required fields
      if (!propertyType) {
        if (errorMessage) {
          errorMessage.textContent = 'Please select a property type';
          errorMessage.classList.remove('hidden');
        }
        return;
      }
      
      const bookingData = {
        userId: currentUser ? currentUser.id : null,
        propertyType: propertyType,
        name: sanitizeForDisplay(formData.get('name')?.trim() || ''),
        email: sanitizeForDisplay(formData.get('email')?.trim() || ''),
        phone: sanitizeForDisplay(formData.get('phone')?.trim() || '') || null,
        address: sanitizeForDisplay(formData.get('address')?.trim() || '') || null,
        complexity: sanitizeForDisplay(formData.get('complexity')?.trim() || ''),
        preferredDate: formData.get('preferredDate') || null,
        additionalInfo: sanitizeForDisplay(formData.get('additionalInfo')?.trim() || '') || null,
        status: 'pending'
      };
      
      // Validate email
      if (!isValidEmail(bookingData.email)) {
        if (errorMessage) {
          errorMessage.textContent = 'Please enter a valid email address';
          errorMessage.classList.remove('hidden');
        }
        return;
      }
      
      // Add property-specific fields
      if (propertyType === 'residential') {
        bookingData.homeSize = sanitizeForDisplay(formData.get('homeSize')?.trim() || '') || null;
        const bedrooms = formData.get('bedrooms');
        const bathrooms = formData.get('bathrooms');
        const sqft = formData.get('squareFootage');
        const bedroomsNum = bedrooms ? parseInt(bedrooms, 10) : null;
        const bathroomsNum = bathrooms ? parseInt(bathrooms, 10) : null;
        const sqftNum = sqft ? parseInt(sqft, 10) : null;
        bookingData.bedrooms = (bedroomsNum !== null && bedroomsNum >= 0) ? bedroomsNum : null;
        bookingData.bathrooms = (bathroomsNum !== null && bathroomsNum >= 0) ? bathroomsNum : null;
        bookingData.squareFootage = (sqftNum !== null && sqftNum >= 0) ? sqftNum : null;
      } else {
        bookingData.businessName = sanitizeForDisplay(formData.get('businessName')?.trim() || '') || null;
        bookingData.officeType = sanitizeForDisplay(formData.get('officeType')?.trim() || '') || null;
        const floors = formData.get('numberOfFloors');
        const employees = formData.get('numberOfEmployees');
        const sqft = formData.get('squareFootageCommercial');
        const floorsNum = floors ? parseInt(floors, 10) : null;
        const employeesNum = employees ? parseInt(employees, 10) : null;
        const sqftNum = sqft ? parseInt(sqft, 10) : null;
        bookingData.numberOfFloors = (floorsNum !== null && floorsNum >= 1) ? floorsNum : null;
        bookingData.numberOfEmployees = (employeesNum !== null && employeesNum >= 0) ? employeesNum : null;
        bookingData.squareFootage = (sqftNum !== null && sqftNum >= 0) ? sqftNum : null;
      }
      
      // Create booking
      if (functionExists('createBooking')) {
        try {
          createBooking(bookingData);
          
          // Show success message
          if (errorMessage) {
            errorMessage.textContent = 'Booking request submitted successfully!';
            errorMessage.setAttribute('role', 'alert');
            errorMessage.classList.remove('hidden');
            errorMessage.classList.remove('bg-red-100', 'text-red-800');
            errorMessage.classList.add('bg-green-100', 'text-green-800');
          }
          
          // Redirect or show message
          if (currentUser) {
            setTimeout(() => {
              window.location.href = 'dashboard.html';
            }, 1500);
          } else {
            setTimeout(() => {
              window.location.href = 'signin.html';
            }, 2000);
          }
        } catch (error) {
          console.error('Error creating booking:', error.message || 'Unknown error');
          if (errorMessage) {
            errorMessage.textContent = 'Error submitting booking. Please try again.';
            errorMessage.classList.remove('hidden');
          }
        }
      } else {
        console.error('createBooking function not found');
        if (errorMessage) {
          errorMessage.textContent = 'Error: Booking system not available. Please try again later.';
          errorMessage.classList.remove('hidden');
        }
      }
    });
  }
});
