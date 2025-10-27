import React from 'react';
import { Link } from 'react-router-dom';
import { routes } from '../utils/navigation';

const AboutPage: React.FC = () => {
  const teamMembers = [
    {
      name: 'Dr. Fatima Al-Khalifa',
      role: 'Chief Medical Officer',
      specialty: 'Internal Medicine',
      image: '👩‍⚕️',
      description: 'Leading healthcare innovation in Bahrain with 15+ years of experience.'
    },
    {
      name: 'Ahmed Al-Mansouri',
      role: 'Chief Technology Officer',
      specialty: 'Healthcare Technology',
      image: '👨‍💻',
      description: 'Pioneering digital health solutions for the Middle East region.'
    },
    {
      name: 'Dr. Sarah Johnson',
      role: 'Head of Patient Care',
      specialty: 'Family Medicine',
      image: '👩‍⚕️',
      description: 'Ensuring exceptional patient experience and care quality.'
    }
  ];

  const achievements = [
    {
      number: '10,000+',
      label: 'Patients Served',
      icon: '👥'
    },
    {
      number: '500+',
      label: 'Healthcare Providers',
      icon: '🩺'
    },
    {
      number: '50,000+',
      label: 'Appointments Booked',
      icon: '📅'
    },
    {
      number: '99.9%',
      label: 'Uptime Reliability',
      icon: '⚡'
    }
  ];

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
                <p style={{
                  fontSize: '14px',
                  color: '#6b7280',
                  margin: 0
                }}>
                  About Us
                </p>
              </div>
            </div>
          </Link>

          <Link
            to={routes.home}
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
            Back to Home
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '40px 20px'
      }}>
        {/* Hero Section */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          padding: '48px 32px',
          marginBottom: '32px',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          textAlign: 'center'
        }}>
          <h1 style={{
            fontSize: '48px',
            fontWeight: '700',
            color: '#111827',
            marginBottom: '16px'
          }}>
            About PatientCare
          </h1>
          <p style={{
            fontSize: '20px',
            color: '#6b7280',
            maxWidth: '800px',
            margin: '0 auto 32px',
            lineHeight: '1.6'
          }}>
            Revolutionizing healthcare in Bahrain through innovative digital solutions that connect patients with quality healthcare providers, ensuring accessible and efficient medical care for all.
          </p>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 24px',
            backgroundColor: '#f0fdfa',
            borderRadius: '50px',
            border: '1px solid #0d9488'
          }}>
            <span style={{ fontSize: '20px' }}>🇧🇭</span>
            <span style={{ color: '#0d9488', fontWeight: '600' }}>
              Proudly serving the Kingdom of Bahrain
            </span>
          </div>
        </div>

        {/* Mission & Vision */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
          gap: '24px',
          marginBottom: '48px'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '32px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              backgroundColor: '#dbeafe',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '24px'
            }}>
              <svg width="32" height="32" fill="#2563eb" viewBox="0 0 24 24">
                <path d="M12,2L13.09,8.26L22,9L17.22,13.78L18.18,22L12,19.27L5.82,22L6.78,13.78L2,9L10.91,8.26L12,2Z"/>
              </svg>
            </div>
            <h2 style={{
              fontSize: '24px',
              fontWeight: '700',
              color: '#111827',
              marginBottom: '16px'
            }}>
              Our Mission
            </h2>
            <p style={{
              fontSize: '16px',
              color: '#6b7280',
              lineHeight: '1.6',
              margin: 0
            }}>
              To provide accessible, high-quality healthcare services to every resident of Bahrain through innovative technology solutions that bridge the gap between patients and healthcare providers, ensuring timely and efficient medical care.
            </p>
          </div>

          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '32px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              backgroundColor: '#dcfce7',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '24px'
            }}>
              <svg width="32" height="32" fill="#16a34a" viewBox="0 0 24 24">
                <path d="M12,2A3,3 0 0,1 15,5V11A3,3 0 0,1 12,14A3,3 0 0,1 9,11V5A3,3 0 0,1 12,2M19,11C19,14.53 16.39,17.44 13,17.93V21H11V17.93C7.61,17.44 5,14.53 5,11H7A5,5 0 0,0 12,16A5,5 0 0,0 17,11H19Z"/>
              </svg>
            </div>
            <h2 style={{
              fontSize: '24px',
              fontWeight: '700',
              color: '#111827',
              marginBottom: '16px'
            }}>
              Our Vision
            </h2>
            <p style={{
              fontSize: '16px',
              color: '#6b7280',
              lineHeight: '1.6',
              margin: 0
            }}>
              To become the leading digital healthcare platform in the Gulf region, setting new standards for patient care, medical innovation, and healthcare accessibility while maintaining the highest levels of security and compliance.
            </p>
          </div>
        </div>

        {/* Achievements */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          padding: '48px 32px',
          marginBottom: '48px',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
        }}>
          <h2 style={{
            fontSize: '32px',
            fontWeight: '700',
            color: '#111827',
            textAlign: 'center',
            marginBottom: '48px'
          }}>
            Our Impact
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '32px'
          }}>
            {achievements.map((achievement, index) => (
              <div key={index} style={{ textAlign: 'center' }}>
                <div style={{
                  fontSize: '48px',
                  marginBottom: '16px'
                }}>
                  {achievement.icon}
                </div>
                <div style={{
                  fontSize: '36px',
                  fontWeight: '700',
                  color: '#0d9488',
                  marginBottom: '8px'
                }}>
                  {achievement.number}
                </div>
                <div style={{
                  fontSize: '16px',
                  color: '#6b7280',
                  fontWeight: '500'
                }}>
                  {achievement.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Team Section */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          padding: '48px 32px',
          marginBottom: '48px',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
        }}>
          <h2 style={{
            fontSize: '32px',
            fontWeight: '700',
            color: '#111827',
            textAlign: 'center',
            marginBottom: '16px'
          }}>
            Meet Our Leadership Team
          </h2>
          <p style={{
            fontSize: '18px',
            color: '#6b7280',
            textAlign: 'center',
            marginBottom: '48px',
            maxWidth: '600px',
            margin: '0 auto 48px'
          }}>
            Our experienced team combines medical expertise with cutting-edge technology to deliver exceptional healthcare solutions.
          </p>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '32px'
          }}>
            {teamMembers.map((member, index) => (
              <div key={index} style={{
                textAlign: 'center',
                padding: '24px',
                border: '1px solid #f3f4f6',
                borderRadius: '12px',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#0d9488';
                e.currentTarget.style.backgroundColor = '#f0fdfa';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#f3f4f6';
                e.currentTarget.style.backgroundColor = 'transparent';
              }}>
                <div style={{
                  fontSize: '64px',
                  marginBottom: '16px'
                }}>
                  {member.image}
                </div>
                <h3 style={{
                  fontSize: '20px',
                  fontWeight: '600',
                  color: '#111827',
                  marginBottom: '8px'
                }}>
                  {member.name}
                </h3>
                <p style={{
                  fontSize: '16px',
                  color: '#0d9488',
                  fontWeight: '500',
                  marginBottom: '4px'
                }}>
                  {member.role}
                </p>
                <p style={{
                  fontSize: '14px',
                  color: '#6b7280',
                  marginBottom: '16px'
                }}>
                  {member.specialty}
                </p>
                <p style={{
                  fontSize: '14px',
                  color: '#6b7280',
                  lineHeight: '1.5'
                }}>
                  {member.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Values Section */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          padding: '48px 32px',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
        }}>
          <h2 style={{
            fontSize: '32px',
            fontWeight: '700',
            color: '#111827',
            textAlign: 'center',
            marginBottom: '48px'
          }}>
            Our Core Values
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '32px'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '80px',
                height: '80px',
                backgroundColor: '#fef3c7',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 24px',
                fontSize: '32px'
              }}>
                🛡️
              </div>
              <h3 style={{
                fontSize: '20px',
                fontWeight: '600',
                color: '#111827',
                marginBottom: '16px'
              }}>
                Privacy & Security
              </h3>
              <p style={{
                fontSize: '16px',
                color: '#6b7280',
                lineHeight: '1.6'
              }}>
                Your health data is protected with enterprise-grade security and full NHRA compliance.
              </p>
            </div>

            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '80px',
                height: '80px',
                backgroundColor: '#dbeafe',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 24px',
                fontSize: '32px'
              }}>
                ⚡
              </div>
              <h3 style={{
                fontSize: '20px',
                fontWeight: '600',
                color: '#111827',
                marginBottom: '16px'
              }}>
                Innovation
              </h3>
              <p style={{
                fontSize: '16px',
                color: '#6b7280',
                lineHeight: '1.6'
              }}>
                Continuously advancing healthcare technology to improve patient outcomes and experiences.
              </p>
            </div>

            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '80px',
                height: '80px',
                backgroundColor: '#dcfce7',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 24px',
                fontSize: '32px'
              }}>
                🤝
              </div>
              <h3 style={{
                fontSize: '20px',
                fontWeight: '600',
                color: '#111827',
                marginBottom: '16px'
              }}>
                Accessibility
              </h3>
              <p style={{
                fontSize: '16px',
                color: '#6b7280',
                lineHeight: '1.6'
              }}>
                Making quality healthcare accessible to everyone, regardless of location or background.
              </p>
            </div>

            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '80px',
                height: '80px',
                backgroundColor: '#fce7f3',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 24px',
                fontSize: '32px'
              }}>
                💎
              </div>
              <h3 style={{
                fontSize: '20px',
                fontWeight: '600',
                color: '#111827',
                marginBottom: '16px'
              }}>
                Excellence
              </h3>
              <p style={{
                fontSize: '16px',
                color: '#6b7280',
                lineHeight: '1.6'
              }}>
                Maintaining the highest standards in healthcare delivery and patient satisfaction.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;