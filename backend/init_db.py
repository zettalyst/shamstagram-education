"""
데이터베이스 초기화 스크립트

개발 환경에서 데이터베이스를 초기화하고 샘플 데이터를 생성합니다.
"""

import os
from app import create_app, db
from app.models import User, Post, Comment, Like, Invitation
from config.config import config


def init_database():
    """데이터베이스 초기화 및 샘플 데이터 생성"""
    
    # 애플리케이션 생성
    config_name = os.getenv('FLASK_ENV', 'development')
    app = create_app(config[config_name])
    
    with app.app_context():
        # 기존 테이블 삭제 및 재생성 (주의: 모든 데이터가 삭제됨!)
        print("🗑️  기존 테이블 삭제 중...")
        db.drop_all()
        
        print("🔨 새 테이블 생성 중...")
        db.create_all()
        
        # 샘플 초대 토큰 생성
        print("📧 샘플 초대 토큰 생성 중...")
        invitations = [
            Invitation(email='student1@example.com', token=Invitation.generate_token()),
            Invitation(email='student2@example.com', token=Invitation.generate_token()),
            Invitation(email='student3@example.com', token=Invitation.generate_token()),
            # 데모용 특별 토큰
            Invitation(email='demo@example.com', token='shamwow')
        ]
        
        for invitation in invitations:
            db.session.add(invitation)
        
        # 변경사항 저장
        db.session.commit()
        
        print("\n✅ 데이터베이스 초기화 완료!")
        print("\n📋 생성된 초대 토큰:")
        for inv in invitations:
            print(f"  - {inv.email}: {inv.token}")
        
        print(f"\n🌐 초대 URL 예시:")
        frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:8080')
        print(f"  {frontend_url}/?token={invitations[0].token}")


if __name__ == '__main__':
    init_database()