/**
 * 홈 페이지 컴포넌트
 */
function Home() {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-center">
        Welcome to Shamstagram
      </h2>
      
      <div className="card max-w-2xl mx-auto">
        <p className="text-lg text-gray-600 mb-4">
          평범한 일상을 AI가 화려하게 과장해주는 재미있는 SNS입니다.
        </p>
        
        <div className="space-y-4">
          <button className="btn btn-primary w-full">
            시작하기
          </button>
          
          <button className="btn btn-secondary w-full">
            더 알아보기
          </button>
        </div>
      </div>
      
      {/* 샘플 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="card animate-fade-in">
            <h3 className="text-xl font-semibold mb-2">
              기능 {i}
            </h3>
            <p className="text-gray-600">
              여기에 기능 설명이 들어갑니다.
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Home