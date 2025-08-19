'use client'

import { useState, useEffect } from 'react'
import { Search, Filter, MoreVertical, Loader2, Trophy, Target, Calendar, TrendingUp } from 'lucide-react'
import { createClient } from '../../../lib/supabase'

interface Profile {
  id: string
  email: string | null
  display_name: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
  current_level: number | null
  total_xp: number | null
  streak_count: number | null
  last_login_date: string | null
  subscription_type: string | null
  current_league: string | null
  beauty_field: string | null
  onboarding_completed: boolean | null
}

export default function UsersPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [users, setUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchUsers()
  }, [])

  async function fetchUsers() {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setUsers(data || [])
    } catch (error) {
      console.error('Error fetching users:', error)
      setError('ユーザーの取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('このユーザーを削除してもよろしいですか？')) return

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', id)

      if (error) throw error
      
      // 成功したらリストを更新
      setUsers(users.filter(user => user.id !== id))
    } catch (error) {
      console.error('Error deleting user:', error)
      alert('ユーザーの削除に失敗しました')
    }
  }

  const filteredUsers = users.filter(user =>
    (user.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
    (user.email?.toLowerCase().includes(searchTerm.toLowerCase()) || false)
  )

  const getSubscriptionBadge = (type: string | null) => {
    switch (type) {
      case 'premium':
        return 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white'
      case 'basic':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getLeagueBadge = (league: string | null) => {
    switch (league) {
      case 'legend':
        return 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
      case 'gold':
        return 'bg-yellow-100 text-yellow-800'
      case 'silver':
        return 'bg-gray-200 text-gray-800'
      case 'bronze':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-gray-100 text-gray-600'
    }
  }

  const formatLastLogin = (date: string | null) => {
    if (!date) return '未ログイン'
    const lastLogin = new Date(date)
    const now = new Date()
    const diff = now.getTime() - lastLogin.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    
    if (days > 0) return `${days}日前`
    if (hours > 0) return `${hours}時間前`
    return '1時間以内'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-lg">
        <p className="text-red-600">{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">ユーザー管理</h1>
        <div className="flex gap-2">
          <span className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm">
            総ユーザー数: {users.length}
          </span>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="ユーザーを検索..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ユーザー
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  レベル・XP
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  リーグ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  サブスクリプション
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  最終ログイン
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  アクション
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    ユーザーが見つかりません
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {user.avatar_url ? (
                          <img 
                            src={user.avatar_url} 
                            alt={user.display_name || 'User'}
                            className="h-10 w-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                            <span className="text-white font-medium">
                              {(user.display_name || user.email || '?').charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.display_name || 'ユーザー名未設定'}
                          </div>
                          <div className="text-sm text-gray-500">{user.email || 'メール未設定'}</div>
                          {user.beauty_field && (
                            <div className="text-xs text-purple-600 mt-1">
                              {user.beauty_field}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Trophy className="h-4 w-4 text-yellow-500 mr-1" />
                        <span className="text-sm font-medium text-gray-900">
                          Lv.{user.current_level || 1}
                        </span>
                        <span className="text-xs text-gray-500 ml-2">
                          {user.total_xp || 0} XP
                        </span>
                      </div>
                      {user.streak_count && user.streak_count > 0 && (
                        <div className="flex items-center mt-1">
                          <Calendar className="h-3 w-3 text-orange-500 mr-1" />
                          <span className="text-xs text-orange-600">
                            {user.streak_count}日連続
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getLeagueBadge(user.current_league)}`}>
                        {user.current_league || 'なし'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getSubscriptionBadge(user.subscription_type)}`}>
                        {user.subscription_type || 'フリー'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatLastLogin(user.last_login_date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button 
                        onClick={() => handleDelete(user.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        削除
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}