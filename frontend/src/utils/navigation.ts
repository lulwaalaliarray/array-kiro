import { NavigateFunction } from 'react-router-dom';

// Authentication check function
export const isLoggedIn = (): boolean => {
  const token = localStorage.getItem('authToken');
  const userData = localStorage.getItem('userData');
  return !!(token && userData);
};

// Navigation helper function
export const handleNavigation = (
  navigate: NavigateFunction,
  destination: string,
  requiresAuth: boolean = false,
  showToast?: (message: string, type: 'success' | 'error' | 'info') => void
) => {
  if (requiresAuth && !isLoggedIn()) {
    // Store the intended destination for redirect after login
    localStorage.setItem('redirectAfterLogin', destination);
    
    if (showToast) {
      showToast('Please log in to continue', 'info');
    }
    
    navigate('/login');
    return;
  }
  
  navigate(destination);
};

// Route definitions
export const routes = {
  home: '/',
  login: '/login',
  signup: '/signup',
  about: '/about',
  contact: '/contact',
  support: '/support',
  appointments: '/appointments',
  chat: '/chat',
  records: '/records',
  doctors: '/doctors',
  dashboard: '/dashboard',
  profile: '/profile',
  // Product pages
  features: '/features',
  findDoctors: '/find-doctors',
  pricing: '/pricing',
  security: '/security',
  // Company pages
  careers: '/careers',
  press: '/press',
  blog: '/blog',
  // Support pages
  help: '/help',
  privacy: '/privacy',
  terms: '/terms'
} as const;