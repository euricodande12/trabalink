import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "jsr:@supabase/supabase-js@2";
import * as kv from "./kv_store.tsx";

const app = new Hono();

app.use("*", cors());
app.use("*", logger(console.log));

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

// Helper function to generate unique IDs
function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

// User signup
app.post("/make-server-1685d933/signup", async (c) => {
  try {
    const body = await c.req.json();
    const { email, password, name, userType, phone, location, businessName } = body;

    // Create user with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm since email server isn't configured
      user_metadata: { name, userType, phone, location, businessName },
    });

    if (authError) {
      console.log(`Error creating user: ${authError.message}`);
      return c.json({ error: authError.message }, 400);
    }

    // Store user profile in KV store
    const userId = authData.user.id;
    const userProfile = {
      id: userId,
      email,
      name,
      userType,
      phone,
      location,
      businessName: businessName || null,
      createdAt: new Date().toISOString(),
    };

    await kv.set(`user:${userId}`, userProfile);

    // Sign in the user to get access token
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      console.log(`Auto-signin after signup failed: ${signInError.message}`);
      // Still return success but user needs to sign in manually
      return c.json({ success: true, user: userProfile, userId });
    }

    return c.json({ 
      success: true, 
      user: userProfile, 
      userId,
      accessToken: signInData.session.access_token 
    });
  } catch (error) {
    console.log(`Signup error: ${error}`);
    return c.json({ error: "Failed to create account" }, 500);
  }
});

// User signin
app.post("/make-server-1685d933/signin", async (c) => {
  try {
    const body = await c.req.json();
    const { email, password } = body;

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.log(`Signin error: ${error.message}`);
      return c.json({ error: error.message }, 401);
    }

    // Get user profile from KV store
    const userProfile = await kv.get(`user:${data.user.id}`);

    return c.json({
      success: true,
      user: userProfile,
      accessToken: data.session.access_token,
    });
  } catch (error) {
    console.log(`Signin error: ${error}`);
    return c.json({ error: "Failed to sign in" }, 500);
  }
});

// Get current session
app.get("/make-server-1685d933/session", async (c) => {
  try {
    const accessToken = c.req.header("Authorization")?.split(" ")[1];
    if (!accessToken) {
      return c.json({ error: "No token provided" }, 401);
    }

    const { data, error } = await supabase.auth.getUser(accessToken);
    if (error || !data.user) {
      return c.json({ error: "Invalid session" }, 401);
    }

    const userProfile = await kv.get(`user:${data.user.id}`);
    return c.json({ success: true, user: userProfile });
  } catch (error) {
    console.log(`Session error: ${error}`);
    return c.json({ error: "Failed to get session" }, 500);
  }
});

