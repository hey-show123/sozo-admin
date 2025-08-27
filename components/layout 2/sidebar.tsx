'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { BookOpen, Users, LogOut, GraduationCap, Home, Brain } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { useState, useEffect } from 'react'

const baseNavigation = [
  { name: 'ダッシュボード', href: '/', icon: Home },
  { name: 'カリキュラム', href: '/courses', icon: BookOpen },
  { name: 'レッスン', href: '/lessons', icon: GraduationCap },
  { name: 'ユーザー', href: '/users', icon: Users },
]

const superAdminNavigation = [
  { name: 'AI設定', href: '/ai-settings', icon: Brain, superAdminOnly: true },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [userRole, setUserRole] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUserPermissions()
  }, [])

  const fetchUserPermissions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserEmail(user.email)
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()
        
        setUserRole(profile?.role || null)
      }
    } catch (error) {
      console.error('Error fetching user permissions:', error)
    } finally {
      setLoading(false)
    }
  }

  const isSuperAdmin = () => {
    return userRole === 'super_admin' || userEmail === 'hey_show@icloud.com'
  }

  const navigation = [
    ...baseNavigation,
    ...(isSuperAdmin() ? superAdminNavigation : [])
  ]

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="flex h-full w-72 flex-col bg-white border-r border-gray-200">
      <div className="flex h-20 items-center px-6 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
          SOZO
          <span className="text-gray-600 font-normal ml-2 text-lg">Admin</span>
        </h1>
      </div>
      <nav className="flex-1 space-y-1 px-4 py-6">
        {!loading && navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`
                group flex items-center px-4 py-3 text-sm font-medium rounded-xl
                transition-all duration-200 ease-in-out
                ${isActive 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }
              `}
            >
              <item.icon
                className={`
                  mr-3 h-5 w-5 flex-shrink-0 transition-colors duration-200
                  ${isActive 
                    ? 'text-white' 
                    : 'text-gray-400 group-hover:text-gray-600'
                  }
                `}
              />
              <span className="tracking-wide">{item.name}</span>
              {item.superAdminOnly && (
                <span className="ml-auto text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                  SA
                </span>
              )}
              {isActive && (
                <div className="ml-auto h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
              )}
            </Link>
          )
        })}
      </nav>
      <div className="border-t border-gray-200 p-4">
        <button
          onClick={handleLogout}
          className="group flex w-full items-center px-4 py-3 text-sm font-medium rounded-xl
                     text-gray-600 hover:bg-gray-100 
                     hover:text-red-600 transition-all duration-200 ease-in-out"
        >
          <LogOut className="mr-3 h-5 w-5 flex-shrink-0 text-gray-400 
                           group-hover:text-red-600 transition-colors duration-200" />
          <span className="tracking-wide">ログアウト</span>
        </button>
      </div>
    </div>
  )
}