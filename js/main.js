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

function setButtonLoading(button, isLoading, loadingText) {
  if (!button) return;
  if (!button.dataset.defaultText) {
    button.dataset.defaultText = button.textContent.trim();
  }
  if (isLoading) {
    button.disabled = true;
    button.textContent = loadingText || 'Please wait...';
  } else {
    button.disabled = false;
    button.textContent = button.dataset.defaultText;
  }
}

function setFormMessage(messageEl, type, text) {
  if (!messageEl) return;
  messageEl.textContent = text;
  messageEl.setAttribute('role', 'alert');
  messageEl.classList.remove('hidden', 'bg-red-100', 'text-red-800', 'bg-green-100', 'text-green-800');
  if (type === 'success') {
    messageEl.classList.add('bg-green-100', 'text-green-800');
  } else {
    messageEl.classList.add('bg-red-100', 'text-red-800');
  }
}

// Update navbar based on auth state
async function updateNavbar() {
  try {
    const isAuth = await safeIsAuthenticated();
    const currentUser = await safeGetCurrentUser();
    
    // Update desktop nav
    const desktopNav = document.querySelector('[data-desktop-nav]');
    const desktopActions = document.querySelector('[data-desktop-actions]');
    if (desktopNav && desktopActions) {
      // Remove any existing dynamic elements
      const existingDropdown = desktopActions.querySelector('.user-dropdown-container');
      if (existingDropdown) existingDropdown.remove();

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
          signOutLink.addEventListener('click', async function(e) {
            e.preventDefault();
            if (functionExists('signOut')) {
              await signOut();
              window.location.href = 'index.html';
            }
          });
        }
        
        userDropdown.appendChild(userButton);
        userDropdown.appendChild(dropdownMenu);
        
        // Insert after book button
        desktopActions.appendChild(userDropdown);
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
        
        // Insert after book button
        desktopActions.appendChild(signInDropdown);
      }
    }
    
    // Update mobile nav
    const mobileNav = document.querySelector('[data-mobile-nav]') || document.getElementById('mobile-menu');
    if (mobileNav) {
      const mobileContainer = mobileNav.querySelector('.flex.flex-col.space-y-4');
      if (mobileContainer) {
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
            mobileSignOutLink.addEventListener('click', async function(e) {
              e.preventDefault();
              if (functionExists('signOut')) {
                await signOut();
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
    syncMembershipLinks();
  } catch (error) {
    console.error('Error updating navbar:', error.message || 'Unknown error');
  }
}

function syncMembershipLinks() {
  if (typeof getNavigationSettings === 'undefined') return;
  const settings = getNavigationSettings();
  const showMembership = settings?.showMembership === true;

  const desktopContainer = document.querySelector('[data-desktop-nav] .flex.items-center');
  const mobileContainer = document.querySelector('[data-mobile-nav] .flex.flex-col.space-y-4');

  const updateContainer = (container, className) => {
    if (!container) return;
    const existing = container.querySelector('[data-membership-link]');
    if (showMembership && !existing) {
      const link = document.createElement('a');
      link.href = 'membership.html';
      link.textContent = 'Membership';
      link.className = className;
      link.setAttribute('data-membership-link', 'true');

      const insertAfter = container.querySelector('a[href="our-work.html"]');
      if (insertAfter && insertAfter.nextSibling) {
        container.insertBefore(link, insertAfter.nextSibling);
      } else {
        container.appendChild(link);
      }
    } else if (!showMembership && existing) {
      existing.remove();
    }
  };

  updateContainer(desktopContainer, 'text-gray-700 hover:text-blue-600 transition font-medium');
  updateContainer(mobileContainer, 'text-gray-700 hover:text-blue-600 transition font-medium');
}

// Mobile menu toggle
document.addEventListener('DOMContentLoaded', async function() {
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

function initAddressAutocomplete() {
  const addressInput = document.getElementById('address');
  if (!addressInput || typeof window.places !== 'function') return;

  const appId = window.ALGOLIA_APP_ID;
  const apiKey = window.ALGOLIA_API_KEY;
  if (!appId || !apiKey || appId.includes('YOUR_') || apiKey.includes('YOUR_')) {
    console.warn('Algolia Places not configured. Set ALGOlIA_APP_ID and ALGOlIA_API_KEY.');
    return;
  }

  window.places({
    appId,
    apiKey,
    container: addressInput,
    type: 'address'
  });
}

// Property type toggle for booking form
document.addEventListener('DOMContentLoaded', async function() {
  // Property type toggle
  const propertyTypeRadios = document.querySelectorAll('input[name="propertyType"]');
  const residentialFields = document.getElementById('residential-fields');
  const commercialFields = document.getElementById('commercial-fields');

  const allPropertyFields = document.querySelectorAll('.residential-field, .commercial-field');
  allPropertyFields.forEach(field => {
    if (field.hasAttribute('required')) {
      field.dataset.required = 'true';
    }
  });

  const applyPropertyType = (propertyType) => {
    if (propertyType === 'residential') {
      if (residentialFields) residentialFields.style.display = 'block';
      if (commercialFields) commercialFields.style.display = 'none';

      const residentialInputs = residentialFields?.querySelectorAll('.residential-field') || [];
      const commercialInputs = commercialFields?.querySelectorAll('.commercial-field') || [];
      residentialInputs.forEach(field => {
        if (field.dataset.required === 'true') {
          field.setAttribute('required', 'required');
        }
        field.removeAttribute('disabled');
      });
      commercialInputs.forEach(field => {
        field.removeAttribute('required');
        field.setAttribute('disabled', 'disabled');
      });
    } else if (propertyType === 'commercial') {
      if (residentialFields) residentialFields.style.display = 'none';
      if (commercialFields) commercialFields.style.display = 'block';

      const residentialInputs = residentialFields?.querySelectorAll('.residential-field') || [];
      const commercialInputs = commercialFields?.querySelectorAll('.commercial-field') || [];
      residentialInputs.forEach(field => {
        field.removeAttribute('required');
        field.setAttribute('disabled', 'disabled');
      });
      commercialInputs.forEach(field => {
        if (field.dataset.required === 'true') {
          field.setAttribute('required', 'required');
        }
        field.removeAttribute('disabled');
      });
    }
  };

  if (propertyTypeRadios.length > 0) {
    propertyTypeRadios.forEach(radio => {
      radio.addEventListener('change', function() {
        applyPropertyType(this.value);
      });
    });

    const selected = document.querySelector('input[name="propertyType"]:checked')?.value || 'residential';
    applyPropertyType(selected);
  }

  // Auto-fill form if user is logged in
  const currentUser = await safeGetCurrentUser();
  if (currentUser) {
    const nameField = document.getElementById('name');
    const emailField = document.getElementById('email');
    if (nameField) nameField.value = currentUser.name || '';
    if (emailField) emailField.value = currentUser.email || '';
  }

  const signInCallout = document.getElementById('signin-callout');
  if (signInCallout) {
    signInCallout.classList.toggle('hidden', !!currentUser);
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

  // Initialize address autocomplete
  initAddressAutocomplete();

  // Form handling
  const intakeForm = document.getElementById('intake-form');
  if (intakeForm) {

    intakeForm.addEventListener('invalid', function(e) {
      const target = e.target;
      if (!target) return;
    }, true);

    const submitButton = intakeForm.querySelector('button[type="submit"]');

    intakeForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      const invalidFields = intakeForm.querySelectorAll(':invalid').length;
      
      // Hide error message if shown
      const errorMessage = document.getElementById('error-message');
      if (errorMessage) {
        errorMessage.classList.add('hidden');
      }

      setButtonLoading(submitButton, true, 'Submitting...');
      
      // Get form data
      const formData = new FormData(this);
      const propertyType = formData.get('propertyType');
      const activeUser = await safeGetCurrentUser();
      
      // Validate required fields
      if (!propertyType) {
        setFormMessage(errorMessage, 'error', 'Please select a property type.');
        setButtonLoading(submitButton, false);
        return;
      }
      
      if (!activeUser) {
        setFormMessage(
          errorMessage,
          'success',
          'Thanks! Your request is received. We will reach out soon to confirm details.'
        );
        intakeForm.reset();
        applyPropertyType('residential');
        setButtonLoading(submitButton, false);
        return;
      }

      const bookingData = {
        userId: activeUser.id,
        propertyType: propertyType,
        name: formData.get('name')?.trim() || '',
        email: formData.get('email')?.trim() || '',
        phone: formData.get('phone')?.trim() || null,
        address: formData.get('address')?.trim() || null,
        complexity: formData.get('complexity')?.trim() || '',
        preferredDate: formData.get('preferredDate') || null,
        additionalInfo: formData.get('additionalInfo')?.trim() || null,
        status: 'pending'
      };
      
      // Validate email
      if (!isValidEmail(bookingData.email)) {
        setFormMessage(errorMessage, 'error', 'Please enter a valid email address.');
        setButtonLoading(submitButton, false);
        return;
      }
      
      // Add property-specific fields
      if (propertyType === 'residential') {
        bookingData.homeSize = formData.get('homeSize')?.trim() || null;
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
        bookingData.businessName = formData.get('businessName')?.trim() || null;
        bookingData.officeType = formData.get('officeType')?.trim() || null;
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
          await createBooking(bookingData);
          
          setFormMessage(errorMessage, 'success', 'Booking request submitted successfully!');
          
          // Redirect or show message
          setTimeout(() => {
            window.location.href = 'dashboard.html';
          }, 1500);
        } catch (error) {
          console.error('Error creating booking:', error.message || 'Unknown error');
          setFormMessage(errorMessage, 'error', 'Error submitting booking. Please try again.');
          setButtonLoading(submitButton, false);
        }
      } else {
        console.error('createBooking function not found');
        setFormMessage(errorMessage, 'error', 'Booking system not available. Please try again later.');
        setButtonLoading(submitButton, false);
      }
    });
  }
});
