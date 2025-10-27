# 🚀 PatientCare - GitHub Setup & Deployment Guide

## 📋 Prerequisites

### 1. Install Git
- Download Git from: https://git-scm.com/download/win
- Install with default settings
- Restart your command prompt after installation

### 2. Create GitHub Account
- Go to https://github.com
- Sign up for a free account if you don't have one

## 🔧 Initial Setup

### Step 1: Initialize Git Repository
Open Command Prompt in your project folder and run:

```bash
cd "C:\Users\LulwaAlali\Downloads\kiroProject"
git init
```

### Step 2: Configure Git (First time only)
```bash
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

### Step 3: Create .gitignore File
Create a `.gitignore` file to exclude unnecessary files:

```
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Production builds
/frontend/dist/
/frontend/build/
/backend/dist/

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# IDE files
.vscode/
.idea/
*.swp
*.swo

# OS files
.DS_Store
Thumbs.db

# Logs
logs/
*.log

# Runtime data
pids/
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/

# Temporary folders
tmp/
temp/
```

### Step 4: Add Files to Git
```bash
git add .
git commit -m "Initial commit: PatientCare healthcare platform for Bahrain"
```

## 🌐 Push to GitHub

### Step 1: Create GitHub Repository
1. Go to https://github.com
2. Click "New repository" (green button)
3. Repository name: `patientcare-bahrain`
4. Description: `Healthcare appointment booking platform for Bahrain`
5. Make it **Public** or **Private** (your choice)
6. **Don't** initialize with README (we already have files)
7. Click "Create repository"

### Step 2: Connect Local Repository to GitHub
Replace `YOUR_USERNAME` with your GitHub username:

```bash
git remote add origin https://github.com/YOUR_USERNAME/patientcare-bahrain.git
git branch -M main
git push -u origin main
```

## 🔄 Daily Update Workflow

### Making Changes and Pushing Updates

1. **Check what files changed:**
   ```bash
   git status
   ```

2. **Add specific files or all changes:**
   ```bash
   # Add specific files
   git add frontend/src/components/NewComponent.tsx
   
   # Or add all changes
   git add .
   ```

3. **Commit with descriptive message:**
   ```bash
   git commit -m "Add doctor verification system with CPR validation"
   ```

4. **Push to GitHub:**
   ```bash
   git push
   ```

### Example Commit Messages
- `feat: Add patient dashboard with appointment booking`
- `fix: Resolve login redirect issue for doctors`
- `style: Update Bahrain healthcare theme colors`
- `docs: Add API documentation for appointments`
- `refactor: Improve authentication flow`

## 🚀 Deployment Options

### Option 1: Vercel (Recommended for Frontend)
1. Go to https://vercel.com
2. Sign up with GitHub
3. Import your repository
4. Set build settings:
   - Framework: React
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `dist`

### Option 2: Netlify
1. Go to https://netlify.com
2. Connect GitHub account
3. Deploy from Git repository
4. Build settings:
   - Base directory: `frontend`
   - Build command: `npm run build`
   - Publish directory: `frontend/dist`

### Option 3: GitHub Pages (Static only)
1. In your GitHub repository settings
2. Go to "Pages" section
3. Source: Deploy from branch
4. Branch: main
5. Folder: `/docs` or root

## 📁 Recommended Project Structure

```
patientcare-bahrain/
├── frontend/                 # React frontend
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── vite.config.js
├── backend/                  # Node.js backend (future)
│   ├── src/
│   ├── package.json
│   └── server.js
├── docs/                     # Documentation
├── .gitignore
├── README.md
└── GITHUB_SETUP_GUIDE.md
```

## 🔐 Environment Variables (For Production)

Create `.env` files for sensitive data:

### Frontend (.env)
```
VITE_API_BASE_URL=https://your-api-domain.com
VITE_STRIPE_PUBLIC_KEY=pk_live_...
```

### Backend (.env)
```
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret-key
STRIPE_SECRET_KEY=sk_live_...
```

## 📊 GitHub Features to Use

### 1. Issues
- Track bugs and feature requests
- Create templates for bug reports

### 2. Projects
- Organize tasks with Kanban boards
- Track development progress

### 3. Actions (CI/CD)
- Automatic testing on push
- Automatic deployment
- Code quality checks

### 4. Releases
- Tag stable versions
- Create release notes
- Distribute builds

## 🛡️ Security Best Practices

1. **Never commit sensitive data:**
   - API keys
   - Database passwords
   - JWT secrets

2. **Use environment variables**
3. **Keep dependencies updated**
4. **Enable GitHub security alerts**
5. **Use branch protection rules**

## 📝 Next Steps

1. Install Git and create GitHub account
2. Follow the setup steps above
3. Push your current code
4. Set up deployment (Vercel recommended)
5. Create issues for future features
6. Invite collaborators if working in a team

## 🆘 Common Issues & Solutions

### Git not recognized
- Install Git from official website
- Restart command prompt
- Check PATH environment variable

### Permission denied (GitHub)
- Set up SSH keys or use personal access token
- Check repository permissions

### Build failures
- Check Node.js version compatibility
- Clear node_modules and reinstall
- Check environment variables

---

## 🇧🇭 PatientCare Project Status

✅ **Completed Features:**
- Professional healthcare UI design
- Patient/Doctor authentication system
- CPR validation for Bahrain residents
- Doctor certification upload
- Find doctors with NHRA licensing
- Responsive design for mobile/desktop
- Arabic & English language support

🚧 **Next Development Phase:**
- Backend API development
- Database integration
- Real appointment booking
- Payment processing (BHD)
- SMS notifications in Arabic
- Integration with Bahrain hospitals

---

**Happy coding! 🩺💻**