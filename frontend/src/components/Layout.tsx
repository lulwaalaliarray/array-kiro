import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Footer from './Footer';
import BackToTopButton from './BackToTopButton';
import { routes } from '../utils/navigation';
import { isLoggedIn } from '../utils/navigation';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  userType?: string;
  avatar?: string;
}

const Layout: React.FC<LayoutProps> = ({ children, title, subtitle }) => {
  const [user, setUser] = useState<User | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();

  // Ensure page starts at top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Check for user authentication
  useEffect(() => {
    if (isLoggedIn()) {
      const userData = localStorage.getItem('userData');
      if (userData) {
        try {
          setUser(JSON.parse(userData));
        } catch (error) {
          console.error('Error parsing user data:', error);
        }
      }
    }
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (showDropdown) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showDropdown]);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    setUser(null);
    setShowDropdown(false);
    navigate(routes.home);
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      {/* Header */}
      <div style={{
        backgroundColor: 'white',
        borderBottom: '1px solid #e5e7eb',
        padding: '20px 0'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          {/* Logo */}
          <Link to={routes.home} style={{ textDecoration: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                backgroundColor: '#0d9488',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <svg width="28" height="28" fill="white" viewBox="0 0 24 24">
                  <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14h-4v-4h4v4zm0-6h-4V7h4v4z"/>
                </svg>
              </div>
              <div>
                <h1 style={{
                  fontSize: '24px',
                  fontWeight: '700',
                  color: '#111827',
                  margin: 0
                }}>
                  PatientCare
                </h1>
                {(title || subtitle) && (
                  <p style={{
                    fontSize: '14px',
                    color: '#6b7280',
                    margin: 0
                  }}>
                    {subtitle || title}
                  </p>
                )}
              </div>
            </div>
          </Link>

          {/* Centered Navigation Links */}
          <nav style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '32px',
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)'
          }}>
            <Link
              to={routes.home}
              style={{
                color: '#6b7280',
                textDecoration: 'none',
                fontSize: '16px',
                fontWeight: '500',
                transition: 'color 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#0d9488';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#6b7280';
              }}
            >
              Home
            </Link>
            {user && (
              <>
                <Link
                  to={routes.dashboard}
                  style={{
                    color: '#6b7280',
                    textDecoration: 'none',
                    fontSize: '16px',
                    fontWeight: '500',
                    transition: 'color 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#0d9488';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = '#6b7280';
                  }}
                >
                  {user && user.userType === 'doctor' ? 'Past Patients' : 'Dashboard'}
                </Link>
                <Link
                  to={user.userType === 'doctor' ? routes.appointments : routes.doctors}
                  style={{
                    color: '#6b7280',
                    textDecoration: 'none',
                    fontSize: '16px',
                    fontWeight: '500',
                    transition: 'color 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#0d9488';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = '#6b7280';
                  }}
                >
                  {user.userType === 'doctor' ? 'Upcoming Appointments' : 'Find Doctors'}
                </Link>
              </>
            )}
            <Link
              to={user && user.userType === 'doctor' ? routes.blog : routes.about}
              style={{
                color: '#6b7280',
                textDecoration: 'none',
                fontSize: '16px',
                fontWeight: '500',
                transition: 'color 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#0d9488';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#6b7280';
              }}
            >
              {user && user.userType === 'doctor' ? 'Blog' : 'About'}
            </Link>
            <Link
              to={routes.contact}
              style={{
                color: '#6b7280',
                textDecoration: 'none',
                fontSize: '16px',
                fontWeight: '500',
                transition: 'color 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#0d9488';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#6b7280';
              }}
            >
              Contact
            </Link>
          </nav>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {user ? (
              // Authenticated user profile
              <div style={{ position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <button
                    onClick={() => navigate(routes.profile)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '4px',
                      borderRadius: '8px',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#f0fdfa';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                    title="Click to view profile"
                  >
                    <div style={{ textAlign: 'right' }}>
                      <p style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#111827',
                        margin: 0
                      }}>
                        {user.name}
                      </p>
                      <p style={{
                        fontSize: '12px',
                        color: '#6b7280',
                        margin: 0
                      }}>
                        {user.userType === 'doctor' ? 'Doctor' : 'Patient'}
                      </p>
                    </div>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      backgroundColor: '#f0fdfa',
                      borderRadius: '50%',
                      border: '2px solid #0d9488',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s'
                    }}>
                      <span style={{
                        fontSize: '16px',
                        fontWeight: '600',
                        color: '#0d9488'
                      }}>
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </button>
                  <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '4px',
                      borderRadius: '4px',
                      transition: 'all 0.2s',
                      color: '#6b7280'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#f0fdfa';
                      e.currentTarget.style.color = '#0d9488';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = '#6b7280';
                    }}
                    title="Open menu"
                  >
                    <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M7 10l5 5 5-5z"/>
                    </svg>
                  </button>
                </div>

                {/* Dropdown Menu */}
                {showDropdown && (
                  <div style={{
                    position: 'absolute',
                    top: '50px',
                    right: '0',
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                    border: '1px solid #e5e7eb',
                    minWidth: '200px',
                    zIndex: 1000
                  }}>
                    <div style={{ padding: '12px 16px', borderBottom: '1px solid #f3f4f6' }}>
                      <p style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#111827',
                        margin: '0 0 4px 0'
                      }}>
                        {user.name}
                      </p>
                      <p style={{
                        fontSize: '12px',
                        color: '#6b7280',
                        margin: 0
                      }}>
                        {user.email}
                      </p>
                    </div>
                    <div style={{ padding: '8px 0' }}>
                      <Link
                        to={routes.dashboard}
                        onClick={() => setShowDropdown(false)}
                        style={{
                          display: 'block',
                          padding: '8px 16px',
                          color: '#374151',
                          textDecoration: 'none',
                          fontSize: '14px',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#f9fafb';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        Dashboard
                      </Link>
                      <Link
                        to={routes.profile}
                        onClick={() => setShowDropdown(false)}
                        style={{
                          display: 'block',
                          padding: '8px 16px',
                          color: '#374151',
                          textDecoration: 'none',
                          fontSize: '14px',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#f9fafb';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        Account Settings
                      </Link>
                      <button
                        onClick={handleLogout}
                        style={{
                          width: '100%',
                          padding: '8px 16px',
                          backgroundColor: 'transparent',
                          border: 'none',
                          color: '#ef4444',
                          textAlign: 'left',
                          fontSize: '14px',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#fef2f2';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              // Non-authenticated user buttons
              <>
                <Link
                  to={routes.login}
                  style={{
                    padding: '8px 16px',
                    color: '#0d9488',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    fontSize: '14px',
                    fontWeight: '500',
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
                </Link>
                <Link
                  to={routes.signup}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#0d9488',
                    color: 'white',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    fontSize: '14px',
                    fontWeight: '500',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#0f766e';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#0d9488';
                  }}
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main>
        {children}
      </main>

      {/* Footer */}
      <Footer />
      
      {/* Back to Top Button */}
      <BackToTopButton />
    </div>
  );
};

export default Layout;