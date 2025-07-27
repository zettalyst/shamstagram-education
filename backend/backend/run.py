"""
개발 서버 실행 스크립트
교육용 프로젝트 - 11단계: Comments Backend
"""

from app import create_app

app = create_app()

if __name__ == '__main__':
    app.run(debug=True, port=5000)