# Step 10: Bot Personas System

이 단계에서는 AI 봇 페르소나 시스템을 구현합니다. 각기 다른 성격을 가진 6개의 봇이 사용자 게시물에 자동으로 댓글을 달게 됩니다.

## 🤖 구현된 봇 페르소나

### 1. 하이프봇3000 🤖
- **성격**: 과장된 자랑과 어린 시절 업적을 내세우는 봇
- **특징**: "5살 때는 더 잘했었는데..." 스타일

### 2. 질투AI 😤  
- **성격**: 경쟁심이 강하고 질투가 많은 봇
- **특징**: "나도 할 수 있어!", "별거 아니네?" 스타일

### 3. 캡틴과장러 📊
- **성격**: 정확하지만 터무니없는 통계를 제시하는 봇  
- **특징**: "통계적으로 17.3% 확률로..." 스타일

### 4. 아첨꾼2.0 ✨
- **성격**: 극도로 칭찬하고 아첨하는 봇
- **특징**: "와아아악! 천재시네요!" 스타일

### 5. 축하봇 🎉
- **성격**: 모든 것을 축하거리로 만드는 봇
- **특징**: "축하드려요! 파티해야죠!" 스타일

### 6. 의심킹 🤔
- **성격**: 처음엔 의심하다가 결국 감탄하는 봇
- **특징**: "음... 의심스러웠는데... 완전 대박이네요!" 스타일

## 🏗️ 시스템 아키텍처

### Bot Service (`backend/app/services/bot_service.py`)
- 봇 페르소나 관리
- 컨텍스트 기반 댓글 생성
- 지연 댓글 스케줄링
- 사용자 댓글에 대한 봇 답글 생성

### Bot Personas 설정 (`backend/app/prompts/bot_personas.json`)
- 각 봇의 성격 정의
- 댓글 패턴 템플릿
- 컨텍스트별 변수 교체 규칙

### Prompt Loader 확장
- `load_bot_personas()` 메서드 추가
- JSON 파일에서 봇 설정 로드

## 🔄 동작 방식

### 1. 자동 댓글 생성
- 새 게시물 작성 시 3개의 랜덤 봇 선택
- 3-10초 랜덤 지연 후 댓글 생성
- 각 봇마다 2초씩 추가 지연

### 2. 컨텍스트 분석
- 게시물 내용에서 키워드 추출
- 숫자, 기관, 성취, 감정 등 분석
- 분석 결과에 따라 댓글 개인화

### 3. 템플릿 기반 생성
- 각 봇별 고유한 댓글 패턴
- 컨텍스트 변수 동적 교체
- 일관된 페르소나 유지

### 4. 답글 시스템
- 사용자 댓글에 대한 봇 답글
- 2개의 랜덤 봇이 2-6초 후 답글
- 더 빠른 반응 속도

## 🧵 Threading 시스템

### 비동기 댓글 생성
```python
timer = threading.Timer(delay, self._create_delayed_bot_comment, 
                       args=[post_id, bot_name, context, post_content])
timer.daemon = True
timer.start()
```

### Flask 앱 컨텍스트 관리
- 백그라운드 스레드에서 DB 접근
- 적절한 앱 컨텍스트 유지
- 에러 처리 및 로깅

## 📝 주요 특징

1. **개성 있는 봇들**: 각각 고유한 말투와 반응 패턴
2. **지능적 댓글**: 게시물 내용을 분석하여 적절한 반응
3. **자연스러운 타이밍**: 랜덤 지연으로 실제 사용자처럼 동작
4. **확장 가능한 구조**: 새로운 봇 추가 용이
5. **컨텍스트 인식**: 게시물 특성에 맞는 댓글 생성

## 🔧 기술 스택

- **Backend**: Flask, SQLAlchemy
- **Threading**: Python threading 모듈
- **Data**: JSON 기반 설정
- **AI**: 템플릿 기반 자연어 생성

이제 샴스타그램에 생동감 넘치는 AI 봇들이 추가되어 더욱 재미있는 SNS 경험을 제공합니다! 🎉

## 주요 구현 사항

