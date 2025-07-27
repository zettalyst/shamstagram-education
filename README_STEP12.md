# STEP 12: Comments Frontend - 댓글 UI, 스레드 구조, 애니메이션

STEP 12에서는 댓글 기능의 프론트엔드 UI를 구현합니다. 댓글 목록 표시, 댓글 작성 폼, 스레드 구조, 그리고 봇 댓글 애니메이션을 포함합니다.

## 🎯 학습 목표

1. **댓글 UI 컴포넌트 설계**: 계층적 구조의 댓글 시스템
2. **실시간 UI 업데이트**: 댓글 작성 후 즉시 화면 반영
3. **스레드 표시**: 부모-자식 댓글 관계의 시각적 표현
4. **애니메이션 효과**: 봇 댓글의 지연 표시와 부드러운 등장
5. **사용자 경험**: 직관적인 댓글 인터페이스

## 📁 구현된 파일들

### Frontend Components

#### UI 컴포넌트들
```
frontend/src/components/ui/
├── card.tsx              # 카드 컨테이너 컴포넌트
├── button.tsx            # 버튼 컴포넌트 (다양한 variant)
├── avatar.tsx            # 사용자 아바타 컴포넌트
├── dropdown-menu.tsx     # 드롭다운 메뉴 컴포넌트
└── textarea.tsx          # 텍스트 입력 컴포넌트
```

#### 댓글 관련 컴포넌트들
```
frontend/src/components/comments/
├── CommentSection.tsx    # 댓글 섹션 전체 컨테이너
├── Comment.tsx          # 개별 댓글 표시 컴포넌트
└── CommentForm.tsx      # 댓글 작성/수정 폼
```

### API 서비스 확장

#### 댓글 관련 API 함수들 추가
```typescript
// Comment 타입 정의
export interface Comment {
  id: number;
  content: string;
  created_at: string;
  is_bot: boolean;
  bot_name?: string;
  author?: {
    id: number;
    nickname: string;
    avatar: number;
  };
  replies?: Comment[];
  delay?: number;
}

// API 함수들
- getComments(postId): 게시물의 댓글 목록 가져오기
- createComment(postId, content, parentId?): 댓글 작성
- updateComment(commentId, content): 댓글 수정
- deleteComment(commentId): 댓글 삭제
```

## 🔧 주요 구현 내용

### 1. UI 컴포넌트 시스템

#### Card 컴포넌트
- 재사용 가능한 카드 레이아웃
- Header, Content, Footer 구조
- 일관된 디자인 시스템

#### Button 컴포넌트
- 다양한 variant: default, ghost, outline, destructive
- 크기 옵션: sm, default, lg, icon
- 접근성 고려 (focus-visible, ring)

#### Avatar 컴포넌트
- 사용자 프로필 이미지 표시
- Fallback 텍스트 지원
- 원형 디자인

#### Dropdown Menu 컴포넌트
- 컨텍스트 메뉴 기능
- 수정/삭제 액션 메뉴
- 키보드 내비게이션 지원

### 2. 댓글 시스템 아키텍처

#### CommentSection 컴포넌트
```typescript
// 댓글 섹션의 최상위 컨테이너
// 특징:
// - 댓글 목록 로딩 및 상태 관리
// - 새 댓글 작성 폼 통합
// - 실시간 업데이트 처리
// - 봇 댓글 애니메이션 시작점
// - 댓글 섹션 토글 기능
```

#### Comment 컴포넌트
```typescript
// 개별 댓글 표시
// 특징:
// - 사용자/봇 댓글 구분 표시
// - 작성자 정보 (아바타, 닉네임, 시간)
// - 답글 버튼과 스레드 표시
// - 수정/삭제 권한 관리
// - 봇 이모지와 스타일링
// - 3단계 중첩 레벨 제한
```

#### CommentForm 컴포넌트
```typescript
// 댓글 작성/수정 폼
// 특징:
// - 텍스트 입력 validation (500자 제한)
// - 작성/수정 모드 지원
// - 취소/저장 버튼
// - 로딩 상태 표시
// - 에러 처리
// - 글자 수 카운터
```

### 3. 스레드 시각화

#### 계층적 구조
```css
/* 대댓글 들여쓰기 */
.comment-thread {
  margin-left: 2rem;
  padding-left: 1rem;
  border-left: 2px solid #e5e7eb;
}

/* 봇 댓글 특별 스타일링 */
.bot-comment {
  background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
  border-left: 3px solid #8b5cf6;
}
```

### 4. 봇 댓글 시스템

#### 봇 페르소나별 이모지
```typescript
const botEmojis = {
  '하이프봇3000': '🤖',
  '질투AI': '😤', 
  '캡틴과장러': '📊',
  '아첨꾼2.0': '✨',
  '축하봇': '🎉',
  '의심킹': '🤔'
};
```

