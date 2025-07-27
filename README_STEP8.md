# Shamstagram 교육 프로젝트 - STEP 8: 게시물 프론트엔드 UI

## 단계 개요
React에서 게시물 목록 표시, 게시물 작성, PostCard 컴포넌트 등 게시물 관련 프론트엔드 UI를 구현합니다. 페이지네이션과 실시간 상태 업데이트를 포함합니다.

## 주요 구현 사항

### 1. MainFeed 페이지 (MainFeed.tsx)
```typescript
// src/pages/MainFeed.tsx
export default function MainFeed() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  
  // 게시물 목록 불러오기
  const loadPosts = async (pageNum: number = 1, append: boolean = false) => {
    const response = await getPosts(pageNum, 10);
    
    if (append) {
      // 페이지네이션: 기존 게시물에 추가
      setPosts(prev => [...prev, ...response.posts]);
    } else {
      // 새로고침: 게시물 목록 교체
      setPosts(response.posts);
    }
    
    setHasMore(response.pagination.has_next);
  };
  
  // 새 게시물 생성 시 목록 업데이트
  const handlePostCreated = (newPost: Post) => {
    setPosts(prev => [newPost, ...prev]);
  };
}
```

### 2. PostCard 컴포넌트 (PostCard.tsx)
```typescript
// src/components/posts/PostCard.tsx
export default function PostCard({ post, onLike, onEdit, onDelete }: PostCardProps) {
  const { user } = useAuth();
  const [isLiked, setIsLiked] = useState(post.is_liked);
  const [likeCount, setLikeCount] = useState(post.likes);
  
  // 작성자 여부 확인
  const isAuthor = user?.id === post.author.id;
  
  return (
    <Card className="w-full max-w-2xl mx-auto mb-4">
      <CardHeader>
        {/* 작성자 정보 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar>
              <AvatarImage
                src="/avatars.jpg"
                style={{ objectPosition: `${(post.author.avatar - 1) * 25}% 0` }}
              />
            </Avatar>
            <div>
              <p className="font-semibold">{post.author.nickname}</p>
              <p className="text-xs text-gray-500">{formatRelativeTime(post.created_at)}</p>
            </div>
          </div>
          
          {/* 더보기 메뉴 (작성자만) */}
          {isAuthor && (
            <DropdownMenu>
              <DropdownMenuTrigger>
                <MoreVertical className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={onEdit}>수정하기</DropdownMenuItem>
                <DropdownMenuItem onClick={onDelete}>삭제하기</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        {/* 원본 텍스트 */}
        <div className="mb-3 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">원본:</p>
          <p className="text-sm">{post.original_text}</p>
        </div>
        
        {/* AI 변환 텍스트 */}
        <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-4 w-4 text-purple-600" />
            <p className="text-sm font-semibold text-purple-700">AI 과장 버전</p>
          </div>
          <p className="text-base font-medium">{post.ai_text}</p>
        </div>
      </CardContent>
      
      <CardFooter>
        {/* 액션 버튼들 */}
        <div className="flex items-center space-x-1">
          <Button variant="ghost" onClick={handleLike}>
            <Heart className={isLiked ? 'fill-current text-red-600' : ''} />
            <span>{formatNumber(likeCount)}</span>
          </Button>
          <Button variant="ghost">
            <MessageCircle className="h-5 w-5" />
            <span>댓글</span>
          </Button>
          <Button variant="ghost">
            <Share2 className="h-5 w-5" />
            <span>공유</span>
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
```

