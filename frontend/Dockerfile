# 빌드 스테이지
FROM node:18-alpine as builder

# 작업 디렉토리 설정
WORKDIR /app

# 패키지 파일 복사
COPY package*.json ./

# 의존성 설치
RUN npm ci

# 소스 코드 복사
COPY . .

# 빌드 인자로 API URL 전달
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# 애플리케이션 빌드
RUN npm run build

# 프로덕션 스테이지
FROM nginx:alpine

# Nginx 설정 파일 복사
COPY nginx.conf /etc/nginx/nginx.conf

# 빌드된 파일 복사
COPY --from=builder /app/dist /usr/share/nginx/html

# 포트 노출
EXPOSE 80

# Nginx 실행
CMD ["nginx", "-g", "daemon off;"]