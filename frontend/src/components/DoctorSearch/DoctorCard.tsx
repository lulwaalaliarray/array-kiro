import { useState } from 'react';
import {
  Card,
  CardContent,
  Avatar,
  Typography,
  Button,
  Box,
  Chip,
  Rating,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  LocationOn as LocationOnIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
} from '@mui/icons-material';
import { DoctorProfile } from '../../types';
import AppointmentBooking from '../Booking/AppointmentBooking';

interface DoctorCardProps {
  doctor: DoctorProfile;
  showDistance?: boolean;
  distance?: number;
}

export const DoctorCard: React.FC<DoctorCardProps> = ({
  doctor,
  showDistance = false,
  distance
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [bookingOpen, setBookingOpen] = useState(false);

  const handleBookAppointment = () => {
    setBookingOpen(true);
  };

  return (
    <>
      <Card sx={{ mb: 2, '&:hover': { boxShadow: 4 } }}>
        <CardContent>
          <Box sx={{ 
            display: 'flex', 
            flexDirection: isMobile ? 'column' : 'row',
            gap: 2,
            alignItems: isMobile ? 'flex-start' : 'center'
          }}>
            {/* Profile Picture */}
            <Avatar
              src={doctor.profilePicture}
              sx={{ 
                width: 80, 
                height: 80,
                alignSelf: isMobile ? 'center' : 'flex-start'
              }}
            >
              <PersonIcon sx={{ fontSize: 40 }} />
            </Avatar>

            {/* Doctor Information */}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Box sx={{ 
                display: 'flex', 
                flexDirection: isMobile ? 'column' : 'row',
                justifyContent: 'space-between',
                alignItems: isMobile ? 'flex-start' : 'flex-start',
                gap: 2,
                mb: 1
              }}>
                <Box>
                  <Typography variant="h6" component="h3" gutterBottom>
                    Dr. {doctor.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {doctor.specializations?.join(', ')}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {doctor.yearsOfExperience} years experience
                  </Typography>
                </Box>

                <Box sx={{ textAlign: isMobile ? 'left' : 'right' }}>
                  <Typography variant="h5" color="primary" fontWeight="bold">
                    ₹{doctor.consultationFee?.toLocaleString()}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Consultation Fee
                  </Typography>
                </Box>
              </Box>

              {/* Rating */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Rating value={doctor.rating || 0} readOnly size="small" />
                <Typography variant="body2" color="text.secondary">
                  {doctor.rating?.toFixed(1) || 'N/A'} ({doctor.totalReviews || 0} reviews)
                </Typography>
              </Box>

              {/* Clinic Information */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  {doctor.clinicInfo?.name}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                  <LocationOnIcon fontSize="small" color="action" />
                  <Typography variant="body2" color="text.secondary">
                    {doctor.clinicInfo?.address?.city}, {doctor.clinicInfo?.address?.state}
                  </Typography>
                </Box>
                {showDistance && distance && (
                  <Typography variant="body2" color="primary">
                    {distance.toFixed(1)} km away
                  </Typography>
                )}
              </Box>

              {/* Status and Actions */}
              <Box sx={{ 
                display: 'flex', 
                flexDirection: isMobile ? 'column' : 'row',
                justifyContent: 'space-between',
                alignItems: isMobile ? 'stretch' : 'center',
                gap: 2
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                  <Chip
                    label={doctor.isAcceptingPatients ? 'Accepting Patients' : 'Not Accepting'}
                    color={doctor.isAcceptingPatients ? 'success' : 'error'}
                    size="small"
                  />
                  <Chip
                    label={`License: ${doctor.licenseVerificationStatus}`}
                    color={doctor.licenseVerificationStatus === 'verified' ? 'success' : 'warning'}
                    size="small"
                    variant="outlined"
                  />
                </Box>

                <Box sx={{ 
                  display: 'flex', 
                  gap: 1,
                  flexDirection: isMobile ? 'column' : 'row'
                }}>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => window.open(`/doctors/${doctor.userId}`, '_blank')}
                  >
                    View Profile
                  </Button>
                  {doctor.isAcceptingPatients && doctor.licenseVerificationStatus === 'verified' && (
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<CalendarIcon />}
                      onClick={handleBookAppointment}
                    >
                      Book Appointment
                    </Button>
                  )}
                </Box>
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>

      <AppointmentBooking
        open={bookingOpen}
        onClose={() => setBookingOpen(false)}
        doctor={doctor}
      />
    </>
  );
};