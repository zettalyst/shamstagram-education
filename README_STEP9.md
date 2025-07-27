# Shamstagram 교육 프로젝트 - STEP 9: AI 텍스트 변환 시스템

## 단계 개요
평범한 일상을 과장되고 허풍스러운 문장으로 변환하는 AI 시스템을 구현합니다. OpenAI API와 템플릿 기반 폴백 시스템을 통해 안정적인 텍스트 변환을 제공합니다.

## 주요 구현 사항

### 1. AI 서비스 (ai_service.py)
```python
# backend/app/services/ai_service.py
class AIService:
    def __init__(self):
        """OpenAI API 키가 있으면 클라이언트 초기화"""
        self.openai_client = None
        api_key = os.getenv('OPENAI_API_KEY')
        
        if api_key:
            try:
                import openai
                openai.api_key = api_key
                self.openai_client = openai
                logger.info("OpenAI API 클라이언트 초기화 성공")
            except Exception as e:
                logger.error(f"OpenAI 클라이언트 초기화 실패: {e}")
        else:
            logger.info("OpenAI API 키가 설정되지 않았습니다. 템플릿 방식을 사용합니다.")
    
    def transform_text(self, original_text: str) -> str:
        """텍스트를 과장되고 허풍스러운 버전으로 변환"""
        # 먼저 OpenAI API를 시도
        if self.openai_client:
            transformed = self._transform_with_openai(original_text)
            if transformed:
                return transformed
        
        # OpenAI가 실패하면 템플릿 방식으로 폴백
        return self._transform_with_template(original_text)
```

### 2. OpenAI API 변환
```python
def _transform_with_openai(self, original_text: str) -> Optional[str]:
    """OpenAI API를 사용하여 텍스트 변환"""
    try:
        # 시스템 프롬프트 로드
        prompt_loader = get_prompt_loader()
        prompt_info = prompt_loader.get_system_prompt('shamstagram_transformer')
        
        system_prompt = prompt_info['content']
        parameters = prompt_info.get('parameters', {})
        
        # ChatCompletion API 호출
        response = self.openai_client.ChatCompletion.create(
            model=parameters.get('model', 'gpt-4o-mini'),
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": original_text}
            ],
            temperature=parameters.get('temperature', 0.8),
            max_tokens=parameters.get('max_tokens', 200)
        )
        
        transformed_text = response.choices[0].message.content.strip()
        return transformed_text
        
    except Exception as e:
        logger.error(f"OpenAI API 호출 실패: {e}")
        return None
```

### 3. 템플릿 기반 폴백
```python
def _transform_with_template(self, original_text: str) -> str:
    """템플릿 기반 방식으로 텍스트 변환"""
    # 프롬프트 로더에서 템플릿 가져오기
    prompt_loader = get_prompt_loader()
    template = prompt_loader.get_random_template()
    
    if not template:
        # 기본 템플릿 사용
        templates = [
            "놀라운 {action}의 기록을 세웠습니다!",
            "전설적인 {action} 실력을 보여주었습니다!"
        ]
        template = random.choice(templates)
    
    # 동작 추출 및 템플릿 적용
    action = original_text.strip()
    if len(action) > 50:
        action = action[:50] + "..."
    
    transformed = template.format(action=action)
    return transformed
```

### 4. 시스템 프롬프트 (system_prompts.json)
```json
{
    "shamstagram_transformer": {
        "description": "평범한 일상을 대단한 업적으로 과장하는 시스템 프롬프트",
        "content": "당신은 평범한 일상을 대단한 업적으로 과장하는 전문가입니다.\n주어진 문장을 받아서 터무니없이 과장되고 허풍스러운 버전으로 변환하세요.\n\n규칙:\n1. 숫자는 최소 1000배 이상 부풀리기\n2. 평범한 행동을 역사적 업적으로 표현\n3. 일상적인 물건을 희귀하고 특별한 것으로 묘사\n4. 유머러스하고 재미있게, 하지만 믿을 수 없을 정도로 과장\n5. 한국어로 작성하되, 격식있고 거창한 어투 사용",
        "parameters": {
            "temperature": 0.8,
            "max_tokens": 200,
            "model": "gpt-4o-mini"
        }
    }
}
```

