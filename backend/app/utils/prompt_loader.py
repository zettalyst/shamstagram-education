# backend/app/utils/prompt_loader.py
"""
프롬프트 로더 유틸리티
JSON 파일에서 시스템 프롬프트와 템플릿을 로드합니다.
"""

import json
import os
import random
from typing import Dict, List, Optional
import logging

logger = logging.getLogger(__name__)


class PromptLoader:
    """프롬프트와 템플릿을 관리하는 유틸리티 클래스"""
    
    def __init__(self):
        """PromptLoader 초기화"""
        # 프롬프트 디렉토리 경로 설정
        self.prompts_dir = os.path.join(
            os.path.dirname(os.path.dirname(__file__)),
            'prompts'
        )
        
        # 캐시 초기화
        self._system_prompts = None
        self._templates = None
    
    def get_system_prompt(self, prompt_name: str = 'shamstagram_transformer') -> Optional[Dict]:
        """
        시스템 프롬프트를 가져옵니다.
        
        Args:
            prompt_name (str): 프롬프트 이름
            
        Returns:
            Optional[Dict]: 프롬프트 정보 (content, parameters 포함)
        """
        if self._system_prompts is None:
            self._load_system_prompts()
        
        return self._system_prompts.get(prompt_name)
    
    def get_random_template(self) -> Optional[str]:
        """
        랜덤 변환 템플릿을 가져옵니다.
        
        Returns:
            Optional[str]: 포맷된 템플릿 문자열
        """
        if self._templates is None:
            self._load_templates()
        
        if not self._templates:
            return None
        
        # 랜덤 템플릿 선택
        template_info = random.choice(self._templates['templates'])
        template = template_info['template']
        
        # 변수 값 생성
        variables = {}
        for var in template_info['variables']:
            if var == 'number':
                variables[var] = self._get_random_number()
            elif var == 'action':
                # action은 외부에서 제공되므로 플레이스홀더 유지
                variables[var] = '{action}'
        
        # 템플릿에 변수 적용 (action 제외)
        for var, value in variables.items():
            if var != 'action':
                template = template.replace(f'{{{var}}}', value)
        
        return template
    
    def get_all_templates(self) -> List[Dict]:
        """
        모든 템플릿 정보를 가져옵니다.
        
        Returns:
            List[Dict]: 템플릿 목록
        """
        if self._templates is None:
            self._load_templates()
        
        return self._templates.get('templates', [])
    
    def _load_system_prompts(self):
        """시스템 프롬프트를 JSON 파일에서 로드합니다."""
        try:
            prompts_file = os.path.join(self.prompts_dir, 'system_prompts.json')
            with open(prompts_file, 'r', encoding='utf-8') as f:
                self._system_prompts = json.load(f)
            logger.info(f"시스템 프롬프트 로드 완료: {len(self._system_prompts)}개")
        except Exception as e:
            logger.error(f"시스템 프롬프트 로드 실패: {e}")
            self._system_prompts = {}
    
    def _load_templates(self):
        """변환 템플릿을 JSON 파일에서 로드합니다."""
        try:
            templates_file = os.path.join(self.prompts_dir, 'transformation_templates.json')
            with open(templates_file, 'r', encoding='utf-8') as f:
                self._templates = json.load(f)
            logger.info(f"변환 템플릿 로드 완료: {len(self._templates.get('templates', []))}개")
        except Exception as e:
            logger.error(f"변환 템플릿 로드 실패: {e}")
            self._templates = {'templates': [], 'numbers': {}}
    
    def _get_random_number(self) -> str:
        """
        랜덤 숫자를 생성합니다.
        
        Returns:
            str: 포맷된 숫자 문자열
        """
        if not self._templates or 'numbers' not in self._templates:
            # 기본값
            return random.choice(['999', '10,000', '100만', '1억'])
        
        # 카테고리별 숫자 중 랜덤 선택
        number_categories = list(self._templates['numbers'].values())
        if number_categories:
            category = random.choice(number_categories)
            return random.choice(category)
        
        return '10,000'
    
    def load_bot_personas(self) -> Dict:
        """
        봇 페르소나 정보를 JSON 파일에서 로드합니다.
        
        Returns:
            Dict: 봇 페르소나 정보
        """
        try:
            personas_file = os.path.join(self.prompts_dir, 'bot_personas.json')
            with open(personas_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
            logger.info(f"봇 페르소나 로드 완료: {len(data.get('bot_personas', {}))}개")
            return data.get('bot_personas', {})
        except Exception as e:
            logger.error(f"봇 페르소나 로드 실패: {e}")
            return {}
    
    def reload(self):
        """프롬프트와 템플릿을 다시 로드합니다."""
        self._system_prompts = None
        self._templates = None
        logger.info("프롬프트와 템플릿 캐시 초기화됨")


# 싱글톤 인스턴스
_prompt_loader_instance = None


def get_prompt_loader() -> PromptLoader:
    """
    PromptLoader의 싱글톤 인스턴스를 반환합니다.
    
    Returns:
        PromptLoader: 프롬프트 로더 인스턴스
    """
    global _prompt_loader_instance
    if _prompt_loader_instance is None:
        _prompt_loader_instance = PromptLoader()
    return _prompt_loader_instance