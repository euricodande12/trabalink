import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ThemeToggle } from "./components/ThemeToggle";
import { AnimatedButton } from "./components/AnimatedButton";
import { JobCard } from "./components/JobCard";
import { CustomModal } from "./components/CustomModal";
import { LoaderSpinner } from "./components/LoaderSpinner";
import {
  Search,
  Filter,
  MapPin,
  DollarSign,
  Briefcase,
  Clock,
  CheckCircle2,
  User,
  FileText,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Star,
  Phone,
  Mail,
  HelpCircle,
  Send,
  Edit,
  Eye,
  Calendar,
  Building2,
  Users,
  WifiOff,
  AlertCircle,
} from "lucide-react";
import { Input } from "./components/ui/input";
import { Textarea } from "./components/ui/textarea";
import { Label } from "./components/ui/label";
import { Switch } from "./components/ui/switch";
import { Badge } from "./components/ui/badge";
import { Separator } from "./components/ui/separator";
import { authAPI, jobsAPI, applicationsAPI, feedbackAPI } from "./utils/api";
import { ConnectionStatus } from "./components/ConnectionStatus";

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  salary: string;
  type: string;
  postedTime: string;
  category: string;
  description?: string;
  requirements?: string[];
  employerId?: string;
  salaryPeriod?: string;
  applicantCount?: number;
  imageUrl?: string;
}

interface Application {
  id: string;
  jobId: string;
  jobTitle: string;
  company: string;
  appliedDate: string;
  status: "pending" | "reviewed" | "rejected" | "accepted";
  motivation?: string;
  name?: string;
  email?: string;
  phone?: string;
}

