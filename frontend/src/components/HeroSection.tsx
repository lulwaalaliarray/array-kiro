import React from 'react';
import { useNavigate } from 'react-router-dom';
import { handleNavigation, routes } from '../utils/navigation';
import { useToast } from './Toast';

interface HeroSectionProps {
  onGetStarted?: () => void;
  onWatchDemo?: () => void;
}

const HeroSection: React.FC<HeroSectionProps> = ({ onGetStarted, onWatchDemo }) => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const handleGetStarted = () => {
    if (onGetStarted) {
      onGetStarted();
    } else {
      handleNavigation(navigate, routes.signup, false, showToast);
    }
  };

  const handleWatchDemo = () => {
    if (onWatchDemo) {
      onWatchDemo();
    } else {
      handleNavigation(navigate, routes.about, false, showToast);
    }
  };
  return (
    <section style={{
      backgroundColor: '#f8fafc',
      padding: '80px 20px',
      minHeight: '600px',
      display: 'flex',
      alignItems: 'center'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: window.innerWidth >= 1024 ? '1fr 1fr' : '1fr',
          gap: '60px',
          alignItems: 'center'
        }}>
          {/* Left Content */}
          <div>
            <div style={{ marginBottom: '24px' }}>
              <span style={{
                display: 'inline-block',
                padding: '6px 16px',
                backgroundColor: '#ecfdf5',
                color: '#065f46',
                borderRadius: '20px',
                fontSize: '14px',
                fontWeight: '500',
                marginBottom: '24px'
              }}>
                🇧🇭 Trusted by patients across Bahrain
              </span>
              
              <h1 style={{
                fontSize: window.innerWidth >= 768 ? '56px' : '40px',
                fontWeight: '800',
                lineHeight: '1.1',
                color: '#111827',
                marginBottom: '24px'
              }}>
                Your Health,{' '}
                <span style={{
                  background: 'linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}>
                  Simplified
                </span>
              </h1>
              
              <p style={{
                fontSize: '20px',
                color: '#6b7280',
                lineHeight: '1.6',
                marginBottom: '32px',
                maxWidth: '500px'
              }}>
                Connect with Bahrain's top healthcare professionals, book appointments at leading hospitals, and manage your health records with the Kingdom's most trusted medical platform.
              </p>
            </div>

            {/* CTA Buttons */}
            <div style={{
              display: 'flex',
              flexDirection: window.innerWidth >= 640 ? 'row' : 'column',
              gap: '16px',
              marginBottom: '48px'
            }}>
              <button
                onClick={handleGetStarted}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '16px 32px',
                  fontSize: '16px',
                  fontWeight: '600',
                  color: 'white',
                  background: 'linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: '0 4px 14px rgba(13, 148, 136, 0.3)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 25px rgba(13, 148, 136, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 14px rgba(13, 148, 136, 0.3)';
                }}
              >
                Get Started Free
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>

              <button
                onClick={handleWatchDemo}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '16px 32px',
                  fontSize: '16px',
                  fontWeight: '500',
                  color: '#374151',
                  backgroundColor: 'white',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f9fafb';
                  e.currentTarget.style.borderColor = '#9ca3af';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'white';
                  e.currentTarget.style.borderColor = '#d1d5db';
                }}
              >
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
                Watch Demo
              </button>
            </div>

            {/* Trust Indicators */}
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: '24px',
              fontSize: '14px',
              color: '#6b7280'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg width="16" height="16" fill="#10b981" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                NHRA Approved
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg width="16" height="16" fill="#10b981" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                MOH Certified
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg width="16" height="16" fill="#10b981" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Arabic & English
              </div>
            </div>
          </div>

          {/* Right Content - Hero Image/Illustration */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            <div style={{
              width: '100%',
              maxWidth: '500px',
              height: '400px',
              backgroundColor: 'white',
              borderRadius: '16px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              overflow: 'hidden'
            }}>
              {/* Medical Dashboard Mockup */}
              <div style={{
                width: '90%',
                height: '90%',
                backgroundColor: '#f8fafc',
                borderRadius: '12px',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px'
              }}>
                {/* Header */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  paddingBottom: '16px',
                  borderBottom: '1px solid #e5e7eb'
                }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    backgroundColor: '#0d9488',
                    borderRadius: '50%'
                  }}></div>
                  <div>
                    <div style={{
                      width: '120px',
                      height: '12px',
                      backgroundColor: '#d1d5db',
                      borderRadius: '6px',
                      marginBottom: '4px'
                    }}></div>
                    <div style={{
                      width: '80px',
                      height: '8px',
                      backgroundColor: '#e5e7eb',
                      borderRadius: '4px'
                    }}></div>
                  </div>
                </div>

                {/* Cards */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '12px'
                }}>
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} style={{
                      backgroundColor: 'white',
                      borderRadius: '8px',
                      padding: '16px',
                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                    }}>
                      <div style={{
                        width: '24px',
                        height: '24px',
                        backgroundColor: i === 1 ? '#0d9488' : i === 2 ? '#10b981' : i === 3 ? '#3b82f6' : '#f59e0b',
                        borderRadius: '6px',
                        marginBottom: '8px'
                      }}></div>
                      <div style={{
                        width: '60px',
                        height: '8px',
                        backgroundColor: '#d1d5db',
                        borderRadius: '4px',
                        marginBottom: '4px'
                      }}></div>
                      <div style={{
                        width: '40px',
                        height: '6px',
                        backgroundColor: '#e5e7eb',
                        borderRadius: '3px'
                      }}></div>
                    </div>
                  ))}
                </div>

                {/* Chart Area */}
                <div style={{
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  padding: '16px',
                  flex: 1,
                  display: 'flex',
                  alignItems: 'end',
                  gap: '4px'
                }}>
                  {[20, 40, 60, 35, 80, 45, 70].map((height, i) => (
                    <div key={i} style={{
                      flex: 1,
                      height: `${height}%`,
                      backgroundColor: '#0d9488',
                      borderRadius: '2px',
                      opacity: 0.7
                    }}></div>
                  ))}
                </div>
              </div>

              {/* Floating Elements */}
              <div style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                width: '60px',
                height: '60px',
                backgroundColor: '#ecfdf5',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <svg width="24" height="24" fill="#10b981" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;