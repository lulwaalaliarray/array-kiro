import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import toast from 'react-hot-toast';

interface User {
  id: string;
  email: string;
  role: 'PATIENT' | 'DOCTOR' | 'ADMIN';
  isVerified: boolean;
  isActive: boolean;
}

interface PatientProfile {
  id: string;
  name: string;
  age: number;
  gender: string;
  phone: string;
  address: string;
}

interface DoctorProfile {
  id: string;
  name: string;
  profilePicture?: string;
  medicalLicenseNumber: string;
  licenseVerified: boolean;
  qualifications: string[];
  yearsOfExperience: number;
  specializations: string[];
  phone: string;
  clinicName: string;
  clinicAddress: string;
  consultationFee: number;
  isAcceptingPatients: boolean;
  rating: number;
  totalReviews: number;
}

interface AdminProfile {
  id: string;
  name: string;
  phone: string;
}

interface ProfileData {
  user: User;
  profile: PatientProfile | DoctorProfile | AdminProfile;
}

// Validation schemas
const patientSchema = yup.object({
  name: yup.string().required('Name is required'),
  age: yup.number().min(1, 'Age must be at least 1').max(120, 'Age must be less than 120').required('Age is required'),
  gender: yup.string().required('Gender is required'),
  phone: yup.string().required('Phone is required'),
  address: yup.string().required('Address is required')
});

const doctorSchema = yup.object({
  name: yup.string().required('Name is required'),
  qualifications: yup.array().of(yup.string()).min(1, 'At least one qualification is required'),
  yearsOfExperience: yup.number().min(0, 'Experience cannot be negative').required('Experience is required'),
  specializations: yup.array().of(yup.string()).min(1, 'At least one specialization is required'),
  phone: yup.string().required('Phone is required'),
  clinicName: yup.string().required('Clinic name is required'),
  clinicAddress: yup.string().required('Clinic address is required'),
  consultationFee: yup.number().min(0, 'Fee cannot be negative').required('Consultation fee is required'),
  isAcceptingPatients: yup.boolean()
});

const adminSchema = yup.object({
  name: yup.string().required('Name is required'),
  phone: yup.string().required('Phone is required')
});

