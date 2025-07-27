/**
 * Protected Route 컴포넌트
 * 
 * 인증이 필요한 라우트를 보호하는 컴포넌트
 */

import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const location = useLocation();
  
  // 로딩 중일 때 로딩 스피너 표시
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  // 로그인하지 않은 경우 로그인 페이지로 리다이렉트
  if (!user) {
    // 현재 위치를 state로 전달하여 로그인 후 돌아올 수 있도록 함
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  // 로그인한 경우 자식 컴포넌트 렌더링
  return <>{children}</>;
}