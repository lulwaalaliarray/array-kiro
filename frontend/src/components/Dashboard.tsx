import React from 'react';
import { useNavigate } from 'react-router-dom';
import { handleNavigation, routes } from '../utils/navigation';
import { useToast } from './Toast';

interface DashboardProps {
  user: {
    name: string;
    avatar?: string;
  };
}

const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? 'Good morning' : currentHour < 18 ? 'Good afternoon' : 'Good evening';
  const navigate = useNavigate();
  const { showToast } = useToast();

  const handleQuickAction = (destination: string, requiresAuth: boolean = true) => {
    handleNavigation(navigate, destination, requiresAuth, showToast);
  };

  const quickActions = [
    {
      title: 'Book Appointment',
      description: 'Schedule with your doctor',
      icon: (
        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
        </svg>
      ),
      color: 'bg-primary-teal',
      bgColor: 'bg-primary-light'
    },
    {
      title: 'Chat with Doctor',
      description: 'Instant medical consultation',
      icon: (
        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
        </svg>
      ),
      color: 'bg-success',
      bgColor: 'bg-success-light'
    },
    {
      title: 'View Records',
      description: 'Access medical history',
      icon: (
        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm0 2v8h12V6H4zm2 2a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm0 3a1 1 0 011-1h3a1 1 0 110 2H7a1 1 0 01-1-1z" clipRule="evenodd" />
        </svg>
      ),
      color: 'bg-primary-blue',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Prescriptions',
      description: 'Manage medications',
      icon: (
        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
        </svg>
      ),
      color: 'bg-warning',
      bgColor: 'bg-warning-light'
    }
  ];

  const upcomingAppointments = [
    {
      id: 1,
      doctor: 'Dr. Sarah Johnson',
      specialty: 'Cardiologist',
      date: 'Today',
      time: '2:30 PM',
      type: 'Follow-up',
      avatar: '👩‍⚕️'
    },
    {
      id: 2,
      doctor: 'Dr. Michael Chen',
      specialty: 'Dermatologist',
      date: 'Tomorrow',
      time: '10:00 AM',
      type: 'Consultation',
      avatar: '👨‍⚕️'
    }
  ];

  const healthMetrics = [
    { label: 'Blood Pressure', value: '120/80', status: 'normal', color: 'text-success' },
    { label: 'Heart Rate', value: '72 bpm', status: 'normal', color: 'text-success' },
    { label: 'Weight', value: '68 kg', status: 'stable', color: 'text-primary-blue' },
    { label: 'Last Checkup', value: '2 weeks ago', status: 'recent', color: 'text-primary-teal' }
  ];

  return (
    <div className="min-h-screen bg-neutral">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-100">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary-light rounded-full flex items-center justify-center">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full" />
                ) : (
                  <span className="text-primary-teal font-semibold text-lg">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-gray-800">
                  {greeting}, {user.name}!
                </h1>
                <p className="text-gray-600">How are you feeling today?</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <button className="relative p-2 text-gray-600 hover:text-primary-teal transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM9 7H4l5-5v5zm6 10V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2h6a2 2 0 002-2z" />
                </svg>
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-alert rounded-full"></span>
              </button>
              
              <button className="p-2 text-gray-600 hover:text-primary-teal transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Quick Actions */}
            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-6">Quick Actions</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {quickActions.map((action, index) => (
                  <button
                    key={index}
                    className="card hover:shadow-md transition-all duration-200 text-left group"
                    onClick={() => {
                      const routeMap: { [key: string]: string } = {
                        'Book Appointment': routes.appointments,
                        'Chat with Doctor': routes.chat,
                        'View Records': routes.records,
                        'Prescriptions': routes.records
                      };
                      handleQuickAction(routeMap[action.title] || routes.dashboard, true);
                    }}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 ${action.bgColor} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform`}>
                        <div className={`${action.color} text-white`}>
                          {action.icon}
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800 mb-1">{action.title}</h3>
                        <p className="text-sm text-gray-600">{action.description}</p>
                      </div>
                      <svg className="w-5 h-5 text-gray-400 group-hover:text-primary-teal transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </button>
                ))}
              </div>
            </section>

            {/* Upcoming Appointments */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-800">Upcoming Appointments</h2>
                <button className="text-primary-teal hover:text-primary-dark font-medium text-sm">
                  View All
                </button>
              </div>
              
              <div className="space-y-4">
                {upcomingAppointments.map((appointment) => (
                  <div key={appointment.id} className="card">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-primary-light rounded-full flex items-center justify-center text-2xl">
                        {appointment.avatar}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800">{appointment.doctor}</h3>
                        <p className="text-sm text-gray-600">{appointment.specialty}</p>
                        <div className="flex items-center gap-4 mt-2">
                          <span className="text-sm font-medium text-primary-teal">{appointment.date}</span>
                          <span className="text-sm text-gray-500">{appointment.time}</span>
                          <span className="text-xs bg-primary-light text-primary-teal px-2 py-1 rounded-full">
                            {appointment.type}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button className="btn btn-sm btn-secondary">Reschedule</button>
                        <button className="btn btn-sm btn-primary">Join</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Health Metrics */}
            <section className="card">
              <h3 className="font-semibold text-gray-800 mb-4">Health Overview</h3>
              <div className="space-y-4">
                {healthMetrics.map((metric, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">{metric.label}</p>
                      <p className={`font-semibold ${metric.color}`}>{metric.value}</p>
                    </div>
                    <div className="w-2 h-2 bg-success rounded-full"></div>
                  </div>
                ))}
              </div>
              <button className="btn btn-secondary w-full mt-4">
                View Detailed Report
              </button>
            </section>

            {/* Recent Activity */}
            <section className="card">
              <h3 className="font-semibold text-gray-800 mb-4">Recent Activity</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-success rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm text-gray-800">Prescription refilled</p>
                    <p className="text-xs text-gray-500">2 hours ago</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-primary-teal rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm text-gray-800">Lab results available</p>
                    <p className="text-xs text-gray-500">1 day ago</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-warning rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm text-gray-800">Appointment reminder</p>
                    <p className="text-xs text-gray-500">2 days ago</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Emergency Contact */}
            <section className="card bg-alert-light border border-alert/20">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-alert rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="font-semibold text-alert">Emergency</h3>
              </div>
              <p className="text-sm text-gray-700 mb-3">
                For medical emergencies, call 911 or visit your nearest emergency room.
              </p>
              <button className="btn btn-alert w-full">
                Emergency Contact
              </button>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;