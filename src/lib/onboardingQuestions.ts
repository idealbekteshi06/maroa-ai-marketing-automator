// Complete onboarding question definitions — 12 blocks, 83 questions
// Used by the onboarding wizard to render the correct UI per question

export const BUSINESS_TYPES = [
  "Gym/Fitness", "Restaurant", "Café", "Bar", "Retail Shop", "Beauty Salon", "Barbershop",
  "Nail Studio", "Spa", "Medical Clinic", "Dental Clinic", "Pharmacy", "Hotel", "Guesthouse",
  "Real Estate Agency", "Law Firm", "Accounting Firm", "Marketing Agency", "IT Company",
  "Construction", "Auto Repair", "Photography", "Videography", "Wedding Services", "Catering",
  "Bakery", "Butcher", "Supermarket", "School/Academy", "Driving School", "Language School",
  "Yoga Studio", "Dance Studio", "Pilates Studio", "Tattoo Studio", "Jewelry Store",
  "Clothing Store", "Shoe Store", "Electronics Store", "Furniture Store", "Interior Design",
  "Cleaning Service", "Security Company", "Travel Agency", "Other",
];

export const BRAND_VALUES = [
  "Quality", "Trust", "Innovation", "Community", "Affordability", "Luxury", "Speed",
  "Expertise", "Fun", "Family", "Health", "Sustainability", "Tradition", "Modernity",
  "Local Pride", "Excellence", "Transparency", "Care", "Results", "Empowerment",
];

export const BRAND_PERSONALITY = [
  "Energetic", "Warm", "Expert", "Cool", "Bold", "Caring", "Motivating", "Sophisticated",
  "Down-to-earth", "Inspiring", "Trustworthy", "Fun", "Passionate", "No-nonsense",
  "Empowering", "Innovative", "Traditional", "Premium", "Accessible", "Ambitious",
];

export const VISUAL_STYLES = [
  "Clean & Minimal", "Bold & Energetic", "Luxury & Premium", "Warm & Friendly",
  "Dark & Dramatic", "Colorful & Playful", "Natural & Organic", "Professional & Corporate",
];

export const LANGUAGES = [
  "Albanian", "English", "Serbian", "Arabic", "German", "French", "Turkish",
  "Italian", "Portuguese", "Hindi", "Spanish", "Macedonian", "Other",
];

export const SOCIAL_PLATFORMS = [
  "Instagram", "Facebook", "TikTok", "YouTube", "LinkedIn", "Twitter/X",
  "Snapchat", "Pinterest", "WhatsApp Business", "Telegram", "Viber", "Google Business Profile",
];

export const CONTENT_TYPES = [
  "Photos", "Videos (Reels/TikToks)", "Stories", "Carousels", "Text posts",
  "Before/After", "Behind the scenes", "Customer testimonials", "Product demos",
  "Educational content", "Memes/humor", "Promotions/offers", "Live videos",
];

export const BLOCKS = [
  { id: "identity", label: "Business Identity", icon: "Building2", questions: 8, time: "3 min" },
  { id: "location", label: "Location & Market", icon: "MapPin", questions: 7, time: "2 min" },
  { id: "audience", label: "Target Audience", icon: "Users", questions: 10, time: "4 min" },
  { id: "products", label: "Products & Services", icon: "Package", questions: 6, time: "3 min" },
  { id: "voice", label: "Brand Voice", icon: "Palette", questions: 8, time: "3 min" },
  { id: "goals", label: "Goals & Strategy", icon: "Target", questions: 7, time: "2 min" },
  { id: "social", label: "Social Media", icon: "Share2", questions: 9, time: "3 min" },
  { id: "competitors", label: "Competitors", icon: "Swords", questions: 6, time: "2 min" },
  { id: "operations", label: "Operations & Timing", icon: "Clock", questions: 6, time: "2 min" },
  { id: "visual", label: "Visual Identity", icon: "Image", questions: 5, time: "2 min" },
  { id: "customers", label: "Customer Relations", icon: "Heart", questions: 5, time: "1 min" },
  { id: "preferences", label: "AI Preferences", icon: "Settings", questions: 6, time: "1 min" },
];

