"""
AI 서비스

OpenAI API를 사용하여 텍스트를 변환하고 봇 댓글을 생성합니다.
"""

import os
import random
import json
from typing import List, Dict, Optional
from openai import OpenAI


class AIService:
    """AI 텍스트 변환 및 봇 관리 서비스"""
    
    def __init__(self):
        # OpenAI 클라이언트 초기화
        api_key = os.getenv('OPENAI_API_KEY')
        self.client = OpenAI(api_key=api_key) if api_key else None
        
        # 봇 페르소나 정의
        self.bot_personas = {
            "하이프봇3000": {
                "emoji": "🤖",
                "personality": "항상 자신이 더 대단하다고 주장하는 봇",
                "templates": [
                    "그정도는 아무것도 아니죠! 제가 5살 때 이미 {achievement}했답니다! 🚀",
                    "오 정말요? 전 말 그대로 {concept}의 신이에요! 😤",
                    "와! 정말 대단하신데요? 저는 이미 {number}번 했어요! 💪"
                ]
            },
            "질투AI": {
                "emoji": "😤",
                "personality": "다른 사람의 성취를 보면 질투하는 봇",
                "templates": [
                    "뭐어어? 저는 그보다 10배는 더 {action}했는데요... 😒",
                    "아, 그거요? 제가 작년에 이미 마스터했죠. 지금은 {next_level}해요! 🙄",
                    "흥, 저는 {entity}가 직접 찾아와서 {request}했다니까요! 😤"
                ]
            },
            "캡틴과장러": {
                "emoji": "📊",
                "personality": "모든 것을 정밀한 수치로 과장하는 봇",
                "templates": [
                    "제 계산으로는 이건 {percentage}% 대단하고 전 세계 {rank}위입니다! 📊",
                    "통계적으로 이는 {number}명 중 1명만 가능한 업적이에요! 📈",
                    "이로 인해 우주의 엔트로피가 {change}% 변화했습니다! 🎯"
                ]
            },
            "아첨꾼2.0": {
                "emoji": "✨",
                "personality": "극도로 과장된 칭찬을 하는 봇",
                "templates": [
                    "와아아아! 이건 정말 우주 역사상 최고예요! ✨",
                    "믿을 수가 없어요! 당신은 분명 {field}의 신이 되실 거예요! 🌟",
                    "이런 천재성은 1000년에 한 번 나올까 말까해요! 👏"
                ]
            },
            "축하봇": {
                "emoji": "🎉",
                "personality": "모든 것을 축하하고 파티를 여는 봇",
                "templates": [
                    "🎉🎊 축하합니다! 이제 당신은 {achievement}의 전설이 되셨어요! 🎊🎉",
                    "파티 준비하세요! 🥳 {entity}에서 당신을 위한 축제를 준비 중이래요!",
                    "🏆 이 업적은 역사책에 황금 페이지로 기록될 거예요! 🏆"
                ]
            }
        }
        
        # 텍스트 변환 템플릿
        self.transform_templates = [
            "오늘 {original}했는데, 사실은 {industry}계의 혁명을 일으켰고 노벨상 후보에 올랐습니다. 하버드에서 명예박사 학위 제안이 왔지만 너무 바빠서 거절했어요.",
            "방금 {original}했습니다. 이로 인해 전 세계 {number}개국에서 동시에 박수가 터져 나왔고, UN에서 특별 공로상을 수여하기로 했답니다.",
            "{original}하는 중인데 NASA에서 긴급 연락이 왔어요. 제가 만든 {concept}이 화성 탐사의 핵심 기술이 된다고 하네요. 겸손하게 거절했지만요."
        ]
    
    def transform_text(self, original_text: str) -> str:
        """
        평범한 텍스트를 과장된 텍스트로 변환합니다.
        
        Args:
            original_text: 원본 텍스트
            
        Returns:
            str: 변환된 텍스트
        """
        # OpenAI API 사용 가능한 경우
        if self.client:
            try:
                response = self.client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=[
                        {
                            "role": "system",
                            "content": "당신은 평범한 일상을 엄청나게 과장해서 표현하는 AI입니다. 원본 내용을 바탕으로 터무니없이 과장된 이야기를 만들어주세요. 유머러스하고 재미있게, 하지만 불쾌하지 않게 표현해주세요."
                        },
                        {
                            "role": "user",
                            "content": original_text
                        }
                    ],
                    temperature=0.9,
                    max_tokens=300
                )
                return response.choices[0].message.content.strip()
            except Exception as e:
                print(f"OpenAI API 오류: {e}")
        
        # 폴백: 템플릿 기반 변환
        template = random.choice(self.transform_templates)
        
        # 변수 치환
        replacements = {
            "original": original_text,
            "industry": random.choice(["IT", "우주", "의료", "금융", "예술"]),
            "number": random.randint(100, 195),
            "concept": random.choice(["알고리즘", "이론", "발명품", "아이디어", "기술"])
        }
        
        for key, value in replacements.items():
            template = template.replace(f"{{{key}}}", str(value))
        
        return template
    
    def generate_bot_comment(self, post_text: str, bot_name: str) -> Dict[str, any]:
        """
        봇 댓글을 생성합니다.
        
        Args:
            post_text: 게시물 텍스트
            bot_name: 봇 이름
            
        Returns:
            dict: 봇 댓글 정보
        """
        if bot_name not in self.bot_personas:
            bot_name = random.choice(list(self.bot_personas.keys()))
        
        persona = self.bot_personas[bot_name]
        template = random.choice(persona["templates"])
        
        # 변수 치환
        replacements = {
            "achievement": random.choice(["세계 정복", "우주 여행", "타임머신 발명", "순간이동 마스터"]),
            "concept": random.choice(["AI", "양자역학", "블록체인", "메타버스"]),
            "number": random.randint(1000, 9999),
            "action": random.choice(["코딩", "발명", "연구", "개발"]),
            "next_level": random.choice(["다차원 프로그래밍", "우주 해킹", "시공간 조작"]),
            "entity": random.choice(["구글", "NASA", "UN", "하버드"]),
            "request": random.choice(["CEO 자리를 제안", "노벨상을 수여", "명예박사 학위를 제공"]),
            "percentage": random.randint(200, 999),
            "rank": random.randint(1, 3),
            "change": random.randint(10, 50),
            "field": random.choice(["프로그래밍", "과학", "예술", "비즈니스"])
        }
        
        for key, value in replacements.items():
            template = template.replace(f"{{{key}}}", str(value))
        
        return {
            "bot_name": bot_name,
            "content": template,
            "emoji": persona["emoji"],
            "delay": random.randint(3000, 10000)  # 3-10초 지연
        }
    
    def get_bot_names(self) -> List[str]:
        """
        사용 가능한 봇 이름 목록을 반환합니다.
        
        Returns:
            list: 봇 이름 목록
        """
        return list(self.bot_personas.keys())