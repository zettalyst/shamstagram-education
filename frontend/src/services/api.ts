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

/**
 * 게시물 타입
 */
export interface Post {
  id: number;
  original_text: string;
  ai_text: string;
  like_count: number;
  created_at: string;
  author: {
    id: number;
    nickname: string;
    avatar: number;
  };
}

/**
 * 페이지네이션 정보 타입
 */
export interface Pagination {
  page: number;
  pages: number;
  per_page: number;
  total: number;
  has_prev: boolean;
  has_next: boolean;
}

/**
 * 게시물 목록 응답 타입
 */
export interface PostsResponse {
  posts: Post[];
  pagination: Pagination;
}

/**
 * 게시물 목록 가져오기
 * 
 * @param page - 페이지 번호
 * @param limit - 페이지당 항목 수
 * @returns Promise<PostsResponse>
 */
export async function getPosts(page: number = 1, limit: number = 10): Promise<PostsResponse> {
  const response = await apiRequest(`/posts?page=${page}&limit=${limit}`);
  
  if (!response.ok) {
    throw new Error('게시물을 불러올 수 없습니다.');
  }
  
  return response.json();
}

/**
 * 특정 게시물 가져오기
 * 
 * @param postId - 게시물 ID
 * @returns Promise<{ post: Post }>
 */
export async function getPost(postId: number): Promise<{ post: Post }> {
  const response = await apiRequest(`/posts/${postId}`);
  
  if (!response.ok) {
    throw new Error('게시물을 찾을 수 없습니다.');
  }
  
  return response.json();
}

/**
 * 게시물 작성
 * 
 * @param text - 게시물 내용
 * @returns Promise<{ message: string; post: Post }>
 */
export async function createPost(text: string): Promise<{ message: string; post: Post }> {
  const response = await apiRequest('/posts', {
    method: 'POST',
    body: JSON.stringify({ text }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || '게시물 작성에 실패했습니다.');
  }
  
  return response.json();
}

/**
 * 게시물 수정
 * 
 * @param postId - 게시물 ID
 * @param text - 수정할 내용
 * @returns Promise<{ message: string; post: Post }>
 */
export async function updatePost(postId: number, text: string): Promise<{ message: string; post: Post }> {
  const response = await apiRequest(`/posts/${postId}`, {
    method: 'PUT',
    body: JSON.stringify({ text }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || '게시물 수정에 실패했습니다.');
  }
  
  return response.json();
}

/**
 * 게시물 삭제
 * 
 * @param postId - 게시물 ID
 * @returns Promise<{ message: string }>
 */
export async function deletePost(postId: number): Promise<{ message: string }> {
  const response = await apiRequest(`/posts/${postId}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || '게시물 삭제에 실패했습니다.');
  }
  
  return response.json();
}

/**
 * 특정 사용자의 게시물 목록 가져오기
 * 
 * @param userId - 사용자 ID
 * @param page - 페이지 번호
 * @param limit - 페이지당 항목 수
 * @returns Promise<PostsResponse & { user: User }>
 */
export async function getUserPosts(
  userId: number, 
  page: number = 1, 
  limit: number = 10
): Promise<PostsResponse & { user: User }> {
  const response = await apiRequest(`/posts/user/${userId}?page=${page}&limit=${limit}`);
  
  if (!response.ok) {
    throw new Error('사용자 게시물을 불러올 수 없습니다.');
  }
  
  return response.json();
}

/**
 * 댓글 타입
 */
export interface Comment {
  id: number;
  content: string;
  created_at: string;
  is_bot: boolean;
  bot_name?: string;
  author?: {
    id: number;
    nickname: string;
    avatar: number;
  };
  replies?: Comment[];
  delay?: number;
}

/**
 * 댓글 목록 응답 타입
 */
export interface CommentsResponse {
  comments: Comment[];
  total: number;
}

/**
 * 게시물의 댓글 목록 가져오기
 * 
 * @param postId - 게시물 ID
 * @returns Promise<CommentsResponse>
 */
export async function getComments(postId: number): Promise<CommentsResponse> {
  const response = await apiRequest(`/comments/${postId}`);
  
  if (!response.ok) {
    throw new Error('댓글을 불러올 수 없습니다.');
  }
  
  return response.json();
}

/**
 * 댓글 작성
 * 
 * @param postId - 게시물 ID
 * @param content - 댓글 내용
 * @param parentId - 부모 댓글 ID (대댓글인 경우)
 * @returns Promise<{ message: string; comment: Comment }>
 */
export async function createComment(
  postId: number, 
  content: string, 
  parentId?: number
): Promise<{ message: string; comment: Comment }> {
  const response = await apiRequest('/comments', {
    method: 'POST',
    body: JSON.stringify({ 
      post_id: postId, 
      content,
      parent_id: parentId 
    }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || '댓글 작성에 실패했습니다.');
  }
  
  return response.json();
}

/**
 * 댓글 수정
 * 
 * @param commentId - 댓글 ID
 * @param content - 수정할 내용
 * @returns Promise<{ message: string; comment: Comment }>
 */
export async function updateComment(
  commentId: number, 
  content: string
): Promise<{ message: string; comment: Comment }> {
  const response = await apiRequest(`/comments/${commentId}`, {
    method: 'PUT',
    body: JSON.stringify({ content }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || '댓글 수정에 실패했습니다.');
  }
  
  return response.json();
}

/**
 * 댓글 삭제
 * 
 * @param commentId - 댓글 ID
 * @returns Promise<{ message: string }>
 */
export async function deleteComment(commentId: number): Promise<{ message: string }> {
  const response = await apiRequest(`/comments/${commentId}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || '댓글 삭제에 실패했습니다.');
  }
  
  return response.json();
}

/**
 * 좋아요 정보 타입
 */
export interface LikeInfo {
  like_count: number;
  liked: boolean;
}

/**
 * 좋아요 토글 응답 타입
 */
export interface LikeToggleResponse {
  success: boolean;
  liked: boolean;
  like_count: number;
  message: string;
}

/**
 * 게시물 좋아요 토글
 * 
 * @param postId - 게시물 ID
 * @returns Promise<LikeToggleResponse>
 */
export async function toggleLike(postId: number): Promise<LikeToggleResponse> {
  const response = await apiRequest(`/posts/${postId}/like`, {
    method: 'POST',
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || '좋아요 처리에 실패했습니다.');
  }
  
  return response.json();
}

/**
 * 게시물 좋아요 정보 조회
 * 
 * @param postId - 게시물 ID
 * @returns Promise<LikeInfo>
 */
export async function getLikeInfo(postId: number): Promise<LikeInfo> {
  const response = await apiRequest(`/posts/${postId}/likes`);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || '좋아요 정보를 가져올 수 없습니다.');
  }
  
  const data = await response.json();
  return {
    like_count: data.like_count,
    liked: data.liked
  };
}