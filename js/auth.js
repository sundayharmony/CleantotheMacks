// Authentication + data access using Supabase

const ALLOWED_ROLES = ['user', 'member', 'host', 'admin'];

function normalizeRole(role) {
  if (ALLOWED_ROLES.includes(role)) return role;
  return 'user';
}

function mapBookingFromDb(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    status: row.status,
    propertyType: row.property_type,
    name: row.name,
    email: row.email,
    phone: row.phone,
    address: row.address,
    complexity: row.complexity,
    homeSize: row.home_size,
    bedrooms: row.bedrooms,
    bathrooms: row.bathrooms,
    squareFootage: row.square_footage,
    businessName: row.business_name,
    officeType: row.office_type,
    numberOfFloors: row.number_of_floors,
    numberOfEmployees: row.number_of_employees,
    preferredDate: row.preferred_date,
    additionalInfo: row.additional_info,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapBookingToDb(bookingData, userId) {
  return {
    user_id: userId,
    status: bookingData.status || 'pending',
    property_type: bookingData.propertyType,
    name: bookingData.name || null,
    email: bookingData.email || null,
    phone: bookingData.phone || null,
    address: bookingData.address || null,
    complexity: bookingData.complexity || null,
    home_size: bookingData.homeSize || null,
    bedrooms: bookingData.bedrooms ?? null,
    bathrooms: bookingData.bathrooms ?? null,
    square_footage: bookingData.squareFootage ?? null,
    business_name: bookingData.businessName || null,
    office_type: bookingData.officeType || null,
    number_of_floors: bookingData.numberOfFloors ?? null,
    number_of_employees: bookingData.numberOfEmployees ?? null,
    preferred_date: bookingData.preferredDate || null,
    additional_info: bookingData.additionalInfo || null
  };
}

function mapBookingUpdatesToDb(updates) {
  const mapped = {};
  if (updates.status !== undefined) mapped.status = updates.status;
  if (updates.propertyType !== undefined) mapped.property_type = updates.propertyType;
  if (updates.name !== undefined) mapped.name = updates.name;
  if (updates.email !== undefined) mapped.email = updates.email;
  if (updates.phone !== undefined) mapped.phone = updates.phone;
  if (updates.address !== undefined) mapped.address = updates.address;
  if (updates.complexity !== undefined) mapped.complexity = updates.complexity;
  if (updates.homeSize !== undefined) mapped.home_size = updates.homeSize;
  if (updates.bedrooms !== undefined) mapped.bedrooms = updates.bedrooms;
  if (updates.bathrooms !== undefined) mapped.bathrooms = updates.bathrooms;
  if (updates.squareFootage !== undefined) mapped.square_footage = updates.squareFootage;
  if (updates.businessName !== undefined) mapped.business_name = updates.businessName;
  if (updates.officeType !== undefined) mapped.office_type = updates.officeType;
  if (updates.numberOfFloors !== undefined) mapped.number_of_floors = updates.numberOfFloors;
  if (updates.numberOfEmployees !== undefined) mapped.number_of_employees = updates.numberOfEmployees;
  if (updates.preferredDate !== undefined) mapped.preferred_date = updates.preferredDate;
  if (updates.additionalInfo !== undefined) mapped.additional_info = updates.additionalInfo;
  return mapped;
}

async function getProfile(userId) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('id, role, name, email, created_at')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.error('Error loading profile:', error.message || 'Unknown error');
    return null;
  }
  return data || null;
}

async function ensureProfile(user, roleOverride = null, nameOverride = null) {
  if (!user) return null;
  const supabase = getSupabaseClient();
  const profile = {
    id: user.id,
    email: user.email,
    name: nameOverride || user.user_metadata?.name || null,
    role: normalizeRole(roleOverride || 'user')
  };

  const { data, error } = await supabase
    .from('profiles')
    .upsert(profile, { onConflict: 'id' })
    .select('id, role, name, email, created_at')
    .single();

  if (error) {
    console.error('Error saving profile:', error.message || 'Unknown error');
    return null;
  }
  return data;
}

// Create a new user
async function createUser(name, email, password, role = null) {
  const supabase = getSupabaseClient();
  const normalizedRole = normalizeRole(role || 'user');
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name } }
  });

  if (error) {
    throw new Error(error.message || 'Unable to create account');
  }

  if (data?.user) {
    await ensureProfile(data.user, normalizedRole, name);
  }

  return {
    id: data?.user?.id || null,
    name: name,
    email: email,
    role: normalizedRole
  };
}

// Authenticate user
async function authenticateUser(email, password) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data?.user) {
    throw new Error(error?.message || 'Invalid email or password');
  }

  let profile = await getProfile(data.user.id);
  if (!profile) {
    profile = await ensureProfile(data.user, 'user', data.user.user_metadata?.name || null);
  }

  return {
    id: data.user.id,
    name: profile?.name || data.user.user_metadata?.name || '',
    email: data.user.email,
    role: normalizeRole(profile?.role || 'user'),
    createdAt: profile?.created_at || null
  };
}