export const BUDGET_OPTIONS = [
  "€0 (organic only)", "€50-100", "€100-200", "€200-500",
  "€500-1000", "€1000-2000", "Over €2000",
];

export const GOAL_OPTIONS = [
  "Get more new customers",
  "Keep existing customers — reduce churn",
  "Launch something new",
  "Recover from a slow period",
  "Build brand awareness",
  "Increase average spend per customer",
];

export const SUCCESS_METRICS = [
  "New customers per month", "Revenue per month", "Social media followers",
  "Post engagement", "Website visitors", "Email subscribers",
  "Walk-ins per week", "Bookings per week", "Phone calls per week",
];

export const AD_EXPERIENCE = [
  "Never — I'm completely new to ads",
  "Tried it but didn't see results",
  "Yes, basic experience with Facebook/Instagram",
  "Yes, I run ads regularly",
  "Yes, professional advertising experience",
];

export const YEARS_OPTIONS = [
  "Less than 1 year", "1-2 years", "3-5 years", "6-10 years", "More than 10 years",
];

export const STAGE_OPTIONS = [
  { label: "Just starting", desc: "Need to get my first customers" },
  { label: "Growing", desc: "Have customers but want more" },
  { label: "Established", desc: "Want to maintain and scale" },
  { label: "Relaunching", desc: "Rebranding or after a slow period" },
];

export const OPERATION_MODELS = [
  { label: "Physical location", desc: "Customers come to us" },
  { label: "We go to customers", desc: "Home visits, delivery" },
  { label: "Both", desc: "Physical and mobile" },
  { label: "Online only", desc: "Digital services" },
];

export const SERVICE_AREA_OPTIONS = [
  "Walking distance (under 1km)", "Local neighborhood (1-3km)",
  "City-wide (3-15km)", "Regional (15-50km)", "National", "International",
];

export const SPEND_OPTIONS = [
  "Under €20", "€20-50", "€50-100", "€100-200", "€200-500", "Over €500",
];

export const LIFETIME_OPTIONS = [
  "One-time purchase", "1-3 months", "3-6 months",
  "6-12 months", "1-2 years", "More than 2 years",
];

export const DISCOVERY_CHANNELS = [
  "Word of mouth", "Instagram", "Facebook", "Google Search",
  "Google Maps", "TikTok", "Walk-by / location", "Referral from another business",
  "Events", "Other",
];

export const EMOJI_OPTIONS = [
  "Use them often — they make content feel friendly",
  "Use sparingly — 1-2 max per post",
  "Never use emojis — too informal",
];

export const APPROVAL_OPTIONS = [
  { label: "Show me everything first", desc: "I approve before anything is published" },
  { label: "Publish automatically", desc: "I trust the AI to post for me" },
  { label: "Mix", desc: "Auto-publish stories, I approve ads and campaigns" },
];

export const POSTING_FREQUENCY = [
  "1-2 times per week (sustainable)",
  "3-4 times per week (recommended)",
  "Daily (aggressive growth)",
  "Multiple times daily (maximum visibility)",
];

export const NOTIFICATION_OPTIONS = [
  "Email daily report", "WhatsApp summary",
  "In-app notifications only", "Weekly summary only",
];

// Helper to calculate which block a user should start from based on filled data
export function getFirstIncompleteBlock(data: Record<string, any>): number {
  if (!data.business_name) return 0;
  if (!data.city) return 1;
  if (!data.audience_description) return 2;
  if (!data.products?.length) return 3;
  if (!data.tone_keywords?.length) return 4;
  if (!data.primary_goal) return 5;
  if (!data.platforms?.length) return 6;
  return 7;
}
