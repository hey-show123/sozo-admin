export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">ダッシュボード</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">総レッスン数</h3>
          <p className="text-3xl font-bold text-gray-900">24</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">アクティブユーザー</h3>
          <p className="text-3xl font-bold text-gray-900">156</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">今週の学習時間</h3>
          <p className="text-3xl font-bold text-gray-900">342時間</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">平均完了率</h3>
          <p className="text-3xl font-bold text-gray-900">78%</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">最近のアクティビティ</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-gray-600">新規レッスン作成</span>
              <span className="text-sm text-gray-500">2時間前</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-gray-600">ユーザー登録</span>
              <span className="text-sm text-gray-500">5時間前</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-gray-600">AI設定更新</span>
              <span className="text-sm text-gray-500">1日前</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">クイックアクション</h2>
          <div className="grid grid-cols-2 gap-4">
            <a href="/lessons/new" className="block p-4 text-center bg-pink-50 rounded-lg hover:bg-pink-100 transition">
              <span className="text-pink-600 font-medium">新規レッスン</span>
            </a>
            <a href="/courses/new" className="block p-4 text-center bg-purple-50 rounded-lg hover:bg-purple-100 transition">
              <span className="text-purple-600 font-medium">新規コース</span>
            </a>
            <a href="/users" className="block p-4 text-center bg-blue-50 rounded-lg hover:bg-blue-100 transition">
              <span className="text-blue-600 font-medium">ユーザー管理</span>
            </a>
            <a href="/ai-settings" className="block p-4 text-center bg-green-50 rounded-lg hover:bg-green-100 transition">
              <span className="text-green-600 font-medium">AI設定</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}