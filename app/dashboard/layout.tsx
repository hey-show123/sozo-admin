'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  BookOpen, 
  GraduationCap, 
  Users, 
  Settings,
  Menu,
  X,
  Home,
  Sparkles,
  Zap,
  AlignLeft
} from 'lucide-react'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const menuItems = [
    { href: '/dashboard', icon: Home, label: 'ダッシュボード' },
    { href: '/dashboard/lessons', icon: BookOpen, label: 'レッスン管理' },
    { href: '/dashboard/courses', icon: GraduationCap, label: 'カリキュラム管理' },
    { href: '/dashboard/users', icon: Users, label: 'ユーザー管理' },
    { href: '/dashboard/ai-settings', icon: Sparkles, label: 'AI設定' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* サイドバー */}
      <div className={`fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-gray-200 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out lg:translate-x-0`}>
        <div className="flex items-center justify-between h-20 px-6 border-b border-gray-200">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              SOZO Admin
            </h1>
            <p className="text-xs text-gray-500 mt-1">管理ダッシュボード</p>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-gray-500 hover:text-gray-700"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <nav className="mt-6 px-3 sidebar-nav">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center px-4 py-3 mb-2 rounded-lg font-medium transition-all duration-200 ${
                  isActive 
                    ? 'bg-gradient-to-r from-purple-50 to-pink-50 text-purple-700 border-l-4 border-purple-600' 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon className={`h-5 w-5 mr-3 ${isActive ? 'text-purple-600' : 'text-gray-400'}`} />
                <span className="text-sm">{item.label}</span>
                {isActive && (
                  <div className="ml-auto h-2 w-2 rounded-full bg-purple-600 animate-pulse" />
                )}
              </Link>
            )
          })}
        </nav>
        
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <div className="flex items-center px-3 py-2">
            <div className="h-8 w-8 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold text-sm">
              管
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-700">管理者</p>
              <p className="text-xs text-gray-500">admin@sozo.com</p>
            </div>
          </div>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className={`${sidebarOpen ? 'lg:ml-72' : ''} transition-all duration-300`}>
        {/* ヘッダー */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="text-gray-500 hover:text-gray-700 lg:hidden"
              >
                <Menu className="h-6 w-6" />
              </button>
              <h2 className="ml-4 text-xl font-semibold text-gray-800">
                {menuItems.find(item => item.href === pathname)?.label || 'ダッシュボード'}
              </h2>
            </div>
            <div className="flex items-center space-x-4">
              <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                <Settings className="h-5 w-5" />
              </button>
            </div>
          </div>
        </header>

        {/* ページコンテンツ */}
        <main className="p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}