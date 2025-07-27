"""
봇 페르소나 기반 댓글 생성 서비스
교육용 프로젝트 - 10단계: Bot Personas
"""

import json
import random
import threading
import os
import re
from datetime import datetime
from typing import List, Dict, Optional
from flask import current_app

class BotService:
    """봇 댓글 생성 및 관리 서비스"""
    
    def __init__(self):
        """봇 서비스 초기화"""
        self.bot_personas = self._load_bot_personas()
        self.scheduled_timers = []  # 활성 타이머 추적
        
    def _load_bot_personas(self) -> List[Dict]:
        """봇 페르소나 데이터 로드
        
        Returns:
            List[Dict]: 봇 페르소나 정보 리스트
        """
        try:
            # 프로젝트 루트에서 상대 경로로 파일 찾기
            current_dir = os.path.dirname(os.path.abspath(__file__))
            json_path = os.path.join(current_dir, '..', 'prompts', 'bot_personas.json')
            
            with open(json_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                return data.get('bot_personas', [])
        except Exception as e:
            print(f"봇 페르소나 로드 실패: {e}")
            return []
    
    def extract_context_from_text(self, text: str) -> Dict[str, str]:
        """텍스트에서 컨텍스트 추출
        
        Args:
            text: 분석할 텍스트
            
        Returns:
            Dict[str, str]: 추출된 컨텍스트 정보
        """
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
            # 숫자를 정수로 변환하여 가장 큰 것 선택
            max_number = max(int(num) for num in numbers)
            context['number'] = str(max_number)
        
        # 산업/분야 키워드 추출
        industry_keywords = ['회사', '스타트업', '기업', '팀', '부서', '프로젝트', 'IT', '개발', '마케팅', '영업']
        for keyword in industry_keywords:
            if keyword in text:
                context['industry'] = keyword
                break
        
        # 활동 키워드 추출
        activity_keywords = ['개발', '출시', '달성', '완료', '성공', '돌파', '기록', '운영', '관리', '진행']
        for keyword in activity_keywords:
            if keyword in text:
                context['activity'] = keyword
                context['action'] = keyword + '하는 것'
                break
        
        # 객체 키워드 추출
        object_keywords = ['앱', '서비스', '제품', '프로젝트', '시스템', '플랫폼', '솔루션', '기능']
        for keyword in object_keywords:
            if keyword in text:
                context['object'] = keyword
                break
                
        return context
    
    def generate_bot_comment(self, bot_persona: Dict, post_text: str) -> str:
        """봇 페르소나에 따른 댓글 생성
        
        Args:
            bot_persona: 봇 페르소나 정보
            post_text: 원본 게시물 텍스트
            
        Returns:
            str: 생성된 봇 댓글
        """
        # 컨텍스트 추출
        context = self.extract_context_from_text(post_text)
        
        # 숫자가 포함된 경우 contextual_templates 사용 고려
        templates = bot_persona['comment_templates']
        if context.get('number') and 'numbers' in bot_persona.get('contextual_templates', {}):
            # 50% 확률로 숫자 관련 템플릿 사용
            if random.random() < 0.5:
                templates = bot_persona['contextual_templates']['numbers']
        
        # 템플릿 선택
        template = random.choice(templates)
        
        # 템플릿 변수 치환
        comment = template
        for key, value in context.items():
            placeholder = f"{{{key}}}"
            if placeholder in comment:
                comment = comment.replace(placeholder, value)
                
        return comment
    
    def schedule_bot_comments(self, post_id: int, post_text: str, ai_text: str, 
                            min_delay: int = 3, max_delay: int = 10, 
                            bot_count: int = 3):
        """봇 댓글을 지연 실행으로 스케줄링
        
        Args:
            post_id: 게시물 ID
            post_text: 원본 텍스트
            ai_text: AI 변환 텍스트
            min_delay: 최소 지연 시간 (초)
            max_delay: 최대 지연 시간 (초)
            bot_count: 생성할 봇 댓글 수
        """
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
    
    def _create_bot_comment(self, post_id: int, bot_persona: Dict, context_text: str):
        """실제 봇 댓글을 데이터베이스에 생성
        
        Args:
            post_id: 게시물 ID
            bot_persona: 봇 페르소나 정보
            context_text: 컨텍스트 추출용 텍스트
        """
        try:
            # Flask 앱 컨텍스트가 필요한 경우를 위한 처리
            # 실제 구현은 11단계에서 데이터베이스 연동과 함께 완성됩니다
            comment_text = self.generate_bot_comment(bot_persona, context_text)
            
            # 콘솔에 출력 (실제로는 DB에 저장)
            print(f"\n[봇 댓글 생성]")
            print(f"게시물 ID: {post_id}")
            print(f"봇: {bot_persona['name']} {bot_persona['emoji']}")
            print(f"댓글: {comment_text}")
            print(f"시간: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
            print("-" * 50)
            
        except Exception as e:
            print(f"봇 댓글 생성 중 오류: {e}")
    
    def cancel_all_timers(self):
        """모든 예약된 타이머 취소"""
        for timer in self.scheduled_timers:
            if timer.is_alive():
                timer.cancel()
        self.scheduled_timers.clear()
        print("모든 봇 댓글 타이머가 취소되었습니다.")

# 봇 서비스 인스턴스 생성
bot_service = BotService()