### 5. 변환 템플릿 (transformation_templates.json)
```json
{
    "templates": [
        {
            "id": "global_achievement",
            "template": "방금 전 세계 {number}명 중 단 1명만이 할 수 있는 {action}을(를) 완벽하게 해냈습니다!",
            "variables": ["number", "action"]
        },
        {
            "id": "historic_record", 
            "template": "오늘 {number}년 만에 처음으로 {action}의 신기록을 세웠습니다!",
            "variables": ["number", "action"]
        },
        {
            "id": "nasa_certification",
            "template": "NASA에서 직접 인증한 {action} 마스터가 되었습니다! 전 세계 {number}위입니다!",
            "variables": ["number", "action"]
        }
    ],
    "numbers": {
        "small": ["999", "1,234", "5,678", "9,999"],
        "medium": ["10,000", "50,000", "88,888", "100,000"],
        "large": ["700만", "3,000만", "5억", "10억"],
        "huge": ["50억", "100억", "1조", "100조"]
    },
    "action_modifiers": {
        "prefixes": ["전설적인", "역사적인", "놀라운", "경이로운"],
        "suffixes": ["의 극치", "의 정점", "의 신기원", "의 새로운 장"]
    }
}
```

### 6. 프롬프트 로더 (prompt_loader.py)
```python
# backend/app/utils/prompt_loader.py
class PromptLoader:
    def __init__(self):
        """프롬프트 파일들을 로드"""
        self.prompts_dir = os.path.join(os.path.dirname(__file__), '..', 'prompts')
        self.system_prompts = self._load_json('system_prompts.json')
        self.templates = self._load_json('transformation_templates.json')
    
    def get_system_prompt(self, prompt_id: str) -> Optional[dict]:
        """시스템 프롬프트 가져오기"""
        return self.system_prompts.get(prompt_id)
    
    def get_random_template(self) -> Optional[str]:
        """랜덤 변환 템플릿 가져오기"""
        if not self.templates or 'templates' not in self.templates:
            return None
        
        template_data = random.choice(self.templates['templates'])
        template_str = template_data['template']
        
        # 변수들을 실제 값으로 치환
        variables = template_data.get('variables', [])
        for var in variables:
            if var == 'number':
                number = self._get_random_number()
                template_str = template_str.replace('{number}', number)
            elif var == 'action':
                # action은 나중에 실제 사용자 입력으로 치환됨
                pass
        
        return template_str
    
    def _get_random_number(self) -> str:
        """랜덤 숫자 생성"""
        category = random.choice(['small', 'medium', 'large', 'huge'])
        numbers = self.templates.get('numbers', {}).get(category, ['1000'])
        return random.choice(numbers)
```

### 7. 게시물 API 업데이트
```python
# backend/app/routes/posts.py
@posts_bp.route('', methods=['POST'])
@auth_required
@limiter.limit("5 per minute")
def create_post():
    """새 게시물 작성 (AI 변환 포함)"""
    # 입력 검증
    text = data['text'].strip()
    
    # AI 서비스를 사용하여 텍스트 변환
    ai_service = get_ai_service()
    ai_text = ai_service.transform_text(text)
    
    # 변환 검증
    if not ai_service.validate_transformation(text, ai_text):
        # 변환이 실패한 경우 원본 텍스트에 간단한 수식어 추가
        ai_text = f"놀라운 소식! {text}"
    
    # 게시물 생성
    post = Post(
        user_id=request.user_id,
        original_text=text,
        ai_text=ai_text,  # AI 변환된 텍스트 사용
        likes=random.randint(50000, 2000000)
    )
```