// Get current logged-in user
async function getCurrentUser() {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) return null;

  const profile = await getProfile(data.user.id);
  return {
    id: data.user.id,
    name: profile?.name || data.user.user_metadata?.name || '',
    email: data.user.email,
    role: normalizeRole(profile?.role || 'user'),
    createdAt: profile?.created_at || null
  };
}

// Set current user (kept for compatibility)
function setCurrentUser() {
  // Supabase manages session storage internally.
}

// Sign out
async function signOut() {
  const supabase = getSupabaseClient();
  await supabase.auth.signOut();
}

// Check if user is authenticated
async function isAuthenticated() {
  const user = await getCurrentUser();
  return user !== null;
}

// Create a booking
async function createBooking(bookingData) {
  const supabase = getSupabaseClient();
  const currentUser = await getCurrentUser();
  const userId = bookingData.userId || currentUser?.id;
  if (!userId) {
    throw new Error('You must be signed in to create a booking.');
  }

  const payload = mapBookingToDb(bookingData, userId);
  const { data, error } = await supabase
    .from('bookings')
    .insert(payload)
    .select('*')
    .single();

  if (error) {
    throw new Error(error.message || 'Unable to create booking');
  }
  return mapBookingFromDb(data);
}

// Get bookings for a user
async function getUserBookings(userId) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error loading bookings:', error.message || 'Unknown error');
    return [];
  }
  return (data || []).map(mapBookingFromDb);
}

// Get booking by ID
async function getBookingById(bookingId) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('id', bookingId)
    .single();

  if (error) {
    console.error('Error loading booking:', error.message || 'Unknown error');
    return null;
  }
  return mapBookingFromDb(data);
}

// Update booking
async function updateBooking(bookingId, updates) {
  const supabase = getSupabaseClient();
  const payload = mapBookingUpdatesToDb(updates);
  const { data, error } = await supabase
    .from('bookings')
    .update(payload)
    .eq('id', bookingId)
    .select('*')
    .single();

  if (error) {
    console.error('Error updating booking:', error.message || 'Unknown error');
    return null;
  }
  return mapBookingFromDb(data);
}

// Delete booking
async function deleteBooking(bookingId) {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from('bookings')
    .delete()
    .eq('id', bookingId);

  if (error) {
    console.error('Error deleting booking:', error.message || 'Unknown error');
    return false;
  }
  return true;
}

// Check if user is admin
async function isAdmin(userId) {
  const profile = await getProfile(userId);
  return profile?.role === 'admin';
}

// Check if current user is admin
async function isCurrentUserAdmin() {
  const currentUser = await getCurrentUser();
  return currentUser?.role === 'admin';
}

// Get all users (admin)
async function getAllUsers() {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('id, role, name, email, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error loading users:', error.message || 'Unknown error');
    return [];
  }

  return (data || []).map(user => ({
    id: user.id,
    role: user.role,
    name: user.name,
    email: user.email,
    createdAt: user.created_at
  }));
}

// Update user role
async function updateUserRole(userId, newRole) {
  if (!ALLOWED_ROLES.includes(newRole) || newRole === 'guest') {
    throw new Error('Invalid role. Must be "user", "member", "host", or "admin".');
  }
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('profiles')
    .update({ role: normalizeRole(newRole) })
    .eq('id', userId)
    .select('id, role, name, email, created_at')
    .single();

  if (error) {
    throw new Error(error.message || 'Unable to update user role');
  }
  return data;
}

// Delete user (removes profile + bookings; auth user remains)
async function deleteUser(userId) {
  const supabase = getSupabaseClient();
  await supabase.from('bookings').delete().eq('user_id', userId);
  const { error } = await supabase.from('profiles').delete().eq('id', userId);
  return !error;
}

// Get all bookings (admin)
async function getAllBookings() {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error loading bookings:', error.message || 'Unknown error');
    return [];
  }
  return (data || []).map(mapBookingFromDb);
}

// Get booking statistics
async function getBookingStats() {
  const bookings = await getAllBookings();
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
async function getUserStats() {
  const users = await getAllUsers();
  const now = new Date();
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  return {
    total: users.length,
    admins: users.filter(u => u.role === 'admin').length,
    regular: users.filter(u => u.role === 'user').length,
    signupsToday: users.filter(u => {
      if (!u.createdAt) return false;
      const created = new Date(u.createdAt);
      return created.toDateString() === now.toDateString();
    }).length,
    signupsThisWeek: users.filter(u => {
      if (!u.createdAt) return false;
      const created = new Date(u.createdAt);
      return created >= weekAgo;
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

