/**
 * API 서비스 모듈
 * 
 * 백엔드 API와의 통신을 담당하는 유틸리티 함수들
 */

// API 기본 URL - 환경 변수에서 가져오거나 기본값 사용
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// 토큰 저장 키
const TOKEN_KEY = 'shamstagram-token';

/**
 * API 응답 타입
 */
interface ApiResponse<T = any> {
  data?: T;
  message?: string;
  error?: string;
}

/**
 * 사용자 정보 타입
 */
export interface User {
  id: number;
  email: string;
  nickname: string;
  avatar: number;
  created_at?: string;
}

/**
 * 로그인 요청 타입
 */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * 회원가입 요청 타입
 */
export interface RegisterRequest {
  email: string;
  password: string;
  nickname: string;
}

/**
 * 인증 응답 타입
 */
export interface AuthResponse {
  token: string;
  user: User;
  message: string;
}

/**
 * API 요청을 위한 헬퍼 함수
 * 
 * @param url - 요청 URL
 * @param options - fetch 옵션
 * @returns Promise<Response>
 */
async function apiRequest(url: string, options: RequestInit = {}): Promise<Response> {
  const token = localStorage.getItem(TOKEN_KEY);
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  // 토큰이 있으면 Authorization 헤더 추가
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return fetch(`${API_URL}${url}`, {
    ...options,
    headers,
  });
}

/**
 * 토큰 저장
 * 
 * @param token - JWT 토큰
 */
export function saveToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

/**
 * 토큰 가져오기
 * 
 * @returns 저장된 토큰 또는 null
 */
export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

/**
 * 토큰 삭제
 */
export function removeToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

/**
 * 로그인 API 호출
 * 
 * @param credentials - 로그인 정보
 * @returns Promise<AuthResponse>
 */
export async function login(credentials: LoginRequest): Promise<AuthResponse> {
  const response = await apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || '로그인에 실패했습니다.');
  }
  
  const data = await response.json();
  saveToken(data.token);
  return data;
}

/**
 * 회원가입 API 호출
 * 
 * @param userData - 회원가입 정보
 * @returns Promise<AuthResponse>
 */
export async function register(userData: RegisterRequest): Promise<AuthResponse> {
  const response = await apiRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || '회원가입에 실패했습니다.');
  }
  
  const data = await response.json();
  saveToken(data.token);
  return data;
}

/**
 * 현재 사용자 정보 가져오기
 * 
 * @returns Promise<User>
 */
export async function getCurrentUser(): Promise<User> {
  const response = await apiRequest('/auth/me');
  
  if (!response.ok) {
    throw new Error('사용자 정보를 가져올 수 없습니다.');
  }
  
  const data = await response.json();
  return data.user;
}

/**
 * 토큰 유효성 검증
 * 
 * @returns Promise<boolean>
 */
export async function verifyToken(): Promise<boolean> {
  try {
    const response = await apiRequest('/auth/verify');
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * 로그아웃
 */
export function logout(): void {
  removeToken();
  // localStorage에서 사용자 정보도 삭제
  localStorage.removeItem('shamstagram-user');
}