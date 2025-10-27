import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { handleNavigation, routes, isLoggedIn } from '../utils/navigation';
import { useToast } from './Toast';

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { showToast } = useToast();

  const handleGetStarted = () => {
    console.log('Navigating to signup page');
    handleNavigation(navigate, routes.signup, false, showToast);
  };

  const handleLogin = () => {
    console.log('Navigating to login page');
    handleNavigation(navigate, routes.login, false, showToast);
  };

  const handleNavClick = (destination: string) => {
    handleNavigation(navigate, destination, false, showToast);
    setIsMenuOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    localStorage.removeItem('redirectAfterLogin');
    showToast('You have been logged out', 'info');
    navigate(routes.home);
    setIsMenuOpen(false);
  };

  const userLoggedIn = isLoggedIn();
  const userData = userLoggedIn ? JSON.parse(localStorage.getItem('userData') || '{}') : null;

  return (
    <header style={{ 
      backgroundColor: 'white', 
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      position: 'sticky',
      top: 0,
      zIndex: 50
    }}>
      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto', 
        padding: '0 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '70px'
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            backgroundColor: '#0d9488',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <svg width="24" height="24" fill="white" viewBox="0 0 24 24">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14h-4v-4h4v4zm0-6h-4V7h4v4z"/>
            </svg>
          </div>
          <div>
            <h1 style={{ 
              fontSize: '24px', 
              fontWeight: '700', 
              color: '#1f2937',
              margin: 0
            }}>
              Patient<span style={{ color: '#0d9488' }}>Care</span>
            </h1>
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav style={{ 
          display: window.innerWidth >= 768 ? 'flex' : 'none',
          alignItems: 'center',
          gap: '32px'
        }}>
          <button 
            onClick={() => handleNavClick('#features')}
            style={{ 
              color: '#6b7280', 
              background: 'none',
              border: 'none',
              fontWeight: '500',
              transition: 'color 0.2s',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#0d9488'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#6b7280'}
          >
            Features
          </button>
          <button 
            onClick={() => handleNavClick(routes.doctors)}
            style={{ 
              color: '#6b7280', 
              background: 'none',
              border: 'none',
              fontWeight: '500',
              transition: 'color 0.2s',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#0d9488'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#6b7280'}
          >
            Find Doctors
          </button>
          <button 
            onClick={() => handleNavClick(routes.about)}
            style={{ 
              color: '#6b7280', 
              background: 'none',
              border: 'none',
              fontWeight: '500',
              transition: 'color 0.2s',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#0d9488'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#6b7280'}
          >
            About
          </button>
          <button 
            onClick={() => handleNavClick(routes.contact)}
            style={{ 
              color: '#6b7280', 
              background: 'none',
              border: 'none',
              fontWeight: '500',
              transition: 'color 0.2s',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#0d9488'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#6b7280'}
          >
            Contact
          </button>
        </nav>

        {/* Desktop CTA Buttons */}
        <div style={{ 
          display: window.innerWidth >= 768 ? 'flex' : 'none',
          alignItems: 'center',
          gap: '12px'
        }}>
          {userLoggedIn ? (
            <>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px',
                padding: '8px 12px',
                backgroundColor: '#f0fdfa',
                borderRadius: '6px'
              }}>
                <div style={{
                  width: '24px',
                  height: '24px',
                  backgroundColor: '#0d9488',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  color: 'white',
                  fontWeight: '600'
                }}>
                  {userData?.name?.charAt(0) || 'U'}
                </div>
                <span style={{ fontSize: '14px', color: '#0d9488', fontWeight: '500' }}>
                  {userData?.name || 'User'}
                </span>
              </div>
              <button
                onClick={handleLogout}
                style={{
                  padding: '8px 16px',
                  color: '#6b7280',
                  backgroundColor: 'transparent',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f9fafb';
                  e.currentTarget.style.borderColor = '#9ca3af';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.borderColor = '#d1d5db';
                }}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleLogin}
                style={{
                  padding: '8px 16px',
                  color: '#0d9488',
                  backgroundColor: 'transparent',
                  border: '1px solid #0d9488',
                  borderRadius: '6px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f0fdfa';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                Sign In
              </button>
              <button
                onClick={handleGetStarted}
                style={{
                  padding: '8px 16px',
                  color: 'white',
                  background: 'linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(13, 148, 136, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                Get Started
              </button>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          style={{
            display: window.innerWidth < 768 ? 'block' : 'none',
            padding: '8px',
            backgroundColor: 'transparent',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div style={{
          display: window.innerWidth < 768 ? 'block' : 'none',
          backgroundColor: 'white',
          borderTop: '1px solid #e5e7eb',
          padding: '20px'
        }}>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <button onClick={() => handleNavClick('#features')} style={{ color: '#6b7280', background: 'none', border: 'none', textAlign: 'left', fontWeight: '500', cursor: 'pointer' }}>Features</button>
            <button onClick={() => handleNavClick(routes.doctors)} style={{ color: '#6b7280', background: 'none', border: 'none', textAlign: 'left', fontWeight: '500', cursor: 'pointer' }}>Find Doctors</button>
            <button onClick={() => handleNavClick(routes.about)} style={{ color: '#6b7280', background: 'none', border: 'none', textAlign: 'left', fontWeight: '500', cursor: 'pointer' }}>About</button>
            <button onClick={() => handleNavClick(routes.contact)} style={{ color: '#6b7280', background: 'none', border: 'none', textAlign: 'left', fontWeight: '500', cursor: 'pointer' }}>Contact</button>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '16px' }}>
              {userLoggedIn ? (
                <>
                  <div style={{ 
                    padding: '12px',
                    backgroundColor: '#f0fdfa',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <div style={{
                      width: '24px',
                      height: '24px',
                      backgroundColor: '#0d9488',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      color: 'white',
                      fontWeight: '600'
                    }}>
                      {userData?.name?.charAt(0) || 'U'}
                    </div>
                    <span style={{ fontSize: '14px', color: '#0d9488', fontWeight: '500' }}>
                      {userData?.name || 'User'}
                    </span>
                  </div>
                  <button onClick={handleLogout} style={{
                    padding: '12px',
                    color: '#6b7280',
                    backgroundColor: 'transparent',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}>
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <button onClick={handleLogin} style={{
                    padding: '12px',
                    color: '#0d9488',
                    backgroundColor: 'transparent',
                    border: '1px solid #0d9488',
                    borderRadius: '6px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}>
                    Sign In
                  </button>
                  <button onClick={handleGetStarted} style={{
                    padding: '12px',
                    color: 'white',
                    background: 'linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)',
                    border: 'none',
                    borderRadius: '6px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}>
                    Get Started
                  </button>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;