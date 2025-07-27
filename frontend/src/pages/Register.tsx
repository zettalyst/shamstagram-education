/**
 * 회원가입 페이지
 * 
 * STEP 14: 초대 시스템 통합
 * - 초대 토큰 검증
 * - 초대된 이메일 자동 입력
 * - 초대 없이는 회원가입 불가
 */

import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Avatar, AvatarImage } from '../components/ui/avatar';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import api from '../services/api';

export default function Register() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { register, error, clearError, loading: authLoading } = useAuth();
  
  // 폼 상태
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [nickname, setNickname] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(1);
  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  
  // 초대 토큰 검증 상태
  const [invitationToken, setInvitationToken] = useState<string | null>(null);
  const [tokenValidation, setTokenValidation] = useState<{
    isValid: boolean | null;
    email?: string;
    message?: string;
    loading: boolean;
  }>({
    isValid: null,
    loading: true
  });
  
  // 리다이렉트 경로
  const from = location.state?.from?.pathname || '/feed';
  
  // 초대 토큰 검증
  useEffect(() => {
    clearError();
    setValidationError(null);
    
    const token = searchParams.get('token');
    
    if (!token) {
      // 토큰이 없으면 초대가 필요하다고 표시
      setTokenValidation({
        isValid: false,
        message: '초대 토큰이 필요합니다. 초대받은 링크를 통해 접속해주세요.',
        loading: false
      });
      return;
    }
    
    // 토큰 검증 API 호출
    const verifyToken = async () => {
      try {
        setTokenValidation(prev => ({ ...prev, loading: true }));
        
        // 특별 데모 토큰 처리
        if (token === 'shamwow') {
          setInvitationToken(token);
          setTokenValidation({
            isValid: true,
            email: '',
            message: '데모 토큰이 확인되었습니다.',
            loading: false
          });
          return;
        }
        
        // 일반 토큰 검증
        const response = await api.post('/auth/verify-invitation', { token });
        
        setInvitationToken(token);
        setEmail(response.data.email); // 초대된 이메일 자동 입력
        setTokenValidation({
          isValid: true,
          email: response.data.email,
          message: response.data.message,
          loading: false
        });
        
      } catch (err: any) {
        console.error('토큰 검증 오류:', err);
        setTokenValidation({
          isValid: false,
          message: err.response?.data?.error || '초대 토큰 검증에 실패했습니다.',
          loading: false
        });
      }
    };
    
    verifyToken();
  }, [searchParams, clearError]);
  
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
    
    // 토큰 유효성 확인
    if (!tokenValidation.isValid || !invitationToken) {
      setValidationError('유효한 초대 토큰이 필요합니다.');
      return;
    }
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      // 초대 토큰과 함께 회원가입 API 호출
      const response = await api.post('/auth/register', {
        token: invitationToken,
        nickname,
        password,
        avatar: selectedAvatar
      });
      
      // AuthContext 통해 로그인 상태 설정
      // 혹은 직접 localStorage에 토큰 저장
      if (response.data.access_token) {
        localStorage.setItem('shamstagram-token', response.data.access_token);
        localStorage.setItem('shamstagram-user', JSON.stringify(response.data.user));
      }
      
      // 회원가입 성공 시 피드로 리다이렉트
      navigate(from, { replace: true });
    } catch (err: any) {
      console.error('회원가입 오류:', err);
      setValidationError(err.response?.data?.error || '회원가입 중 오류가 발생했습니다.');
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
            {tokenValidation.loading ? '초대 토큰 확인 중...' :
             tokenValidation.isValid ? '과장의 세계에 오신 것을 환영합니다! 🚀' :
             '초대가 필요한 프라이빗 SNS입니다 🔒'}
          </CardDescription>
          
          {/* 토큰 검증 상태 표시 */}
          {!tokenValidation.loading && (
            <div className="flex items-center justify-center gap-2 mt-2">
              {tokenValidation.isValid ? (
                <>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-600">초대 확인됨</span>
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 text-red-600" />
                  <span className="text-sm text-red-600">초대 필요</span>
                </>
              )}
            </div>
          )}
        </CardHeader>
        
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {/* 토큰 검증 메시지 */}
            {tokenValidation.message && (
              <Alert variant={tokenValidation.isValid ? "default" : "destructive"}>
                <AlertDescription>{tokenValidation.message}</AlertDescription>
              </Alert>
            )}
            
            {/* 에러 메시지 */}
            {(error || validationError) && (
              <Alert variant="destructive">
                <AlertDescription>{error || validationError}</AlertDescription>
              </Alert>
            )}
            
            {/* 로딩 상태 */}
            {tokenValidation.loading && (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="ml-2">초대 토큰 확인 중...</span>
              </div>
            )}
            
            {/* 토큰이 유효할 때만 폼 표시 */}
            {tokenValidation.isValid && !tokenValidation.loading && (
              <>
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
                    disabled={loading || authLoading || !!tokenValidation.email} // 초대된 이메일은 수정 불가
                    className="w-full"
                  />
                  {tokenValidation.email && (
                    <p className="text-xs text-gray-500">초대받은 이메일 주소입니다</p>
                  )}
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
              </>
            )}
          </CardContent>
          
          <CardFooter className="flex flex-col space-y-4">
            {/* 회원가입 버튼 - 토큰이 유효할 때만 표시 */}
            {tokenValidation.isValid && !tokenValidation.loading && (
              <Button
                type="submit"
                className="w-full"
                disabled={loading || authLoading || !nickname || !password || !passwordConfirm}
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
            )}
            
            {/* 토큰이 없거나 잘못된 경우 안내 메시지 */}
            {!tokenValidation.isValid && !tokenValidation.loading && (
              <div className="text-center space-y-3">
                <p className="text-sm text-gray-600">
                  Shamstagram은 초대 전용 SNS입니다.
                </p>
                <p className="text-xs text-gray-500">
                  기존 회원으로부터 초대받은 링크를 통해 가입해주세요.
                </p>
              </div>
            )}
            
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