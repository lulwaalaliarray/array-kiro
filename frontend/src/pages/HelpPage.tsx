import React, { useState } from 'react';
import Layout from '../components/Layout';

const HelpPage: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState('getting-started');

  const categories = [
    { id: 'getting-started', name: 'Getting Started', icon: '🚀' },
    { id: 'appointments', name: 'Appointments', icon: '📅' },
    { id: 'doctors', name: 'Finding Doctors', icon: '👨‍⚕️' },
    { id: 'account', name: 'Account Management', icon: '👤' },
    { id: 'billing', name: 'Billing & Payments', icon: '💳' },
    { id: 'technical', name: 'Technical Support', icon: '🔧' }
  ];

  const faqs = {
    'getting-started': [
      {
        question: 'How do I create an account?',
        answer: 'Click "Get Started" on our homepage, choose whether you\'re a patient or healthcare provider, and fill in your details. You\'ll need a valid email address and CPR number for verification.'
      },
      {
        question: 'Is PatientCare free to use?',
        answer: 'We offer a free Basic plan that includes essential features like finding doctors and booking appointments. Premium plans start at 15 BHD per month for additional features.'
      },
      {
        question: 'What do I need to get started?',
        answer: 'You\'ll need a valid email address, your CPR number, and basic personal information. Healthcare providers will also need to upload their medical license for verification.'
      }
    ],
    'appointments': [
      {
        question: 'How do I book an appointment?',
        answer: 'Search for a doctor using our Find Doctors feature, select your preferred time slot from their available appointments, and confirm your booking. You\'ll receive instant confirmation.'
      },
      {
        question: 'Can I reschedule or cancel appointments?',
        answer: 'Yes, you can reschedule or cancel appointments up to 24 hours before the scheduled time through your dashboard or by contacting the healthcare provider directly.'
      },
      {
        question: 'What if I\'m late for my appointment?',
        answer: 'Please contact the healthcare provider as soon as possible. Most providers have a 15-minute grace period, but policies may vary.'
      }
    ],
    'doctors': [
      {
        question: 'How do I find the right doctor?',
        answer: 'Use our advanced search filters to find doctors by specialty, location, insurance acceptance, and patient reviews. You can also browse by specific conditions or treatments.'
      },
      {
        question: 'Are all doctors verified?',
        answer: 'Yes, all healthcare providers on our platform are verified by the NHRA (National Health Regulatory Authority) and must maintain valid medical licenses.'
      },
      {
        question: 'Can I see doctor reviews?',
        answer: 'Yes, you can read reviews and ratings from verified patients to help you make informed decisions about your healthcare provider.'
      }
    ],
    'account': [
      {
        question: 'How do I update my profile information?',
        answer: 'Go to your Dashboard, click on your profile picture or name, and select "Edit Profile" to update your personal information, contact details, and preferences.'
      },
      {
        question: 'How do I change my password?',
        answer: 'In your account settings, click "Security" and then "Change Password". You\'ll need to enter your current password and create a new one.'
      },
      {
        question: 'Can I delete my account?',
        answer: 'Yes, you can delete your account from the account settings. Please note that this action is permanent and cannot be undone.'
      }
    ],
    'billing': [
      {
        question: 'What payment methods do you accept?',
        answer: 'We accept all major credit cards, debit cards, and bank transfers. All payments are processed securely through our encrypted payment system.'
      },
      {
        question: 'When am I charged for Premium features?',
        answer: 'Premium subscriptions are billed monthly or annually in advance. You can view your billing history and manage your subscription in your account settings.'
      },
      {
        question: 'Can I get a refund?',
        answer: 'We offer a 30-day money-back guarantee for Premium subscriptions. Contact our support team to process your refund request.'
      }
    ],
    'technical': [
      {
        question: 'The app is running slowly. What should I do?',
        answer: 'Try refreshing your browser, clearing your cache, or using a different browser. If the problem persists, check your internet connection or contact our technical support.'
      },
      {
        question: 'I\'m not receiving email notifications',
        answer: 'Check your spam folder and ensure that notifications are enabled in your account settings. Add our email domain to your safe sender list.'
      },
      {
        question: 'Is there a mobile app?',
        answer: 'Our platform is fully responsive and works great on mobile browsers. We\'re currently developing native iOS and Android apps that will be available soon.'
      }
    ]
  };

  const contactOptions = [
    {
      title: 'Live Chat',
      description: 'Get instant help from our support team',
      icon: '💬',
      availability: '24/7',
      action: 'Start Chat'
    },
    {
      title: 'Email Support',
      description: 'Send us a detailed message',
      icon: '✉️',
      availability: 'Response within 24 hours',
      action: 'Send Email'
    },
    {
      title: 'Phone Support',
      description: 'Speak directly with our team',
      icon: '📞',
      availability: 'Sun-Thu: 8AM-8PM',
      action: 'Call Now'
    }
  ];

  return (
    <Layout title="Help Center" subtitle="Get the support you need">
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
            How can we help you?
          </h1>
          <p style={{
            fontSize: '20px',
            color: '#6b7280',
            maxWidth: '600px',
            margin: '0 auto 32px',
            lineHeight: '1.6'
          }}>
            Find answers to common questions or get in touch with our support team for personalized assistance.
          </p>
          
          {/* Search Bar */}
          <div style={{
            maxWidth: '500px',
            margin: '0 auto',
            display: 'flex',
            gap: '12px'
          }}>
            <input
              type="text"
              placeholder="Search for help articles..."
              style={{
                flex: 1,
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
              cursor: 'pointer'
            }}>
              Search
            </button>
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '300px 1fr',
          gap: '32px',
          marginBottom: '48px'
        }}>
          {/* Categories Sidebar */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            height: 'fit-content'
          }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: '600',
              color: '#111827',
              marginBottom: '20px'
            }}>
              Help Categories
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 16px',
                    backgroundColor: activeCategory === category.id ? '#f0fdfa' : 'transparent',
                    border: activeCategory === category.id ? '1px solid #0d9488' : '1px solid transparent',
                    borderRadius: '8px',
                    color: activeCategory === category.id ? '#0d9488' : '#6b7280',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    textAlign: 'left'
                  }}
                  onMouseEnter={(e) => {
                    if (activeCategory !== category.id) {
                      e.currentTarget.style.backgroundColor = '#f9fafb';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeCategory !== category.id) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  <span style={{ fontSize: '18px' }}>{category.icon}</span>
                  {category.name}
                </button>
              ))}
            </div>
          </div>

          {/* FAQ Content */}
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
              marginBottom: '24px'
            }}>
              {categories.find(cat => cat.id === activeCategory)?.name} FAQs
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {faqs[activeCategory as keyof typeof faqs]?.map((faq, index) => (
                <div key={index} style={{
                  paddingBottom: '24px',
                  borderBottom: index < faqs[activeCategory as keyof typeof faqs].length - 1 ? '1px solid #e5e7eb' : 'none'
                }}>
                  <h3 style={{
                    fontSize: '18px',
                    fontWeight: '600',
                    color: '#111827',
                    marginBottom: '12px'
                  }}>
                    {faq.question}
                  </h3>
                  <p style={{
                    fontSize: '16px',
                    color: '#6b7280',
                    lineHeight: '1.6'
                  }}>
                    {faq.answer}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Contact Support */}
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
            marginBottom: '16px'
          }}>
            Still need help?
          </h2>
          <p style={{
            fontSize: '18px',
            color: '#6b7280',
            textAlign: 'center',
            marginBottom: '48px'
          }}>
            Our support team is here to help you with any questions or issues.
          </p>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '24px'
          }}>
            {contactOptions.map((option, index) => (
              <div key={index} style={{
                textAlign: 'center',
                padding: '32px 24px',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#0d9488';
                e.currentTarget.style.backgroundColor = '#f0fdfa';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#e5e7eb';
                e.currentTarget.style.backgroundColor = 'transparent';
              }}>
                <div style={{
                  fontSize: '48px',
                  marginBottom: '16px'
                }}>
                  {option.icon}
                </div>
                <h3 style={{
                  fontSize: '20px',
                  fontWeight: '600',
                  color: '#111827',
                  marginBottom: '8px'
                }}>
                  {option.title}
                </h3>
                <p style={{
                  fontSize: '16px',
                  color: '#6b7280',
                  marginBottom: '8px'
                }}>
                  {option.description}
                </p>
                <p style={{
                  fontSize: '14px',
                  color: '#0d9488',
                  fontWeight: '500',
                  marginBottom: '20px'
                }}>
                  {option.availability}
                </p>
                <button style={{
                  padding: '10px 20px',
                  backgroundColor: '#0d9488',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#0f766e';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#0d9488';
                }}>
                  {option.action}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default HelpPage;