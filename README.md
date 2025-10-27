# 🏥 PatientCare - Healthcare Platform for Bahrain

A modern, secure healthcare appointment booking platform designed specifically for the Kingdom of Bahrain, connecting patients with NHRA-licensed healthcare professionals.

![PatientCare Banner](https://via.placeholder.com/800x200/0d9488/ffffff?text=PatientCare+%7C+Your+Health%2C+Simplified)

## 🇧🇭 Built for Bahrain

- **NHRA Compliant** - Integrated with National Health Regulatory Authority standards
- **MOH Certified** - Aligned with Ministry of Health requirements
- **Bilingual Support** - Arabic and English interface
- **CPR Integration** - Bahraini Civil Personal Record validation
- **Local Healthcare Network** - Connected to major Bahraini hospitals

## ✨ Features

### 👥 For Patients
- **Smart Appointment Booking** - Real-time availability with SMS reminders
- **Find Doctors** - Search NHRA-licensed specialists across Bahrain
- **Secure Messaging** - HIPAA-compliant chat with healthcare providers
- **Digital Health Records** - Access medical history and prescriptions
- **Telemedicine** - Video consultations from anywhere in the Kingdom

### 🩺 For Doctors
- **Professional Verification** - NHRA license validation system
- **Patient Management** - Comprehensive patient profiles and history
- **Appointment Scheduling** - Calendar integration and availability management
- **Digital Prescriptions** - Electronic prescription management
- **Secure Communication** - Encrypted messaging with patients

### 🔒 Security & Compliance
- **End-to-End Encryption** - Military-grade data protection
- **NHRA Approved** - Compliant with Bahrain healthcare regulations
- **CPR Validation** - Secure identity verification
- **Audit Trails** - Complete activity logging for compliance

## 🚀 Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **React Router** for navigation
- **Custom CSS** with medical-themed design system
- **Responsive Design** for mobile and desktop

### Backend (Planned)
- **Node.js** with Express
- **PostgreSQL** database
- **Redis** for caching
- **JWT** authentication
- **Stripe** for payments (BHD support)

### Infrastructure
- **Docker** containerization
- **GitHub Actions** CI/CD
- **Vercel/Netlify** deployment
- **AWS/Azure** cloud hosting

## 🏃‍♂️ Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Git

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/patientcare-bahrain.git
   cd patientcare-bahrain
   ```

2. **Install dependencies:**
   ```bash
   npm run install:all
   ```

3. **Start development servers:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   - Frontend: http://localhost:3000
   - Backend: http://localhost:3001

### Demo Credentials

**Patient Login:**
- Email: `patient@patientcare.bh`
- Password: `password`

**Doctor Login:**
- Email: `doctor@patientcare.bh`
- Password: `doctor123`

## 📱 Screenshots

### Welcome Page
![Welcome Page](https://via.placeholder.com/600x400/f8fafc/0d9488?text=Professional+Healthcare+Landing)

### Patient Dashboard
![Patient Dashboard](https://via.placeholder.com/600x400/ffffff/1f2937?text=Patient+Dashboard+with+Quick+Actions)

### Find Doctors
![Find Doctors](https://via.placeholder.com/600x400/f8fafc/0d9488?text=NHRA-Licensed+Doctors+Directory)

### Doctor Profile
![Doctor Profile](https://via.placeholder.com/600x400/ffffff/1f2937?text=Professional+Doctor+Profiles)

## 🏗️ Project Structure

```
patientcare-bahrain/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── pages/           # Page components
│   │   ├── hooks/           # Custom React hooks
│   │   ├── utils/           # Utility functions
│   │   └── index.css        # Global styles
│   ├── public/              # Static assets
│   └── package.json
├── backend/                  # Node.js backend (planned)
│   ├── src/
│   │   ├── routes/          # API routes
│   │   ├── models/          # Database models
│   │   ├── middleware/      # Express middleware
│   │   └── utils/           # Backend utilities
│   └── package.json
├── docs/                     # Documentation
├── docker/                   # Docker configuration
├── .github/                  # GitHub workflows
├── .gitignore
├── README.md
└── package.json              # Root package.json
```

## 🛠️ Development

### Available Scripts

```bash
# Install all dependencies
npm run install:all

# Start development servers
npm run dev

# Start frontend only
npm run dev:frontend

# Start backend only
npm run dev:backend

# Build for production
npm run build

# Run tests
npm test

# Lint code
npm run lint

# Format code
npm run format
```

### Environment Variables

Create `.env` files in frontend and backend directories:

**Frontend (.env):**
```
VITE_API_BASE_URL=http://localhost:3001/api/v1
VITE_STRIPE_PUBLIC_KEY=pk_test_...
```

**Backend (.env):**
```
DATABASE_URL=postgresql://localhost:5432/patientcare
JWT_SECRET=your-secret-key
STRIPE_SECRET_KEY=sk_test_...
REDIS_URL=redis://localhost:6379
```

## 🚀 Deployment

### Vercel (Frontend)
1. Connect GitHub repository to Vercel
2. Set build settings:
   - Framework: React
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `dist`

### Railway/Heroku (Backend)
1. Connect GitHub repository
2. Set environment variables
3. Deploy with automatic builds

### Docker
```bash
# Build and run with Docker Compose
docker-compose up --build

# Production deployment
docker-compose -f docker-compose.prod.yml up -d
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Workflow
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Run tests: `npm test`
5. Commit: `git commit -m 'Add amazing feature'`
6. Push: `git push origin feature/amazing-feature`
7. Open a Pull Request

## 📋 Roadmap

### Phase 1: Foundation ✅
- [x] Professional UI/UX design
- [x] Patient/Doctor authentication
- [x] CPR validation system
- [x] Doctor verification workflow
- [x] Responsive design

### Phase 2: Core Features 🚧
- [ ] Backend API development
- [ ] Database integration
- [ ] Real appointment booking
- [ ] Payment processing (BHD)
- [ ] SMS notifications

### Phase 3: Advanced Features 📅
- [ ] Telemedicine integration
- [ ] Hospital network integration
- [ ] Insurance claim processing
- [ ] Mobile app development
- [ ] AI-powered health insights

### Phase 4: Scale & Optimize 🔮
- [ ] Multi-language support
- [ ] Advanced analytics
- [ ] API for third-party integrations
- [ ] Enterprise features

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation:** [docs/](docs/)
- **Issues:** [GitHub Issues](https://github.com/yourusername/patientcare-bahrain/issues)
- **Discussions:** [GitHub Discussions](https://github.com/yourusername/patientcare-bahrain/discussions)
- **Email:** support@patientcare.bh

## 🙏 Acknowledgments

- **Bahrain Ministry of Health** for healthcare standards guidance
- **NHRA** for regulatory compliance requirements
- **Healthcare professionals** in Bahrain for feedback and testing
- **Open source community** for amazing tools and libraries

---

<div align="center">

**Built with ❤️ for the healthcare community in Bahrain**

[Website](https://patientcare.bh) • [Documentation](docs/) • [API](api/) • [Support](mailto:support@patientcare.bh)

</div>