### 3. CreatePost 컴포넌트 (CreatePost.tsx)
```typescript
// src/components/posts/CreatePost.tsx
export default function CreatePost({ onPostCreated }: CreatePostProps) {
  const { user } = useAuth();
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 입력 검증
    if (!text.trim()) {
      setError('게시물 내용을 입력해주세요.');
      return;
    }
    
    if (text.length > 500) {
      setError('게시물은 500자 이내로 작성해주세요.');
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await createPost(text);
      setText(''); // 입력 필드 초기화
      onPostCreated?.(response.post);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Card>
      <form onSubmit={handleSubmit}>
        <CardHeader>
          {/* 사용자 아바타와 정보 */}
          <div className="flex items-center space-x-3">
            <Avatar>
              <AvatarImage
                src="/avatars.jpg"
                style={{ objectPosition: `${(user.avatar - 1) * 25}% 0` }}
              />
            </Avatar>
            <div>
              <p className="font-semibold">{user.nickname}</p>
              <p className="text-xs text-gray-500">무엇을 과장해볼까요?</p>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* 텍스트 입력 영역 */}
          <Textarea
            placeholder="평범한 일상을 입력하면 AI가 화려하게 과장해드립니다!"
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={loading}
            maxLength={500}
          />
          
          {/* 글자 수 표시 */}
          <div className="mt-2 text-right">
            <span className={text.length > 450 ? 'text-red-600' : 'text-gray-500'}>
              {text.length} / 500
            </span>
          </div>
          
          {/* AI 안내 메시지 */}
          <div className="mt-3 p-3 bg-purple-50 rounded-lg">
            <Sparkles className="h-4 w-4 text-purple-600" />
            <p className="text-xs text-purple-700">
              AI가 당신의 평범한 일상을 놀라운 성과로 변환해드립니다!
            </p>
          </div>
        </CardContent>
        
        <CardFooter>
          <Button type="submit" disabled={loading || !text.trim()}>
            {loading ? '과장 중...' : '과장하기'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
```

### 4. API 서비스 확장 (api.ts)
```typescript
// src/services/api.ts
export interface Post {
  id: number;
  original_text: string;
  ai_text: string;
  likes: number;
  created_at: string;
  is_liked: boolean;
  author: {
    id: number;
    nickname: string;
    avatar: number;
  };
}

export interface Pagination {
  page: number;
  pages: number;
  per_page: number;
  total: number;
  has_prev: boolean;
  has_next: boolean;
}

export interface PostsResponse {
  posts: Post[];
  pagination: Pagination;
}

// 게시물 목록 가져오기
export async function getPosts(page: number = 1, limit: number = 10): Promise<PostsResponse> {
  const response = await apiRequest(`/posts?page=${page}&limit=${limit}`);
  return response.json();
}

// 게시물 작성
export async function createPost(text: string): Promise<{ message: string; post: Post }> {
  const response = await apiRequest('/posts', {
    method: 'POST',
    body: JSON.stringify({ text }),
  });
  return response.json();
}

// 게시물 수정
export async function updatePost(postId: number, text: string): Promise<{ message: string; post: Post }> {
  const response = await apiRequest(`/posts/${postId}`, {
    method: 'PUT',
    body: JSON.stringify({ text }),
  });
  return response.json();
}

// 게시물 삭제
export async function deletePost(postId: number): Promise<{ message: string }> {
  const response = await apiRequest(`/posts/${postId}`, {
    method: 'DELETE',
  });
  return response.json();
}
```

