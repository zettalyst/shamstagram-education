/**
 * 인증 관련 서비스
 * 
 * JWT 토큰 관리와 인증 API 호출을 담당합니다.
 */

interface LoginData {
  email: string
  password: string
}

interface RegisterData {
  email: string
  nickname: string
  password: string
  avatar: number
}

interface User {
  id: number
  email: string
  nickname: string
  avatar: number
  created_at: string
}

interface AuthResponse {
  token: string
  user: User
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

class AuthService {
  private tokenKey = 'shamstagram-token'
  private userKey = 'shamstagram-user'

  /**
   * 토큰 저장
   */
  setToken(token: string): void {
    localStorage.setItem(this.tokenKey, token)
  }

  /**
   * 토큰 가져오기
   */
  getToken(): string | null {
    return localStorage.getItem(this.tokenKey)
  }

  /**
   * 토큰 삭제
   */
  removeToken(): void {
    localStorage.removeItem(this.tokenKey)
  }

  /**
   * 사용자 정보 저장
   */
  setUser(user: User): void {
    localStorage.setItem(this.userKey, JSON.stringify(user))
  }

  /**
   * 사용자 정보 가져오기
   */
  getUser(): User | null {
    const userStr = localStorage.getItem(this.userKey)
    if (!userStr) return null
    
    try {
      return JSON.parse(userStr)
    } catch {
      return null
    }
  }

  /**
   * 사용자 정보 삭제
   */
  removeUser(): void {
    localStorage.removeItem(this.userKey)
  }

  /**
   * 초대 토큰 확인
   */
  async verifyInvitation(token: string): Promise<{ valid: boolean }> {
    const response = await fetch(`${API_URL}/auth/verify-invitation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || '초대 토큰 확인 실패')
    }

    return response.json()
  }

  /**
   * 회원가입
   */
  async register(data: RegisterData & { invitation_token: string }): Promise<AuthResponse> {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || '회원가입 실패')
    }

    const result = await response.json() as AuthResponse
    this.setToken(result.token)
    this.setUser(result.user)
    
    return result
  }

  /**
   * 로그인
   */
  async login(data: LoginData): Promise<AuthResponse> {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || '로그인 실패')
    }

    const result = await response.json() as AuthResponse
    this.setToken(result.token)
    this.setUser(result.user)
    
    return result
  }

  /**
   * 로그아웃
   */
  logout(): void {
    this.removeToken()
    this.removeUser()
    window.location.href = '/'
  }

  /**
   * 현재 사용자 정보 가져오기
   */
  async getCurrentUser(): Promise<User | null> {
    const token = this.getToken()
    if (!token) return null

    try {
      const response = await fetch(`${API_URL}/users/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        if (response.status === 401) {
          this.logout()
        }
        return null
      }

      const user = await response.json()
      this.setUser(user)
      return user
    } catch {
      return null
    }
  }

  /**
   * 인증 헤더 가져오기
   */
  getAuthHeaders(): Record<string, string> {
    const token = this.getToken()
    if (!token) return {}

    return {
      'Authorization': `Bearer ${token}`,
    }
  }
}

export const authService = new AuthService()
export type { User, LoginData, RegisterData, AuthResponse }