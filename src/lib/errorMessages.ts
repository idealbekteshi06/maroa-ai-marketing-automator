export const ERROR_MESSAGES = {
  GENERATION_FAILED: "Generation failed — please try again",
  LOAD_FAILED: "Failed to load data — please refresh",
  SAVE_FAILED: "Failed to save — please try again",
  CONNECTION_ERROR: "Connection error — check your internet",
  LOGIN_FAILED: "Login failed — check your email and password",
  SIGNUP_FAILED: "Signup failed — please try again",
  PROFILE_INCOMPLETE: "Complete your profile for better AI results",
  NO_BUSINESS_ID: "Please complete your profile first",
  CREDITS_LOW: "AI credits low — content may be delayed",
} as const;

export const SUCCESS_MESSAGES = {
  GENERATED: "Generated successfully!",
  SAVED: "Saved successfully!",
  COPIED: "Copied to clipboard!",
  CAMPAIGN_LAUNCHED: "Campaign launched!",
  IDEA_UPDATED: "Idea updated!",
  SIGNED_IN: "Welcome back!",
  RESET_EMAIL_SENT: "Check your email for a reset link.",
} as const;