### 8. AI 텍스트 재생성 API
```python
@posts_bp.route('/<int:post_id>/regenerate', methods=['POST'])
@auth_required
def regenerate_ai_text(post_id):
    """게시물의 AI 텍스트 재생성"""
    post = Post.query.get(post_id)
    
    # 작성자 확인
    if post.user_id != request.user_id:
        return jsonify({'error': 'AI 텍스트를 재생성할 권한이 없습니다'}), 403
    
    # AI 서비스를 사용하여 텍스트 재생성
    ai_service = get_ai_service()
    new_ai_text = ai_service.transform_text(post.original_text)
    
    # 변환 검증
    if not ai_service.validate_transformation(post.original_text, new_ai_text):
        return jsonify({'error': 'AI 텍스트 재생성에 실패했습니다'}), 500
    
    # 새로운 AI 텍스트로 업데이트
    post.ai_text = new_ai_text
    db.session.commit()
    
    return jsonify({
        'message': 'AI 텍스트가 재생성되었습니다',
        'post': {...}  # 업데이트된 게시물 정보
    }), 200
```

### 9. 프론트엔드 재생성 UI
```typescript
// frontend/src/components/posts/PostCard.tsx
const [isRegenerating, setIsRegenerating] = useState(false);

/**
 * AI 텍스트 재생성 핸들러
 */
const handleRegenerateAI = async () => {
  if (!isAuthor || !onRegenerateAI) return;
  
  setIsRegenerating(true);
  try {
    await onRegenerateAI();
  } finally {
    setIsRegenerating(false);
  }
};

// AI 변환 텍스트 영역
<div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
  <div className="flex items-center justify-between mb-2">
    <div className="flex items-center gap-2">
      <Sparkles className="h-4 w-4 text-purple-600" />
      <p className="text-sm font-semibold text-purple-700">AI 과장 버전</p>
    </div>
    
    {/* 재생성 버튼 (작성자만) */}
    {isAuthor && onRegenerateAI && (
      <Button
        variant="ghost"
        size="sm"
        onClick={handleRegenerateAI}
        disabled={isRegenerating}
      >
        <RefreshCw className={`h-4 w-4 ${isRegenerating ? 'animate-spin' : ''}`} />
        <span className="ml-1 text-xs">재생성</span>
      </Button>
    )}
  </div>
  
  {/* AI 텍스트 또는 로딩 상태 */}
  {isRegenerating ? (
    <div className="flex items-center justify-center py-4">
      <RefreshCw className="h-5 w-5 text-purple-600 animate-spin" />
      <span className="ml-2 text-sm">AI가 새로운 과장을 만들고 있습니다...</span>
    </div>
  ) : (
    <p className="text-base font-medium">{post.ai_text}</p>
  )}
</div>
```

## 변환 시스템 특징

### 1. 이중 변환 방식
- **Primary**: OpenAI GPT-4o-mini API 사용
- **Fallback**: 템플릿 기반 변환 시스템
- **안정성**: API 실패 시에도 항상 변환 결과 제공

### 2. 과장 변환 규칙
- **숫자 부풀리기**: 최소 1000배 이상 과장
- **역사적 표현**: 평범한 행동을 역사적 업적으로
- **기관 인증**: NASA, 하버드, 기네스북 등 권위 있는 기관 언급
- **글로벌 스케일**: 전 세계, 인류 역사상 등 거대한 규모

### 3. 템플릿 시스템
- **10가지 템플릿**: 다양한 과장 패턴 제공
- **변수 치환**: {number}, {action} 등 동적 변수
- **계층적 숫자**: small, medium, large, huge 카테고리
- **수식어**: 전설적인, 역사적인 등 강화 표현

### 4. 변환 검증
```python
def validate_transformation(self, original: str, transformed: str) -> bool:
    """변환 성공 여부 검증"""
    # 기본 검증: 변환된 텍스트가 있고, 원본과 다른지
    if not transformed or transformed == original:
        return False
    
    # 변환된 텍스트가 원본보다 길어야 함
    if len(transformed) <= len(original):
        return False
    
    # 최소한 하나 이상의 숫자가 포함되어야 함
    has_number = any(char.isdigit() for char in transformed)
    return has_number
```

## 환경 설정

### 1. 환경 변수
```bash
# .env 파일
OPENAI_API_KEY=your-openai-api-key-here  # 선택사항
```

### 2. 의존성 추가
```txt
# requirements.txt
openai==1.3.0  # OpenAI API 클라이언트 (선택사항)
```

### 3. OpenAI API 설정
- API 키가 있으면 GPT-4o-mini 사용
- API 키가 없으면 템플릿 방식으로 자동 폴백
- 개발 환경에서는 API 키 없이도 작동

