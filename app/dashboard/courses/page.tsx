'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Edit, Trash2, BookOpen, Loader2, Search } from 'lucide-react'
import { createClient } from '../../../lib/supabase'

interface Course {
  id: string
  title: string
  description: string | null
  difficulty_level: number
  category: string
  image_url: string | null
  prerequisites: string[] | null
  is_active: boolean | null
  created_at: string | null
  updated_at: string | null
  lessons?: { count: number }[]
}

export default function CoursesPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchCourses()
  }, [])

  async function fetchCourses() {
    try {
      const supabase = createClient()
      
      // カリキュラムデータと関連するレッスン数を取得
      const { data: coursesData, error: coursesError } = await supabase
        .from('curriculums')
        .select(`
          *,
          lessons:lessons(count)
        `)
        .order('created_at', { ascending: false })

      if (coursesError) throw coursesError
      setCourses(coursesData || [])
    } catch (error) {
      console.error('Error fetching courses:', error)
      setError('カリキュラムの取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('このカリキュラムを削除してもよろしいですか？関連するレッスンも削除されます。')) return

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('curriculums')
        .delete()
        .eq('id', id)

      if (error) throw error
      
      // 成功したらリストを更新
      setCourses(courses.filter(course => course.id !== id))
    } catch (error) {
      console.error('Error deleting curriculum:', error)
      alert('カリキュラムの削除に失敗しました')
    }
  }

  const getDifficultyLabel = (level: number) => {
    switch (level) {
      case 1: return '初級'
      case 2: return '中級'
      case 3: return '上級'
      default: return '未設定'
    }
  }

  const getDifficultyColor = (level: number) => {
    switch (level) {
      case 1: return 'bg-green-100 text-green-800'
      case 2: return 'bg-yellow-100 text-yellow-800'
      case 3: return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredCourses = courses.filter(course =>
    course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (course.description?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
    course.category.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
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
        <h1 className="text-3xl font-bold text-gray-900">カリキュラム管理</h1>
        <Link
          href="/dashboard/courses/new"
          className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
        >
          <Plus className="h-5 w-5 mr-2" />
          新規カリキュラム
        </Link>
      </div>

      {courses.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">カリキュラムがありません</h3>
          <p className="text-gray-500 mb-4">新しいカリキュラムを作成してください</p>
          <Link
            href="/dashboard/courses/new"
            className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
          >
            <Plus className="h-5 w-5 mr-2" />
            最初のカリキュラムを作成
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="カリキュラムを検索..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    タイトル
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    説明
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    カテゴリ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    難易度
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    レッスン数
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ステータス
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    最終更新
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    アクション
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCourses.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                      カリキュラムがありません
                    </td>
                  </tr>
                ) : (
                  filteredCourses.map((course) => {
                  const lessonCount = course.lessons?.[0]?.count || 0
                  
                  return (
                    <tr key={course.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link
                          href={`/dashboard/courses/${course.id}`}
                          className="text-sm font-medium text-gray-900 hover:text-purple-600"
                        >
                          {course.title}
                        </Link>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600 max-w-xs truncate">
                          {course.description || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">
                          {course.category}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getDifficultyColor(course.difficulty_level)}`}>
                          {getDifficultyLabel(course.difficulty_level)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">
                          {lessonCount} レッスン
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          course.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {course.is_active ? 'アクティブ' : '非公開'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {course.updated_at ? new Date(course.updated_at).toLocaleDateString('ja-JP') : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link
                          href={`/dashboard/courses/${course.id}`}
                          className="text-purple-600 hover:text-purple-900 mr-3"
                        >
                          <BookOpen className="h-4 w-4 inline" />
                        </Link>
                        <Link
                          href={`/dashboard/courses/${course.id}/edit`}
                          className="text-gray-600 hover:text-gray-900 mr-3"
                        >
                          <Edit className="h-4 w-4 inline" />
                        </Link>
                        <button
                          onClick={() => handleDelete(course.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="h-4 w-4 inline" />
                        </button>
                      </td>
                    </tr>
                  )
                }))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}