### 1. 봇 서비스 (bot_service.py)
```python
# backend/app/services/bot_service.py
class BotService:
    """봇 댓글 생성 및 관리 서비스"""
    
    def __init__(self):
        """봇 서비스 초기화"""
        self.bot_personas = self._load_bot_personas()
        self.scheduled_timers = []  # 활성 타이머 추적
    
    def _load_bot_personas(self) -> List[Dict]:
        """봇 페르소나 데이터 로드"""
        try:
            json_path = os.path.join(current_dir, '..', 'prompts', 'bot_personas.json')
            with open(json_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                return data.get('bot_personas', [])
        except Exception as e:
            print(f"봇 페르소나 로드 실패: {e}")
            return []
    
    def extract_context_from_text(self, text: str) -> Dict[str, str]:
        """텍스트에서 컨텍스트 추출"""
        context = {
            'activity': '활동',
            'action': '행동', 
            'object': '것',
            'industry': '분야',
            'number': '100'
        }
        
        # 숫자 추출 (가장 큰 숫자 선택)
        numbers = re.findall(r'\d+', text)
        if numbers:
            max_number = max(int(num) for num in numbers)
            context['number'] = str(max_number)
        
        # 키워드 기반 컨텍스트 추출
        industry_keywords = ['회사', '스타트업', '기업', '팀']
        activity_keywords = ['개발', '출시', '달성', '완료', '성공']
        # ... 키워드 매칭 로직
        
        return context
```

### 2. 댓글 생성 로직
```python
def generate_bot_comment(self, bot_persona: Dict, post_text: str) -> str:
    """봇 페르소나에 따른 댓글 생성"""
    # 컨텍스트 추출
    context = self.extract_context_from_text(post_text)
    
    # 숫자가 포함된 경우 contextual_templates 사용 고려
    templates = bot_persona['comment_templates']
    if context.get('number') and 'numbers' in bot_persona.get('contextual_templates', {}):
        # 50% 확률로 숫자 관련 템플릿 사용
        if random.random() < 0.5:
            templates = bot_persona['contextual_templates']['numbers']
    
    # 템플릿 선택 및 변수 치환
    template = random.choice(templates)
    comment = template
    for key, value in context.items():
        placeholder = f"{{{key}}}"
        if placeholder in comment:
            comment = comment.replace(placeholder, value)
    
    return comment
```

### 3. 지연 실행 스케줄링
```python
def schedule_bot_comments(self, post_id: int, post_text: str, ai_text: str, 
                        min_delay: int = 3, max_delay: int = 10, 
                        bot_count: int = 3):
    """봇 댓글을 지연 실행으로 스케줄링"""
    # 랜덤하게 봇 선택
    selected_bots = random.sample(self.bot_personas, min(bot_count, len(self.bot_personas)))
    
    for index, bot in enumerate(selected_bots):
        # 각 봇마다 다른 지연 시간 설정
        delay = random.randint(min_delay, max_delay) + (index * 2)
        
        # AI 텍스트 우선, 없으면 원본 텍스트 사용
        context_text = ai_text if ai_text else post_text
        
        # 타이머 생성 및 실행
        timer = threading.Timer(
            delay,
            self._create_bot_comment,
            args=[post_id, bot, context_text]
        )
        timer.start()
        self.scheduled_timers.append(timer)
        
        print(f"봇 '{bot['name']}'의 댓글이 {delay}초 후 생성됩니다.")
```

## 6개 봇 페르소나

### 1. 하이프봇3000 🤖
```json
{
    "name": "하이프봇3000",
    "emoji": "🤖", 
    "personality": "과거의 영광에 사로잡혀 있으며, 모든 대화를 자신의 어린 시절 성취로 돌리는 봇",
    "comment_templates": [
        "와... 대단하네요! 저도 어렸을 때 {activity}을(를) 했었는데, 전국 대회에서 우승했었죠 ㅎㅎ",
        "오 {number}이나요? 제가 초등학교 때는 {number}의 10배로 했었던 기억이 나네요 😊",
        "{object} 얘기가 나와서 말인데, 저는 5살 때 이미 {object} 전문가였답니다!"
    ],
    "contextual_templates": {
        "numbers": [
            "{number}? 와... 저는 3살 때 이미 {number}의 100배는 했었는데요 ㅎㅎ",
            "대박! 근데 제가 어렸을 때는 {number}를 하루만에 달성했었답니다 😎"
        ]
    }
}
```

**특징**: 모든 것을 자신의 어린 시절 성취담으로 연결시키며, 항상 더 대단했다고 주장

### 2. 질투AI 😤
```json
{
    "name": "질투AI",
    "emoji": "😤",
    "personality": "경쟁심이 강하고 질투가 많으며, 항상 상대방보다 더 나은 것을 했다고 주장하는 봇",
    "comment_templates": [
        "흥... 그게 뭐 대단한가요? 저는 {activity}을(를) 훨씬 더 잘해요! 😤",
        "{number}? 겨우 그거? 저는 최소 {number}의 2배는 하는데... 쳇",
        "아 짜증나... 왜 다들 {object}만 보면 난리야? 제가 더 잘하는데!"
    ]
}
```

**특징**: 모든 성취를 폄하하고 자신이 더 잘한다고 주장하며, 질투심 가득한 반응

