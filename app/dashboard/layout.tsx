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
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out`}>
        <div className="flex items-center justify-between h-16 px-6 bg-gradient-to-r from-pink-500 to-purple-600">
          <h1 className="text-xl font-bold text-white">SOZO Admin</h1>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-white hover:text-gray-200"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <nav className="mt-8">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center px-6 py-3 text-gray-700 hover:bg-gray-100 hover:text-gray-900 ${
                  isActive ? 'bg-gray-100 border-r-4 border-pink-500' : ''
                }`}
              >
                <Icon className="h-5 w-5 mr-3" />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>
      </div>

      {/* メインコンテンツ */}
      <div className={`${sidebarOpen ? 'ml-64' : 'ml-0'} transition-all duration-300`}>
        {/* ヘッダー */}
        <header className="bg-white shadow-sm">
          <div className="flex items-center justify-between px-6 py-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-gray-500 hover:text-gray-700"
            >
              <Menu className="h-6 w-6" />
            </button>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">管理者</span>
            </div>
          </div>
        </header>

        {/* ページコンテンツ */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  )
}