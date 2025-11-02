import { projectId, publicAnonKey } from './supabase/info';

const API_URL = `https://${projectId}.supabase.co/functions/v1/make-server-1685d933`;

// Helper function for API calls
async function apiCall(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem('access_token');
  
  console.log(`API Call to ${endpoint}:`, { hasToken: !!token, tokenPrefix: token?.substring(0, 20) });
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : `Bearer ${publicAnonKey}`,
    ...options.headers,
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    console.error(`API Error on ${endpoint}:`, { status: response.status, data });
    throw new Error(data.error || `Request failed with status ${response.status}`);
  }

  return data;
}

// Auth API
export const authAPI = {
  signup: async (userData: {
    email: string;
    password: string;
    name: string;
    userType: string;
    phone: string;
    location: string;
    businessName?: string;
  }) => {
    const data = await apiCall('/signup', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    
    if (data.success) {
      // Store token if provided (auto-signin after signup)
      if (data.accessToken) {
        localStorage.setItem('access_token', data.accessToken);
      }
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('user_id', data.userId);
    }
    
    return data;
  },

  signin: async (email: string, password: string) => {
    const data = await apiCall('/signin', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    if (data.success) {
      localStorage.setItem('access_token', data.accessToken);
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('user_id', data.user.id);
    }
    
    return data;
  },

  getSession: async () => {
    try {
      return await apiCall('/session');
    } catch (error) {
      return null;
    }
  },

  signout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    localStorage.removeItem('user_id');
  },

  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('access_token');
  },
};

// Jobs API
export const jobsAPI = {
  getAll: async (search?: string, category?: string) => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (category) params.append('category', category);
    
    const query = params.toString() ? `?${params.toString()}` : '';
    return await apiCall(`/jobs${query}`);
  },

  getById: async (jobId: string) => {
    return await apiCall(`/jobs/${jobId}`);
  },

  create: async (jobData: {
    title: string;
    description: string;
    location: string;
    salary: string;
    category: string;
    type?: string;
    salaryPeriod?: string;
    requirements?: string[];
  }) => {
    return await apiCall('/jobs', {
      method: 'POST',
      body: JSON.stringify(jobData),
    });
  },

  getEmployerJobs: async () => {
    return await apiCall('/employer/jobs');
  },

  getApplicants: async (jobId: string) => {
    return await apiCall(`/jobs/${jobId}/applicants`);
  },

  update: async (jobId: string, jobData: {
    title?: string;
    description?: string;
    location?: string;
    salary?: string;
    category?: string;
    type?: string;
    salaryPeriod?: string;
  }) => {
    return await apiCall(`/jobs/${jobId}`, {
      method: 'PUT',
      body: JSON.stringify(jobData),
    });
  },
};

// Applications API
export const applicationsAPI = {
  submit: async (applicationData: {
    jobId: string;
    motivation: string;
    name: string;
    email: string;
    phone: string;
  }) => {
    return await apiCall('/applications', {
      method: 'POST',
      body: JSON.stringify(applicationData),
    });
  },

  getMyApplications: async () => {
    return await apiCall('/applications');
  },

  update: async (applicationId: string, data: any) => {
    return await apiCall(`/applications/${applicationId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  updateStatus: async (applicationId: string, status: string) => {
    return await apiCall(`/applications/${applicationId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  },
};

// Feedback API
export const feedbackAPI = {
  submit: async (rating: number, message: string) => {
    const userId = localStorage.getItem('user_id');
    return await apiCall('/feedback', {
      method: 'POST',
      body: JSON.stringify({ rating, message, userId }),
    });
  },
};
