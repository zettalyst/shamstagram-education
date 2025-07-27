/**
 * 포맷팅 유틸리티 함수들
 */

/**
 * 숫자를 한국식 단위로 포맷팅
 * 
 * @param num - 포맷팅할 숫자
 * @returns 포맷팅된 문자열
 * 
 * @example
 * formatNumber(1234) // "1,234"
 * formatNumber(12345) // "1.2만"
 * formatNumber(123456789) // "1.2억"
 */
export function formatNumber(num: number): string {
  if (num < 10000) {
    // 만 단위 미만은 콤마로 표시
    return num.toLocaleString('ko-KR');
  } else if (num < 100000000) {
    // 억 단위 미만은 만 단위로 표시
    return `${(num / 10000).toFixed(1).replace(/\.0$/, '')}만`;
  } else {
    // 억 단위 이상은 억 단위로 표시
    return `${(num / 100000000).toFixed(1).replace(/\.0$/, '')}억`;
  }
}

/**
 * 날짜를 상대적인 시간으로 포맷팅
 * 
 * @param dateString - ISO 날짜 문자열
 * @returns 상대적인 시간 문자열
 * 
 * @example
 * formatRelativeTime('2024-01-01T12:00:00') // "3일 전"
 */
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return '방금 전';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes}분 전`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours}시간 전`;
  } else if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days}일 전`;
  } else if (diffInSeconds < 2592000) {
    const weeks = Math.floor(diffInSeconds / 604800);
    return `${weeks}주 전`;
  } else if (diffInSeconds < 31536000) {
    const months = Math.floor(diffInSeconds / 2592000);
    return `${months}개월 전`;
  } else {
    const years = Math.floor(diffInSeconds / 31536000);
    return `${years}년 전`;
  }
}

/**
 * 날짜를 한국 형식으로 포맷팅
 * 
 * @param dateString - ISO 날짜 문자열
 * @returns 포맷팅된 날짜 문자열
 * 
 * @example
 * formatDate('2024-01-01T12:00:00') // "2024년 1월 1일"
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}