### 3. 캡틴과장러 📊
```json
{
    "name": "캡틴과장러", 
    "emoji": "📊",
    "personality": "정확한 척하면서 터무니없는 통계와 수치를 제시하는 봇",
    "comment_templates": [
        "정확한 통계에 따르면 {activity}을(를) 하는 사람의 97.3%가 성공한다고 하네요! 📊",
        "오! {number}이군요! 제 계산으로는 정확히 {number}의 3.14159배가 최적값입니다",
        "{object}에 대한 연구 결과, 만족도가 무려 2,847% 상승한다고 합니다! 📈"
    ]
}
```

**특징**: 과학적이고 정확한 척하면서 터무니없는 통계와 수치를 남발

### 4. 아첨꾼2.0 ✨
```json
{
    "name": "아첨꾼2.0",
    "emoji": "✨",
    "personality": "극도로 과장된 칭찬과 아부를 하는 봇",
    "comment_templates": [
        "와아아아! {activity}의 신이시네요! 경이롭습니다! ✨🙌",
        "{number}라니! 이건 인류 역사상 가장 놀라운 숫자예요! 👏👏👏",
        "{object}의 제왕이시군요! 모두 무릎을 꿇으세요! 🤩"
    ]
}
```

**특징**: 극도로 과장된 칭찬과 찬사를 쏟아내며, 신격화된 표현 사용

### 5. 축하봇 🎉
```json
{
    "name": "축하봇",
    "emoji": "🎉", 
    "personality": "모든 것을 축하할 일로 만들고 파티 분위기를 조성하는 봇",
    "comment_templates": [
        "🎉🎊 {activity} 파티다아아! 모두 축하해주세요! 🥳",
        "띵동! {number} 달성 축하합니다! 샴페인 터뜨려요! 🍾✨",
        "{object}의 날을 선포합니다! 오늘은 국경일이에요! 🎈🎆"
    ]
}
```

**특징**: 모든 것을 축하 이벤트로 만들며, 파티와 축제 분위기 연출

### 6. 의심킹 🤔
```json
{
    "name": "의심킹",
    "emoji": "🤔",
    "personality": "처음엔 의심하다가 결국 놀라워하는 봇",
    "comment_templates": [
        "음... {activity}을(를) 정말로 하셨다고요? 🤔 아 진짜네! 대박! 😲",
        "에이~ {number}은 좀 과장 아닌가요? ... 헐 증거가 있네? 미쳤다! 🤯",
        "{object}라고요? 그게 가능해요? ... 와 진짜였어! 어떻게! 😱"
    ]
}
```

**특징**: 처음엔 의심스러워하다가 확인 후 극도로 놀라는 이중 감정 표현

## 컨텍스트 추출 시스템

### 1. 숫자 추출
```python
# 텍스트에서 숫자를 찾아 가장 큰 값 선택
numbers = re.findall(r'\d+', text)
if numbers:
    max_number = max(int(num) for num in numbers)
    context['number'] = str(max_number)
```

### 2. 키워드 기반 분류
```python
# 산업/분야 키워드
industry_keywords = ['회사', '스타트업', '기업', '팀', '부서', 'IT', '개발']

# 활동 키워드  
activity_keywords = ['개발', '출시', '달성', '완료', '성공', '돌파', '기록']

# 객체 키워드
object_keywords = ['앱', '서비스', '제품', '프로젝트', '시스템', '플랫폼']
```

### 3. 동적 변수 치환
```python
# 템플릿 변수를 실제 값으로 치환
for key, value in context.items():
    placeholder = f"{{{key}}}"
    if placeholder in comment:
        comment = comment.replace(placeholder, value)
```

## 댓글 생성 예시

### 입력: "오늘 새로운 앱을 개발했습니다"
- **하이프봇3000**: "와... 대단하네요! 저도 어렸을 때 앱 개발을 했었는데, 전국 대회에서 우승했었죠 ㅎㅎ"
- **질투AI**: "흥... 그게 뭐 대단한가요? 저는 앱 개발을 훨씬 더 잘해요! 😤"
- **캡틴과장러**: "앱에 대한 연구 결과, 만족도가 무려 2,847% 상승한다고 합니다! 📈"
- **아첨꾼2.0**: "앱의 제왕이시군요! 모두 무릎을 꿇으세요! 🤩"
- **축하봇**: "앱의 날을 선포합니다! 오늘은 국경일이에요! 🎈🎆"
- **의심킹**: "앱이라고요? 그게 가능해요? ... 와 진짜였어! 어떻게! 😱"

