"""
프롬프트 로더 유틸리티

JSON 파일에서 프롬프트를 로드하는 기능을 제공합니다.
"""

import json
import os
from typing import Dict, Any


class PromptLoader:
    """프롬프트 로딩을 담당하는 클래스"""
    
    def __init__(self):
        """프롬프트 로더 초기화"""
        self.prompts_dir = os.path.join(
            os.path.dirname(os.path.dirname(__file__)), 
            'prompts'
        )
    
    def load_system_prompt(self) -> str:
        """시스템 프롬프트를 로드합니다."""
        file_path = os.path.join(self.prompts_dir, 'system_prompt.json')
        
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                return data.get('content', '')
        except FileNotFoundError:
            # 파일이 없으면 기본 프롬프트 반환
            return self._get_default_system_prompt()
        except json.JSONDecodeError:
            return self._get_default_system_prompt()
    
    def load_bot_personas(self) -> Dict[str, Any]:
        """봇 페르소나를 로드합니다."""
        file_path = os.path.join(self.prompts_dir, 'bot_personas.json')
        
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            # 파일이 없으면 기본 페르소나 반환
            return self._get_default_bot_personas()
    
    def _get_default_system_prompt(self) -> str:
        """기본 시스템 프롬프트를 반환합니다."""
        return """당신은 평범한 일상을 화려하고 과장된 이야기로 변환하는 전문가입니다. 
다음 규칙을 따라주세요:
1. 원문의 핵심 내용은 유지하되, 극도로 과장하여 표현하세요.
2. 숫자는 터무니없이 크게 부풀려주세요.
3. 평범한 행동을 영웅적이거나 역사적인 사건으로 묘사하세요.
4. 유머러스하고 재미있게 작성하되, 한국어 어법은 자연스럽게 유지하세요."""
    
    def _get_default_bot_personas(self) -> Dict[str, Any]:
        """기본 봇 페르소나를 반환합니다."""
        return {
            "하이프봇3000": {
                "emoji": "🤖",
                "personality": "어린 시절부터 이미 그 분야의 천재였다고 주장하는 봇",
                "templates": [
                    "헐... 저는 3살 때부터 이 분야 전문가였는데도 이건 처음 봅니다!",
                    "와 이건 제가 태어나기 전부터 준비해도 못 따라갈 수준이네요!"
                ]
            },
            "질투AI": {
                "emoji": "😤",
                "personality": "처음엔 질투하다가 결국 인정하는 봇",
                "templates": [
                    "흥! 뭐가 그리 대단하다고... 아 잠깐, 다시 보니까 진짜 대단하네요?",
                    "별로 안 부러운데요? ...는 구라고 진짜 대단하시네요 인정!"
                ]
            }
        }