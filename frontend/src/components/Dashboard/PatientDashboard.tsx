import { useEffect, useState } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Add as AddIcon,
  VideoCall as VideoCallIcon,
  LocationOn as LocationOnIcon,
  Cancel as CancelIcon,
  RateReview as ReviewIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { fetchAppointments, cancelAppointment } from '../../store/slices/appointmentSlice';
import { Appointment } from '../../types';

function PatientDashboard() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  
  const { appointments, isLoading } = useAppSelector((state) => state.appointments);
  const { user } = useAppSelector((state) => state.auth);
  
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);
  const [recentAppointments, setRecentAppointments] = useState<Appointment[]>([]);

  useEffect(() => {
    if (user) {
      dispatch(fetchAppointments());
    }
  }, [dispatch, user]);

  useEffect(() => {
    const now = new Date();
    const upcoming = appointments.filter(apt => 
      new Date(apt.scheduledDateTime) > now && 
      ['confirmed', 'payment_pending'].includes(apt.status)
    );
    const recent = appointments.filter(apt => 
      apt.status === 'completed' || 
      (new Date(apt.scheduledDateTime) <= now && apt.status === 'confirmed')
    ).slice(0, 5);
    
    setUpcomingAppointments(upcoming);
    setRecentAppointments(recent);
  }, [appointments]);

  const handleCancelAppointment = async (appointmentId: string) => {
    if (window.confirm('Are you sure you want to cancel this appointment?')) {
      await dispatch(cancelAppointment({ 
        appointmentId, 
        reason: 'Cancelled by patient' 
      }));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'success';
      case 'payment_pending': return 'warning';
      case 'awaiting_acceptance': return 'info';
      case 'completed': return 'success';
      case 'cancelled': return 'error';
      case 'rejected': return 'error';
      default: return 'default';
    }
  };

  const formatStatus = (status: string) => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Welcome back, {user?.profile?.name || 'Patient'}!
      </Typography>

      <Grid container spacing={3}>
        {/* Quick Actions */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Quick Actions
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => navigate('/doctors')}
                  fullWidth
                >
                  Book Appointment
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/medical-history')}
                  fullWidth
                >
                  Medical History
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/appointments')}
                  fullWidth
                >
                  View All Appointments
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Upcoming Appointments */}
        <Grid item xs={12} md={8}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Upcoming Appointments
              </Typography>
              {upcomingAppointments.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No upcoming appointments. Book one now!
                </Typography>
              ) : (
                <List>
                  {upcomingAppointments.map((appointment) => (
                    <ListItem
                      key={appointment.id}
                      sx={{
                        border: 1,
                        borderColor: 'divider',
                        borderRadius: 1,
                        mb: 1,
                        flexDirection: isMobile ? 'column' : 'row',
                        alignItems: isMobile ? 'flex-start' : 'center',
                      }}
                    >
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                            <Typography variant="subtitle1">
                              Dr. {appointment.doctor?.name || 'Unknown'}
                            </Typography>
                            <Chip
                              size="small"
                              label={formatStatus(appointment.status)}
                              color={getStatusColor(appointment.status) as any}
                            />
                            {appointment.type === 'online' && <VideoCallIcon color="primary" />}
                            {appointment.type === 'physical' && <LocationOnIcon color="action" />}
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2">
                              {format(new Date(appointment.scheduledDateTime), 'PPP p')}
                            </Typography>
                            {appointment.doctor?.specializations && (
                              <Typography variant="caption" color="text.secondary">
                                {appointment.doctor.specializations.join(', ')}
                              </Typography>
                            )}
                          </Box>
                        }
                      />
                      <ListItemSecondaryAction>
                        <Box sx={{ display: 'flex', gap: 1, flexDirection: isMobile ? 'column' : 'row' }}>
                          {appointment.status === 'confirmed' && appointment.type === 'online' && (
                            <Button
                              size="small"
                              variant="contained"
                              startIcon={<VideoCallIcon />}
                              onClick={() => navigate(`/appointments/${appointment.id}/join`)}
                            >
                              Join
                            </Button>
                          )}
                          {appointment.status === 'payment_pending' && (
                            <Button
                              size="small"
                              variant="contained"
                              color="warning"
                              onClick={() => navigate(`/appointments/${appointment.id}/payment`)}
                            >
                              Pay Now
                            </Button>
                          )}
                          {['awaiting_acceptance', 'payment_pending', 'confirmed'].includes(appointment.status) && (
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleCancelAppointment(appointment.id)}
                            >
                              <CancelIcon />
                            </IconButton>
                          )}
                        </Box>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Appointments */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Appointments
              </Typography>
              {recentAppointments.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No recent appointments.
                </Typography>
              ) : (
                <List>
                  {recentAppointments.map((appointment) => (
                    <ListItem
                      key={appointment.id}
                      sx={{
                        border: 1,
                        borderColor: 'divider',
                        borderRadius: 1,
                        mb: 1,
                        flexDirection: isMobile ? 'column' : 'row',
                        alignItems: isMobile ? 'flex-start' : 'center',
                      }}
                    >
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                            <Typography variant="subtitle1">
                              Dr. {appointment.doctor?.name || 'Unknown'}
                            </Typography>
                            <Chip
                              size="small"
                              label={formatStatus(appointment.status)}
                              color={getStatusColor(appointment.status) as any}
                            />
                          </Box>
                        }
                        secondary={
                          <Typography variant="body2">
                            {format(new Date(appointment.scheduledDateTime), 'PPP p')}
                          </Typography>
                        }
                      />
                      <ListItemSecondaryAction>
                        {appointment.status === 'completed' && (
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<ReviewIcon />}
                            onClick={() => navigate(`/appointments/${appointment.id}/review`)}
                          >
                            Review
                          </Button>
                        )}
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

export default PatientDashboard;