export default function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [currentScreen, setCurrentScreen] = useState(0);
  const [userType, setUserType] = useState<"jobseeker" | "employer" | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [showJobDetailsModal, setShowJobDetailsModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [weeklyRate, setWeeklyRate] = useState(false);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [employerJobs, setEmployerJobs] = useState<Job[]>([]);
  const [showEditApplicationModal, setShowEditApplicationModal] = useState(false);
  const [showViewApplicationModal, setShowViewApplicationModal] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    motivation: "",
    jobTitle: "",
    jobDescription: "",
    salary: "",
    location: "",
    category: "Domestic",
    businessName: "",
  });
  const [showContactModal, setShowContactModal] = useState(false);
  const [showFeedbackSuccess, setShowFeedbackSuccess] = useState(false);
  const [rating, setRating] = useState(0);
  const [error, setError] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [showApplicantsModal, setShowApplicantsModal] = useState(false);
  const [currentJobApplicants, setCurrentJobApplicants] = useState<Application[]>([]);
  const [selectedJobForApplicants, setSelectedJobForApplicants] = useState<Job | null>(null);
  const [showEditJobModal, setShowEditJobModal] = useState(false);
  const [selectedJobToEdit, setSelectedJobToEdit] = useState<Job | null>(null);
  const [showRejectionAdviceModal, setShowRejectionAdviceModal] = useState(false);
  const [rejectionAdvice, setRejectionAdvice] = useState("");
  const [showAuthWarningModal, setShowAuthWarningModal] = useState(false);
  const [acceptedApplicantsCount, setAcceptedApplicantsCount] = useState(0);

  // Check if user is authenticated on mount
  useEffect(() => {
    const user = authAPI.getCurrentUser();
    if (user) {
      setCurrentUser(user);
      setUserType(user.userType);
      setFormData({
        ...formData,
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        location: user.location || "",
        businessName: user.businessName || "",
      });
    }
  }, []);

  // Load jobs when on job feed
  useEffect(() => {
    if (currentScreen === 4) {
      loadJobs();
    }
  }, [currentScreen, searchQuery, selectedCategory]);

  // Load applications when on my applications screen
  useEffect(() => {
    if (currentScreen === 9 && authAPI.isAuthenticated()) {
      loadApplications();
    }
  }, [currentScreen]);

  // Load employer jobs when on dashboard
  useEffect(() => {
    if (currentScreen === 8 && authAPI.isAuthenticated()) {
      loadEmployerJobs();
    }
  }, [currentScreen]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  // Helper to get image search query for job category
  const getJobImageQuery = (category: string, title: string) => {
    const categoryQueries: { [key: string]: string } = {
      Domestic: "professional cleaning house",
      Retail: "retail store shopping",
      Farm: "agriculture farming",
      Catering: "restaurant food service",
      Trade: "construction workers tools"
    };
    return categoryQueries[category] || "professional work";
  };

  // Helper functions
  const loadJobs = async () => {
    try {
      setIsLoading(true);
      const response = await jobsAPI.getAll(searchQuery, selectedCategory !== "All" ? selectedCategory : undefined);
      if (response.success) {
        setJobs(response.jobs.map((job: any) => ({
          ...job,
          postedTime: formatTime(job.postedTime),
          salary: formatSalary(job.salary, job.salaryPeriod),
          // For now, we'll use a placeholder. In production, images would be stored in the job record
          imageUrl: job.imageUrl || undefined,
        })));
      }
    } catch (err: any) {
      console.error("Error loading jobs:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const loadApplications = async () => {
    try {
      setIsLoading(true);
      const response = await applicationsAPI.getMyApplications();
      if (response.success) {
        setApplications(response.applications);
      }
    } catch (err: any) {
      console.error("Error loading applications:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const loadEmployerJobs = async () => {
    try {
      setIsLoading(true);
      const response = await jobsAPI.getEmployerJobs();
      if (response.success) {
        setEmployerJobs(response.jobs.map((job: any) => ({
          ...job,
          postedTime: formatTime(job.postedTime),
        })));
        
        // Load all applicants for accepted count
        let allApplicants: Application[] = [];
        for (const job of response.jobs) {
          try {
            const applicantsResponse = await jobsAPI.getApplicants(job.id);
            if (applicantsResponse.success) {
              allApplicants = [...allApplicants, ...applicantsResponse.applicants];
            }
          } catch (err) {
            console.error(`Error loading applicants for job ${job.id}:`, err);
          }
        }
        
        // Count accepted applicants
        const acceptedCount = allApplicants.filter(app => app.status === 'accepted').length;
        setAcceptedApplicantsCount(acceptedCount);
      }
    } catch (err: any) {
      console.error("Error loading employer jobs:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays === 1) return "1 day ago";
    if (diffDays < 7) return `${diffDays} days ago`;
    return `${Math.floor(diffDays / 7)} weeks ago`;
  };

  const formatSalary = (salary: string, period?: string) => {
    return `${salary}${period ? `/${period === "weekly" ? "week" : "month"}` : ""}`;
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  };

  const handleApply = async () => {
    // Validation
    if (!formData.name || formData.name.trim().length < 2) {
      setError("Please enter your full name");
      return;
    }
    if (!formData.email || !formData.email.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }
    if (!formData.phone || formData.phone.trim().length < 8) {
      setError("Please enter a valid phone number");
      return;
    }
    if (!formData.motivation || formData.motivation.trim().length < 20) {
      setError("Please write at least 20 characters explaining why you're a good fit");
      setShowValidationModal(true);
      return;
    }

    // Check authentication
    const isAuth = authAPI.isAuthenticated();
    const currentUserData = authAPI.getCurrentUser();
    console.log("Auth check:", { isAuth, currentUserData, token: localStorage.getItem('access_token') });
    
    if (!isAuth) {
      setShowAuthWarningModal(true);
      setError("");
      return;
    }

    // Check if already applied
    const alreadyApplied = applications.some(app => app.jobId === selectedJob?.id);
    if (alreadyApplied) {
      setError("You have already applied for this job");
      return;
    }
    
    setIsApplying(true);
    setError("");
    
    try {
      const response = await applicationsAPI.submit({
        jobId: selectedJob?.id || "",
        motivation: formData.motivation,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
      });

      if (response.success) {
        setIsApplying(false);
        setShowApplyModal(false);
        setShowSuccessModal(true);
        setFormData({ ...formData, motivation: "" });
        // Reload applications
        await loadApplications();
      }
    } catch (err: any) {
      console.error("Error applying:", err);
      if (err.message.toLowerCase().includes('unauthorized') || err.message.toLowerCase().includes('sign in')) {
        setShowAuthWarningModal(true);
        setError("");
      } else {
        setError(err.message);
      }
      setIsApplying(false);
    }
  };

  const handlePostJob = async () => {
    const user = authAPI.getCurrentUser();
    const isAuth = authAPI.isAuthenticated();
    console.log("Post job auth check:", { user, isAuth, token: localStorage.getItem('access_token') });
    
    if (!isAuth) {
      setShowAuthWarningModal(true);
      setError("");
      return;
    }
    
    if (!user || user.userType !== "employer") {
      setError("Please sign in as an employer to post jobs");
      return;
    }

    // Validation
    if (!formData.jobTitle || formData.jobTitle.trim().length < 3) {
      setError("Job title must be at least 3 characters");
      return;
    }
    if (!formData.jobDescription || formData.jobDescription.trim().length < 20) {
      setError("Job description must be at least 20 characters");
      return;
    }
    if (!formData.salary || parseFloat(formData.salary) <= 0) {
      setError("Please enter a valid salary");
      return;
    }
    if (!formData.location || formData.location.trim().length < 2) {
      setError("Please enter a valid location");
      return;
    }

    setIsPosting(true);
    setError("");
    
    try {
      const response = await jobsAPI.create({
        title: formData.jobTitle,
        description: formData.jobDescription,
        location: formData.location,
        salary: formData.salary,
        category: formData.category,
        type: "Full-time",
        salaryPeriod: weeklyRate ? "weekly" : "monthly",
      });

      if (response.success) {
        setIsPosting(false);
        setCurrentScreen(8);
        setFormData({
          ...formData,
          jobTitle: "",
          jobDescription: "",
          salary: "",
        });
        // Reload employer jobs
        await loadEmployerJobs();
      }
    } catch (err: any) {
      console.error("Error posting job:", err);
      if (err.message.toLowerCase().includes('unauthorized') || err.message.toLowerCase().includes('sign in')) {
        setShowAuthWarningModal(true);
        setError("");
      } else {
        setError(err.message);
      }
      setIsPosting(false);
    }
  };

  const loadApplicants = async (jobId: string) => {
    try {
      setIsLoading(true);
      const response = await jobsAPI.getApplicants(jobId);
      if (response.success) {
        setCurrentJobApplicants(response.applicants);
      }
    } catch (err: any) {
      console.error("Error loading applicants:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptApplicant = async (applicationId: string) => {
    try {
      await applicationsAPI.updateStatus(applicationId, "accepted");
      // Reload applicants
      if (selectedJobForApplicants) {
        await loadApplicants(selectedJobForApplicants.id);
      }
    } catch (err: any) {
      console.error("Error accepting applicant:", err);
      setError(err.message);
    }
  };

  const handleRejectApplicant = async (applicationId: string) => {
    try {
      await applicationsAPI.updateStatus(applicationId, "rejected");
      // Reload applicants
      if (selectedJobForApplicants) {
        await loadApplicants(selectedJobForApplicants.id);
      }
    } catch (err: any) {
      console.error("Error rejecting applicant:", err);
      setError(err.message);
    }
  };

  const generateRejectionAdvice = (jobTitle: string, jobCategory: string) => {
    const adviceTemplates: { [key: string]: string[] } = {
      Domestic: [
        "Keep building your skills! Consider taking a short course in professional cleaning techniques or childcare.",
        "Tip: Improve your communication skills by practicing basic English or local languages.",
        "Stand out: Get a reference letter from previous employers or community members who can vouch for your reliability.",
        "Next steps: Consider volunteering for community cleaning projects to build your experience."
      ],
      Retail: [
        "Boost your chances: Practice your customer service skills by role-playing with friends or family.",
        "Learn basic math and cash handling skills - many free online resources are available.",
        "Stand out: Take a free online course in retail management or sales techniques.",
        "Tip: Build your product knowledge by researching common retail items and their features."
      ],
      Farm: [
        "Grow your skills: Learn about modern farming techniques through agricultural extension services.",
        "Physical fitness matters: Maintain good health as farm work requires stamina.",
        "Knowledge is power: Study crop cycles, animal husbandry, or irrigation systems.",
        "Experience counts: Volunteer at community gardens to build practical skills."
      ],
      Catering: [
        "Level up: Practice basic cooking skills and learn new recipes at home.",
        "Hygiene first: Study food safety and hygiene standards - crucial for catering jobs.",
        "Time management: Practice preparing multiple dishes efficiently.",
        "Tip: Watch cooking tutorials and practice plating and presentation skills."
      ],
      Trade: [
        "Skill development: Consider apprenticeships or vocational training programs in your area.",
        "Practice makes perfect: Work on personal projects to build your portfolio.",
        "Stay current: Learn about new tools and techniques in your trade.",
        "Certification helps: Look into getting certified in your specific trade area."
      ]
    };

    const generalAdvice = [
      "Don't give up! Every rejection is a learning opportunity. Review your application and see what you can improve.",
      "Stay positive! The right opportunity is out there. Keep applying and improving your skills.",
      "Strengthen your application: Make sure your motivation clearly shows why you're a great fit.",
      "Target your applications: Apply for jobs that match your skills and experience level."
    ];

    const categoryAdvice = adviceTemplates[jobCategory] || generalAdvice;
    const randomAdvice = categoryAdvice[Math.floor(Math.random() * categoryAdvice.length)];
    
    return `Don't be discouraged! This is just one opportunity, and there are many more waiting for you.\n\n${randomAdvice}\n\nRemember: Every successful person has faced rejections. What matters is that you keep trying and learning!`;
  };

  const goToScreen = (screen: number) => {
    setCurrentScreen(screen);
    setError(""); // Clear any errors when navigating
    
    // Clear sensitive/temporary form data when navigating
    setFormData(prev => ({
      ...prev,
      password: "", // Always clear password
      motivation: "", // Clear application motivation
      // Clear job posting fields when leaving post job screen
      ...(currentScreen === 7 ? {
        jobTitle: "",
        jobDescription: "",
        jobLocation: "",
        jobSalary: "",
        jobCategory: "Domestic",
        jobType: "Full-time",
      } : {}),
    }));
  };

  const screens = [
    // Screen 0: Landing
    <motion.div
      key="landing"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen flex flex-col items-center justify-center p-8 bg-gradient-to-br from-primary/10 via-background to-secondary/10"
    >
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-center mb-12"
      >
        <motion.h1
          className="mb-4 text-primary"
          animate={{ scale: [1, 1.02, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          TrabaLink
        </motion.h1>
        <p className="text-muted-foreground max-w-md">
          Connecting Namibia's Youth to Meaningful Work Opportunities
        </p>
      </motion.div>

      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="flex flex-col gap-4 w-full max-w-sm"
      >
        <AnimatedButton variant="primary" fullWidth onClick={() => goToScreen(1)} className="text-center">
          Get Started
        </AnimatedButton>
      </motion.div>
    </motion.div>,

    // Screen 1: Role Select
    <motion.div
      key="role-select"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen flex flex-col items-center justify-center p-8"
    >
      <motion.div
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-center mb-12"
      >
        <h1 className="mb-4">I am a...</h1>
        <p className="text-muted-foreground">Choose your role to continue</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
        <motion.div
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-card border-2 border-border rounded-2xl p-8"
        >
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <User className="w-10 h-10 text-primary" />
            </div>
            <h2 className="mb-2">Job Seeker</h2>
            <p className="text-muted-foreground">Find your next opportunity</p>
          </div>
          <div className="flex flex-col gap-3">
            <AnimatedButton 
              variant="primary" 
              fullWidth 
              onClick={() => {
                setUserType("jobseeker");
                goToScreen(2);
              }}
            >
              Sign Up
            </AnimatedButton>
            <AnimatedButton 
              variant="outline" 
              fullWidth 
              onClick={() => {
                setUserType("jobseeker");
                goToScreen(13);
              }}
            >
              Sign In
            </AnimatedButton>
          </div>
        </motion.div>

        <motion.div
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-card border-2 border-border rounded-2xl p-8"
        >
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-20 h-20 bg-secondary/10 rounded-full flex items-center justify-center mb-4">
              <Building2 className="w-10 h-10 text-secondary" />
            </div>
            <h2 className="mb-2">Employer</h2>
            <p className="text-muted-foreground">Post jobs & find talent</p>
          </div>
          <div className="flex flex-col gap-3">
            <AnimatedButton 
              variant="secondary" 
              fullWidth 
              onClick={() => {
                setUserType("employer");
                goToScreen(3);
              }}
            >
              Sign Up
            </AnimatedButton>
            <AnimatedButton 
              variant="outline" 
              fullWidth 
              onClick={() => {
                setUserType("employer");
                goToScreen(14);
              }}
            >
              Sign In
            </AnimatedButton>
          </div>
        </motion.div>
      </div>

      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => goToScreen(0)}
        className="mt-12 flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to Home
      </motion.button>
    </motion.div>,

    // Screen 2: Job Seeker Sign-up
    <motion.div
      key="jobseeker-signup"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen flex flex-col items-center justify-center p-8"
    >
      <div className="w-full max-w-md">
        <motion.div
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center mb-8"
        >
          <h1 className="mb-2">Create Your Account</h1>
          <p className="text-muted-foreground">Join TrabaLink as a Job Seeker</p>
        </motion.div>

        <motion.form
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-card border border-border rounded-2xl p-6 space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            setIsLoading(true);
            setError("");
            try {
              const response = await authAPI.signup({
                email: formData.email,
                password: formData.password,
                name: formData.name,
                userType: "jobseeker",
                phone: formData.phone,
                location: formData.location,
              });
              
              if (response.success) {
                setCurrentUser(response.user);
                setUserType("jobseeker");
                goToScreen(4);
              }
            } catch (err: any) {
              setError(err.message);
            } finally {
              setIsLoading(false);
            }
          }}
        >
          {error && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <div>
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              type="text"
              placeholder="Maria Nghitila"
              className="mt-1"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="maria@example.com"
              className="mt-1"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              className="mt-1"
              required
              minLength={6}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+264 81 234 5678"
              className="mt-1"
              required
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              type="text"
              placeholder="Windhoek"
              className="mt-1"
              required
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            />
          </div>

          {isLoading ? (
            <div className="flex justify-center py-3">
              <LoaderSpinner />
            </div>
          ) : (
            <AnimatedButton type="submit" variant="primary" fullWidth>
              Create Account
            </AnimatedButton>
          )}

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => goToScreen(13)}
              className="text-primary hover:underline"
            >
              Sign in here
            </button>
          </p>
        </motion.form>

        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => goToScreen(1)}
          className="mt-6 flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mx-auto"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </motion.button>
      </div>
    </motion.div>,

    // Screen 3: Employer Sign-up
    <motion.div
      key="employer-signup"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen flex flex-col items-center justify-center p-8"
    >
      <div className="w-full max-w-md">
        <motion.div
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center mb-8"
        >
          <h1 className="mb-2">Create Employer Account</h1>
          <p className="text-muted-foreground">Post jobs and find great talent</p>
        </motion.div>

        <motion.form
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-card border border-border rounded-2xl p-6 space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            setIsLoading(true);
            setError("");
            try {
              const response = await authAPI.signup({
                email: formData.email,
                password: formData.password,
                name: formData.name,
                userType: "employer",
                phone: formData.phone,
                location: formData.location,
                businessName: formData.businessName,
              });
              
              if (response.success) {
                setCurrentUser(response.user);
                setUserType("employer");
                goToScreen(7);
              }
            } catch (err: any) {
              setError(err.message);
            } finally {
              setIsLoading(false);
            }
          }}
        >
          {error && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <div>
            <Label htmlFor="business-name">Business Name</Label>
            <Input
              id="business-name"
              type="text"
              placeholder="Your Business"
              className="mt-1"
              required
              value={formData.businessName}
              onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="contact-person">Contact Person</Label>
            <Input
              id="contact-person"
              type="text"
              placeholder="Tomas Silva"
              className="mt-1"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="employer-email">Email</Label>
            <Input
              id="employer-email"
              type="email"
              placeholder="tomas@business.com"
              className="mt-1"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="employer-password">Password</Label>
            <Input
              id="employer-password"
              type="password"
              placeholder="••••••••"
              className="mt-1"
              required
              minLength={6}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="employer-phone">Phone Number</Label>
            <Input
              id="employer-phone"
              type="tel"
              placeholder="+264 81 234 5678"
              className="mt-1"
              required
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="business-location">Business Location</Label>
            <Input
              id="business-location"
              type="text"
              placeholder="Swakopmund"
              className="mt-1"
              required
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            />
          </div>

          {isLoading ? (
            <div className="flex justify-center py-3">
              <LoaderSpinner />
            </div>
          ) : (
            <AnimatedButton type="submit" variant="secondary" fullWidth>
              Create Account
            </AnimatedButton>
          )}

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => goToScreen(14)}
              className="text-secondary hover:underline"
            >
              Sign in here
            </button>
          </p>
        </motion.form>

        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => goToScreen(1)}
          className="mt-6 flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mx-auto"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </motion.button>
      </div>
    </motion.div>,

    // Screen 4: Job Feed
    <motion.div
      key="job-feed"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen p-8"
    >
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mb-8"
        >
          <h1 className="mb-2">Find Your Next Job</h1>
          <p className="text-muted-foreground">Swipe left to skip, right to save</p>
        </motion.div>

        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="flex gap-3 mb-6"
        >
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search jobs..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-4 py-2 bg-card border border-border rounded-xl hover:bg-muted transition-colors"
          >
            <Filter className="w-5 h-5" />
          </motion.button>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex gap-2 mb-6 overflow-x-auto pb-2"
        >
          {["All", "Domestic", "Retail", "Farm", "Catering", "Trade"].map((category, index) => (
            <motion.button
              key={category}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + index * 0.05 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-xl whitespace-nowrap transition-colors ${
                category === selectedCategory
                  ? "bg-primary text-primary-foreground"
                  : "bg-card border border-border hover:bg-muted"
              }`}
            >
              {category}
            </motion.button>
          ))}
        </motion.div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <LoaderSpinner />
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No jobs found. Try a different search or category.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {jobs.map((job, index) => (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
              >
                <JobCard
                  {...job}
                  onClick={() => {
                    setSelectedJob(job);
                    setShowJobDetailsModal(true);
                  }}
                  onSwipeRight={() => console.log("Saved", job.title)}
                  onSwipeLeft={() => console.log("Skipped", job.title)}
                />
              </motion.div>
            ))}
          </div>
        )}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="fixed bottom-8 left-1/2 -translate-x-1/2 flex gap-4"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => goToScreen(9)}
            className="px-6 py-3 bg-card border border-border rounded-xl shadow-lg hover:shadow-xl transition-all"
          >
            My Applications
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => goToScreen(10)}
            className="px-6 py-3 bg-card border border-border rounded-xl shadow-lg hover:shadow-xl transition-all"
          >
            Profile
          </motion.button>
        </motion.div>
      </div>
    </motion.div>,

    // Screen 5: Job Details (handled by modal)
    null,

    // Screen 6: Application Success
    <motion.div
      key="success"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen flex flex-col items-center justify-center p-8"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", damping: 15 }}
        className="text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", damping: 10 }}
          className="w-32 h-32 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6"
        >
          <CheckCircle2 className="w-16 h-16 text-green-500" />
        </motion.div>

        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mb-4"
        >
          Application Submitted!
        </motion.h1>

        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-muted-foreground mb-8 max-w-md"
        >
          Your application has been sent successfully. The employer will review it and contact you
          soon.
        </motion.p>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex flex-col gap-3 max-w-sm mx-auto"
        >
          <AnimatedButton variant="primary" fullWidth onClick={() => goToScreen(4)}>
            Browse More Jobs
          </AnimatedButton>
          <AnimatedButton variant="outline" fullWidth onClick={() => goToScreen(9)}>
            View My Applications
          </AnimatedButton>
        </motion.div>
      </motion.div>
    </motion.div>,

    // Screen 7: Post Job
    <motion.div
      key="post-job"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen p-8"
    >
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mb-8"
        >
          <h1 className="mb-2">Post a New Job</h1>
          <p className="text-muted-foreground">Fill in the details to attract the right candidates</p>
        </motion.div>

        <motion.form
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-card border border-border rounded-2xl p-6 space-y-6"
          onSubmit={(e) => {
            e.preventDefault();
            handlePostJob();
          }}
        >
          {error && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <div>
            <Label htmlFor="job-title">Job Title</Label>
            <Input
              id="job-title"
              type="text"
              placeholder="e.g. Domestic Worker, Retail Assistant"
              className="mt-1"
              required
              value={formData.jobTitle}
              onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="job-description">Job Description</Label>
            <Textarea
              id="job-description"
              placeholder="Describe the role, responsibilities, and requirements..."
              className="mt-1 min-h-[120px]"
              required
              value={formData.jobDescription}
              onChange={(e) => setFormData({ ...formData, jobDescription: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="job-location">Location</Label>
              <Input
                id="job-location"
                type="text"
                placeholder="Windhoek"
                className="mt-1"
                required
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="job-category">Category</Label>
              <select
                id="job-category"
                className="w-full mt-1 px-3 py-2 bg-input-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                required
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                <option value="Domestic">Domestic</option>
                <option value="Retail">Retail</option>
                <option value="Farm">Farm</option>
                <option value="Catering">Catering</option>
                <option value="Trade">Trade</option>
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label htmlFor="job-salary">Salary (N$)</Label>
              <div className="flex items-center gap-2">
                <span className={`text-sm ${!weeklyRate ? "text-primary" : "text-muted-foreground"}`}>
                  Monthly
                </span>
                <Switch checked={weeklyRate} onCheckedChange={setWeeklyRate} />
                <span className={`text-sm ${weeklyRate ? "text-primary" : "text-muted-foreground"}`}>
                  Weekly
                </span>
              </div>
            </div>
            <Input
              id="job-salary"
              type="number"
              placeholder={weeklyRate ? "e.g. 650" : "e.g. 2,800"}
              className="mt-1"
              required
              value={formData.salary}
              onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
            />
            <p className="text-sm text-muted-foreground mt-1">
              {weeklyRate ? "Weekly rate" : "Monthly rate"}
              {formData.salary && (
                <span className="text-primary ml-1">
                  ≈ N$ {weeklyRate ? (parseFloat(formData.salary) * 4).toFixed(0) : (parseFloat(formData.salary) / 4).toFixed(0)} {weeklyRate ? "monthly" : "weekly"}
                </span>
              )}
            </p>
          </div>

          <div className="flex gap-3">
            {isPosting ? (
              <div className="flex-1 flex items-center justify-center py-3">
                <LoaderSpinner />
              </div>
            ) : (
              <AnimatedButton type="submit" variant="secondary" fullWidth>
                Post Job
              </AnimatedButton>
            )}
          </div>
        </motion.form>

        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => goToScreen(8)}
          className="mt-6 flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mx-auto"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Dashboard
        </motion.button>
      </div>
    </motion.div>,

    // Screen 8: Employer Dashboard
    <motion.div
      key="employer-dashboard"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen p-8"
    >
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex justify-between items-center mb-8"
        >
          <div>
            <h1 className="mb-2">Employer Dashboard</h1>
            <p className="text-muted-foreground">Manage your jobs and applicants</p>
          </div>
          <AnimatedButton variant="secondary" onClick={() => goToScreen(7)}>
            Post New Job
          </AnimatedButton>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
        >
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                <Briefcase className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-muted-foreground">Active Jobs</p>
                <h2>{employerJobs.length}</h2>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-secondary/10 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-secondary" />
              </div>
              <div>
                <p className="text-muted-foreground">Total Applicants</p>
                <h2>{employerJobs.reduce((sum, job) => sum + (job.applicantCount || 0), 0)}</h2>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <p className="text-muted-foreground">Accepted Applicants</p>
                <h2>{acceptedApplicantsCount}</h2>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="mb-4">Active Job Listings</h2>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <LoaderSpinner />
            </div>
          ) : employerJobs.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">No jobs posted yet</p>
              <AnimatedButton variant="primary" onClick={() => goToScreen(7)}>
                Post Your First Job
              </AnimatedButton>
            </div>
          ) : (
            <div className="space-y-4">
              {employerJobs.map((job, index) => (
                <motion.div
                  key={job.id}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  whileHover={{ x: 4 }}
                  className="bg-card border border-border rounded-xl p-6 cursor-pointer hover:border-primary transition-all"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="mb-2">{job.title}</h3>
                      <div className="flex items-center gap-4 text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {job.applicantCount || 0} applicants
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          Posted {job.postedTime}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {job.location}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <AnimatedButton 
                        variant="outline" 
                        onClick={async () => {
                          setSelectedJobForApplicants(job);
                          await loadApplicants(job.id);
                          setShowApplicantsModal(true);
                        }}
                      >
                        <Users className="w-4 h-4 mr-2" />
                        View Applicants
                      </AnimatedButton>
                      <AnimatedButton 
                        variant="ghost" 
                        onClick={() => {
                          setSelectedJobToEdit(job);
                          setFormData({
                            ...formData,
                            jobTitle: job.title,
                            jobDescription: job.description || "",
                            location: job.location,
                            salary: job.salary.replace(/\/.*$/, "").replace("N$ ", ""),
                            category: job.category,
                          });
                          setShowEditJobModal(true);
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </AnimatedButton>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-8 flex gap-4 justify-center"
        >
          <AnimatedButton variant="outline" onClick={() => goToScreen(10)}>
            Profile Settings
          </AnimatedButton>
          <AnimatedButton variant="outline" onClick={() => goToScreen(12)}>
            Give Feedback
          </AnimatedButton>
        </motion.div>
      </div>
    </motion.div>,

    // Screen 9: My Applications
    <motion.div
      key="my-applications"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen p-8"
    >
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mb-8"
        >
          <h1 className="mb-2">My Applications</h1>
          <p className="text-muted-foreground">Track your job application status</p>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          {isLoading ? (
            <div className="flex justify-center py-8">
              <LoaderSpinner />
            </div>
          ) : applications && applications.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">No applications yet</p>
              <AnimatedButton variant="primary" onClick={() => goToScreen(4)}>
                Browse Jobs
              </AnimatedButton>
            </div>
          ) : (
            applications && applications.map((application, index) => (
            <motion.div
              key={application.id}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3 + index * 0.1 }}
              whileHover={{ x: 4 }}
              className="bg-card border border-border rounded-xl p-6"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="mb-1">{application.jobTitle}</h3>
                  <p className="text-muted-foreground">{application.company}</p>
                </div>
                <Badge
                  className={`
                    ${application.status === "pending" ? "bg-yellow-500/10 text-yellow-500" : ""}
                    ${application.status === "reviewed" ? "bg-blue-500/10 text-blue-500" : ""}
                    ${application.status === "accepted" ? "bg-green-500/10 text-green-500" : ""}
                    ${application.status === "rejected" ? "bg-red-500/10 text-red-500" : ""}
                  `}
                >
                  {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                </Badge>
              </div>

              <div className="flex items-center gap-2 text-muted-foreground mb-4">
                <Calendar className="w-4 h-4" />
                <span className="text-sm">Applied on {formatDate(application.appliedDate)}</span>
              </div>

              <div className="flex gap-3">
                <AnimatedButton
                  variant="outline"
                  onClick={() => {
                    setSelectedApplication(application);
                    setShowViewApplicationModal(true);
                  }}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  View
                </AnimatedButton>
                {application.status === "rejected" ? (
                  <AnimatedButton
                    variant="primary"
                    onClick={() => {
                      setSelectedApplication(application);
                      const advice = generateRejectionAdvice(application.jobTitle, application.company);
                      setRejectionAdvice(advice);
                      setShowRejectionAdviceModal(true);
                    }}
                  >
                    <HelpCircle className="w-4 h-4 mr-2" />
                    Get Advice
                  </AnimatedButton>
                ) : (
                  <AnimatedButton
                    variant="outline"
                    onClick={() => {
                      setSelectedApplication(application);
                      setFormData({ ...formData, motivation: application.motivation || "" });
                      setShowEditApplicationModal(true);
                    }}
                    disabled={application.status === "accepted"}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </AnimatedButton>
                )}
              </div>
            </motion.div>
          )))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 flex gap-4 justify-center"
        >
          <AnimatedButton variant="primary" onClick={() => goToScreen(4)}>
            Browse More Jobs
          </AnimatedButton>
          <AnimatedButton variant="outline" onClick={() => goToScreen(10)}>
            Profile
          </AnimatedButton>
        </motion.div>
      </div>
    </motion.div>,

    // Screen 10: Profile
    <motion.div
      key="profile"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen p-8"
    >
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center mb-8"
        >
          <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-12 h-12 text-primary" />
          </div>
          <h1 className="mb-2">{formData.name || "Maria Nghitila"}</h1>
          <p className="text-muted-foreground">{formData.email || "maria@example.com"}</p>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-card border border-border rounded-2xl p-6 space-y-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                <Settings className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3>Theme</h3>
                <p className="text-muted-foreground text-sm">
                  {darkMode ? "Dark mode" : "Light mode"}
                </p>
              </div>
            </div>
            <Switch checked={darkMode} onCheckedChange={setDarkMode} />
          </div>

          <Separator />

          <motion.div
            whileHover={{ x: 4 }}
            className="flex items-center justify-between p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <WifiOff className="w-6 h-6 text-yellow-500" />
              <div>
                <h4>Offline Mode</h4>
                <p className="text-muted-foreground text-sm">Limited data usage active</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </motion.div>

          <Separator />

          <motion.button
            whileHover={{ x: 4 }}
            className="flex items-center gap-3 w-full p-4 rounded-xl hover:bg-muted transition-colors"
            onClick={() => goToScreen(11)}
          >
            <HelpCircle className="w-6 h-6 text-muted-foreground" />
            <div className="text-left flex-1">
              <h4>Support & Help</h4>
              <p className="text-muted-foreground text-sm">FAQs and contact support</p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </motion.button>

          <Separator />

          <motion.button
            whileHover={{ x: 4 }}
            className="flex items-center gap-3 w-full p-4 rounded-xl hover:bg-destructive/10 transition-colors text-destructive"
            onClick={() => {
              authAPI.signout();
              setCurrentUser(null);
              setUserType(null);
              goToScreen(0);
            }}
          >
            <LogOut className="w-6 h-6" />
            <div className="text-left flex-1">
              <h4>Log Out</h4>
              <p className="text-sm opacity-70">Sign out of your account</p>
            </div>
            <ChevronRight className="w-5 h-5" />
          </motion.button>
        </motion.div>

        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => goToScreen(userType === "jobseeker" ? 4 : 8)}
          className="mt-6 flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mx-auto"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </motion.button>
      </div>
    </motion.div>,

    // Screen 11: Support Hub
    <motion.div
      key="support"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen p-8"
    >
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center mb-8"
        >
          <h1 className="mb-2">Support Hub</h1>
          <p className="text-muted-foreground">Get help and find answers to your questions</p>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8"
        >
          <motion.div
            whileHover={{ y: -4 }}
            className="bg-card border border-border rounded-xl p-6"
          >
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
              <Phone className="w-6 h-6 text-primary" />
            </div>
            <h3 className="mb-2">Call Us</h3>
            <p className="text-muted-foreground mb-3">Mon-Fri, 8am-5pm</p>
            <a href="tel:+26461234567" className="text-primary hover:underline">
              +264 61 234 567
            </a>
          </motion.div>

          <motion.div
            whileHover={{ y: -4 }}
            className="bg-card border border-border rounded-xl p-6"
          >
            <div className="w-12 h-12 bg-secondary/10 rounded-xl flex items-center justify-center mb-4">
              <Mail className="w-6 h-6 text-secondary" />
            </div>
            <h3 className="mb-2">Email Us</h3>
            <p className="text-muted-foreground mb-3">24/7 support</p>
            <a href="mailto:support@trabalink.na" className="text-primary hover:underline">
              support@trabalink.na
            </a>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {[
              {
                q: "How do I apply for a job?",
                a: "Browse jobs, click on any listing, and tap 'Apply Now'. Fill in your details and motivation to submit your application.",
              },
              {
                q: "Is TrabaLink free to use?",
                a: "Yes! TrabaLink is completely free for both job seekers and employers.",
              },
              {
                q: "How do I know if an employer has seen my application?",
                a: "Check 'My Applications' to see the status of each application. You'll see if it's pending, reviewed, or if you've been contacted.",
              },
              {
                q: "Can I edit my application after submitting?",
                a: "Yes, you can edit pending applications from the 'My Applications' page before the employer reviews them.",
              },
            ].map((faq, index) => (
              <motion.div
                key={index}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                className="bg-card border border-border rounded-xl p-6"
              >
                <h4 className="mb-2">{faq.q}</h4>
                <p className="text-muted-foreground">{faq.a}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-8 flex gap-4 justify-center"
        >
          <AnimatedButton variant="primary" onClick={() => goToScreen(12)}>
            Send Feedback
          </AnimatedButton>
          <AnimatedButton variant="outline" onClick={() => goToScreen(userType === "jobseeker" ? 4 : 8)}>
            Back to {userType === "jobseeker" ? "Jobs" : "Dashboard"}
          </AnimatedButton>
        </motion.div>
      </div>
    </motion.div>,

    // Screen 12: Feedback
    <motion.div
      key="feedback"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen flex flex-col items-center justify-center p-8"
    >
      <div className="w-full max-w-md">
        <motion.div
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center mb-8"
        >
          <h1 className="mb-2">We Value Your Feedback</h1>
          <p className="text-muted-foreground">Help us improve TrabaLink</p>
        </motion.div>

        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-card border border-border rounded-2xl p-6"
        >
          <div className="mb-6">
            <Label className="mb-3 block text-center">Rate your experience</Label>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <motion.button
                  key={star}
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setRating(star)}
                  className="p-2"
                  type="button"
                >
                  <Star
                    className={`w-8 h-8 ${
                      star <= rating ? "fill-primary text-primary" : "text-muted-foreground"
                    }`}
                  />
                </motion.button>
              ))}
            </div>
          </div>

          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const formElement = e.target as HTMLFormElement;
              const feedbackText = (formElement.elements.namedItem("feedback") as HTMLTextAreaElement).value;
              
              try {
                await feedbackAPI.submit(rating, feedbackText);
                setShowFeedbackSuccess(true);
                setTimeout(() => {
                  setShowFeedbackSuccess(false);
                  goToScreen(userType === "jobseeker" ? 4 : 8);
                }, 2000);
              } catch (err: any) {
                console.error("Error submitting feedback:", err);
                setError(err.message);
              }
            }}
            className="space-y-4"
          >
            <div>
              <Label htmlFor="feedback">Your Feedback</Label>
              <Textarea
                id="feedback"
                placeholder="Tell us what you think..."
                className="mt-1 min-h-[120px]"
                required
              />
            </div>

            <AnimatedButton type="submit" variant="primary" fullWidth>
              <Send className="w-4 h-4 mr-2" />
              Submit Feedback
            </AnimatedButton>
          </form>
        </motion.div>

        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => goToScreen(userType === "jobseeker" ? 4 : 8)}
          className="mt-6 flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mx-auto"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </motion.button>
      </div>
    </motion.div>,

    // Screen 13: Job Seeker Sign-In
    <motion.div
      key="jobseeker-signin"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen flex flex-col items-center justify-center p-8"
    >
      <div className="w-full max-w-md">
        <motion.div
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center mb-8"
        >
          <h1 className="mb-2">Welcome Back</h1>
          <p className="text-muted-foreground">Sign in to your Job Seeker account</p>
        </motion.div>

        <motion.form
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-card border border-border rounded-2xl p-6 space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            setIsLoading(true);
            setError("");
            try {
              const response = await authAPI.signin(formData.email, formData.password);
              
              if (response.success) {
                setCurrentUser(response.user);
                setUserType("jobseeker");
                setFormData({
                  ...formData,
                  name: response.user.name || "",
                  phone: response.user.phone || "",
                  location: response.user.location || "",
                });
                goToScreen(4);
              }
            } catch (err: any) {
              setError(err.message || "Invalid email or password");
            } finally {
              setIsLoading(false);
            }
          }}
        >
          {error && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <div>
            <Label htmlFor="signin-email">Email</Label>
            <Input
              id="signin-email"
              type="email"
              placeholder="maria@example.com"
              className="mt-1"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="signin-password">Password</Label>
            <Input
              id="signin-password"
              type="password"
              placeholder="••••••••"
              className="mt-1"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          </div>

          {isLoading ? (
            <div className="flex justify-center py-3">
              <LoaderSpinner />
            </div>
          ) : (
            <AnimatedButton type="submit" variant="primary" fullWidth>
              Sign In
            </AnimatedButton>
          )}

          <p className="text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <button
              type="button"
              onClick={() => goToScreen(2)}
              className="text-primary hover:underline"
            >
              Sign up here
            </button>
          </p>
        </motion.form>

        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => goToScreen(1)}
          className="mt-6 flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mx-auto"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </motion.button>
      </div>
    </motion.div>,

    // Screen 14: Employer Sign-In
    <motion.div
      key="employer-signin"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen flex flex-col items-center justify-center p-8"
    >
      <div className="w-full max-w-md">
        <motion.div
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center mb-8"
        >
          <h1 className="mb-2">Welcome Back</h1>
          <p className="text-muted-foreground">Sign in to your Employer account</p>
        </motion.div>

        <motion.form
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-card border border-border rounded-2xl p-6 space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            setIsLoading(true);
            setError("");
            try {
              const response = await authAPI.signin(formData.email, formData.password);
              
              if (response.success) {
                setCurrentUser(response.user);
                setUserType("employer");
                setFormData({
                  ...formData,
                  name: response.user.name || "",
                  phone: response.user.phone || "",
                  location: response.user.location || "",
                  businessName: response.user.businessName || "",
                });
                goToScreen(8);
              }
            } catch (err: any) {
              setError(err.message || "Invalid email or password");
            } finally {
              setIsLoading(false);
            }
          }}
        >
          {error && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <div>
            <Label htmlFor="employer-signin-email">Email</Label>
            <Input
              id="employer-signin-email"
              type="email"
              placeholder="tomas@business.com"
              className="mt-1"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="employer-signin-password">Password</Label>
            <Input
              id="employer-signin-password"
              type="password"
              placeholder="••••••••"
              className="mt-1"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          </div>

          {isLoading ? (
            <div className="flex justify-center py-3">
              <LoaderSpinner />
            </div>
          ) : (
            <AnimatedButton type="submit" variant="secondary" fullWidth>
              Sign In
            </AnimatedButton>
          )}

          <p className="text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <button
              type="button"
              onClick={() => goToScreen(3)}
              className="text-secondary hover:underline"
            >
              Sign up here
            </button>
          </p>
        </motion.form>

        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => goToScreen(1)}
          className="mt-6 flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mx-auto"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </motion.button>
      </div>
    </motion.div>,
  ];

  return (
    <div className="relative">
      <ThemeToggle darkMode={darkMode} setDarkMode={setDarkMode} />
      <ConnectionStatus />

      <AnimatePresence mode="wait">
        {screens[currentScreen]}
      </AnimatePresence>

      {/* Job Details Modal */}
      <CustomModal
        isOpen={showJobDetailsModal}
        onClose={() => setShowJobDetailsModal(false)}
        title={selectedJob?.title}
      >
        {selectedJob && (
          <div className="space-y-4">
            <div>
              <h4 className="mb-2">Company</h4>
              <p className="text-muted-foreground">{selectedJob.company}</p>
            </div>

            <div className="flex gap-4">
              <div>
                <h4 className="mb-2">Location</h4>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  {selectedJob.location}
                </div>
              </div>
              <div>
                <h4 className="mb-2">Salary</h4>
                <div className="flex items-center gap-2 text-primary">
                  <DollarSign className="w-4 h-4" />
                  N$ {selectedJob.salary}
                </div>
              </div>
            </div>

            <div>
              <h4 className="mb-2">Description</h4>
              <p className="text-muted-foreground">{selectedJob.description}</p>
            </div>

            {selectedJob.requirements && selectedJob.requirements.length > 0 && (
              <div>
                <h4 className="mb-2">Requirements</h4>
                <ul className="list-disc list-inside space-y-1">
                  {selectedJob.requirements.map((req, index) => (
                    <li key={index} className="text-muted-foreground">
                      {req}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <AnimatedButton
              variant="primary"
              fullWidth
              onClick={() => {
                setShowJobDetailsModal(false);
                setShowApplyModal(true);
              }}
            >
              Apply Now
            </AnimatedButton>
          </div>
        )}
      </CustomModal>

      {/* Apply Modal */}
      <CustomModal
        isOpen={showApplyModal}
        onClose={() => setShowApplyModal(false)}
        title="Apply for Job"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleApply();
          }}
          className="space-y-4"
        >
          <div>
            <Label htmlFor="apply-name">Full Name</Label>
            <Input
              id="apply-name"
              type="text"
              placeholder="Your name"
              className="mt-1"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="apply-email">Email</Label>
            <Input
              id="apply-email"
              type="email"
              placeholder="your@email.com"
              className="mt-1"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="apply-phone">Phone Number</Label>
            <Input
              id="apply-phone"
              type="tel"
              placeholder="+264 81 234 5678"
              className="mt-1"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="apply-motivation">
              Why are you a good fit? <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="apply-motivation"
              placeholder="Tell the employer why they should hire you... (minimum 20 characters)"
              className="mt-1 min-h-[100px]"
              value={formData.motivation}
              onChange={(e) => setFormData({ ...formData, motivation: e.target.value })}
              required
            />
            <p className="text-sm text-muted-foreground mt-1">
              {formData.motivation.length}/20 characters minimum
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {isApplying ? (
            <div className="flex justify-center py-4">
              <LoaderSpinner />
            </div>
          ) : (
            <AnimatedButton type="submit" variant="primary" fullWidth>
              Submit Application
            </AnimatedButton>
          )}
        </form>
      </CustomModal>

      {/* Validation Modal */}
      <CustomModal
        isOpen={showValidationModal}
        onClose={() => setShowValidationModal(false)}
        title="Required Field"
      >
        <div className="text-center py-4">
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <HelpCircle className="w-8 h-8 text-destructive" />
          </div>
          <p className="text-muted-foreground mb-4">
            Please tell the employer why you're a good fit for this role. This helps your
            application stand out!
          </p>
          <AnimatedButton variant="primary" onClick={() => setShowValidationModal(false)}>
            OK, Got It
          </AnimatedButton>
        </div>
      </CustomModal>

      {/* Success Modal */}
      <CustomModal isOpen={showSuccessModal} onClose={() => setShowSuccessModal(false)}>
        <div className="text-center py-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", damping: 15 }}
            className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <CheckCircle2 className="w-10 h-10 text-green-500" />
          </motion.div>
          <h2 className="mb-2">Application Submitted!</h2>
          <p className="text-muted-foreground mb-6">
            Your application has been sent successfully.
          </p>
          <AnimatedButton
            variant="primary"
            fullWidth
            onClick={() => {
              setShowSuccessModal(false);
              goToScreen(4);
            }}
          >
            Browse More Jobs
          </AnimatedButton>
        </div>
      </CustomModal>

      {/* View Application Modal */}
      <CustomModal
        isOpen={showViewApplicationModal}
        onClose={() => setShowViewApplicationModal(false)}
        title="Application Details"
      >
        {selectedApplication && (
          <div className="space-y-4">
            <div>
              <h4 className="mb-2">Job</h4>
              <p>{selectedApplication.jobTitle}</p>
            </div>
            <div>
              <h4 className="mb-2">Company</h4>
              <p className="text-muted-foreground">{selectedApplication.company}</p>
            </div>
            <div>
              <h4 className="mb-2">Applied Date</h4>
              <p className="text-muted-foreground">{formatDate(selectedApplication.appliedDate)}</p>
            </div>
            <div>
              <h4 className="mb-2">Status</h4>
              <Badge
                className={`
                  ${selectedApplication.status === "pending" ? "bg-yellow-500/10 text-yellow-500" : ""}
                  ${selectedApplication.status === "reviewed" ? "bg-blue-500/10 text-blue-500" : ""}
                  ${selectedApplication.status === "accepted" ? "bg-green-500/10 text-green-500" : ""}
                  ${selectedApplication.status === "rejected" ? "bg-red-500/10 text-red-500" : ""}
                `}
              >
                {selectedApplication.status.charAt(0).toUpperCase() + selectedApplication.status.slice(1)}
              </Badge>
            </div>
            {selectedApplication.motivation && (
              <div>
                <h4 className="mb-2">Your Motivation</h4>
                <p className="text-muted-foreground">{selectedApplication.motivation}</p>
              </div>
            )}
            <AnimatedButton
              variant="primary"
              fullWidth
              onClick={() => setShowViewApplicationModal(false)}
            >
              Close
            </AnimatedButton>
          </div>
        )}
      </CustomModal>

      {/* Edit Application Modal */}
      <CustomModal
        isOpen={showEditApplicationModal}
        onClose={() => setShowEditApplicationModal(false)}
        title="Edit Application"
      >
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (selectedApplication) {
              try {
                setIsLoading(true);
                await applicationsAPI.update(selectedApplication.id, {
                  motivation: formData.motivation,
                });
                
                // Update local state
                setApplications(
                  applications.map((app) =>
                    app.id === selectedApplication.id
                      ? { ...app, motivation: formData.motivation }
                      : app
                  )
                );
                setShowEditApplicationModal(false);
              } catch (err: any) {
                console.error("Error updating application:", err);
                setError(err.message);
              } finally {
                setIsLoading(false);
              }
            }
          }}
          className="space-y-4"
        >
          {error && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{error}</span>
            </div>
          )}
          <div>
            <Label htmlFor="edit-motivation">Update Your Motivation</Label>
            <Textarea
              id="edit-motivation"
              placeholder="Tell the employer why you're a good fit..."
              className="mt-1 min-h-[120px]"
              value={formData.motivation}
              onChange={(e) => setFormData({ ...formData, motivation: e.target.value })}
              required
            />
          </div>
          <div className="flex gap-3">
            {isLoading ? (
              <div className="flex-1 flex justify-center py-3">
                <LoaderSpinner />
              </div>
            ) : (
              <>
                <AnimatedButton type="submit" variant="primary" fullWidth>
                  Save Changes
                </AnimatedButton>
                <AnimatedButton
                  type="button"
                  variant="outline"
                  onClick={() => setShowEditApplicationModal(false)}
                >
                  Cancel
                </AnimatedButton>
              </>
            )}
          </div>
        </form>
      </CustomModal>

      {/* Applicants Modal (for Employers) */}
      <CustomModal
        isOpen={showApplicantsModal}
        onClose={() => setShowApplicantsModal(false)}
        title={`Applicants for ${selectedJobForApplicants?.title || 'Job'}`}
      >
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <LoaderSpinner />
            </div>
          ) : currentJobApplicants.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No applicants yet</p>
            </div>
          ) : (
            currentJobApplicants.map((applicant) => (
              <div key={applicant.id} className="border border-border rounded-xl p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="mb-1">{applicant.name}</h4>
                    <p className="text-muted-foreground text-sm">{applicant.email}</p>
                    <p className="text-muted-foreground text-sm">{applicant.phone}</p>
                  </div>
                  <Badge
                    className={`
                      ${applicant.status === "pending" ? "bg-yellow-500/10 text-yellow-500" : ""}
                      ${applicant.status === "reviewed" ? "bg-blue-500/10 text-blue-500" : ""}
                      ${applicant.status === "accepted" ? "bg-green-500/10 text-green-500" : ""}
                      ${applicant.status === "rejected" ? "bg-red-500/10 text-red-500" : ""}
                    `}
                  >
                    {applicant.status.charAt(0).toUpperCase() + applicant.status.slice(1)}
                  </Badge>
                </div>
                
                {applicant.motivation && (
                  <div>
                    <h4 className="text-sm mb-1">Motivation</h4>
                    <p className="text-muted-foreground text-sm">{applicant.motivation}</p>
                  </div>
                )}
                
                <div className="text-muted-foreground text-sm">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Applied on {formatDate(applicant.appliedDate)}
                </div>
                
                {applicant.status === "pending" && (
                  <div className="flex gap-2 pt-2">
                    <AnimatedButton
                      variant="primary"
                      onClick={() => handleAcceptApplicant(applicant.id)}
                      fullWidth
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Accept
                    </AnimatedButton>
                    <AnimatedButton
                      variant="outline"
                      onClick={() => handleRejectApplicant(applicant.id)}
                      fullWidth
                    >
                      Reject
                    </AnimatedButton>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </CustomModal>

      {/* Edit Job Modal (for Employers) */}
      <CustomModal
        isOpen={showEditJobModal}
        onClose={() => setShowEditJobModal(false)}
        title="Edit Job"
      >
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (selectedJobToEdit) {
              try {
                setIsLoading(true);
                await jobsAPI.update(selectedJobToEdit.id, {
                  title: formData.jobTitle,
                  description: formData.jobDescription,
                  location: formData.location,
                  salary: formData.salary,
                  category: formData.category,
                });
                setShowEditJobModal(false);
                // Reload employer jobs
                await loadEmployerJobs();
              } catch (err: any) {
                console.error("Error updating job:", err);
                setError(err.message);
              } finally {
                setIsLoading(false);
              }
            }
          }}
          className="space-y-4"
        >
          <div>
            <Label htmlFor="edit-job-title">Job Title</Label>
            <Input
              id="edit-job-title"
              type="text"
              placeholder="e.g. Domestic Worker"
              className="mt-1"
              value={formData.jobTitle}
              onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="edit-job-description">Job Description</Label>
            <Textarea
              id="edit-job-description"
              placeholder="Describe the role..."
              className="mt-1 min-h-[100px]"
              value={formData.jobDescription}
              onChange={(e) => setFormData({ ...formData, jobDescription: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="edit-job-location">Location</Label>
            <Input
              id="edit-job-location"
              type="text"
              placeholder="e.g. Windhoek"
              className="mt-1"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="edit-job-salary">Salary (N$)</Label>
            <Input
              id="edit-job-salary"
              type="text"
              placeholder="e.g. 3500"
              className="mt-1"
              value={formData.salary}
              onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
              required
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <div className="flex gap-3">
            {isLoading ? (
              <div className="flex-1 flex justify-center py-3">
                <LoaderSpinner />
              </div>
            ) : (
              <>
                <AnimatedButton type="submit" variant="primary" fullWidth>
                  Save Changes
                </AnimatedButton>
                <AnimatedButton
                  type="button"
                  variant="outline"
                  onClick={() => setShowEditJobModal(false)}
                >
                  Cancel
                </AnimatedButton>
              </>
            )}
          </div>
        </form>
      </CustomModal>

      {/* Rejection Advice Modal */}
      <CustomModal
        isOpen={showRejectionAdviceModal}
        onClose={() => setShowRejectionAdviceModal(false)}
        title="Keep Going!"
      >
        <div className="space-y-4">
          <div className="bg-primary/10 border border-primary/20 rounded-xl p-4">
            <p className="text-foreground whitespace-pre-line">{rejectionAdvice}</p>
          </div>
          <div className="bg-secondary/10 border border-secondary/20 rounded-xl p-4">
            <h4 className="mb-2">
              Quick Tips for Your Next Application
            </h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>Customize your motivation letter for each job</li>
              <li>Highlight relevant experience and skills</li>
              <li>Show enthusiasm and willingness to learn</li>
              <li>Double-check for spelling and grammar</li>
            </ul>
          </div>
          <AnimatedButton
            variant="primary"
            fullWidth
            onClick={() => {
              setShowRejectionAdviceModal(false);
              goToScreen(4);
            }}
          >
            Find More Jobs
          </AnimatedButton>
        </div>
      </CustomModal>

      {/* Auth Warning Modal */}
      <CustomModal
        isOpen={showAuthWarningModal}
        onClose={() => setShowAuthWarningModal(false)}
        title="Session Expired"
      >
        <div className="space-y-4">
          <p className="text-muted-foreground">
            Your session has expired. Please sign out and sign in again to continue.
          </p>
          <AnimatedButton
            variant="primary"
            fullWidth
            onClick={() => {
              authAPI.signout();
              setCurrentUser(null);
              setShowAuthWarningModal(false);
              goToScreen(1);
            }}
          >
            Sign Out & Go to Home
          </AnimatedButton>
        </div>
      </CustomModal>

      {/* Feedback Success */}
      <CustomModal isOpen={showFeedbackSuccess} onClose={() => setShowFeedbackSuccess(false)}>
        <div className="text-center py-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", damping: 15 }}
            className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <CheckCircle2 className="w-10 h-10 text-green-500" />
          </motion.div>
          <h2 className="mb-2">Thank You!</h2>
          <p className="text-muted-foreground">Your feedback helps us improve TrabaLink.</p>
        </div>
      </CustomModal>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="fixed bottom-4 left-1/2 -translate-x-1/2 text-center text-sm text-muted-foreground z-40 pointer-events-none"
      >
        <p>Connecting Namibia's Youth, One Job at a Time</p>
      </motion.div>
    </div>
  );
}