// Post a job (employers only)
app.post("/make-server-1685d933/jobs", async (c) => {
  try {
    const accessToken = c.req.header("Authorization")?.split(" ")[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (authError || !user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const body = await c.req.json();
    const { title, description, location, salary, category, type, salaryPeriod, requirements } = body;

    const jobId = generateId();
    const job = {
      id: jobId,
      employerId: user.id,
      title,
      description,
      location,
      salary,
      salaryPeriod: salaryPeriod || "monthly",
      category,
      type: type || "Full-time",
      postedTime: new Date().toISOString(),
      status: "active",
      applicantCount: 0,
      requirements: requirements || [],
    };

    await kv.set(`job:${jobId}`, job);
    
    // Also store in employer's job list
    const employerJobs = await kv.get(`employer:${user.id}:jobs`) || [];
    employerJobs.push(jobId);
    await kv.set(`employer:${user.id}:jobs`, employerJobs);

    return c.json({ success: true, job });
  } catch (error) {
    console.log(`Post job error: ${error}`);
    return c.json({ error: "Failed to post job" }, 500);
  }
});

// Get all jobs
app.get("/make-server-1685d933/jobs", async (c) => {
  try {
    const search = c.req.query("search") || "";
    const category = c.req.query("category") || "";

    // Get all jobs from KV store
    const allJobs = await kv.getByPrefix("job:");
    
    let jobs = allJobs.filter((job: any) => job.status === "active");

    // Apply filters
    if (search) {
      jobs = jobs.filter((job: any) => 
        job.title.toLowerCase().includes(search.toLowerCase()) ||
        job.description.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (category && category !== "All") {
      jobs = jobs.filter((job: any) => job.category === category);
    }

    // Sort by most recent
    jobs.sort((a: any, b: any) => new Date(b.postedTime).getTime() - new Date(a.postedTime).getTime());

    // Add company info
    for (const job of jobs) {
      const employer = await kv.get(`user:${job.employerId}`);
      job.company = employer?.businessName || employer?.name || "Anonymous Employer";
    }

    return c.json({ success: true, jobs });
  } catch (error) {
    console.log(`Get jobs error: ${error}`);
    return c.json({ error: "Failed to fetch jobs" }, 500);
  }
});

// Get a specific job
app.get("/make-server-1685d933/jobs/:jobId", async (c) => {
  try {
    const jobId = c.req.param("jobId");
    const job = await kv.get(`job:${jobId}`);

    if (!job) {
      return c.json({ error: "Job not found" }, 404);
    }

    // Add employer info
    const employer = await kv.get(`user:${job.employerId}`);
    job.company = employer?.businessName || employer?.name || "Anonymous Employer";
    job.employerEmail = employer?.email;
    job.employerPhone = employer?.phone;

    return c.json({ success: true, job });
  } catch (error) {
    console.log(`Get job error: ${error}`);
    return c.json({ error: "Failed to fetch job" }, 500);
  }
});

// Submit job application
app.post("/make-server-1685d933/applications", async (c) => {
  try {
    const accessToken = c.req.header("Authorization")?.split(" ")[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (authError || !user) {
      return c.json({ error: "Unauthorized - please sign in to apply" }, 401);
    }

    const body = await c.req.json();
    const { jobId, motivation, name, email, phone } = body;

    // Get job details
    const job = await kv.get(`job:${jobId}`);
    if (!job) {
      return c.json({ error: "Job not found" }, 404);
    }

    const applicationId = generateId();
    const application = {
      id: applicationId,
      jobId,
      userId: user.id,
      jobTitle: job.title,
      company: job.company,
      motivation,
      name,
      email,
      phone,
      appliedDate: new Date().toISOString(),
      status: "pending",
    };

    await kv.set(`application:${applicationId}`, application);

    // Add to user's applications
    const userApplications = await kv.get(`user:${user.id}:applications`) || [];
    userApplications.push(applicationId);
    await kv.set(`user:${user.id}:applications`, userApplications);

    // Add to job's applicants
    const jobApplicants = await kv.get(`job:${jobId}:applicants`) || [];
    jobApplicants.push(applicationId);
    await kv.set(`job:${jobId}:applicants`, jobApplicants);

    // Update job applicant count
    job.applicantCount = jobApplicants.length;
    await kv.set(`job:${jobId}`, job);

    return c.json({ success: true, application });
  } catch (error) {
    console.log(`Submit application error: ${error}`);
    return c.json({ error: "Failed to submit application" }, 500);
  }
});

// Get user's applications
app.get("/make-server-1685d933/applications", async (c) => {
  try {
    const accessToken = c.req.header("Authorization")?.split(" ")[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (authError || !user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const applicationIds = await kv.get(`user:${user.id}:applications`) || [];
    const applications = await kv.mget(applicationIds.map((id: string) => `application:${id}`));

    // Sort by most recent
    applications.sort((a: any, b: any) => 
      new Date(b.appliedDate).getTime() - new Date(a.appliedDate).getTime()
    );

    return c.json({ success: true, applications });
  } catch (error) {
    console.log(`Get applications error: ${error}`);
    return c.json({ error: "Failed to fetch applications" }, 500);
  }
});

// Update application
app.put("/make-server-1685d933/applications/:applicationId", async (c) => {
  try {
    const accessToken = c.req.header("Authorization")?.split(" ")[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (authError || !user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const applicationId = c.req.param("applicationId");
    const application = await kv.get(`application:${applicationId}`);

    if (!application) {
      return c.json({ error: "Application not found" }, 404);
    }

    if (application.userId !== user.id) {
      return c.json({ error: "Unauthorized to edit this application" }, 403);
    }

    const body = await c.req.json();
    const updatedApplication = {
      ...application,
      ...body,
      updatedAt: new Date().toISOString(),
    };

    await kv.set(`application:${applicationId}`, updatedApplication);

    return c.json({ success: true, application: updatedApplication });
  } catch (error) {
    console.log(`Update application error: ${error}`);
    return c.json({ error: "Failed to update application" }, 500);
  }
});

// Get applicants for a job (employers only)
app.get("/make-server-1685d933/jobs/:jobId/applicants", async (c) => {
  try {
    const accessToken = c.req.header("Authorization")?.split(" ")[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (authError || !user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const jobId = c.req.param("jobId");
    const job = await kv.get(`job:${jobId}`);

    if (!job) {
      return c.json({ error: "Job not found" }, 404);
    }

    if (job.employerId !== user.id) {
      return c.json({ error: "Unauthorized to view applicants" }, 403);
    }

    const applicantIds = await kv.get(`job:${jobId}:applicants`) || [];
    const applicants = await kv.mget(applicantIds.map((id: string) => `application:${id}`));

    // Sort by most recent
    applicants.sort((a: any, b: any) => 
      new Date(b.appliedDate).getTime() - new Date(a.appliedDate).getTime()
    );

    return c.json({ success: true, applicants });
  } catch (error) {
    console.log(`Get applicants error: ${error}`);
    return c.json({ error: "Failed to fetch applicants" }, 500);
  }
});

// Get employer's jobs
app.get("/make-server-1685d933/employer/jobs", async (c) => {
  try {
    const accessToken = c.req.header("Authorization")?.split(" ")[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (authError || !user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const jobIds = await kv.get(`employer:${user.id}:jobs`) || [];
    const jobs = await kv.mget(jobIds.map((id: string) => `job:${id}`));

    // Add applicant counts
    for (const job of jobs) {
      const applicantIds = await kv.get(`job:${job.id}:applicants`) || [];
      job.applicantCount = applicantIds.length;
    }

    // Sort by most recent
    jobs.sort((a: any, b: any) => 
      new Date(b.postedTime).getTime() - new Date(a.postedTime).getTime()
    );

    return c.json({ success: true, jobs });
  } catch (error) {
    console.log(`Get employer jobs error: ${error}`);
    return c.json({ error: "Failed to fetch jobs" }, 500);
  }
});

// Submit feedback
app.post("/make-server-1685d933/feedback", async (c) => {
  try {
    const body = await c.req.json();
    const { rating, message, userId } = body;

    const feedbackId = generateId();
    const feedback = {
      id: feedbackId,
      userId,
      rating,
      message,
      createdAt: new Date().toISOString(),
    };

    await kv.set(`feedback:${feedbackId}`, feedback);

    return c.json({ success: true, feedback });
  } catch (error) {
    console.log(`Submit feedback error: ${error}`);
    return c.json({ error: "Failed to submit feedback" }, 500);
  }
});

// Update application status (employers only)
app.put("/make-server-1685d933/applications/:applicationId/status", async (c) => {
  try {
    const accessToken = c.req.header("Authorization")?.split(" ")[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (authError || !user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const applicationId = c.req.param("applicationId");
    const application = await kv.get(`application:${applicationId}`);

    if (!application) {
      return c.json({ error: "Application not found" }, 404);
    }

    // Verify employer owns the job
    const job = await kv.get(`job:${application.jobId}`);
    if (job.employerId !== user.id) {
      return c.json({ error: "Unauthorized to update this application" }, 403);
    }

    const body = await c.req.json();
    const { status } = body;

    application.status = status;
    application.updatedAt = new Date().toISOString();

    await kv.set(`application:${applicationId}`, application);

    return c.json({ success: true, application });
  } catch (error) {
    console.log(`Update application status error: ${error}`);
    return c.json({ error: "Failed to update status" }, 500);
  }
});

Deno.serve(app.fetch);
