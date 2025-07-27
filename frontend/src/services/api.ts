/**
 * API 서비스
 * 
 * 백엔드 API와의 통신을 담당합니다.
 */

import { authService } from './auth'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

interface Post {
  id: number
  user: {
    id: number
    nickname: string
    avatar: number
  }
  original_text: string
  ai_text: string
  likes: number
  created_at: string
  updated_at: string
  is_liked?: boolean
  is_owner?: boolean
  bot_comments?: Comment[]
  user_comment_count?: number
  comments?: Comment[]
}

interface Comment {
  id: number
  post_id: number
  user?: {
    id: number
    nickname: string
    avatar: number
  }
  parent_id: number | null
  original_text?: string
  content: string
  is_bot: boolean
  bot_name?: string
  delay?: number
  created_at: string
  replies?: Comment[]
}

interface CreatePostData {
  original_text: string
}

interface CreateCommentData {
  original_text: string
  parent_id?: number
}

interface Invitation {
  id: number
  email: string
  token: string
  is_used: boolean
  created_at: string
  used_at?: string
}

interface Stats {
  total_users: number
  total_posts: number
  total_comments: number
  top_users: Array<{
    nickname: string
    avatar: number
    post_count: number
  }>
}

class ApiService {
  /**
   * API 요청 헬퍼
   */
  private async request(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<Response> {
    const headers = {
      'Content-Type': 'application/json',
      ...authService.getAuthHeaders(),
      ...options.headers,
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    })

    if (response.status === 401) {
      authService.logout()
      throw new Error('인증이 만료되었습니다.')
    }

    return response
  }

  /**
   * 게시물 목록 가져오기
   */
  async getPosts(): Promise<Post[]> {
    const response = await this.request('/posts')
    
    if (!response.ok) {
      throw new Error('게시물을 불러올 수 없습니다.')
    }

    return response.json()
  }

  /**
   * 특정 게시물 가져오기
   */
  async getPost(postId: number): Promise<Post> {
    const response = await this.request(`/posts/${postId}`)
    
    if (!response.ok) {
      throw new Error('게시물을 찾을 수 없습니다.')
    }

    return response.json()
  }

  /**
   * 게시물 생성
   */
  async createPost(data: CreatePostData): Promise<Post> {
    const response = await this.request('/posts', {
      method: 'POST',
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || '게시물 생성에 실패했습니다.')
    }

    return response.json()
  }

  /**
   * 게시물 삭제
   */
  async deletePost(postId: number): Promise<void> {
    const response = await this.request(`/posts/${postId}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || '게시물 삭제에 실패했습니다.')
    }
  }

  /**
   * 좋아요 토글
   */
  async toggleLike(postId: number): Promise<{ is_liked: boolean; like_count: number }> {
    const response = await this.request(`/posts/${postId}/like`, {
      method: 'POST',
    })

    if (!response.ok) {
      throw new Error('좋아요 처리에 실패했습니다.')
    }

    return response.json()
  }

  /**
   * 댓글 생성
   */
  async createComment(postId: number, data: CreateCommentData): Promise<Comment> {
    const response = await this.request(`/posts/${postId}/comments`, {
      method: 'POST',
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || '댓글 작성에 실패했습니다.')
    }

    return response.json()
  }

  /**
   * 사용자 게시물 가져오기
   */
  async getMyPosts(): Promise<Post[]> {
    const response = await this.request('/users/me/posts')
    
    if (!response.ok) {
      throw new Error('게시물을 불러올 수 없습니다.')
    }

    return response.json()
  }

  /**
   * 프로필 업데이트
   */
  async updateProfile(data: { nickname?: string; avatar?: number }): Promise<void> {
    const response = await this.request('/users/me', {
      method: 'PUT',
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || '프로필 업데이트에 실패했습니다.')
    }

    // 사용자 정보 새로고침
    await authService.getCurrentUser()
  }

  /**
   * 초대 목록 가져오기
   */
  async getInvitations(): Promise<Invitation[]> {
    const response = await this.request('/invitations')
    
    if (!response.ok) {
      throw new Error('초대 목록을 불러올 수 없습니다.')
    }

    return response.json()
  }

  /**
   * 초대 생성
   */
  async createInvitation(email: string): Promise<{ invitation: Invitation; invitation_url: string }> {
    const response = await this.request('/invitations', {
      method: 'POST',
      body: JSON.stringify({ email }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || '초대 생성에 실패했습니다.')
    }

    return response.json()
  }

  /**
   * 통계 가져오기
   */
  async getStats(): Promise<Stats> {
    const response = await this.request('/users/stats')
    
    if (!response.ok) {
      throw new Error('통계를 불러올 수 없습니다.')
    }

    return response.json()
  }
}

export const apiService = new ApiService()
export type { Post, Comment, CreatePostData, CreateCommentData, Invitation, Stats }