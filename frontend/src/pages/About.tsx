/**
 * 소개 페이지 컴포넌트
 */
function About() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h2 className="text-3xl font-bold">About Shamstagram</h2>
      
      <div className="card">
        <h3 className="text-2xl font-semibold mb-4">프로젝트 소개</h3>
        <p className="text-gray-600 mb-4">
          Shamstagram은 교육 목적으로 만들어진 풀스택 웹 애플리케이션입니다.
          React, TypeScript, Flask, SQLAlchemy 등 현대적인 웹 기술을 활용합니다.
        </p>
        
        <h4 className="text-xl font-semibold mb-2">주요 기능</h4>
        <ul className="list-disc list-inside space-y-2 text-gray-600">
          <li>AI 텍스트 변환</li>
          <li>봇 페르소나 시스템</li>
          <li>실시간 댓글</li>
          <li>좋아요 기능</li>
          <li>초대 기반 가입</li>
        </ul>
      </div>
      
      <div className="card">
        <h3 className="text-2xl font-semibold mb-4">기술 스택</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="font-semibold mb-2">Frontend</h4>
            <ul className="text-gray-600 space-y-1">
              <li>• React 18</li>
              <li>• TypeScript</li>
              <li>• Vite</li>
              <li>• Tailwind CSS</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Backend</h4>
            <ul className="text-gray-600 space-y-1">
              <li>• Python Flask</li>
              <li>• SQLAlchemy</li>
              <li>• JWT Auth</li>
              <li>• OpenAI API</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default About