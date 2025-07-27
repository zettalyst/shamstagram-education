# Shamstagram 교육 프로젝트 - STEP 6: React 인증 프론트엔드

## 단계 개요
React에서 JWT 토큰 기반 인증 시스템을 구현합니다. AuthContext를 통한 전역 상태 관리, Protected Routes, 로그인/회원가입 UI를 구현합니다.

## 주요 구현 사항

### 1. API 서비스 (api.ts)
```typescript
// src/services/api.ts
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

class ApiService {
  private static getAuthHeaders() {
    const token = localStorage.getItem('shamstagram-token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }
  
  private static async request<T>(url: string, options: RequestInit): Promise<T> {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
        ...options.headers,
      },
      ...options,
    });
    
    // 401 에러시 자동 로그아웃
    if (response.status === 401) {
      this.clearAuth();
      window.location.href = '/login';
    }
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || '요청 처리 중 오류가 발생했습니다');
    }
    
    return response.json();
  }
}
```

### 2. 인증 컨텍스트 (AuthContext.tsx)
```typescript
// src/contexts/AuthContext.tsx
interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (credentials: LoginRequest) => Promise<void>;
  register: (userData: RegisterRequest) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 컴포넌트 마운트 시 토큰 검증 및 사용자 정보 로드
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
          const currentUser = await getCurrentUser();
          setUser(currentUser);
          localStorage.setItem('shamstagram-user', JSON.stringify(currentUser));
        } else {
          apiLogout();
          setUser(null);
        }
      } catch (err) {
        apiLogout();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    
    initAuth();
  }, []);
}
```

### 3. Protected Route 컴포넌트
```typescript
// src/components/auth/ProtectedRoute.tsx
export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const location = useLocation();
  
  // 로딩 중일 때 스피너 표시
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  // 로그인하지 않은 경우 로그인 페이지로 리다이렉트
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  return <>{children}</>;
}
```

### 4. 로그인 페이지 (Login.tsx)
```typescript
// src/pages/Login.tsx
export default function Login() {
  const { login, error, clearError, loading: authLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await login({ email, password });
      navigate(from, { replace: true });
    } catch (err) {
      // 에러는 AuthContext에서 처리
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Shamstagram 로그인</CardTitle>
        <CardDescription>과장의 세계로 돌아오신 것을 환영합니다! 🎭</CardDescription>
      </CardHeader>
      
      <form onSubmit={handleSubmit}>
        <CardContent>
          {/* 이메일, 비밀번호 입력 폼 */}
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={loading}>
            {loading ? '로그인 중...' : '로그인'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
```

### 5. 회원가입 페이지 (Register.tsx)
```typescript
// src/pages/Register.tsx
export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [nickname, setNickname] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(1);
  
  // 폼 유효성 검증
  const validateForm = (): boolean => {
    if (password.length < 6) {
      setValidationError('비밀번호는 최소 6자 이상이어야 합니다.');
      return false;
    }
    
    if (password !== passwordConfirm) {
      setValidationError('비밀번호가 일치하지 않습니다.');
      return false;
    }
    
    return true;
  };
  
  // 아바타 선택 UI
  const avatarOptions = [1, 2, 3, 4, 5];
  
  return (
    <Card>
      {/* 아바타 선택 */}
      <div className="flex justify-center gap-2">
        {avatarOptions.map((avatarId) => (
          <button
            key={avatarId}
            onClick={() => setSelectedAvatar(avatarId)}
            className={selectedAvatar === avatarId ? 'ring-2 ring-primary' : ''}
          >
            <Avatar>
              <AvatarImage
                src="/avatars.jpg"
                style={{ objectPosition: `${(avatarId - 1) * 25}% 0` }}
              />
            </Avatar>
          </button>
        ))}
      </div>
    </Card>
  );
}
```

### 6. 네비게이션 업데이트
```typescript
// src/App.tsx
function Navigation() {
  const { user, logout } = useAuth();
  
  return (
    <header className="bg-white shadow-sm">
      <nav className="flex items-center space-x-4">
        {user ? (
          <>
            <Link to="/feed">피드</Link>
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4" />
              <span>{user.nickname}</span>
            </div>
            <Button variant="ghost" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
              로그아웃
            </Button>
          </>
        ) : (
          <>
            <Link to="/login">로그인</Link>
            <Link to="/register">
              <Button>회원가입</Button>
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}
```

