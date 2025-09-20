'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Edit, Trash2, BookOpen, Loader2, Search } from 'lucide-react'
import { createClient } from '../../../lib/supabase'
import { getCategoryLabel } from '../../../lib/constants/categories'
import { getDifficultyLabel, getDifficultyColor } from '../../../lib/constants/difficulty-levels'

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
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-4 border-b">
            <div className="relative max-w-md">
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
            <table className="w-full min-w-[1200px]">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                    操作
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[200px]">
                    タイトル
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[300px]">
                    説明
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                    カテゴリ
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                    難易度
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-28">
                    レッスン数
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-28">
                    ステータス
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                    最終更新
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                    その他
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCourses.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
                      カリキュラムがありません
                    </td>
                  </tr>
                ) : (
                  filteredCourses.map((course) => {
                  const lessonCount = course.lessons?.[0]?.count || 0
                  
                  return (
                    <tr key={course.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <Link
                            href={`/dashboard/courses/${course.id}/edit`}
                            className="p-1.5 text-purple-600 hover:text-purple-900 hover:bg-purple-50 rounded transition-colors"
                            title="編集"
                          >
                            <Edit className="h-4 w-4" />
                          </Link>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/dashboard/courses/${course.id}`}
                          className="text-sm font-medium text-gray-900 hover:text-purple-600 block"
                        >
                          {course.title}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-gray-600" title={course.description || ''}>
                          {course.description || '-'}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm text-gray-600">
                          {getCategoryLabel(course.category)}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getDifficultyColor(course.difficulty_level)}`}>
                          {getDifficultyLabel(course.difficulty_level)}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm text-gray-600">
                          {lessonCount} レッスン
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          course.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {course.is_active ? 'アクティブ' : '非公開'}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                        {course.updated_at ? new Date(course.updated_at).toLocaleDateString('ja-JP') : '-'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-center text-sm font-medium">
                        <div className="flex items-center justify-center space-x-2">
                          <Link
                            href={`/dashboard/courses/${course.id}`}
                            className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                            title="詳細表示"
                          >
                            <BookOpen className="h-4 w-4" />
                          </Link>
                          <button
                            onClick={() => handleDelete(course.id)}
                            className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                            title="削除"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
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