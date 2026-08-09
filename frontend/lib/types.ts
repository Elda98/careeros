/**
 * Mirrors backend/app/schemas/*.py. Kept as one file so a backend schema
 * change is a single, obvious place to update on the frontend too — see
 * CONTRIBUTING.md rule 8 (documentation lives alongside the code it
 * describes, not in a separate upfront contract spec).
 */

export type ConfidenceLevel = "high" | "medium" | "low";

export interface DashboardRead {
  next_action: { roadmap_item_id: string; title: string; reason: string } | null;
  current_confidence: ConfidenceLevel | null;
}

export interface ProfileRead {
  id: string;
  background: string;
  education: string;
  experience: string;
  skills: string[];
}

export interface ProfileUpdate {
  background?: string;
  education?: string;
  experience?: string;
  skills?: string[];
}

export interface GoalRead {
  id: string;
  target_role: string;
  target_field: string;
  is_active: boolean;
}

export interface OnboardingStatusRead {
  profile_exists: boolean;
  goal_set: boolean;
  meets_hard_bar: boolean;
  is_complete: boolean;
  missing_hard_bar_fields: string[];
  missing_quality_fields: string[];
  onboarding_completed: boolean;
}

/** Which of the four Orbit personas this account is — mirrors
 * backend/app/db/models.py's AccountType. `null` means the user hasn't
 * chosen yet (the role-selection screen's trigger condition). */
export type AccountType = "student" | "graduate" | "company" | "service_provider";

export interface AccountTypeRead {
  account_type: AccountType | null;
}

export interface CompanyProfileRead {
  id: string;
  company_name: string;
  industry: string;
  description: string;
  website: string;
}

export interface CompanyProfileUpdate {
  company_name?: string;
  industry?: string;
  description?: string;
  website?: string;
}

export interface ServiceProviderProfileRead {
  id: string;
  professional_title: string;
  expertise: string[];
  description: string;
  contact_info: string;
}

export interface ServiceProviderProfileUpdate {
  professional_title?: string;
  expertise?: string[];
  description?: string;
  contact_info?: string;
}

export type OpportunityType = "job" | "internship";
export type OpportunityStatus = "open" | "closed";
export type ApplicationStatus = "submitted" | "reviewed" | "accepted" | "rejected";

export interface JobOpportunityCreate {
  title: string;
  description?: string;
  opportunity_type?: OpportunityType;
  location?: string;
  required_skills?: string[];
}

export interface JobOpportunityUpdate {
  title?: string;
  description?: string;
  opportunity_type?: OpportunityType;
  location?: string;
  required_skills?: string[];
  status?: OpportunityStatus;
}

export interface JobOpportunityRead {
  id: string;
  title: string;
  description: string;
  opportunity_type: OpportunityType;
  location: string;
  required_skills: string[];
  status: OpportunityStatus;
  created_at: string;
}

export interface JobOpportunityWithCompanyRead extends JobOpportunityRead {
  company_name: string;
}

export interface ApplicantRead {
  user_id: string;
  email: string;
}

export interface ApplicationRead {
  id: string;
  status: ApplicationStatus;
  created_at: string;
  applicant: ApplicantRead;
}

export interface MyApplicationRead {
  id: string;
  status: ApplicationStatus;
  created_at: string;
  opportunity: JobOpportunityWithCompanyRead;
}

export interface SkillGapItemRead {
  id: string;
  skill: string;
  description: string;
  severity: ConfidenceLevel;
}

export interface SkillGapAnalysisRead {
  id: string;
  version: number;
  summary: string;
  confidence: ConfidenceLevel;
  confidence_reason: string;
  grounded_on: string[];
  created_at: string;
  gaps: SkillGapItemRead[];
}

export type RoadmapItemStatus = "not_started" | "in_progress" | "completed" | "skipped";

export interface RoadmapItemRead {
  id: string;
  title: string;
  description: string;
  addresses_gap: string;
  status: RoadmapItemStatus;
}

export interface RoadmapRead {
  id: string;
  version: number;
  confidence: ConfidenceLevel;
  created_at: string;
  items: RoadmapItemRead[];
}

export interface ExplanationRead {
  explanation: string;
  grounded_on: string[];
}

export interface NotificationRead {
  id: string;
  category: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export type CVFeedbackCategory = "factual_structural" | "judgment_call";

export interface CVFeedbackItemRead {
  id: string;
  category: CVFeedbackCategory;
  note: string;
  relevance_to_goal: string;
}

export interface CVFeedbackRoundRead {
  id: string;
  round_number: number;
  document_text: string;
  confidence: ConfidenceLevel;
  created_at: string;
  items: CVFeedbackItemRead[];
}

export interface AccountRead {
  email: string;
  member_since: string;
}

export type SubscriptionTier = "free" | "paid";
export type SubscriptionStatus = "active" | "canceled";

export interface SubscriptionRead {
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  cancellation_reason: string | null;
}

export interface SubscriptionCancelRequest {
  reason?: string;
}

export interface RenewalRecapRead {
  member_since: string;
  skills_addressed_count: number;
  roadmap_items_completed_count: number;
  roadmap_items_total_count: number;
  cv_feedback_rounds_count: number;
}

export interface NotificationPreferenceRead {
  muted_categories: string[];
  available_categories: string[];
}

export interface NotificationPreferenceUpdate {
  muted_categories: string[];
}

export interface DataOverviewRead {
  profile_present: boolean;
  goals_count: number;
  skill_gap_analyses_count: number;
  roadmaps_count: number;
  cv_feedback_rounds_count: number;
  notifications_count: number;
  subscription_tier: SubscriptionTier | null;
}
