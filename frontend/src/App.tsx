import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import About from './pages/About'

/**
 * 메인 앱 컴포넌트
 * 
 * React Router를 사용하여 페이지 라우팅을 관리합니다.
 */
function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        {/* 헤더 */}
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <h1 className="text-2xl font-bold text-primary">
                Shamstagram
              </h1>
              <nav className="space-x-4">
                <a href="/" className="text-gray-700 hover:text-primary">
                  홈
                </a>
                <a href="/about" className="text-gray-700 hover:text-primary">
                  소개
                </a>
              </nav>
            </div>
          </div>
        </header>

        {/* 라우트 */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App