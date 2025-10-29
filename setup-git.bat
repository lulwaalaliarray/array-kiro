@echo off
echo Setting up Git repository for PatientCare improvements...

REM Initialize Git repository
git init

REM Configure Git user (replace with your details)
git config user.name "Lulwa Alali"
git config user.email "your.email@example.com"

REM Add remote repository
git remote add origin https://github.com/aamna466/patientCare-.git

REM Create and switch to new branch
git checkout -b feature/dashboard-reviews-availability-improvements

REM Add all files
git add .

REM Commit with comprehensive message
git commit -m "feat: Major PatientCare improvements - Dashboard, Reviews, Availability System

✅ Dashboard Cleanup:
- Remove unnecessary sign out and home buttons from dashboard
- Clean up unused imports and functions

⭐ Fixed Star Rating System:
- Fix star ratings to show accurate ratings instead of always 5 stars
- Update renderStars function to use proper inline styles
- Use correct colors for filled (#fbbf24) and empty (#d1d5db) stars

📊 Enhanced Review & Rating System:
- Integrate real review data in doctor profiles
- Add complete Patient Reviews section with individual review cards
- Show accurate average ratings from reviewStorage
- Display up to 5 reviews with patient names, ratings, dates, comments

🗓️ Complete Availability System Overhaul:
- Create new availabilityStorage.ts with date-specific override support
- Enhance ManageAvailability component with interactive calendar
- Add 30-day visual calendar with color-coded availability status
- Implement date-specific availability overrides
- Add DateOverrideModal for custom availability settings
- Support custom hours for specific dates
- Add reason tracking for unavailability
- Integrate availability system with booking modal
- Real-time availability validation in booking process

🎨 User Experience Improvements:
- Interactive calendar interface with hover effects
- Color-coded availability system
- Quick action buttons for common availability changes
- Comprehensive test files for all improvements

📁 Files Modified/Created:
- frontend/src/components/Dashboard.tsx (cleaned up)
- frontend/src/pages/DoctorProfilePage.tsx (reviews + star fix)
- frontend/src/utils/availabilityStorage.ts (NEW)
- frontend/src/components/ManageAvailability.tsx (enhanced)
- frontend/src/components/Booking/BookingModal.tsx (enhanced)
- RECENT_IMPROVEMENTS.md (NEW - comprehensive documentation)
- Multiple test files for verification

All improvements are production-ready and significantly enhance the PatientCare platform!"

REM Push to GitHub
git push -u origin feature/dashboard-reviews-availability-improvements

echo.
echo ✅ Git setup complete!
echo 🚀 Your improvements have been pushed to GitHub!
echo 📋 Branch: feature/dashboard-reviews-availability-improvements
echo 🌐 Repository: https://github.com/aamna466/patientCare-
echo.
echo Next steps:
echo 1. Go to https://github.com/aamna466/patientCare-
echo 2. Create a Pull Request for your new branch
echo 3. Review and merge your improvements
echo.
pause