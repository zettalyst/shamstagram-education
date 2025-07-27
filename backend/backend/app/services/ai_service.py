"""
AI 서비스 (스텁)
교육용 프로젝트 - 11단계에서는 기본 구조만 제공
"""

class AIService:
    """AI 텍스트 변환 서비스"""
    
    def transform_text(self, text):
        """텍스트를 AI로 변환 (스텁)
        
        Args:
            text: 원본 텍스트
            
        Returns:
            str: 변환된 텍스트 (현재는 원본 반환)
        """
        # 11단계에서는 원본 텍스트를 그대로 반환
        return text + " (AI 변환 예정)"

# 서비스 인스턴스 생성
ai_service = AIService()