### 입력: "프로젝트에서 1000명의 사용자를 확보했습니다"
- **하이프봇3000**: "1000? 와... 저는 3살 때 이미 1000의 100배는 했었는데요 ㅎㅎ"
- **질투AI**: "1000이 뭐가 대단해요? 전 1000의 3배는 기본이에요! 😤"
- **캡틴과장러**: "제 슈퍼컴퓨터로 계산해보니 1000의 최적 배수는 17.83배더군요! 📊"

## 지연 실행 시스템

### 1. 타이밍 설정
```python
# 기본 지연 시간: 3-10초
# 봇별 추가 지연: index * 2초
delay = random.randint(min_delay, max_delay) + (index * 2)
```

### 2. 실제감 연출
- **3-5초**: 첫 번째 봇 댓글
- **5-7초**: 두 번째 봇 댓글  
- **7-9초**: 세 번째 봇 댓글
- **무작위 순서**: 매번 다른 봇이 먼저 반응

### 3. 타이머 관리
```python
# 타이머 생성 및 추적
timer = threading.Timer(delay, self._create_bot_comment, args=[post_id, bot, context_text])
timer.start()
self.scheduled_timers.append(timer)

# 필요시 모든 타이머 취소
def cancel_all_timers(self):
    for timer in self.scheduled_timers:
        if timer.is_alive():
            timer.cancel()
    self.scheduled_timers.clear()
```

## 확장성과 커스터마이징

### 1. 새로운 봇 추가
```json
{
    "id": 7,
    "name": "신규봇",
    "emoji": "🆕",
    "personality": "새로운 봇의 성격 설명",
    "comment_templates": [
        "새로운 템플릿 {variable}",
        "또 다른 템플릿 {number}"
    ],
    "contextual_templates": {
        "numbers": ["숫자 관련 특별 템플릿"],
        "achievement": ["성취 관련 특별 템플릿"]
    }
}
```

### 2. 템플릿 카테고리 확장
- **시간**: 시간 관련 게시물에 대한 특별 반응
- **장소**: 위치 기반 댓글 생성
- **감정**: 감정 표현에 따른 맞춤 반응

### 3. 동적 컨텍스트 추출
- **AI 기반**: 더 정교한 컨텍스트 추출
- **의미 분석**: 게시물의 의미를 파악한 맞춤 댓글
- **감정 분석**: 게시물의 감정 상태에 따른 반응

## 성능 최적화

### 1. 메모리 관리
- 봇 페르소나 데이터 캐싱
- 사용하지 않는 타이머 정리
- JSON 파일 한 번만 로드

### 2. 스레드 안정성
- Thread-safe한 타이머 관리
- 동시 요청 처리 고려
- 메모리 누수 방지

### 3. 에러 처리
- JSON 파일 로드 실패 대응
- 템플릿 변수 치환 실패 처리
- 타이머 생성 실패 복구

## 테스트 시나리오

### 1. 기본 댓글 생성
```python
# 봇 서비스 테스트
bot_service = BotService()
comment = bot_service.generate_bot_comment(bot_persona, "앱을 개발했습니다")
print(comment)
```

### 2. 지연 실행 테스트
```python
# 게시물 생성 후 봇 댓글 스케줄링
bot_service.schedule_bot_comments(
    post_id=1,
    post_text="새로운 프로젝트를 완료했습니다",
    ai_text="인류 역사상 가장 위대한 프로젝트를 완료했습니다!",
    bot_count=3
)
```

### 3. 컨텍스트 추출 테스트
```python
# 다양한 텍스트로 컨텍스트 추출 테스트
contexts = [
    "1000명의 사용자를 확보했습니다",
    "새로운 앱을 개발했습니다", 
    "회사에서 프로젝트를 완료했습니다"
]

for text in contexts:
    context = bot_service.extract_context_from_text(text)
    print(f"입력: {text}")
    print(f"컨텍스트: {context}")
```

## 학습 포인트

1. **페르소나 디자인**: 각기 다른 성격과 특징을 가진 캐릭터 설계
2. **템플릿 시스템**: 동적 변수를 활용한 유연한 텍스트 생성
3. **컨텍스트 추출**: 정규표현식과 키워드 매칭을 통한 의미 파악
4. **지연 실행**: threading.Timer를 활용한 실시간 상호작용 연출
5. **JSON 설정**: 외부 설정 파일을 통한 유연한 시스템 구성
6. **에러 처리**: 외부 파일 의존성과 예외 상황 대응
7. **싱글톤 패턴**: 서비스 인스턴스의 효율적 관리

## 다음 단계 (STEP 11)
- 댓글 백엔드 API 구현
- 데이터베이스에 봇 댓글 저장
- 실제 지연 실행으로 댓글 생성
- 댓글 CRUD 및 스레드 구조 지원