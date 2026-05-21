// ===== User Types =====
export interface User {
  id: string;
  email: string;
  name: string;
  created_at: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

// ===== Learning Module Types =====
export interface Module {
  id: string;
  title: string;
  description: string;
  order_index: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimated_minutes: number;
  lesson_count: number;
  completed_lessons: number;
}

export interface Lesson {
  id: string;
  module_id: string;
  title: string;
  content: string;
  order_index: number;
  example_sql: string | null;
}

export interface Quiz {
  id: string;
  lesson_id: string;
  question: string;
  options: string[];
  correct_answer: number;
  explanation: string;
  order_index: number;
}

// ===== Progress Types =====
export interface UserProgress {
  lesson_id: string;
  completed: boolean;
  quiz_score: number | null;
  completed_at: string | null;
}

// ===== Chat Types =====
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

// ===== SQL Query Types =====
export interface QueryResult {
  columns: string[];
  rows: Record<string, unknown>[];
  rowCount: number;
  executionTime: number;
}

export interface QueryHistory {
  id: string;
  query: string;
  result: string | null;
  error: string | null;
  created_at: string;
}

// ===== Settings Types =====
export interface Settings {
  id: string;
  user_id: string;
  dark_mode: boolean;
  display_name: string;
  bio: string;
}

// ===== Favorite Types =====
export interface Favorite {
  id: string;
  user_id: string;
  item_type: 'lesson' | 'query';
  item_id: string;
  created_at: string;
}

// ===== Search Types =====
export interface SearchResult {
  lesson_id: string;
  lesson_title: string;
  module_id: string;
  module_title: string;
  snippet: string;
  content: string;
  score: number;
}

// ===== Certificate Types =====
export interface CertificateData {
  user_name: string;
  course_name: string;
  completed_date: string;
  total_lessons: number;
  completed_lessons: number;
  score: number;
  certificate_id: string;
}

// ===== Comment Types =====
export interface Comment {
  id: string;
  user_id: string;
  user_name: string;
  lesson_id: string;
  content: string;
  created_at: string;
}
