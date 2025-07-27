# Shamstagram Education

AI 기반 SNS 프로젝트를 단계별로 학습하는 교육용 저장소입니다.

## 🎯 프로젝트 개요

Shamstagram은 사용자의 평범한 일상을 AI가 과장되게 변환하여 재미있는 경험을 제공하는 SNS입니다.
이 교육용 저장소는 전체 프로젝트를 15단계로 나누어 점진적으로 개발하는 과정을 담고 있습니다.

## 📚 브랜치 구조

총 15개의 브랜치로 구성되어 있으며, 각 브랜치는 특정 기능 구현에 집중합니다:

1. **1_project_setup** - 프로젝트 폴더 구조, README, .gitignore, 기본 설정 파일
2. **2_backend_foundation** - Flask 앱 초기화, 기본 라우트, CORS, 에러 핸들러
3. **3_database_models** - SQLAlchemy 모델 (User, Post, Comment, Like, Invitation)
4. **4_frontend_foundation** - React+Vite+TypeScript 설정, 라우터, Tailwind+shadcn/ui
5. **5_auth_backend** - JWT 인증, 로그인/회원가입 API, 비밀번호 해싱
6. **6_auth_frontend** - 로그인/회원가입 페이지, AuthContext, Protected routes
7. **7_posts_backend** - 게시물 CRUD API, 페이지네이션
8. **8_posts_frontend** - UI: MainFeed, CreatePost, PostCard 컴포넌트
9. **9_ai_transformation** - AI 텍스트 변환 (OpenAI API + 템플릿 폴백)
10. **10_bot_personas** - 6개 봇 페르소나, 지연 실행 시스템
11. **11_comments_backend** - 댓글 API, 스레드 구조, 봇 댓글 자동 생성
12. **12_comments_frontend** - 댓글 UI, 스레드 표시, 애니메이션
13. **13_likes_feature** - 좋아요 토글 API, 애니메이션
14. **14_invitation_system** - 초대 토큰 시스템, 이메일 초대
15. **15_docker_deployment** - Docker 설정, docker-compose, Nginx, 배포 준비

## 🚀 시작하기

각 브랜치로 체크아웃하여 단계별 구현 내용을 확인할 수 있습니다:

```bash
# 특정 단계로 이동
git checkout 1_project_setup

# 다음 단계로 이동
git checkout 2_backend_foundation
```

## 💡 학습 방법

1. 각 브랜치의 README를 읽고 해당 단계의 목표를 이해합니다.
2. 코드와 주석을 통해 구현 방법을 학습합니다.
3. 직접 코드를 작성해보며 실습합니다.
4. 다음 브랜치와 비교하여 변경사항을 확인합니다.

## 🛠 기술 스택

- **Backend**: Python, Flask, SQLAlchemy
- **Frontend**: React, TypeScript, Tailwind CSS
- **AI**: OpenAI API
- **Database**: SQLite
- **Deployment**: Docker, Nginx

## 📝 라이선스

교육 목적으로 자유롭게 사용 가능합니다.