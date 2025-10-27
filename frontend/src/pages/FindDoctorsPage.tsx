import React from 'react';
import Layout from '../components/Layout';

const FindDoctorsPage: React.FC = () => {
  const searchFeatures = [
    {
      icon: '🔍',
      title: 'Advanced Search Filters',
      description: 'Find the perfect healthcare provider using our comprehensive search system with multiple filter options.'
    },
    {
      icon: '📍',
      title: 'Location-Based Results',
      description: 'Discover doctors near you across all governorates of Bahrain with accurate distance calculations.'
    },
    {
      icon: '⭐',
      title: 'Patient Reviews & Ratings',
      description: 'Read authentic reviews from verified patients to make informed decisions about your healthcare.'
    },
    {
      icon: '💳',
      title: 'Insurance Verification',
      description: 'Check insurance compatibility instantly and see which providers accept your health insurance plan.'
    }
  ];

  const specialties = [
    'Cardiology', 'Dermatology', 'Endocrinology', 'Family Medicine', 'Gastroenterology',
    'General Surgery', 'Gynecology', 'Internal Medicine', 'Neurology', 'Oncology',
    'Ophthalmology', 'Orthopedics', 'Pediatrics', 'Psychiatry', 'Radiology', 'Urology'
  ];

  const locations = [
    'Manama', 'Muharraq', 'Riffa', 'Hamad Town', 'A\'ali', 'Isa Town',
    'Sitra', 'Budaiya', 'Jidhafs', 'Tubli', 'Sanabis', 'Adliya'
  ];

  return (
    <Layout title="Find Doctors" subtitle="Discover healthcare providers">
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
            Find Your Perfect Doctor
          </h1>
          <p style={{
            fontSize: '20px',
            color: '#6b7280',
            maxWidth: '800px',
            margin: '0 auto 32px',
            lineHeight: '1.6'
          }}>
            Connect with licensed healthcare professionals across Bahrain. Search by specialty, location, insurance, and patient reviews to find the right doctor for your needs.
          </p>
          
          {/* Demo Search Bar */}
          <div style={{
            maxWidth: '600px',
            margin: '0 auto',
            display: 'flex',
            gap: '12px',
            flexWrap: 'wrap'
          }}>
            <input
              type="text"
              placeholder="Search by doctor name or specialty..."
              style={{
                flex: 1,
                minWidth: '300px',
                padding: '12px 16px',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '16px'
              }}
            />
            <button style={{
              padding: '12px 24px',
              background: 'linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}>
              Search Doctors
            </button>
          </div>
        </div>

        {/* Search Features */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '24px',
          marginBottom: '48px'
        }}>
          {searchFeatures.map((feature, index) => (
            <div key={index} style={{
              backgroundColor: 'white',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: '48px',
                marginBottom: '16px'
              }}>
                {feature.icon}
              </div>
              <h3 style={{
                fontSize: '20px',
                fontWeight: '600',
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

        {/* Specialties & Locations */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
          gap: '32px',
          marginBottom: '48px'
        }}>
          {/* Popular Specialties */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '32px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
          }}>
            <h2 style={{
              fontSize: '24px',
              fontWeight: '700',
              color: '#111827',
              marginBottom: '24px',
              textAlign: 'center'
            }}>
              Popular Specialties
            </h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: '12px'
            }}>
              {specialties.map((specialty, index) => (
                <div key={index} style={{
                  padding: '8px 12px',
                  backgroundColor: '#f0fdfa',
                  border: '1px solid #0d9488',
                  borderRadius: '20px',
                  textAlign: 'center',
                  fontSize: '14px',
                  color: '#0d9488',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#0d9488';
                  e.currentTarget.style.color = 'white';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#f0fdfa';
                  e.currentTarget.style.color = '#0d9488';
                }}>
                  {specialty}
                </div>
              ))}
            </div>
          </div>

          {/* Popular Locations */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '32px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
          }}>
            <h2 style={{
              fontSize: '24px',
              fontWeight: '700',
              color: '#111827',
              marginBottom: '24px',
              textAlign: 'center'
            }}>
              Search by Location
            </h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
              gap: '12px'
            }}>
              {locations.map((location, index) => (
                <div key={index} style={{
                  padding: '8px 12px',
                  backgroundColor: '#f0f9ff',
                  border: '1px solid #2563eb',
                  borderRadius: '20px',
                  textAlign: 'center',
                  fontSize: '14px',
                  color: '#2563eb',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#2563eb';
                  e.currentTarget.style.color = 'white';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#f0f9ff';
                  e.currentTarget.style.color = '#2563eb';
                }}>
                  {location}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* How It Works */}
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
            How It Works
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
                backgroundColor: '#dbeafe',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 24px',
                fontSize: '32px'
              }}>
                1️⃣
              </div>
              <h3 style={{
                fontSize: '20px',
                fontWeight: '600',
                color: '#111827',
                marginBottom: '16px'
              }}>
                Search & Filter
              </h3>
              <p style={{
                fontSize: '16px',
                color: '#6b7280',
                lineHeight: '1.6'
              }}>
                Use our advanced search to find doctors by specialty, location, insurance, and availability.
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
                2️⃣
              </div>
              <h3 style={{
                fontSize: '20px',
                fontWeight: '600',
                color: '#111827',
                marginBottom: '16px'
              }}>
                Compare Profiles
              </h3>
              <p style={{
                fontSize: '16px',
                color: '#6b7280',
                lineHeight: '1.6'
              }}>
                Review doctor profiles, credentials, patient reviews, and available appointment times.
              </p>
            </div>

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
                3️⃣
              </div>
              <h3 style={{
                fontSize: '20px',
                fontWeight: '600',
                color: '#111827',
                marginBottom: '16px'
              }}>
                Book Instantly
              </h3>
              <p style={{
                fontSize: '16px',
                color: '#6b7280',
                lineHeight: '1.6'
              }}>
                Select your preferred time slot and book your appointment instantly with confirmation.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default FindDoctorsPage;