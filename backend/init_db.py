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
        
        # 샘플 사용자 생성 (개발/테스트용)
        print("\n👥 샘플 사용자 생성 중...")
        from app.services.auth_service import AuthService
        
        sample_users = [
            {
                'email': 'demo@example.com',
                'nickname': '과장왕',
                'password': 'demo1234',
                'avatar': 1
            },
            {
                'email': 'test@example.com',
                'nickname': '허풍쟁이',
                'password': 'test1234',
                'avatar': 2
            }
        ]
        
        created_users = []
        for user_data in sample_users:
            # 이미 존재하는지 확인
            existing_user = User.query.filter_by(email=user_data['email']).first()
            if not existing_user:
                user = User(
                    email=user_data['email'],
                    nickname=user_data['nickname'],
                    password_hash=AuthService.hash_password(user_data['password']),
                    avatar=user_data['avatar']
                )
                db.session.add(user)
                created_users.append(user)
        
        db.session.commit()
        
        # 샘플 게시물 생성
        print("📝 샘플 게시물 생성 중...")
        import random
        
        sample_posts = [
            "오늘 점심에 라면 먹었어요",
            "주말에 집에서 쉬었습니다",
            "새로운 프로젝트 시작했어요",
            "운동 30분 했습니다",
            "책 한 권 읽었어요"
        ]
        
        # 첫 번째 샘플 사용자로 게시물 생성
        if created_users:
            for post_text in sample_posts:
                post = Post(
                    user_id=created_users[0].id,
                    original_text=post_text,
                    ai_text=f"[AI 변환 예정] {post_text}",  # 9단계에서 실제 AI 변환 구현
                    likes=random.randint(50000, 2000000)
                )
                db.session.add(post)
        
        db.session.commit()
        
        print("\n✅ 데이터베이스 초기화 완료!")
        print("\n📋 생성된 초대 토큰:")
        for inv in invitations:
            print(f"  - {inv.email}: {inv.token}")
        
        if created_users:
            print("\n👥 생성된 샘플 사용자:")
            for user in created_users:
                print(f"  - {user.email} / 비밀번호: {[u['password'] for u in sample_users if u['email'] == user.email][0]}")
        
        print(f"\n🌐 초대 URL 예시:")
        frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:8080')
        print(f"  {frontend_url}/?token={invitations[0].token}")


if __name__ == '__main__':
    init_database()