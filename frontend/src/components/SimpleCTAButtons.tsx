import React from 'react';

interface SimpleCTAButtonsProps {
  onGetStarted: () => void;
  onLearnMore?: () => void;
}

const SimpleCTAButtons: React.FC<SimpleCTAButtonsProps> = ({ 
  onGetStarted, 
  onLearnMore
}) => {
  const handleLearnMore = () => {
    if (onLearnMore) {
      onLearnMore();
    } else {
      console.log('Learn more clicked');
    }
  };

  const primaryButtonStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '12px 24px',
    fontSize: '16px',
    fontWeight: '600',
    color: 'white',
    background: 'linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)',
    border: 'none',
    borderRadius: '8px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    textDecoration: 'none',
    whiteSpace: 'nowrap'
  };

  const secondaryButtonStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '12px 24px',
    fontSize: '16px',
    fontWeight: '500',
    color: '#374151',
    backgroundColor: '#f3f4f6',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    textDecoration: 'none',
    whiteSpace: 'nowrap'
  };

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    alignItems: 'center',
    marginBottom: '32px'
  };

  const containerStyleDesktop: React.CSSProperties = {
    ...containerStyle,
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'flex-start'
  };

  const [isDesktop, setIsDesktop] = React.useState(window.innerWidth >= 640);

  React.useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 640);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div style={isDesktop ? containerStyleDesktop : containerStyle}>
      {/* Primary CTA Button */}
      <button 
        onClick={onGetStarted}
        style={primaryButtonStyle}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'linear-gradient(135deg, #0f766e 0%, #0d9488 100%)';
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)';
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
        }}
        aria-label="Get started with PatientCare"
      >
        <span>Get Started</span>
        <svg 
          width="16" 
          height="16" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
          style={{ flexShrink: 0 }}
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M13 7l5 5m0 0l-5 5m5-5H6" 
          />
        </svg>
      </button>
      
      {/* Secondary CTA Button */}
      <button 
        onClick={handleLearnMore}
        style={secondaryButtonStyle}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#e5e7eb';
          e.currentTarget.style.borderColor = '#d1d5db';
          e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '#f3f4f6';
          e.currentTarget.style.borderColor = '#e5e7eb';
          e.currentTarget.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05)';
        }}
        aria-label="Learn more about PatientCare"
      >
        <svg 
          width="16" 
          height="16" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
          style={{ flexShrink: 0 }}
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
          />
        </svg>
        <span>Learn More</span>
      </button>
    </div>
  );
};

export default SimpleCTAButtons;