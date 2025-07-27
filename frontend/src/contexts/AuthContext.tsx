/**
 * 인증 컨텍스트
 * 
 * 전역적인 인증 상태 관리를 위한 React Context
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, LoginRequest, RegisterRequest, login as apiLogin, register as apiRegister, getCurrentUser, logout as apiLogout, verifyToken } from '../services/api';

/**
 * 인증 컨텍스트 타입
 */
interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (credentials: LoginRequest) => Promise<void>;
  register: (userData: RegisterRequest) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

/**
 * 인증 컨텍스트 생성
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * AuthProvider 컴포넌트 Props
 */
interface AuthProviderProps {
  children: ReactNode;
}

/**
 * 인증 상태를 제공하는 Provider 컴포넌트
 * 
 * @param props - AuthProviderProps
 * @returns JSX.Element
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  /**
   * 컴포넌트 마운트 시 토큰 검증 및 사용자 정보 로드
   */
  useEffect(() => {
    const initAuth = async () => {
      try {
        // localStorage에서 캐시된 사용자 정보 먼저 확인
        const cachedUser = localStorage.getItem('shamstagram-user');
        if (cachedUser) {
          setUser(JSON.parse(cachedUser));
        }
        
        // 토큰 유효성 검증
        const isValid = await verifyToken();
        if (isValid) {
          // 토큰이 유효하면 최신 사용자 정보 가져오기
          const currentUser = await getCurrentUser();
          setUser(currentUser);
          // localStorage에 캐시
          localStorage.setItem('shamstagram-user', JSON.stringify(currentUser));
        } else {
          // 토큰이 유효하지 않으면 로그아웃 처리
          apiLogout();
          setUser(null);
        }
      } catch (err) {
        // 에러 발생 시 로그아웃 처리
        apiLogout();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    
    initAuth();
  }, []);
  
  /**
   * 로그인 함수
   * 
   * @param credentials - 로그인 정보
   */
  const login = async (credentials: LoginRequest) => {
    try {
      setError(null);
      setLoading(true);
      
      const response = await apiLogin(credentials);
      setUser(response.user);
      
      // localStorage에 사용자 정보 캐시
      localStorage.setItem('shamstagram-user', JSON.stringify(response.user));
    } catch (err) {
      setError(err instanceof Error ? err.message : '로그인 중 오류가 발생했습니다.');
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * 회원가입 함수
   * 
   * @param userData - 회원가입 정보
   */
  const register = async (userData: RegisterRequest) => {
    try {
      setError(null);
      setLoading(true);
      
      const response = await apiRegister(userData);
      setUser(response.user);
      
      // localStorage에 사용자 정보 캐시
      localStorage.setItem('shamstagram-user', JSON.stringify(response.user));
    } catch (err) {
      setError(err instanceof Error ? err.message : '회원가입 중 오류가 발생했습니다.');
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * 로그아웃 함수
   */
  const logout = () => {
    apiLogout();
    setUser(null);
    setError(null);
  };
  
  /**
   * 에러 메시지 초기화
   */
  const clearError = () => {
    setError(null);
  };
  
  const value: AuthContextType = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    clearError,
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * 인증 컨텍스트 사용을 위한 커스텀 훅
 * 
 * @returns AuthContextType
 * @throws Error - AuthProvider 외부에서 사용 시
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}