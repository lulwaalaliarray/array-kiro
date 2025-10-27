import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { routes } from '../utils/navigation';

const ContactPage: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
    inquiryType: 'general'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate form submission
    setTimeout(() => {
      setIsSubmitting(false);
      setShowSuccessPopup(true);
      
      // Clear form
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: '',
        inquiryType: 'general'
      });
    }, 1500);
  };

  const closePopup = () => {
    setShowSuccessPopup(false);
  };

  const contactInfo = [
    {
      icon: '📍',
      title: 'Visit Us',
      details: ['PatientCare Headquarters', 'Manama City Centre', 'Building 123, Office 456', 'Manama, Kingdom of Bahrain']
    },
    {
      icon: '📞',
      title: 'Call Us',
      details: ['+973 1234 5678', '+973 8765 4321', 'Emergency: 999', 'Available 24/7']
    },
    {
      icon: '✉️',
      title: 'Email Us',
      details: ['info@patientcare.bh', 'support@patientcare.bh', 'emergency@patientcare.bh', 'Response within 24 hours']
    },
    {
      icon: '🕒',
      title: 'Business Hours',
      details: ['Monday - Friday: 8:00 AM - 8:00 PM', 'Saturday: 9:00 AM - 5:00 PM', 'Sunday: 10:00 AM - 4:00 PM', 'Emergency services: 24/7']
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
                  Contact Us
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
            Get in Touch
          </h1>
          <p style={{
            fontSize: '20px',
            color: '#6b7280',
            maxWidth: '600px',
            margin: '0 auto',
            lineHeight: '1.6'
          }}>
            Have questions about our services? Need support? We're here to help you with all your healthcare needs.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))',
          gap: '32px',
          marginBottom: '32px'
        }}>
          {/* Contact Form */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '32px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
          }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: '#111827',
              marginBottom: '8px'
            }}>
              Send us a Message
            </h2>
            <p style={{
              fontSize: '16px',
              color: '#6b7280',
              marginBottom: '32px'
            }}>
              Fill out the form below and we'll get back to you within 24-48 hours.
            </p>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '6px'
                }}>
                  Full Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="Enter your full name"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '16px',
                    transition: 'border-color 0.2s',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#0d9488'}
                  onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '6px'
                }}>
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="your.email@example.com"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '16px',
                    transition: 'border-color 0.2s',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#0d9488'}
                  onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '6px'
                }}>
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+973 XXXX XXXX"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '16px',
                    transition: 'border-color 0.2s',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#0d9488'}
                  onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '6px'
                }}>
                  Inquiry Type *
                </label>
                <select
                  name="inquiryType"
                  value={formData.inquiryType}
                  onChange={handleChange}
                  required
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '16px',
                    backgroundColor: 'white',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#0d9488'}
                  onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                >
                  <option value="general">General Inquiry</option>
                  <option value="technical">Technical Support</option>
                  <option value="medical">Medical Question</option>
                  <option value="billing">Billing & Insurance</option>
                  <option value="partnership">Partnership Opportunity</option>
                  <option value="feedback">Feedback & Suggestions</option>
                </select>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '6px'
                }}>
                  Subject *
                </label>
                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  placeholder="Brief description of your inquiry"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '16px',
                    transition: 'border-color 0.2s',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#0d9488'}
                  onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '6px'
                }}>
                  Message *
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={5}
                  placeholder="Please provide details about your inquiry..."
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '16px',
                    transition: 'border-color 0.2s',
                    boxSizing: 'border-box',
                    resize: 'vertical',
                    minHeight: '120px'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#0d9488'}
                  onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: isSubmitting ? '#9ca3af' : 'linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
                onMouseEnter={(e) => {
                  if (!isSubmitting) {
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(13, 148, 136, 0.3)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSubmitting) {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }
                }}
              >
                {isSubmitting ? (
                  <>
                    <div style={{
                      width: '16px',
                      height: '16px',
                      border: '2px solid #ffffff',
                      borderTop: '2px solid transparent',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }}></div>
                    Sending...
                  </>
                ) : (
                  'Send Message'
                )}
              </button>
            </form>
          </div>

          {/* Contact Information */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '24px'
          }}>
            {contactInfo.map((info, index) => (
              <div key={index} style={{
                backgroundColor: 'white',
                borderRadius: '16px',
                padding: '24px',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '16px'
                }}>
                  <div style={{
                    fontSize: '24px',
                    width: '48px',
                    height: '48px',
                    backgroundColor: '#f0fdfa',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {info.icon}
                  </div>
                  <h3 style={{
                    fontSize: '20px',
                    fontWeight: '600',
                    color: '#111827',
                    margin: 0
                  }}>
                    {info.title}
                  </h3>
                </div>
                <div style={{ paddingLeft: '60px' }}>
                  {info.details.map((detail, detailIndex) => (
                    <p key={detailIndex} style={{
                      fontSize: '14px',
                      color: '#6b7280',
                      margin: '4px 0',
                      lineHeight: '1.5'
                    }}>
                      {detail}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Emergency Notice */}
        <div style={{
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '16px',
          padding: '24px',
          textAlign: 'center'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            marginBottom: '16px'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              backgroundColor: '#ef4444',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px'
            }}>
              🚨
            </div>
            <h3 style={{
              fontSize: '20px',
              fontWeight: '600',
              color: '#dc2626',
              margin: 0
            }}>
              Medical Emergency?
            </h3>
          </div>
          <p style={{
            fontSize: '16px',
            color: '#7f1d1d',
            marginBottom: '16px'
          }}>
            For immediate medical assistance, please call <strong>999</strong> or visit your nearest emergency room.
          </p>
          <p style={{
            fontSize: '14px',
            color: '#991b1b'
          }}>
            Do not use this contact form for urgent medical situations.
          </p>
        </div>
      </div>

      {/* Success Popup */}
      {showSuccessPopup && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '32px',
            maxWidth: '400px',
            width: '90%',
            textAlign: 'center',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              backgroundColor: '#dcfce7',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px',
              fontSize: '32px'
            }}>
              ✅
            </div>
            <h3 style={{
              fontSize: '24px',
              fontWeight: '700',
              color: '#111827',
              marginBottom: '16px'
            }}>
              Message Received!
            </h3>
            <p style={{
              fontSize: '16px',
              color: '#6b7280',
              marginBottom: '24px',
              lineHeight: '1.6'
            }}>
              Your message has been received. We will respond to you within 24-48 hours.
            </p>
            <button
              onClick={closePopup}
              style={{
                padding: '12px 24px',
                background: 'linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
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
              Close
            </button>
          </div>
        </div>
      )}

      {/* Add spinning animation */}
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default ContactPage;