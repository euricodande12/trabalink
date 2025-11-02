# TrabaLink - Supabase Integration

TrabaLink is now fully connected to Supabase with real database functionality, user authentication, and persistent data storage.

## Features

### 🔐 Authentication
- **Sign Up**: Both job seekers and employers can create accounts
- **Sign In**: Returning users can log in to access their data
- **Session Management**: User sessions persist across page refreshes
- **Secure Passwords**: All passwords are encrypted via Supabase Auth

### 💼 Job Posting (Employers)
- Create and post job listings with full details
- Track applicant counts in real-time
- View all your posted jobs on the dashboard
- Jobs are stored permanently in the database

### 🔍 Job Search (Job Seekers)
- Browse real job listings from the database
- Search jobs by title or description
- Filter by category (Domestic, Retail, Farm, Catering, Trade)
- Real-time job updates

### 📝 Applications
- Submit job applications with motivation letters
- Track application status (pending, reviewed, accepted, rejected)
- Edit submitted applications
- View application history

### 📊 Analytics
- Employer dashboard shows:
  - Active job count
  - Total applicants across all jobs
  - Individual job performance

## Test Accounts

You can create test accounts or use these credentials if already created:

**Job Seeker:**
- Email: maria@test.com
- Password: test123

**Employer:**
- Email: tomas@test.com
- Password: test123

## How to Use

### For Job Seekers:
1. Click "Get Started" on the landing page
2. Select "Job Seeker"
3. Choose "Sign Up" to create a new account or "Sign In" if you have one
4. Browse jobs, apply to positions, and track your applications

### For Employers:
1. Click "Get Started" on the landing page
2. Select "Employer"
3. Choose "Sign Up" to create a new account or "Sign In" if you have one
4. Post jobs, view applicants, and manage your listings

## Database Structure

The app uses Supabase's key-value store with the following structure:

- `user:{userId}` - User profiles (name, email, type, etc.)
- `job:{jobId}` - Job listings
- `application:{applicationId}` - Job applications
- `employer:{employerId}:jobs` - List of job IDs per employer
- `user:{userId}:applications` - List of application IDs per user
- `job:{jobId}:applicants` - List of applicant IDs per job
- `feedback:{feedbackId}` - User feedback submissions

## API Endpoints

All API calls are made through `/utils/api.ts`:

### Auth API
- `signup()` - Create new account
- `signin()` - Sign in existing user
- `signout()` - Log out current user
- `getCurrentUser()` - Get current user data
- `isAuthenticated()` - Check if user is logged in

### Jobs API
- `getAll()` - Get all jobs with optional filters
- `getById()` - Get specific job details
- `create()` - Post a new job (employers only)
- `getEmployerJobs()` - Get jobs posted by current employer
- `getApplicants()` - Get applicants for a specific job

### Applications API
- `submit()` - Submit a job application
- `getMyApplications()` - Get user's applications
- `update()` - Update application details
- `updateStatus()` - Change application status (employers only)

### Feedback API
- `submit()` - Submit user feedback

## Connection Status

A connection indicator appears in the top-right corner:
- 🟢 Green: Connected to Supabase
- 🔴 Red: Offline mode

## Notes

- All data is stored in Namibian Dollars (N$)
- Salary periods can be weekly or monthly
- The app includes form validation and error handling
- Real-time updates when data changes
- Responsive design works on all devices
