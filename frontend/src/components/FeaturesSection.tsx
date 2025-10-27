import React from 'react';

const FeaturesSection: React.FC = () => {
  const features = [
    {
      icon: (
        <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      title: 'Smart Scheduling',
      description: 'Book appointments at Bahrain\'s leading hospitals and clinics. Real-time availability with automated SMS reminders in Arabic or English.',
      color: '#0d9488'
    },
    {
      icon: (
        <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
        </svg>
      ),
      title: 'Secure Messaging',
      description: 'Chat with Bahraini healthcare providers in Arabic or English. NHRA-compliant video consultations and secure messaging.',
      color: '#10b981'
    },
    {
      icon: (
        <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      title: 'Digital Health Records',
      description: 'Access your complete medical history from Bahrain\'s healthcare network. Integration with MOH systems and major hospitals.',
      color: '#3b82f6'
    },
    {
      icon: (
        <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      ),
      title: 'Telemedicine',
      description: 'Video consultations with licensed Bahraini doctors. Perfect for follow-ups and consultations from anywhere in the Kingdom.',
      color: '#8b5cf6'
    },
    {
      icon: (
        <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      title: 'Health Analytics',
      description: 'Track your health metrics with insights tailored for Bahrain\'s climate and lifestyle. Personalized wellness recommendations.',
      color: '#f59e0b'
    },
    {
      icon: (
        <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
      title: 'Privacy & Security',
      description: 'Compliant with Bahrain\'s data protection laws and NHRA regulations. Your health data is secured with military-grade encryption.',
      color: '#ef4444'
    }
  ];

  return (
    <section id="features" style={{
      backgroundColor: 'white',
      padding: '100px 20px'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Section Header */}
        <div style={{ textAlign: 'center', marginBottom: '80px' }}>
          <span style={{
            display: 'inline-block',
            padding: '6px 16px',
            backgroundColor: '#f0f9ff',
            color: '#0369a1',
            borderRadius: '20px',
            fontSize: '14px',
            fontWeight: '500',
            marginBottom: '16px'
          }}>
            Features
          </span>
          <h2 style={{
            fontSize: window.innerWidth >= 768 ? '48px' : '36px',
            fontWeight: '800',
            color: '#111827',
            marginBottom: '16px',
            lineHeight: '1.2'
          }}>
            Everything you need for{' '}
            <span style={{
              background: 'linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              better healthcare
            </span>
          </h2>
          <p style={{
            fontSize: '20px',
            color: '#6b7280',
            maxWidth: '600px',
            margin: '0 auto',
            lineHeight: '1.6'
          }}>
            Comprehensive healthcare management tools designed for Bahrain's healthcare system, supporting both Arabic and English languages.
          </p>
        </div>

        {/* Features Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: window.innerWidth >= 1024 ? 'repeat(3, 1fr)' : window.innerWidth >= 768 ? 'repeat(2, 1fr)' : '1fr',
          gap: '32px'
        }}>
          {features.map((feature, index) => (
            <div
              key={index}
              style={{
                backgroundColor: 'white',
                borderRadius: '16px',
                padding: '32px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                border: '1px solid #f3f4f6',
                transition: 'all 0.3s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
              }}
            >
              <div style={{
                width: '56px',
                height: '56px',
                backgroundColor: `${feature.color}15`,
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '24px',
                color: feature.color
              }}>
                {feature.icon}
              </div>
              
              <h3 style={{
                fontSize: '20px',
                fontWeight: '700',
                color: '#111827',
                marginBottom: '12px'
              }}>
                {feature.title}
              </h3>
              
              <p style={{
                fontSize: '16px',
                color: '#6b7280',
                lineHeight: '1.6'
              }}>
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;