export const ProfilePage: React.FC = () => {
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Get validation schema based on user role
  const getValidationSchema = () => {
    if (!profileData) return patientSchema;
    
    switch (profileData.user.role) {
      case 'PATIENT':
        return patientSchema;
      case 'DOCTOR':
        return doctorSchema;
      case 'ADMIN':
        return adminSchema;
      default:
        return patientSchema;
    }
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch
  } = useForm({
    resolver: yupResolver(getValidationSchema())
  });

  // Load profile data
  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const response = await fetch('/api/v1/users/profile', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load profile');
      }

      const data = await response.json();
      setProfileData(data.data);
      
      // Reset form with loaded data
      if (data.data.profile) {
        reset(data.data.profile);
      }
    } catch (error) {
      toast.error('Failed to load profile');
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  // Update profile
  const onSubmit = async (data: any) => {
    if (!profileData) return;

    setUpdating(true);
    try {
      const endpoint = `/api/v1/users/profile/${profileData.user.role.toLowerCase()}`;
      
      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      const result = await response.json();
      setProfileData(prev => prev ? { ...prev, profile: result.data.profile } : null);
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error('Failed to update profile');
      console.error('Error updating profile:', error);
    } finally {
      setUpdating(false);
    }
  };

  // Handle profile image upload
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || profileData?.user.role !== 'DOCTOR') return;

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('profileImage', file);

      const response = await fetch('/api/v1/users/profile/image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to upload image');
      }

      const result = await response.json();
      
      // Update profile data with new image URL
      setProfileData(prev => {
        if (prev && prev.user.role === 'DOCTOR') {
          return {
            ...prev,
            profile: {
              ...prev.profile as DoctorProfile,
              profilePicture: result.data.fileUrl
            }
          };
        }
        return prev;
      });

      toast.success('Profile image updated successfully');
    } catch (error) {
      toast.error('Failed to upload image');
      console.error('Error uploading image:', error);
    } finally {
      setUploadingImage(false);
    }
  };

  // Handle array field changes (qualifications, specializations)
  const handleArrayFieldChange = (fieldName: string, index: number, value: string) => {
    const currentValues = watch(fieldName) || [];
    const newValues = [...currentValues];
    newValues[index] = value;
    setValue(fieldName, newValues);
  };

  const addArrayField = (fieldName: string) => {
    const currentValues = watch(fieldName) || [];
    setValue(fieldName, [...currentValues, '']);
  };

  const removeArrayField = (fieldName: string, index: number) => {
    const currentValues = watch(fieldName) || [];
    const newValues = currentValues.filter((_: any, i: number) => i !== index);
    setValue(fieldName, newValues);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Failed to load profile data</p>
          <button
            onClick={loadProfile}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const { user, profile } = profileData;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                user.isVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
              }`}>
                {user.isVerified ? 'Verified' : 'Unverified'}
              </span>
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {user.role}
              </span>
            </div>
          </div>

          {/* Profile Image (Doctor only) */}
          {user.role === 'DOCTOR' && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Profile Picture
              </label>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-200">
                  {(profile as DoctorProfile).profilePicture ? (
                    <img
                      src={(profile as DoctorProfile).profilePicture}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="profile-image-upload"
                  />
                  <label
                    htmlFor="profile-image-upload"
                    className={`px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 ${
                      uploadingImage ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {uploadingImage ? 'Uploading...' : 'Change Picture'}
                  </label>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Common fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  {...register('name')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone *
                </label>
                <input
                  type="tel"
                  {...register('phone')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {errors.phone && (
                  <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
                )}
              </div>
            </div>

            {/* Patient-specific fields */}
            {user.role === 'PATIENT' && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Age *
                    </label>
                    <input
                      type="number"
                      {...register('age')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    {errors.age && (
                      <p className="mt-1 text-sm text-red-600">{errors.age.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Gender *
                    </label>
                    <select
                      {...register('gender')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                    {errors.gender && (
                      <p className="mt-1 text-sm text-red-600">{errors.gender.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address *
                  </label>
                  <textarea
                    {...register('address')}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {errors.address && (
                    <p className="mt-1 text-sm text-red-600">{errors.address.message}</p>
                  )}
                </div>
              </>
            )}

            {/* Doctor-specific fields */}
            {user.role === 'DOCTOR' && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Medical License Number
                    </label>
                    <input
                      type="text"
                      value={(profile as DoctorProfile).medicalLicenseNumber}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      License verification status: {(profile as DoctorProfile).licenseVerified ? 'Verified' : 'Pending'}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Years of Experience *
                    </label>
                    <input
                      type="number"
                      {...register('yearsOfExperience')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    {errors.yearsOfExperience && (
                      <p className="mt-1 text-sm text-red-600">{errors.yearsOfExperience.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Clinic Name *
                    </label>
                    <input
                      type="text"
                      {...register('clinicName')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    {errors.clinicName && (
                      <p className="mt-1 text-sm text-red-600">{errors.clinicName.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Consultation Fee ($) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      {...register('consultationFee')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    {errors.consultationFee && (
                      <p className="mt-1 text-sm text-red-600">{errors.consultationFee.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Clinic Address *
                  </label>
                  <textarea
                    {...register('clinicAddress')}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {errors.clinicAddress && (
                    <p className="mt-1 text-sm text-red-600">{errors.clinicAddress.message}</p>
                  )}
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    {...register('isAcceptingPatients')}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label className="ml-2 text-sm text-gray-700">
                    Currently accepting new patients
                  </label>
                </div>
              </>
            )}

            {/* Submit button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={updating}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updating ? 'Updating...' : 'Update Profile'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};