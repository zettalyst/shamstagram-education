/**
 * 회원가입 페이지
 * 
 * 새로운 사용자 등록 화면
 */

import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Avatar, AvatarImage } from '../components/ui/avatar';
import { Loader2 } from 'lucide-react';

export default function Register() {
  const navigate = useNavigate();
  const location = useLocation();
  const { register, error, clearError, loading: authLoading } = useAuth();
  
  // 폼 상태
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [nickname, setNickname] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(1);
  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  
  // 리다이렉트 경로
  const from = location.state?.from?.pathname || '/feed';
  
  // 에러 메시지 클리어
  useEffect(() => {
    clearError();
    setValidationError(null);
  }, [clearError]);
  
  /**
   * 아바타 옵션 (1-5)
   */
  const avatarOptions = [1, 2, 3, 4, 5];
  
  /**
   * 폼 유효성 검증
   */
  const validateForm = (): boolean => {
    if (!email || !password || !nickname) {
      setValidationError('모든 필드를 입력해주세요.');
      return false;
    }
    
    if (password.length < 6) {
      setValidationError('비밀번호는 최소 6자 이상이어야 합니다.');
      return false;
    }
    
    if (password !== passwordConfirm) {
      setValidationError('비밀번호가 일치하지 않습니다.');
      return false;
    }
    
    if (nickname.length < 2 || nickname.length > 20) {
      setValidationError('닉네임은 2-20자 사이여야 합니다.');
      return false;
    }
    
    setValidationError(null);
    return true;
  };
  
  /**
   * 폼 제출 핸들러
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      await register({
        email,
        password,
        nickname,
      });
      // 회원가입 성공 시 피드로 리다이렉트
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
            Shamstagram 가입하기
          </CardTitle>
          <CardDescription className="text-center">
            과장의 세계에 오신 것을 환영합니다! 🚀
          </CardDescription>
        </CardHeader>
        
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {/* 에러 메시지 */}
            {(error || validationError) && (
              <Alert variant="destructive">
                <AlertDescription>{error || validationError}</AlertDescription>
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
            
            {/* 닉네임 입력 */}
            <div className="space-y-2">
              <Label htmlFor="nickname">닉네임</Label>
              <Input
                id="nickname"
                type="text"
                placeholder="멋진 닉네임"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                required
                disabled={loading || authLoading}
                className="w-full"
                minLength={2}
                maxLength={20}
              />
              <p className="text-xs text-gray-500">2-20자 사이로 입력해주세요</p>
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
                minLength={6}
              />
              <p className="text-xs text-gray-500">최소 6자 이상</p>
            </div>
            
            {/* 비밀번호 확인 */}
            <div className="space-y-2">
              <Label htmlFor="passwordConfirm">비밀번호 확인</Label>
              <Input
                id="passwordConfirm"
                type="password"
                placeholder="••••••••"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                required
                disabled={loading || authLoading}
                className="w-full"
              />
            </div>
            
            {/* 아바타 선택 */}
            <div className="space-y-2">
              <Label>프로필 아바타 선택</Label>
              <div className="flex justify-center gap-2">
                {avatarOptions.map((avatarId) => (
                  <button
                    key={avatarId}
                    type="button"
                    onClick={() => setSelectedAvatar(avatarId)}
                    className={`rounded-full p-1 transition-all ${
                      selectedAvatar === avatarId
                        ? 'ring-2 ring-primary ring-offset-2'
                        : 'hover:ring-2 hover:ring-gray-300'
                    }`}
                    disabled={loading || authLoading}
                  >
                    <Avatar>
                      <AvatarImage
                        src="/avatars.jpg"
                        alt={`Avatar ${avatarId}`}
                        className="object-cover"
                        style={{
                          objectPosition: `${(avatarId - 1) * 25}% 0`,
                        }}
                      />
                    </Avatar>
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
          
          <CardFooter className="flex flex-col space-y-4">
            {/* 회원가입 버튼 */}
            <Button
              type="submit"
              className="w-full"
              disabled={loading || authLoading || !email || !password || !nickname}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  가입 중...
                </>
              ) : (
                '회원가입'
              )}
            </Button>
            
            {/* 로그인 링크 */}
            <p className="text-sm text-center text-gray-600">
              이미 계정이 있으신가요?{' '}
              <Link
                to="/login"
                className="font-medium text-primary hover:underline"
              >
                로그인
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}