### 5. 유틸리티 함수 (format.ts)
```typescript
// src/utils/format.ts
export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  }
  return num.toString();
}

export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return '방금 전';
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes}분 전`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}시간 전`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays}일 전`;
  }
  
  return date.toLocaleDateString('ko-KR');
}
```

### 6. Textarea UI 컴포넌트
```typescript
// src/components/ui/textarea.tsx
import * as React from "react"
import { cn } from "../../lib/utils"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }
```

## 주요 기능

### 1. 게시물 목록 표시
- **무한 스크롤**: "더 보기" 버튼으로 추가 게시물 로드
- **페이지네이션**: 페이지 단위로 게시물 로드
- **실시간 업데이트**: 새 게시물 작성 시 목록 상단에 추가
- **로딩 상태**: 로딩 스피너와 상태 표시

### 2. 게시물 카드 UI
- **이중 텍스트 표시**: 원본 텍스트와 AI 변환 텍스트 구분 표시
- **작성자 정보**: 아바타, 닉네임, 작성 시간 표시
- **인터랙션 버튼**: 좋아요, 댓글, 공유 버튼
- **권한 기반 메뉴**: 작성자만 수정/삭제 메뉴 표시

### 3. 게시물 작성
- **실시간 입력**: 500자 제한과 실시간 글자 수 표시
- **입력 검증**: 빈 값과 길이 제한 검증
- **로딩 상태**: 작성 중 버튼 비활성화
- **AI 테마**: 과장 테마에 맞는 UI 디자인

### 4. 상태 관리
- **로컬 상태**: 좋아요 상태 즉시 업데이트
- **낙관적 업데이트**: API 응답 전 UI 먼저 업데이트
- **에러 처리**: 네트워크 오류 시 적절한 에러 메시지

### 5. 사용자 경험
- **반응형 디자인**: 모바일/데스크톱 대응
- **시각적 피드백**: 호버, 포커스 효과
- **직관적 인터페이스**: 명확한 버튼과 아이콘

## UI/UX 디자인

### 1. 색상 테마
- **AI 변환 영역**: 보라색 그라디언트 배경
- **원본 텍스트**: 회색 배경으로 구분
- **액션 버튼**: 좋아요 빨간색, 기타 회색
- **브랜드 컬러**: 보라색과 핑크색 그라디언트

### 2. 타이포그래피
- **제목**: 2xl, bold 폰트
- **본문**: base 크기, medium 두께
- **메타 정보**: xs 크기, 회색 텍스트
- **버튼 라벨**: sm 크기, medium 두께

### 3. 레이아웃
- **카드 디자인**: 둥근 모서리, 그림자 효과
- **최대 너비**: 2xl (672px) 컨테이너
- **간격**: 일관된 4의 배수 간격
- **반응형**: 모바일에서 좌우 여백 조정

### 4. 인터랙션
- **호버 효과**: 카드 그림자 증가
- **클릭 피드백**: 버튼 색상 변화
- **로딩 스피너**: 회전 애니메이션
- **트랜지션**: 부드러운 상태 변화

## 데이터 플로우

### 1. 게시물 로드
```
MainFeed → getPosts() → API → setPosts() → PostCard 렌더링
```

### 2. 게시물 작성
```
CreatePost → createPost() → API → onPostCreated() → MainFeed 상태 업데이트
```

### 3. 좋아요 토글
```
PostCard → handleLike() → 로컬 상태 업데이트 → (추후 API 연동)
```

### 4. 페이지네이션
```
"더 보기" 클릭 → loadPosts(page+1, true) → 기존 목록에 추가
```

## 에러 처리

### 1. 네트워크 에러
- API 요청 실패 시 에러 메시지 표시
- 재시도 버튼 제공 (새로고침)
- 로딩 상태 적절히 해제

### 2. 입력 검증 에러
- 빈 값 입력 시 에러 메시지
- 글자 수 초과 시 빨간색 표시
- 실시간 검증과 제출 시 검증

### 3. 권한 에러
- 작성자가 아닌 경우 수정/삭제 메뉴 숨김
- API에서 403 에러 시 적절한 메시지

## 성능 최적화

### 1. 컴포넌트 최적화
- React.memo로 불필요한 리렌더링 방지
- useCallback으로 핸들러 함수 최적화
- 적절한 key prop으로 리스트 렌더링 최적화

### 2. 이미지 최적화
- 아바타 스프라이트 이미지 재사용
- CSS background-position으로 효율적 표시

### 3. 상태 관리
- 로컬 상태와 서버 상태 분리
- 낙관적 업데이트로 응답성 향상

## 테스트 방법

### 1. 개발 서버 실행
```bash
# 백엔드 실행
cd backend
python run.py

# 프론트엔드 실행
cd frontend
npm run dev
```

### 2. 기능 테스트
1. 로그인 후 `/feed` 페이지 접근
2. 게시물 작성 폼에 텍스트 입력 후 "과장하기" 클릭
3. 게시물 목록에서 새 게시물 확인
4. 좋아요 버튼 클릭하여 카운트 변화 확인
5. "더 보기" 버튼으로 추가 게시물 로드
6. 작성자인 게시물에서 더보기 메뉴 확인

### 3. 반응형 테스트
- 브라우저 크기 조정하여 모바일 뷰 확인
- 터치 인터랙션 테스트 (모바일 디바이스)

## 학습 포인트

1. **컴포넌트 구조**: 재사용 가능한 컴포넌트 설계
2. **상태 관리**: 로컬 상태와 서버 상태의 동기화
3. **이벤트 처리**: 폼 제출, 버튼 클릭 등 사용자 인터랙션
4. **조건부 렌더링**: 로딩, 에러, 권한에 따른 UI 변화
5. **타입 안전성**: TypeScript 인터페이스로 API 응답 타입 정의
6. **사용자 경험**: 로딩 상태, 에러 처리, 피드백
7. **CSS-in-JS**: Tailwind CSS를 활용한 스타일링

## 다음 단계 (STEP 9)
- AI 텍스트 변환 시스템 구현
- OpenAI API 연동
- 템플릿 기반 폴백 시스템
- 실시간 AI 변환 적용