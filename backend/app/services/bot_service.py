"""
Bot Service - AI 봇 페르소나 관리 및 댓글 생성 서비스
"""
import random
import threading
import time
from typing import List, Dict, Any, Optional
from app.utils.prompt_loader import PromptLoader
from app.models.comment import Comment
from app.models.post import Post
from app import db


class BotService:
    def __init__(self):
        self.prompt_loader = PromptLoader()
        self.bot_personas = self.prompt_loader.load_bot_personas()
        
    def get_bot_names(self) -> List[str]:
        """사용 가능한 봇 이름 목록 반환"""
        return list(self.bot_personas.keys())
    
    def get_random_bots(self, count: int = 3) -> List[str]:
        """랜덤하게 봇들을 선택"""
        bot_names = self.get_bot_names()
        return random.sample(bot_names, min(count, len(bot_names)))
    
    def extract_context_keywords(self, text: str) -> Dict[str, Any]:
        """텍스트에서 컨텍스트 키워드 추출"""
        text_lower = text.lower()
        
        # 숫자 관련
        numbers = []
        import re
        number_matches = re.findall(r'\d+', text)
        numbers.extend(number_matches)
        
        # 기관/회사 관련
        institutions = []
        institution_keywords = ['회사', '대학교', '학교', '기업', '스타트업', '팀', '부서', '조직']
        for keyword in institution_keywords:
            if keyword in text:
                institutions.append(keyword)
        
        # 성취/활동 관련
        achievements = []
        achievement_keywords = ['성공', '완료', '달성', '성취', '우승', '합격', '통과', '승진', '선발']
        for keyword in achievement_keywords:
            if keyword in text:
                achievements.append(keyword)
        
        # 감정 관련
        emotions = []
        emotion_keywords = ['기쁘', '행복', '즐거', '신나', '뿌듯', '만족', '감동', '놀라']
        for keyword in emotion_keywords:
            if keyword in text:
                emotions.append(keyword)
        
        return {
            'numbers': numbers,
            'institutions': institutions,
            'achievements': achievements,
            'emotions': emotions,
            'length': len(text),
            'has_exclamation': '!' in text,
            'has_question': '?' in text
        }
    
    def generate_bot_comment(self, bot_name: str, context: Dict[str, Any], post_content: str = "") -> str:
        """특정 봇의 댓글 생성"""
        if bot_name not in self.bot_personas:
            return f"{bot_name}: 흥미로운 소식이네요! 👍"
        
        bot_data = self.bot_personas[bot_name]
        patterns = bot_data.get('comment_patterns', [])
        contextual_templates = bot_data.get('contextual_templates', {})
        
        if not patterns:
            return f"{bot_name}: 대단하네요! {bot_data.get('emoji', '🤖')}"
        
        # 랜덤 패턴 선택
        pattern = random.choice(patterns)
        
        # 컨텍스트 기반 템플릿 변수 교체
        comment = pattern
        
        # 모든 템플릿 변수를 찾아서 교체
        import re
        template_vars = re.findall(r'\{([^}]+)\}', pattern)
        
        for var in template_vars:
            if var in contextual_templates:
                replacement = random.choice(contextual_templates[var])
                comment = comment.replace(f'{{{var}}}', replacement)
            else:
                # 기본 대체값 제공
                default_replacements = {
                    'achievement_modifier': '더 멋지게',
                    'competitive_action': '그런 거',
                    'precise_percentage': '87.3',
                    'extreme_praise': '정말 대단해요',
                    'celebration_reason': '성취',
                    'initial_doubt': '별거 아닐 거라고'
                }
                replacement = default_replacements.get(var, '정말 멋져요')
                comment = comment.replace(f'{{{var}}}', replacement)
        
        # 봇 이름과 이모지 추가
        emoji = bot_data.get('emoji', '🤖')
        return f"{bot_name} {emoji}: {comment}"
    
    def schedule_bot_comments(self, post_id: int, post_content: str, original_text: str):
        """봇 댓글들을 지연 시간을 두고 스케줄링"""
        try:
            # 컨텍스트 추출
            context = self.extract_context_keywords(f"{original_text} {post_content}")
            
            # 3개의 랜덤 봇 선택
            selected_bots = self.get_random_bots(3)
            
            # 각 봇마다 다른 지연 시간으로 댓글 생성 스케줄링
            for i, bot_name in enumerate(selected_bots):
                # 3초에서 10초 사이의 랜덤 지연 + 봇 순서별 2초 추가
                delay = random.uniform(3, 10) + (i * 2)
                
                timer = threading.Timer(delay, self._create_delayed_bot_comment, 
                                      args=[post_id, bot_name, context, post_content])
                timer.daemon = True
                timer.start()
                
        except Exception as e:
            print(f"Error scheduling bot comments: {e}")
    
    def _create_delayed_bot_comment(self, post_id: int, bot_name: str, context: Dict[str, Any], post_content: str):
        """지연된 봇 댓글 생성 (백그라운드 스레드에서 실행)"""
        try:
            # Flask 애플리케이션 컨텍스트 내에서 실행
            from app import create_app
            app = create_app()
            
            with app.app_context():
                # 포스트가 여전히 존재하는지 확인
                post = Post.query.get(post_id)
                if not post:
                    return
                
                # 봇 댓글 생성
                comment_text = self.generate_bot_comment(bot_name, context, post_content)
                
                # 댓글 저장
                comment = Comment(
                    post_id=post_id,
                    user_id=None,  # 봇 댓글은 user_id가 None
                    original_text=comment_text,
                    content=comment_text,
                    bot_name=bot_name,
                    is_bot=True
                )
                
                db.session.add(comment)
                db.session.commit()
                
                print(f"Bot comment created: {bot_name} on post {post_id}")
                
        except Exception as e:
            print(f"Error creating delayed bot comment: {e}")
    
    def generate_bot_reply(self, parent_comment_content: str, original_post_content: str = "") -> Dict[str, Any]:
        """사용자 댓글에 대한 봇 답글 생성"""
        try:
            # 컨텍스트 추출
            context = self.extract_context_keywords(f"{parent_comment_content} {original_post_content}")
            
            # 2개의 랜덤 봇 선택 (답글은 적게)
            selected_bots = self.get_random_bots(2)
            
            replies = []
            for bot_name in selected_bots:
                reply_text = self.generate_bot_comment(bot_name, context, parent_comment_content)
                replies.append({
                    'bot_name': bot_name,
                    'content': reply_text,
                    'delay': random.uniform(2, 6)  # 답글은 더 빠르게
                })
            
            return replies
            
        except Exception as e:
            print(f"Error generating bot reply: {e}")
            return []
    
    def schedule_bot_replies(self, parent_comment_id: int, parent_comment_content: str, post_content: str = ""):
        """봇 답글들을 지연 시간을 두고 스케줄링"""
        try:
            replies = self.generate_bot_reply(parent_comment_content, post_content)
            
            for i, reply_data in enumerate(replies):
                delay = reply_data['delay'] + (i * 1.5)  # 답글 간격은 1.5초
                
                timer = threading.Timer(delay, self._create_delayed_bot_reply,
                                      args=[parent_comment_id, reply_data])
                timer.daemon = True
                timer.start()
                
        except Exception as e:
            print(f"Error scheduling bot replies: {e}")
    
    def _create_delayed_bot_reply(self, parent_comment_id: int, reply_data: Dict[str, Any]):
        """지연된 봇 답글 생성 (백그라운드 스레드에서 실행)"""
        try:
            from app import create_app
            app = create_app()
            
            with app.app_context():
                # 부모 댓글이 여전히 존재하는지 확인
                parent_comment = Comment.query.get(parent_comment_id)
                if not parent_comment:
                    return
                
                # 봇 답글 저장
                reply = Comment(
                    post_id=parent_comment.post_id,
                    user_id=None,
                    parent_id=parent_comment_id,
                    original_text=reply_data['content'],
                    content=reply_data['content'],
                    bot_name=reply_data['bot_name'],
                    is_bot=True
                )
                
                db.session.add(reply)
                db.session.commit()
                
                print(f"Bot reply created: {reply_data['bot_name']} to comment {parent_comment_id}")
                
        except Exception as e:
            print(f"Error creating delayed bot reply: {e}")


# 싱글톤 인스턴스
bot_service = BotService()