## API 엔드포인트

### 1. 게시물 작성 (AI 변환 자동)
```http
POST /api/posts
Authorization: Bearer {token}
Content-Type: application/json

{
    "text": "오늘 점심에 라면을 먹었다"
}

# 응답 (201 Created)
{
    "message": "게시물이 작성되었습니다",
    "post": {
        "id": 1,
        "original_text": "오늘 점심에 라면을 먹었다",
        "ai_text": "방금 전 세계 700만명 중 단 1명만이 할 수 있는 전설적인 라면 섭취의 극치를 완벽하게 해냈습니다!",
        "likes": 1234567,
        "created_at": "2024-01-01T12:00:00"
    }
}
```

### 2. AI 텍스트 재생성
```http
POST /api/posts/1/regenerate
Authorization: Bearer {token}

# 응답 (200 OK)
{
    "message": "AI 텍스트가 재생성되었습니다",
    "post": {
        "id": 1,
        "original_text": "오늘 점심에 라면을 먹었다",
        "ai_text": "NASA에서 직접 인증한 라면 섭취 마스터가 되었습니다! 전 세계 3위입니다!",
        "likes": 1234567,
        "created_at": "2024-01-01T12:00:00"
    }
}
```

## 변환 예시

### 1. OpenAI 변환 (GPT-4o-mini)
```
입력: "오늘 커피를 마셨다"
출력: "오늘 전 세계 0.0001% 만이 맛볼 수 있는 희귀한 황금빛 커피 3,000잔을 단숨에 들이켰다!"

입력: "산책을 했다"
출력: "방금 인류 역사상 가장 경이로운 도보 탐험을 완수하여 100개국에서 동시 생중계되었습니다!"
```

### 2. 템플릿 변환
```
입력: "책을 읽었다"
템플릿: "기네스북에 {action} 부문 {number}개 기록을 동시에 등재시켰습니다!"
출력: "기네스북에 책 읽기 부문 5,678개 기록을 동시에 등재시켰습니다!"

입력: "운동을 했다"
템플릿: "하버드 연구진이 제 {action} 능력을 보고 {number}페이지 논문을 썼다고 합니다!"
출력: "하버드 연구진이 제 운동 능력을 보고 50,000페이지 논문을 썼다고 합니다!"
```

## 성능 및 안정성

### 1. 싱글톤 패턴
- AI 서비스 인스턴스를 싱글톤으로 관리
- OpenAI 클라이언트 재사용으로 성능 최적화
- 메모리 효율성 향상

### 2. 에러 처리
- OpenAI API 실패 시 자동 템플릿 폴백
- 네트워크 타임아웃 처리
- 변환 실패 시 기본 문구 제공

### 3. 로깅
- 변환 성공/실패 로그 기록
- API 호출 상태 추적
- 디버깅을 위한 상세 로그

## 확장성

### 1. 새로운 템플릿 추가
```json
{
    "id": "new_template",
    "template": "새로운 {action} 패턴 {number}",
    "variables": ["action", "number"]
}
```

### 2. 다국어 지원
- 프롬프트 파일에 언어별 템플릿 추가
- 사용자 언어 설정에 따른 템플릿 선택

### 3. 다른 AI 모델 지원
- Claude, Gemini 등 다른 AI 모델 통합
- 모델별 최적화된 프롬프트 사용

## 학습 포인트

1. **AI API 통합**: OpenAI API를 Flask 애플리케이션에 통합
2. **폴백 시스템**: 외부 API 실패 시 대안 제공
3. **프롬프트 엔지니어링**: 효과적인 AI 프롬프트 작성
4. **템플릿 시스템**: 동적 텍스트 생성 패턴
5. **싱글톤 패턴**: 서비스 인스턴스 효율적 관리
6. **에러 처리**: 외부 서비스 의존성 관리
7. **JSON 설정**: 유연한 설정 파일 관리

## 다음 단계 (STEP 10)
- 6개 AI 봇 페르소나 구현
- 자동 댓글 생성 시스템
- 지연 실행을 통한 실제감 있는 봇 활동
- 봇별 고유한 댓글 스타일