#### 자동 새로고침 시스템
```typescript
// 댓글 작성 후 봇 댓글 대기
setTimeout(() => {
  loadComments(); // 봇 댓글들 새로고침
}, 1500);

// 답글 작성 후 봇 대댓글 대기
setTimeout(() => {
  loadComments(); // 봇 대댓글들 새로고침
}, 1000);
```

### 5. PostCard 통합

#### 댓글 섹션 토글
```typescript
const [showComments, setShowComments] = useState(false);

const handleCommentClick = () => {
  setShowComments(!showComments);
  onComment?.();
};
```

#### 시각적 피드백
- 댓글 버튼 활성화시 보라색으로 변경
- 댓글 아이콘 fill 효과
- 부드러운 섹션 열기/닫기

## 🎨 UI/UX 디자인 원칙

### 1. 시각적 계층 구조
- **주 댓글**: 왼쪽 정렬, 풀 너비
- **대댓글**: 들여쓰기 + 연결선 (최대 3단계)
- **봇 댓글**: 보라색 그라데이션 배경과 이모지

### 2. 상호작용 피드백
- **호버 효과**: 댓글 카드 hover시 배경색 변경
- **클릭 피드백**: 버튼 상태 변화
- **로딩 상태**: 스피너와 disable 상태

### 3. 접근성 고려사항
- **키보드 내비게이션**: Tab 순서 관리
- **스크린 리더**: aria-label과 semantic HTML
- **색상 대비**: 충분한 대비값 확보

### 4. 반응형 디자인
- **모바일**: 댓글 카드 간격 축소
- **태블릿**: 중간 크기 최적화
- **데스크톱**: 풀 기능 표시

## 🔄 상태 관리

### 1. 댓글 상태
```typescript
interface CommentState {
  comments: Comment[];
  loading: boolean;
  error: string | null;
  showComments: boolean;
  replyingTo: number | null;
  commentCount: number;
}
```

### 2. 실시간 업데이트
- **새 댓글**: 즉시 목록에 추가
- **봇 댓글**: 지연 후 자동 새로고침
- **수정/삭제**: 해당 댓글만 업데이트
- **답글**: 부모 댓글의 replies 배열에 추가

### 3. 에러 처리
- **네트워크 오류**: 재시도 버튼 제공
- **권한 오류**: 적절한 메시지 표시
- **Validation 오류**: 인라인 에러 메시지
- **빈 상태**: 댓글이 없을 때 안내 메시지

## 🚀 주요 기능

### 1. 댓글 작성
- 500자 제한 및 실시간 카운터
- 빈 댓글 방지
- 로딩 상태 표시
- 성공시 폼 초기화

### 2. 댓글 수정/삭제
- 작성자만 수정/삭제 가능
- 인라인 수정 모드
- 삭제 확인 다이얼로그
- 봇 댓글은 수정/삭제 불가

### 3. 답글 시스템
- 3단계 중첩 제한
- 시각적 스레드 표시
- 답글 숨기기/보기 토글
- 답글 개수 표시

### 4. 봇 댓글 처리
- 6개 봇 페르소나별 이모지
- 특별한 시각적 스타일링
- 자동 새로고침으로 지연 댓글 로딩

## 🎯 다음 단계 (STEP 13)

STEP 13에서는 좋아요 기능의 API와 애니메이션을 구현합니다:

1. **좋아요 토글 API**: 좋아요 추가/제거 백엔드 연동
2. **좋아요 애니메이션**: 하트 터지는 효과
3. **실시간 카운트**: 좋아요 수 실시간 업데이트
4. **사용자 상태**: 좋아요 여부 표시
5. **성능 최적화**: Optimistic update 구현

## 📚 학습 포인트

### 1. React 컴포넌트 설계
- **컴포넌트 분리**: 단일 책임 원칙 적용
- **Props 타입 정의**: TypeScript 활용한 타입 안전성
- **상태 끌어올리기**: 부모-자식 상태 공유

### 2. 조건부 렌더링
- **상태 기반 UI**: loading, error, success 상태 처리
- **권한 기반 표시**: 작성자만 수정/삭제 버튼 표시
- **중첩 레벨**: 답글 깊이에 따른 UI 변화

### 3. 이벤트 처리
- **폼 제출**: preventDefault와 validation
- **비동기 처리**: async/await를 통한 API 호출
- **에러 핸들링**: try-catch를 통한 안전한 처리

### 4. 사용자 경험 (UX)
- **즉각적 피드백**: 버튼 상태 변화
- **로딩 상태**: 적절한 스피너와 메시지
- **에러 복구**: 사용자 친화적 에러 처리

이 단계를 통해 현대적인 소셜 네트워크의 댓글 시스템을 구현하는 방법을 학습할 수 있습니다.