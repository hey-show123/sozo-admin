'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { Users, Shield, Eye, Book, UserCog } from 'lucide-react'

interface User {
  id: string
  email: string
  role: string
  created_at: string
  last_sign_in_at: string | null
  profiles?: {
    username: string | null
    avatar_url: string | null
  }
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      // ユーザー一覧を取得
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select(`
          *,
          profiles!inner(username, avatar_url)
        `)
        .order('created_at', { ascending: false })

      if (usersError) throw usersError

      setUsers(usersData || [])
    } catch (error) {
      console.error('Error loading users:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateUserRole = async (userId: string, newRole: string) => {
    setUpdatingUserId(userId)
    try {
      const { error } = await supabase
        .from('users')
        .update({ role: newRole })
        .eq('id', userId)

      if (error) throw error

      alert('ユーザー権限を更新しました')
      loadUsers()
    } catch (error) {
      console.error('Error updating user role:', error)
      alert('権限の更新に失敗しました')
    } finally {
      setUpdatingUserId(null)
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'super_admin':
        return <Shield className="h-4 w-4" />
      case 'admin':
        return <UserCog className="h-4 w-4" />
      case 'viewer':
        return <Eye className="h-4 w-4" />
      default:
        return <Book className="h-4 w-4" />
    }
  }

  const getRoleLabel = (role: string) => {
    const labels: { [key: string]: string } = {
      'super_admin': 'スーパー管理者',
      'admin': '管理者',
      'viewer': '閲覧者',
      'learner': '学習者'
    }
    return labels[role] || role
  }

  const getRoleColor = (role: string) => {
    const colors: { [key: string]: string } = {
      'super_admin': 'bg-purple-100 text-purple-800',
      'admin': 'bg-blue-100 text-blue-800',
      'viewer': 'bg-green-100 text-green-800',
      'learner': 'bg-gray-100 text-gray-800'
    }
    return colors[role] || 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">読み込み中...</div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">ユーザー管理</h1>
        <p className="mt-2 text-gray-600">ユーザーの一覧と権限管理</p>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ユーザー
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                権限
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                登録日
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                最終ログイン
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                権限変更
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      {user.profiles?.avatar_url ? (
                        <img 
                          className="h-10 w-10 rounded-full" 
                          src={user.profiles.avatar_url} 
                          alt="" 
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                          <Users className="h-5 w-5 text-gray-600" />
                        </div>
                      )}
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {user.profiles?.username || 'ユーザー名未設定'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {user.email}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                    {getRoleIcon(user.role)}
                    {getRoleLabel(user.role)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(user.created_at).toLocaleDateString('ja-JP')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {user.last_sign_in_at 
                    ? new Date(user.last_sign_in_at).toLocaleDateString('ja-JP')
                    : '未ログイン'
                  }
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <select
                    value={user.role}
                    onChange={(e) => updateUserRole(user.id, e.target.value)}
                    disabled={updatingUserId === user.id}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:opacity-50"
                  >
                    <option value="learner">学習者</option>
                    <option value="viewer">閲覧者</option>
                    <option value="admin">管理者</option>
                    <option value="super_admin">スーパー管理者</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-800 mb-2">権限について</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li><strong>学習者:</strong> アプリの学習機能のみ利用可能</li>
          <li><strong>閲覧者:</strong> 管理画面の閲覧のみ可能</li>
          <li><strong>管理者:</strong> コンテンツの作成・編集が可能</li>
          <li><strong>スーパー管理者:</strong> すべての機能とユーザー管理が可能</li>
        </ul>
      </div>
    </div>
  )
} 