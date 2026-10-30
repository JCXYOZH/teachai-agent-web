export interface User {
  id: string;
  email: string;
  display_name: string;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: 'bearer';
  expires_in: number;
  user: User;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload extends LoginPayload {
  display_name?: string;
  code: string;
}

export interface RegistrationCodeResponse {
  email: string;
  expires_in: number;
  resend_after: number;
}

export interface HealthResponse {
  status: string;
  service: string;
  version: string;
  environment: string;
}

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface Folder {
  id: string;
  name: string;
  course_count: number;
  asset_count: number;
  created_at: string;
  updated_at: string;
}

export interface Course {
  id: string;
  title: string;
  description: string | null;
  folder_id: string | null;
  folder_name: string | null;
  status: 'draft' | 'ready' | 'archived';
  asset_count: number;
  created_at: string;
  updated_at: string;
}

export interface CourseListResponse {
  items: Course[];
  total: number;
  limit: number;
  offset: number;
}

export interface Asset {
  id: string;
  filename: string;
  original_filename: string;
  extension: string;
  media_type: string;
  size_bytes: number;
  page_count: number | null;
  char_count: number;
  extraction_status: 'ready' | 'empty' | 'failed';
  course_id: string | null;
  course_title: string | null;
  folder_id: string | null;
  folder_name: string | null;
  excerpt: string | null;
  download_url: string;
  created_at: string;
  updated_at: string;
}

export interface AssetSectionLocator {
  kind: 'page' | 'slide' | 'document' | 'lines';
  index?: number;
  start?: number;
  end?: number;
  label?: string;
}

export interface AssetSection {
  locator: AssetSectionLocator;
  text: string;
  char_count: number;
}

export interface AssetDetail extends Asset {
  extraction_error: string | null;
  truncated: boolean;
  text_preview: string;
  sections: AssetSection[];
}

export interface AssetListResponse {
  items: Asset[];
  total: number;
  limit: number;
  offset: number;
}

export interface SearchCourseHit {
  id: string;
  title: string;
  description: string | null;
  folder_name: string | null;
  updated_at: string;
}

export interface SearchAssetHit {
  id: string;
  filename: string;
  media_type: string;
  folder_name: string | null;
  course_title: string | null;
  excerpt: string | null;
  updated_at: string;
}

export interface SearchResponse {
  query: string;
  total: number;
  courses: SearchCourseHit[];
  assets: SearchAssetHit[];
}

export type ProviderProtocol = 'openai' | 'anthropic';
export type ProviderApiKeySource = 'user' | 'environment';

export interface ProviderConfig {
  id: string;
  label: string;
  description: string;
  protocol: ProviderProtocol;
  default_base_url: string;
  alternate_base_urls: string[];
  requires_api_key: boolean;
  supports_model_discovery: boolean;
  default_models: string[];
  configured: boolean;
  api_key_configured: boolean;
  api_key_hint: string | null;
  api_key_source: ProviderApiKeySource | null;
  base_url: string;
  default_model: string;
  is_default: boolean;
  updated_at: string | null;
}

export interface ProviderConfigUpdate {
  api_key?: string;
  clear_api_key?: boolean;
  base_url?: string | null;
  default_model?: string | null;
  is_default?: boolean;
}

export interface ProviderTestRequest {
  api_key?: string;
  base_url?: string;
  default_model?: string;
}

export interface ProviderTestResponse {
  provider_id: string;
  success: boolean;
  message: string;
  latency_ms: number;
  model: string;
  models: string[];
}

export type ClassroomSceneType = 'slide' | 'quiz' | 'interactive' | 'pbl';

export interface ClassroomSlideElement {
  id: string;
  left: number;
  top: number;
  width: number;
  height: number;
  rotate?: number;
  type: string;
  content: string;
  defaultFontName?: string;
  defaultColor?: string;
  textType?: string;
  lineHeight?: number;
}

export interface ClassroomSlideCanvas {
  id: string;
  viewportSize: number;
  viewportRatio: number;
  theme?: {
    backgroundColor?: string;
    themeColors?: string[];
    fontColor?: string;
    fontName?: string;
  };
  background?: {
    type: string;
    color?: string;
  };
  elements: ClassroomSlideElement[];
  turningMode?: string;
  type?: string;
  script?: string;
}

export interface ClassroomSlideContent {
  type: 'slide';
  schemaVersion?: number;
  canvas: ClassroomSlideCanvas;
}

export interface ClassroomQuizOption {
  label: string;
  value: string;
}

export interface ClassroomQuestion {
  id: string;
  type: 'single' | 'multiple' | 'short_answer';
  question: string;
  options: ClassroomQuizOption[];
  answer: string[];
  analysis: string | null;
  hasAnswer: boolean;
  points: number;
}

export interface ClassroomQuizContent {
  type: 'quiz';
  questions: ClassroomQuestion[];
}

export type ClassroomWidgetType =
  | 'simulation'
  | 'diagram'
  | 'code'
  | 'game'
  | 'visualization3d'
  | 'procedural-skill';

export interface ClassroomInteractiveContent {
  type: 'interactive';
  schemaVersion?: number;
  widgetType?: ClassroomWidgetType;
  prompt?: string | null;
  html: string;
  frame?: {
    viewportWidth: number;
    viewportHeight: number;
  };
}

export type ClassroomMicrotaskStatus = 'todo' | 'in_progress' | 'completed';

export interface ClassroomPblMicrotask {
  id: string;
  title: string;
  description: string | null;
  completionCriteria: string | null;
  hints: string[];
  status: ClassroomMicrotaskStatus;
}

export interface ClassroomPblMilestone {
  id: string;
  title: string;
  description: string | null;
  deliverable: string | null;
  microtasks: ClassroomPblMicrotask[];
}

export interface ClassroomPblProject {
  title: string;
  description: string;
  learningObjective: string | null;
  finalDeliverable: string | null;
  milestones: ClassroomPblMilestone[];
}

export interface ClassroomPblContent {
  type: 'pbl';
  schemaVersion?: number;
  project: ClassroomPblProject;
}

export type ClassroomSceneContent =
  | ClassroomSlideContent
  | ClassroomQuizContent
  | ClassroomInteractiveContent
  | ClassroomPblContent;

export interface ClassroomAction {
  id: string;
  type: string;
  text?: string;
  speed?: number;
  [key: string]: unknown;
}

export interface ClassroomScene {
  id: string;
  stage_id: string;
  type: ClassroomSceneType;
  title: string;
  order: number;
  content: ClassroomSceneContent;
  actions: ClassroomAction[];
  created_at: string;
  updated_at: string;
}

export interface Classroom {
  id: string;
  course_id: string;
  outline_id: string | null;
  version: number;
  name: string;
  description: string;
  style: string;
  language_directive: string;
  dsl_version: string;
  provider_id: string | null;
  model_name: string | null;
  scene_count: number;
  scenes: ClassroomScene[];
  created_at: string;
  updated_at: string;
}

export interface ClassroomGeneratePayload {
  provider_id?: string;
  model?: string;
  instructions?: string;
}

export type GenerationJobStatus = 'queued' | 'running' | 'completed' | 'failed';
export type GenerationJobKind = 'outline' | 'classroom';

export interface GenerationJob {
  id: string;
  course_id: string;
  kind: GenerationJobKind;
  outline_id: string | null;
  stage_id: string | null;
  provider_id: string | null;
  model_name: string | null;
  status: GenerationJobStatus;
  progress: number;
  message: string;
  error_code: string | null;
  error_message: string | null;
  scene_count: number;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
}

export interface CourseOutlineSummary {
  id: string;
  course_id: string;
  version: number;
  source: 'generated' | 'manual';
  course_title: string;
  scene_count: number;
  created_at: string;
}

export interface CourseOutlineGeneratePayload {
  provider_id?: string;
  model?: string;
  instructions?: string;
  scene_count?: number;
}

export type ClassroomResponseKind = 'question' | 'microtask';

export interface ClassroomAnswerItem {
  kind: ClassroomResponseKind;
  target_id: string;
  answer: string[] | string | { completed: boolean };
}

export interface ClassroomResult {
  target_id: string;
  kind: ClassroomResponseKind;
  score: number | null;
  max_score: number;
  correct: boolean | null;
  reference_answer: string[];
  analysis: string | null;
}

export interface ClassroomSubmitResult {
  scene_id: string;
  stage_id: string;
  results: ClassroomResult[];
  score: number;
  max_score: number;
}

export interface ClassroomResponseRecord {
  id: string;
  course_id: string;
  stage_id: string;
  scene_id: string;
  kind: ClassroomResponseKind;
  target_id: string;
  answer: unknown;
  score: number | null;
  max_score: number;
  correct: boolean | null;
  submitted_at: string;
}

export interface ClassroomResponsesPayload {
  stage_id: string | null;
  responses: ClassroomResponseRecord[];
}
