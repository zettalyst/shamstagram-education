import { Navigate } from 'react-router-dom'

interface ProtectedRouteProps {
  isAuthenticated: boolean
  children: React.ReactNode
}

/**
 * 인증이 필요한 라우트를 보호하는 컴포넌트
 * 
 * 인증되지 않은 사용자는 로그인 페이지로 리다이렉트됩니다.
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ isAuthenticated, children }) => {
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

export default ProtectedRoute