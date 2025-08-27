'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { BookOpen, Users, LogOut, GraduationCap, Layers, Brain, Home } from 'lucide-react'
import { createClient } from '@/lib/supabase'

const navigation = [
  { name: 'ダッシュボード', href: '/', icon: Home },
  { name: 'レッスン', href: '/lessons', icon: GraduationCap },
  { name: 'モジュール', href: '/modules', icon: Layers },
  { name: 'コース', href: '/courses', icon: BookOpen },
  { name: 'ユーザー', href: '/users', icon: Users },
  { name: 'AIチューニング', href: '/ai-tuning', icon: Brain },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="flex h-full w-72 flex-col bg-white dark:bg-[#222628] border-r border-[#ECF0F1] dark:border-[#3A3F42]">
      <div className="flex h-20 items-center px-6 border-b border-[#ECF0F1] dark:border-[#3A3F42]">
        <h1 className="text-2xl font-bold text-[#2C3E50] dark:text-[#ECF0F1] tracking-tight">
          SOZO
          <span className="text-[#7F8C8D] dark:text-[#BDC3C7] font-normal ml-2 text-lg">Admin</span>
        </h1>
      </div>
      <nav className="flex-1 space-y-1 px-4 py-6">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`
                group flex items-center px-4 py-3 text-sm font-medium rounded-xl
                transition-all duration-200 ease-in-out
                ${isActive 
                  ? 'bg-[#2C3E50] dark:bg-[#ECF0F1] text-white dark:text-[#1A1D1E] shadow-md' 
                  : 'text-[#7F8C8D] dark:text-[#BDC3C7] hover:bg-[#F8F9FA] dark:hover:bg-[#2C3134] hover:text-[#2C3E50] dark:hover:text-[#ECF0F1]'
                }
              `}
            >
              <item.icon
                className={`
                  mr-3 h-5 w-5 flex-shrink-0 transition-colors duration-200
                  ${isActive 
                    ? 'text-white dark:text-[#1A1D1E]' 
                    : 'text-[#BDC3C7] dark:text-[#7F8C8D] group-hover:text-[#2C3E50] dark:group-hover:text-[#ECF0F1]'
                  }
                `}
              />
              <span className="tracking-wide">{item.name}</span>
              {isActive && (
                <div className="ml-auto h-2 w-2 rounded-full bg-[#E8B87F] animate-pulse" />
              )}
            </Link>
          )
        })}
      </nav>
      <div className="border-t border-[#ECF0F1] dark:border-[#3A3F42] p-4">
        <button
          onClick={handleLogout}
          className="group flex w-full items-center px-4 py-3 text-sm font-medium rounded-xl
                     text-[#7F8C8D] dark:text-[#BDC3C7] hover:bg-[#F8F9FA] dark:hover:bg-[#2C3134] 
                     hover:text-[#E74C3C] dark:hover:text-[#E74C3C] transition-all duration-200 ease-in-out"
        >
          <LogOut className="mr-3 h-5 w-5 flex-shrink-0 text-[#BDC3C7] dark:text-[#7F8C8D] 
                           group-hover:text-[#E74C3C] transition-colors duration-200" />
          <span className="tracking-wide">ログアウト</span>
        </button>
      </div>
    </div>
  )
} 