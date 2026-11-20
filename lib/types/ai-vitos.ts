// ==============================================================================
// AI Virtual IT Company OS (AI-VITOS) Types & Data Models
// ==============================================================================

export type AutonomyLevel = 'L1' | 'L2' | 'L3';
// L1: Fully Autonomous (Read, Research, Code Analysis, Drafts, Safe)
// L2: Approval Required (Publish, Deploy, Send Invoices, Modify Infra)
// L3: Restricted (Root access, Production drop, Financial disbursement)

export type DepartmentKey =
  | 'executive'
  | 'bizdev'
  | 'webdev'
  | 'reveng'
  | 'devops'
  | 'marketing'
  | 'support'
  | 'finance';

export type ITServiceVertical =
  | 'Website Development'
  | 'Web Application Development'
  | 'Mobile Application Development'
  | 'Software Development & Maintenance'
  | 'API Development & Integration'
  | 'IT Infrastructure Management'
  | 'Cloud Hosting & Server Management'
  | 'Website Maintenance & Monitoring'
  | 'Cybersecurity Assessments'
  | 'SEO & Search Engine Optimisation'
  | 'Google Ads Management'
  | 'Meta Ads (Facebook & Instagram)'
  | 'Social Media Account Management'
  | 'Social Media Content Creation'
  | 'Graphic Design & Branding'
  | 'Content Writing & Copywriting'
  | 'Business Automation'
  | 'CRM Development & Management'
  | 'Technical Support & Troubleshooting'
  | 'IT Consulting & Digital Transformation';

export type TaskStatus =
  | 'queued'
  | 'in_progress'
  | 'waiting_approval'
  | 'completed'
  | 'failed'
  | 'escalated';

export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Urgent';

export interface AIDepartment {
  id: string;
  department_key: DepartmentKey;
  name: string;
  description: string;
  icon: string;
  lead_agent_id: string;
  budget_monthly: number;
  is_active: boolean;
  active_agents_count?: number;
  created_at: string;
  updated_at: string;
}

