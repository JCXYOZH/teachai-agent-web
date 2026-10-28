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
