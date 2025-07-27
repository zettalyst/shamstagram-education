/**
 * 로그인 페이지
 * 
 * 사용자 로그인 화면
 */

import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Loader2 } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, error, clearError, loading: authLoading } = useAuth();
  
  // 폼 상태
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  // 리다이렉트 경로
  const from = location.state?.from?.pathname || '/';
  
  // 에러 메시지 클리어
  useEffect(() => {
    clearError();
  }, [clearError]);
  
  /**
   * 폼 제출 핸들러
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      return;
    }
    
    setLoading(true);
    
    try {
      await login({ email, password });
      // 로그인 성공 시 리다이렉트
      navigate(from, { replace: true });
    } catch (err) {
      // 에러는 AuthContext에서 처리
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-100 to-blue-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Shamstagram 로그인
          </CardTitle>
          <CardDescription className="text-center">
            과장의 세계로 돌아오신 것을 환영합니다! 🎭
          </CardDescription>
        </CardHeader>
        
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {/* 에러 메시지 */}
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {/* 이메일 입력 */}
            <div className="space-y-2">
              <Label htmlFor="email">이메일</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading || authLoading}
                className="w-full"
              />
            </div>
            
            {/* 비밀번호 입력 */}
            <div className="space-y-2">
              <Label htmlFor="password">비밀번호</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading || authLoading}
                className="w-full"
              />
            </div>
          </CardContent>
          
          <CardFooter className="flex flex-col space-y-4">
            {/* 로그인 버튼 */}
            <Button
              type="submit"
              className="w-full"
              disabled={loading || authLoading || !email || !password}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  로그인 중...
                </>
              ) : (
                '로그인'
              )}
            </Button>
            
            {/* 회원가입 링크 */}
            <p className="text-sm text-center text-gray-600">
              아직 계정이 없으신가요?{' '}
              <Link
                to="/register"
                className="font-medium text-primary hover:underline"
              >
                회원가입
              </Link>
            </p>
            
            {/* 초대 링크 */}
            <p className="text-sm text-center text-gray-500">
              초대 코드가 있으신가요?{' '}
              <Link
                to="/"
                className="font-medium text-primary hover:underline"
              >
                초대 페이지로
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}