export interface AIAgentEmployee {
  id: string;
  agent_id: string;
  department_key: DepartmentKey;
  name: string;
  role_title: string;
  avatar?: string;
  autonomy_level: AutonomyLevel;
  model_preference: string;
  system_prompt: string;
  capabilities: string[];
  tools: {
    name: string;
    description: string;
    parameters?: Record<string, any>;
  }[];
  hourly_rate: number;
  total_tokens_used: number;
  total_cost_usd: number;
  tasks_completed: number;
  performance_score: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AITask {
  id: string;
  organization_id?: string;
  client_id: string;
  project_id?: string | null;
  task_title: string;
  description?: string;
  department_key: DepartmentKey;
  assigned_agent_id: string;
  priority: TaskPriority;
  status: TaskStatus;
  autonomy_level: AutonomyLevel;
  required_approval_role?: 'founder' | 'client' | 'tech_lead' | 'none';
  input_payload?: Record<string, any>;
  output_payload?: Record<string, any>;
  error_message?: string;
  tokens_used: number;
  cost_usd: number;
  started_at?: string | null;
  completed_at?: string | null;
  created_at: string;
  updated_at: string;
  agent_name?: string;
  agent_role?: string;
  client_name?: string;
  project_name?: string;
}

export interface AITaskSubtask {
  id: string;
  task_id: string;
  step_order: number;
  title: string;
  instructions?: string;
  assigned_agent_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  output?: Record<string, any>;
  duration_ms: number;
}

export interface AICommandLog {
  id: string;
  raw_command: string;
  parsed_intent: string;
  generated_plan: {
    objective: string;
    department: DepartmentKey;
    steps: {
      step: number;
      agent_id: string;
      action: string;
      description: string;
      autonomy: AutonomyLevel;
    }[];
  };
  delegated_task_ids?: string[];
  status: 'processing' | 'completed' | 'waiting_approval' | 'failed';
  tokens_consumed: number;
  cost_usd: number;
  execution_summary?: string;
  created_at: string;
}

export interface ApprovalCheckpoint {
  id: string;
  task_id?: string;
  client_id?: string;
  title: string;
  action_type: string;
  autonomy_level: 'L2' | 'L3';
  status: 'pending' | 'approved' | 'rejected';
  proposed_by_agent_id: string;
  reviewed_by_user_id?: string;
  review_notes?: string;
  action_payload: Record<string, any>;
  created_at: string;
  reviewed_at?: string;
}

export interface ReverseEngineeringAudit {
  id: string;
  organization_id?: string;
  client_id: string;
  target_url: string;
  target_name: string;
  target_category: string;
  tech_stack: {
    frontend?: string[];
    backend_indicators?: string[];
    css_frameworks?: string[];
    analytics_scripts?: string[];
    fonts_and_cdns?: string[];
    ssl_provider?: string;
  };
  dom_structure: {
    title?: string;
    meta_description?: string;
    navigation_items?: string[];
    sections_detected?: string[];
    heading_hierarchy?: Record<string, number>;
    forms_count?: number;
  };
  public_apis: {
    endpoint: string;
    method: string;
    purpose: string;
    auth_requirement: string;
  }[];
  ui_components: {
    name: string;
    description: string;
    styling_notes: string;
  }[];
  performance_metrics: {
    estimated_load_time_sec?: number;
    resource_count?: number;
    mobile_readiness_score?: number;
  };
  seo_strategy?: {
    keyword_focus?: string[];
    schema_markup?: string[];
    open_graph_tags?: boolean;
  };
  cleanroom_architecture_recommendation: string;
  original_implementation_plan: {
    suggested_stack: string[];
    estimated_sprint_weeks: number;
    recommended_agents: string[];
    deliverables: string[];
  };
  ethical_compliance_certified: boolean;
  compliance_notes: string;
  created_at: string;
}

export interface DevOpsServer {
  id: string;
  organization_id?: string;
  client_id: string;
  server_name: string;
  host_url: string;
  ip_address?: string;
  environment: 'production' | 'staging' | 'development';
  status: 'healthy' | 'degraded' | 'down' | 'maintenance';
  ssl_valid: boolean;
  ssl_expiry_date?: string;
  last_ping_ms: number;
  uptime_percentage: number;
  monitoring_enabled: boolean;
  last_checked_at: string;
  created_at: string;
}

export interface DevOpsIncident {
  id: string;
  server_id?: string;
  client_id?: string;
  severity: 'P1_CRITICAL' | 'P2_HIGH' | 'P3_MEDIUM' | 'P4_LOW';
  title: string;
  description: string;
  detected_by_agent_id: string;
  status: 'investigating' | 'mitigating' | 'resolved' | 'escalated';
  root_cause?: string;
  mitigation_steps?: string;
  resolved_at?: string;
  created_at: string;
}

export interface ITProject {
  id: string;
  organization_id?: string;
  client_id: string;
  project_name: string;
  service_category: ITServiceVertical;
  description?: string;
  status: 'planning' | 'in_progress' | 'review' | 'waiting_approval' | 'delivered' | 'active_maintenance' | 'archived';
  priority: TaskPriority;
  budget: number;
  spent: number;
  repo_url?: string;
  staging_url?: string;
  production_url?: string;
  tech_stack: string[];
  deliverables: {
    name: string;
    completed: boolean;
    assigned_agent?: string;
  }[];
  start_date?: string;
  target_delivery_date?: string;
  created_at: string;
  updated_at: string;
}

export interface ITSupportTicket {
  id: string;
  ticket_number: string;
  client_id: string;
  project_id?: string;
  subject: string;
  description: string;
  category: 'Technical Bug' | 'Feature Request' | 'Server Outage' | 'Billing' | 'General Inquiry';
  priority: TaskPriority;
  status: 'open' | 'in_progress' | 'waiting_client' | 'resolved' | 'closed';
  assigned_agent_id?: string;
  customer_email?: string;
  resolution_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ITQuotation {
  id: string;
  quotation_number: string;
  client_id: string;
  project_id?: string;
  title: string;
  line_items: {
    service: string;
    description: string;
    quantity: number;
    unit_price: number;
    total: number;
  }[];
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total_amount: number;
  valid_until: string;
  status: 'draft' | 'sent' | 'approved' | 'rejected' | 'expired';
  terms?: string;
  created_at: string;
}

export interface ITInvoice {
  id: string;
  invoice_number: string;
  client_id: string;
  project_id?: string;
  amount: number;
  tax_amount: number;
  total_amount: number;
  due_date: string;
  status: 'draft' | 'issued' | 'paid' | 'overdue' | 'cancelled';
  payment_method?: string;
  paid_at?: string;
  notes?: string;
  created_at: string;
}

export interface TenantKnowledgeDoc {
  id: string;
  client_id: string;
  title: string;
  category: 'brand' | 'architecture' | 'api_spec' | 'sop' | 'guideline' | 'incident_postmortem';
  content: string;
  tags: string[];
  version: number;
  created_at: string;
  updated_at: string;
}
