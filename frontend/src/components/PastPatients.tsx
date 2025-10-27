import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import BackToTopButton from './BackToTopButton';
import { appointmentStorage, Appointment } from '../utils/appointmentStorage';
import { prescriptionStorage } from '../utils/prescriptionStorage';
import { useToast } from './Toast';
import { isLoggedIn } from '../utils/navigation';

const PastPatients: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [pastPatients, setPastPatients] = useState<Appointment[]>([]);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');

  useEffect(() => {
    // Check if user is logged in and is a doctor
    if (!isLoggedIn()) {
      showToast('Please log in to view patient records', 'error');
      navigate('/login');
      return;
    }

    const userData = localStorage.getItem('userData');
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        if (parsedUser.userType !== 'doctor') {
          showToast('Access denied. Doctors only.', 'error');
          navigate('/');
          return;
        }
        setUser(parsedUser);
        loadPastPatients(parsedUser.id || parsedUser.email);
      } catch (error) {
        console.error('Error parsing user data:', error);
        navigate('/login');
      }
    }
    setLoading(false);
  }, [navigate, showToast]);

  const loadPastPatients = (doctorId: string) => {
    const appointments = appointmentStorage.getPastAppointments(doctorId);
    setPastPatients(appointments);
    
    // Load prescriptions for this doctor
    const doctorPrescriptions = prescriptionStorage.getDoctorPrescriptions(doctorId);
    setPrescriptions(doctorPrescriptions);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  // Filter patients based on search term and selected month
  const filteredPatients = pastPatients.filter(appointment => {
    const matchesSearch = appointment.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         appointment.patientEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         appointment.type.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesMonth = !selectedMonth || appointment.date.startsWith(selectedMonth);
    
    return matchesSearch && matchesMonth;
  });

  // Get unique months from appointments for filter dropdown
  const getAvailableMonths = () => {
    const months = [...new Set(pastPatients.map(apt => apt.date.substring(0, 7)))];
    return months.sort().reverse(); // Most recent first
  };

  // Group patients by month
  const groupedPatients = filteredPatients.reduce((groups: { [key: string]: Appointment[] }, appointment) => {
    const month = appointment.date.substring(0, 7);
    if (!groups[month]) {
      groups[month] = [];
    }
    groups[month].push(appointment);
    return groups;
  }, {});

  const getMonthName = (monthString: string) => {
    const [year, month] = monthString.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const getPatientPrescriptions = (patientId: string) => {
    return prescriptions.filter(prescription => prescription.patientId === patientId);
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
        <Header />
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh'
        }}>
          <div style={{ fontSize: '18px', color: '#6b7280' }}>Loading...</div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      <Header />

      {/* Main Content */}
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '40px 20px'
      }}>
        {/* Header */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          padding: '32px',
          marginBottom: '32px',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
        }}>
          <h1 style={{
            fontSize: '32px',
            fontWeight: '700',
            color: '#111827',
            marginBottom: '8px'
          }}>
            Past Patients
          </h1>
          <p style={{
            fontSize: '16px',
            color: '#6b7280',
            margin: 0
          }}>
            Review your patient history and completed appointments
          </p>
        </div>

        {/* Search and Filter */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '24px',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr auto',
            gap: '16px',
            alignItems: 'center'
          }}>
            <div>
              <input
                type="text"
                placeholder="Search patients by name, email, or appointment type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
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
            <div>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                style={{
                  padding: '12px 16px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '16px',
                  backgroundColor: 'white',
                  minWidth: '200px'
                }}
              >
                <option value="">All Months</option>
                {getAvailableMonths().map(month => (
                  <option key={month} value={month}>
                    {getMonthName(month)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '32px'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '20px',
            textAlign: 'center',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}>
            <p style={{
              fontSize: '32px',
              fontWeight: '700',
              color: '#0d9488',
              margin: '0 0 8px 0'
            }}>
              {pastPatients.length}
            </p>
            <p style={{
              fontSize: '14px',
              color: '#6b7280',
              margin: 0
            }}>
              Total Patients
            </p>
          </div>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '20px',
            textAlign: 'center',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}>
            <p style={{
              fontSize: '32px',
              fontWeight: '700',
              color: '#0d9488',
              margin: '0 0 8px 0'
            }}>
              {pastPatients.filter(apt => apt.status === 'completed').length}
            </p>
            <p style={{
              fontSize: '14px',
              color: '#6b7280',
              margin: 0
            }}>
              Completed
            </p>
          </div>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '20px',
            textAlign: 'center',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}>
            <p style={{
              fontSize: '32px',
              fontWeight: '700',
              color: '#0d9488',
              margin: '0 0 8px 0'
            }}>
              BHD {pastPatients.reduce((total, apt) => total + apt.fee, 0)}
            </p>
            <p style={{
              fontSize: '14px',
              color: '#6b7280',
              margin: 0
            }}>
              Total Revenue
            </p>
          </div>
        </div>

        {/* Patients List */}
        {filteredPatients.length === 0 ? (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '48px 32px',
            textAlign: 'center',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              backgroundColor: '#f3f4f6',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px'
            }}>
              <svg width="32" height="32" fill="#9ca3af" viewBox="0 0 24 24">
                <path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zM4 18v-4h3v4h2v-7.5c0-.83.67-1.5 1.5-1.5S12 9.67 12 10.5V11h2v-.5c0-.83.67-1.5 1.5-1.5S17 9.67 17 10.5V18h2v2H4v-2z"/>
              </svg>
            </div>
            <h3 style={{
              fontSize: '20px',
              fontWeight: '600',
              color: '#111827',
              marginBottom: '8px'
            }}>
              {searchTerm || selectedMonth ? 'No patients found' : 'No past patients yet'}
            </h3>
            <p style={{
              fontSize: '16px',
              color: '#6b7280',
              margin: 0
            }}>
              {searchTerm || selectedMonth 
                ? 'Try adjusting your search criteria or filters.'
                : 'Completed appointments will appear here.'
              }
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {Object.entries(groupedPatients)
              .sort(([a], [b]) => b.localeCompare(a)) // Most recent first
              .map(([month, appointments]) => (
              <div key={month} style={{
                backgroundColor: 'white',
                borderRadius: '16px',
                padding: '24px',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
              }}>
                <h2 style={{
                  fontSize: '20px',
                  fontWeight: '600',
                  color: '#111827',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span>{getMonthName(month)}</span>
                  <span style={{
                    fontSize: '14px',
                    color: '#6b7280',
                    fontWeight: '400'
                  }}>
                    ({appointments.length} patient{appointments.length !== 1 ? 's' : ''})
                  </span>
                </h2>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {appointments
                    .sort((a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time))
                    .map((appointment) => (
                    <div key={appointment.id} style={{
                      padding: '20px',
                      backgroundColor: '#f9fafb',
                      borderRadius: '12px',
                      border: '1px solid #e5e7eb'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '12px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <div style={{
                            width: '48px',
                            height: '48px',
                            backgroundColor: '#6366f1',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '18px',
                            fontWeight: '600',
                            color: 'white'
                          }}>
                            {appointment.patientName.charAt(0)}
                          </div>
                          <div>
                            <h3 style={{
                              fontSize: '16px',
                              fontWeight: '600',
                              color: '#111827',
                              margin: '0 0 4px 0'
                            }}>
                              {appointment.patientName}
                            </h3>
                            <p style={{
                              fontSize: '14px',
                              color: '#6b7280',
                              margin: '0 0 4px 0'
                            }}>
                              {appointment.patientEmail}
                            </p>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '12px',
                              fontSize: '14px',
                              color: '#6b7280'
                            }}>
                              <span>{formatDate(appointment.date)}</span>
                              <span>•</span>
                              <span>{formatTime(appointment.time)}</span>
                              <span>•</span>
                              <span>{appointment.duration} min</span>
                              <span>•</span>
                              <span>{appointment.type}</span>
                            </div>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <p style={{
                            fontSize: '18px',
                            fontWeight: '600',
                            color: '#0d9488',
                            margin: '0 0 4px 0'
                          }}>
                            BHD {appointment.fee}
                          </p>
                          <span style={{
                            padding: '4px 12px',
                            backgroundColor: appointment.status === 'completed' ? '#dcfce7' : '#f3f4f6',
                            color: appointment.status === 'completed' ? '#166534' : '#6b7280',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: '500',
                            textTransform: 'capitalize'
                          }}>
                            {appointment.status}
                          </span>
                        </div>
                      </div>

                      {/* Patient Information */}
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '16px',
                        marginTop: '12px'
                      }}>
                        {/* Appointment Notes */}
                        {appointment.notes && (
                          <div style={{
                            padding: '12px',
                            backgroundColor: '#f3f4f6',
                            borderRadius: '8px'
                          }}>
                            <p style={{
                              fontSize: '12px',
                              fontWeight: '600',
                              color: '#374151',
                              margin: '0 0 4px 0'
                            }}>
                              Appointment Notes:
                            </p>
                            <p style={{
                              fontSize: '14px',
                              color: '#6b7280',
                              margin: 0
                            }}>
                              {appointment.notes}
                            </p>
                          </div>
                        )}

                        {/* Prescriptions */}
                        {(() => {
                          const patientPrescriptions = getPatientPrescriptions(appointment.patientId);
                          return patientPrescriptions.length > 0 && (
                            <div style={{
                              padding: '12px',
                              backgroundColor: '#f0fdfa',
                              borderRadius: '8px'
                            }}>
                              <p style={{
                                fontSize: '12px',
                                fontWeight: '600',
                                color: '#374151',
                                margin: '0 0 8px 0'
                              }}>
                                Recent Prescriptions:
                              </p>
                              {patientPrescriptions.slice(0, 2).map((prescription, idx) => (
                                <div key={idx} style={{ marginBottom: '8px' }}>
                                  <p style={{
                                    fontSize: '13px',
                                    fontWeight: '500',
                                    color: '#0d9488',
                                    margin: '0 0 2px 0'
                                  }}>
                                    {prescription.diagnosis}
                                  </p>
                                  <p style={{
                                    fontSize: '12px',
                                    color: '#6b7280',
                                    margin: 0
                                  }}>
                                    {prescription.medications.length} medication{prescription.medications.length !== 1 ? 's' : ''} prescribed
                                  </p>
                                </div>
                              ))}
                              {patientPrescriptions.length > 2 && (
                                <p style={{
                                  fontSize: '11px',
                                  color: '#9ca3af',
                                  margin: '4px 0 0 0',
                                  fontStyle: 'italic'
                                }}>
                                  +{patientPrescriptions.length - 2} more prescription{patientPrescriptions.length - 2 !== 1 ? 's' : ''}
                                </p>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Footer />
      <BackToTopButton />
    </div>
  );
};

export default PastPatients;