export interface Prescription {
  id: string;
  patientId: string;
  patientName: string;
  patientEmail: string;
  doctorId: string;
  doctorName: string;
  medications: {
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions: string;
  }[];
  diagnosis: string;
  notes?: string;
  dateIssued: string;
  status: 'active' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

const PRESCRIPTIONS_STORAGE_KEY = 'patientcare_prescriptions';

export const prescriptionStorage = {
  // Get all prescriptions
  getAllPrescriptions: (): Prescription[] => {
    try {
      const stored = localStorage.getItem(PRESCRIPTIONS_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading prescriptions:', error);
      return [];
    }
  },

  // Get prescriptions for a specific doctor
  getDoctorPrescriptions: (doctorId: string): Prescription[] => {
    const prescriptions = prescriptionStorage.getAllPrescriptions();
    return prescriptions.filter(prescription => prescription.doctorId === doctorId);
  },

  // Get prescriptions for a specific patient
  getPatientPrescriptions: (patientId: string): Prescription[] => {
    const prescriptions = prescriptionStorage.getAllPrescriptions();
    return prescriptions.filter(prescription => prescription.patientId === patientId);
  },

  // Add new prescription
  addPrescription: (prescription: Omit<Prescription, 'id' | 'createdAt' | 'updatedAt'>): Prescription => {
    const prescriptions = prescriptionStorage.getAllPrescriptions();
    const newPrescription: Prescription = {
      ...prescription,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    prescriptions.push(newPrescription);
    localStorage.setItem(PRESCRIPTIONS_STORAGE_KEY, JSON.stringify(prescriptions));
    return newPrescription;
  },

  // Update prescription
  updatePrescription: (id: string, updates: Partial<Prescription>): boolean => {
    try {
      const prescriptions = prescriptionStorage.getAllPrescriptions();
      const index = prescriptions.findIndex(prescription => prescription.id === id);
      
      if (index === -1) return false;
      
      prescriptions[index] = {
        ...prescriptions[index],
        ...updates,
        updatedAt: new Date().toISOString()
      };
      
      localStorage.setItem(PRESCRIPTIONS_STORAGE_KEY, JSON.stringify(prescriptions));
      return true;
    } catch (error) {
      console.error('Error updating prescription:', error);
      return false;
    }
  },

  // Delete prescription
  deletePrescription: (id: string): boolean => {
    try {
      const prescriptions = prescriptionStorage.getAllPrescriptions();
      const filtered = prescriptions.filter(prescription => prescription.id !== id);
      localStorage.setItem(PRESCRIPTIONS_STORAGE_KEY, JSON.stringify(filtered));
      return true;
    } catch (error) {
      console.error('Error deleting prescription:', error);
      return false;
    }
  }
};