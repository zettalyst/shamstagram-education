# backend/app/services/ai_service.py
"""
AI 텍스트 변환 서비스
사용자의 평범한 문장을 과장되고 허풍스러운 문장으로 변환합니다.

두 가지 방식을 지원합니다:
1. OpenAI API (GPT-4o-mini) - 메인 방식
2. 템플릿 기반 변환 - 폴백 방식
"""

import os
import random
import logging
from typing import Optional
from app.utils.prompt_loader import get_prompt_loader

logger = logging.getLogger(__name__)


class AIService:
    """AI 텍스트 변환 서비스 클래스"""
    
    def __init__(self):
        """
        AIService 초기화
        OpenAI API 키가 설정되어 있으면 OpenAI 클라이언트를 초기화합니다.
        """
        self.openai_client = None
        api_key = os.getenv('OPENAI_API_KEY')
        
        if api_key:
            try:
                import openai
                openai.api_key = api_key
                self.openai_client = openai
                logger.info("OpenAI API 클라이언트 초기화 성공")
            except ImportError:
                logger.warning("OpenAI 패키지가 설치되지 않았습니다. 템플릿 방식을 사용합니다.")
            except Exception as e:
                logger.error(f"OpenAI 클라이언트 초기화 실패: {e}")
        else:
            logger.info("OpenAI API 키가 설정되지 않았습니다. 템플릿 방식을 사용합니다.")
    
    def transform_text(self, original_text: str) -> str:
        """
        텍스트를 과장되고 허풍스러운 버전으로 변환합니다.
        
        Args:
            original_text (str): 원본 텍스트
            
        Returns:
            str: 변환된 텍스트
        """
        # 먼저 OpenAI API를 시도합니다
        if self.openai_client:
            transformed = self._transform_with_openai(original_text)
            if transformed:
                return transformed
        
        # OpenAI가 실패하면 템플릿 방식으로 폴백합니다
        return self._transform_with_template(original_text)
    
    def _transform_with_openai(self, original_text: str) -> Optional[str]:
        """
        OpenAI API를 사용하여 텍스트를 변환합니다.
        
        Args:
            original_text (str): 원본 텍스트
            
        Returns:
            Optional[str]: 변환된 텍스트 또는 None (실패 시)
        """
        try:
            # 프롬프트 로더에서 시스템 프롬프트 가져오기
            prompt_loader = get_prompt_loader()
            prompt_info = prompt_loader.get_system_prompt('shamstagram_transformer')
            
            if not prompt_info:
                logger.error("시스템 프롬프트를 찾을 수 없습니다")
                return None
            
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
            logger.info(f"OpenAI 변환 성공: {original_text[:30]}... -> {transformed_text[:30]}...")
            return transformed_text
            
        except Exception as e:
            logger.error(f"OpenAI API 호출 실패: {e}")
            return None
    
    def _transform_with_template(self, original_text: str) -> str:
        """
        템플릿 기반 방식으로 텍스트를 변환합니다.
        
        Args:
            original_text (str): 원본 텍스트
            
        Returns:
            str: 변환된 텍스트
        """
        # 프롬프트 로더에서 템플릿 가져오기
        prompt_loader = get_prompt_loader()
        template = prompt_loader.get_random_template()
        
        if not template:
            # 템플릿을 찾을 수 없는 경우 기본값 사용
            logger.warning("템플릿을 찾을 수 없어 기본값을 사용합니다")
            templates = [
                "놀라운 {action}의 기록을 세웠습니다!",
                "전설적인 {action} 실력을 보여주었습니다!"
            ]
            template = random.choice(templates)
        
        # 동작 추출 (간단한 방식)
        action = original_text.strip()
        if len(action) > 50:
            action = action[:50] + "..."
        
        # 템플릿에 동작 적용
        transformed = template.format(action=action)
        
        logger.info(f"템플릿 변환 성공: {original_text[:30]}... -> {transformed[:30]}...")
        return transformed
    
    def validate_transformation(self, original: str, transformed: str) -> bool:
        """
        변환이 성공적으로 이루어졌는지 검증합니다.
        
        Args:
            original (str): 원본 텍스트
            transformed (str): 변환된 텍스트
            
        Returns:
            bool: 변환 성공 여부
        """
        # 기본 검증: 변환된 텍스트가 있고, 원본과 다른지 확인
        if not transformed or transformed == original:
            return False
        
        # 변환된 텍스트가 원본보다 길어야 함 (과장했으므로)
        if len(transformed) <= len(original):
            return False
        
        # 최소한 하나 이상의 숫자가 포함되어야 함
        has_number = any(char.isdigit() for char in transformed)
        
        return has_number


# 서비스 인스턴스를 싱글톤으로 관리
_ai_service_instance = None


def get_ai_service() -> AIService:
    """
    AIService의 싱글톤 인스턴스를 반환합니다.
    
    Returns:
        AIService: AI 서비스 인스턴스
    """
    global _ai_service_instance
    if _ai_service_instance is None:
        _ai_service_instance = AIService()
    return _ai_service_instance