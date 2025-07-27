"""
Flask 개발 서버 실행 스크립트

개발 환경에서 Flask 애플리케이션을 실행합니다.
프로덕션에서는 gunicorn 등의 WSGI 서버를 사용해야 합니다.
"""

import os
from app import create_app
from config.config import config

# 환경 설정 가져오기 (기본값: development)
config_name = os.getenv('FLASK_ENV', 'development')
app = create_app(config[config_name])


if __name__ == '__main__':
    # 포트 설정 (환경 변수에서 가져오거나 기본값 5000)
    port = int(os.getenv('PORT', 5000))
    
    # 개발 환경 정보 출력
    print(f"\n{'='*50}")
    print(f"🚀 Shamstagram 백엔드 서버 시작")
    print(f"📍 환경: {config_name}")
    print(f"🌐 주소: http://localhost:{port}")
    print(f"📚 API 문서: http://localhost:{port}/api")
    print(f"🏥 헬스체크: http://localhost:{port}/api/health")
    print(f"{'='*50}\n")
    
    # 개발 서버 실행
    app.run(
        host='0.0.0.0',  # 모든 인터페이스에서 접근 가능
        port=port,
        debug=(config_name == 'development')
    )