## 기능 상세

### 1. 토큰 관리
- **localStorage 저장**: `shamstagram-token` 키로 JWT 토큰 저장
- **자동 헤더 추가**: API 요청 시 Authorization 헤더 자동 포함
- **토큰 만료 처리**: 401 응답 시 자동 로그아웃 및 리다이렉트

### 2. 사용자 정보 캐싱
- **localStorage 캐싱**: `shamstagram-user` 키로 사용자 정보 캐시
- **초기 로딩 최적화**: 캐시된 정보 먼저 표시 후 서버에서 최신 정보 확인
- **토큰 검증**: 앱 시작 시 토큰 유효성 검증

### 3. 라우트 보호
- **ProtectedRoute**: 인증이 필요한 페이지 보호
- **리다이렉트**: 로그인 전 방문 페이지로 로그인 후 자동 리다이렉트
- **로딩 상태**: 인증 확인 중 로딩 스피너 표시

### 4. 폼 검증
- **실시간 검증**: 입력 시 즉시 유효성 검증
- **에러 표시**: 명확한 에러 메시지 표시
- **중복 제출 방지**: 로딩 중 버튼 비활성화

### 5. 아바타 시스템
- **스프라이트 이미지**: 5개 아바타를 포함한 단일 이미지 파일
- **CSS 포지셔닝**: `object-position`을 사용한 아바타 선택
- **선택 UI**: 시각적 피드백이 있는 아바타 선택 인터페이스

## API 엔드포인트 연동

### 1. 로그인
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

### 2. 회원가입
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "nickname": "사용자닉네임"
}
```

### 3. 사용자 정보 조회
```http
GET /api/auth/me
Authorization: Bearer {token}
```

### 4. 토큰 검증
```http
GET /api/auth/verify
Authorization: Bearer {token}
```

## 환경 변수 설정

```bash
# frontend/.env
VITE_API_URL=http://localhost:5000/api
```

## 라우트 구조

```typescript
<Routes>
  {/* 공개 라우트 */}
  <Route path="/" element={<Home />} />
  <Route path="/about" element={<About />} />
  <Route path="/login" element={<Login />} />
  <Route path="/register" element={<Register />} />
  
  {/* 보호된 라우트 */}
  <Route
    path="/feed"
    element={
      <ProtectedRoute>
        <TempFeed />
      </ProtectedRoute>
    }
  />
</Routes>
```

## 에러 처리

### 1. API 에러
- **401 Unauthorized**: 자동 로그아웃 및 로그인 페이지로 리다이렉트
- **400 Bad Request**: 사용자에게 구체적인 에러 메시지 표시
- **500 Server Error**: 일반적인 에러 메시지 표시

### 2. 네트워크 에러
- **연결 실패**: 네트워크 에러 메시지 표시
- **타임아웃**: 재시도 버튼 제공

### 3. 폼 검증 에러
- **실시간 검증**: 입력 중 즉시 에러 표시
- **제출 전 검증**: 폼 제출 시 최종 검증

## 테스트 방법

### 1. 개발 서버 실행
```bash
cd frontend
npm run dev
```

### 2. 기능 테스트
1. 회원가입: `/register`에서 새 계정 생성
2. 로그인: `/login`에서 생성한 계정으로 로그인
3. 보호된 라우트: `/feed` 접근 시 인증 확인
4. 로그아웃: 네비게이션에서 로그아웃 버튼 클릭
5. 토큰 만료: 로컬스토리지에서 토큰 삭제 후 보호된 페이지 접근

## 학습 포인트

1. **React Context**: 전역 상태 관리를 위한 Context API 사용
2. **Custom Hook**: useAuth 훅을 통한 인증 로직 캡슐화
3. **Protected Routes**: 조건부 라우팅과 리다이렉트
4. **로컬스토리지**: 클라이언트 사이드 데이터 저장
5. **TypeScript**: 타입 안전성을 위한 인터페이스 정의
6. **에러 경계**: 에러 처리와 사용자 피드백
7. **폼 처리**: 제어된 컴포넌트와 유효성 검증

## 다음 단계 (STEP 7)
- 게시물 CRUD API 구현
- 게시물 목록 조회 및 페이지네이션
- 게시물 생성, 수정, 삭제 기능
- 데이터베이스 관계 설정