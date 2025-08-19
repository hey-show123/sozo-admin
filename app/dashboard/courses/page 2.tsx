'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { Plus, Pencil, Trash2, GraduationCap, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'

interface Course {
  id: string
  title: string
  description: string | null
  difficulty: string
  is_active: boolean
  created_at: string
  updated_at: string
  module_count?: number
}

type SortField = 'title' | 'difficulty' | 'module_count' | 'created_at' | 'is_active'
type SortDirection = 'asc' | 'desc'

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [sortField, setSortField] = useState<SortField>('created_at')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const supabase = createClient()

  useEffect(() => {
    loadCourses()
  }, [])

  useEffect(() => {
    const sorted = [...courses].sort((a, b) => {
      let aValue: any, bValue: any

      switch (sortField) {
        case 'title':
          aValue = a.title.toLowerCase()
          bValue = b.title.toLowerCase()
          break
        case 'difficulty':
          const difficultyOrder = { beginner: 1, elementary: 2, intermediate: 3, advanced: 4 }
          aValue = difficultyOrder[a.difficulty as keyof typeof difficultyOrder] || 0
          bValue = difficultyOrder[b.difficulty as keyof typeof difficultyOrder] || 0
          break
        case 'module_count':
          aValue = a.module_count || 0
          bValue = b.module_count || 0
          break
        case 'created_at':
          aValue = new Date(a.created_at).getTime()
          bValue = new Date(b.created_at).getTime()
          break
        case 'is_active':
          aValue = a.is_active ? 1 : 0
          bValue = b.is_active ? 1 : 0
          break
        default:
          aValue = a.created_at
          bValue = b.created_at
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
      return 0
    })

    setFilteredCourses(sorted)
  }, [courses, sortField, sortDirection])

  const loadCourses = async () => {
    try {
      // コース一覧を取得
      const { data: coursesData, error: coursesError } = await supabase
        .from('courses')
        .select('*')
        .order('created_at', { ascending: false })

      if (coursesError) throw coursesError

      // 各コースのモジュール数を取得
      if (coursesData) {
        const coursesWithCount = await Promise.all(
          coursesData.map(async (course) => {
            const { count } = await supabase
              .from('modules')
              .select('*', { count: 'exact', head: true })
              .eq('course_id', course.id)
            
            return {
              ...course,
              module_count: count || 0
            }
          })
        )
        setCourses(coursesWithCount)
      }
    } catch (error) {
      console.error('Error loading courses:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('このコースを削除してもよろしいですか？関連するモジュールとレッスンも削除されます。')) {
      return
    }

    try {
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', id)

      if (error) throw error

      alert('コースを削除しました')
      loadCourses()
    } catch (error) {
      console.error('Error deleting course:', error)
      alert('コースの削除に失敗しました')
    }
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4 text-gray-400" />
    }
    return sortDirection === 'asc' 
      ? <ArrowUp className="h-4 w-4 text-indigo-600" />
      : <ArrowDown className="h-4 w-4 text-indigo-600" />
  }

  const getSortFieldLabel = (field: SortField) => {
    const labels: { [key in SortField]: string } = {
      title: 'コース名',
      difficulty: '難易度',
      module_count: 'モジュール数',
      is_active: 'ステータス',
      created_at: '作成日'
    }
    return labels[field]
  }

  const getDifficultyLabel = (difficulty: string) => {
    const labels: { [key: string]: string } = {
      beginner: '初級',
      elementary: '初中級',
      intermediate: '中級',
      advanced: '上級'
    }
    return labels[difficulty] || difficulty
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
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">カリキュラム管理</h1>
          <p className="mt-2 text-gray-600">
            学習カリキュラムの作成と管理 ({filteredCourses.length} 件のカリキュラム)
          </p>
          {sortField && (
            <p className="mt-1 text-sm text-indigo-600">
              {getSortFieldLabel(sortField)}で{sortDirection === 'asc' ? '昇順' : '降順'}にソート中
            </p>
          )}
        </div>
        <Link
          href="/courses/new"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <Plus className="h-5 w-5 mr-2" />
          新しいカリキュラム
        </Link>
      </div>

      {filteredCourses.length === 0 ? (
        <div className="bg-white shadow rounded-lg p-12 text-center">
          <GraduationCap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">まだカリキュラムがありません</p>
          <Link
            href="/courses/new"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            最初のカリキュラムを作成
          </Link>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort('title')}
                >
                  <div className="flex items-center space-x-1">
                    <span>コース名</span>
                    {getSortIcon('title')}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort('difficulty')}
                >
                  <div className="flex items-center space-x-1">
                    <span>難易度</span>
                    {getSortIcon('difficulty')}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort('module_count')}
                >
                  <div className="flex items-center space-x-1">
                    <span>モジュール数</span>
                    {getSortIcon('module_count')}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort('is_active')}
                >
                  <div className="flex items-center space-x-1">
                    <span>ステータス</span>
                    {getSortIcon('is_active')}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort('created_at')}
                >
                  <div className="flex items-center space-x-1">
                    <span>作成日</span>
                    {getSortIcon('created_at')}
                  </div>
                </th>
                <th className="relative px-6 py-3">
                  <span className="sr-only">アクション</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCourses.map((course) => (
                <tr key={course.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {course.title}
                      </div>
                      {course.description && (
                        <div className="text-sm text-gray-500">
                          {course.description}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {getDifficultyLabel(course.difficulty)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {course.module_count} モジュール
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      course.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {course.is_active ? 'アクティブ' : '非アクティブ'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(course.created_at).toLocaleDateString('ja-JP')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link
                      href={`/courses/${course.id}/edit`}
                      className="text-indigo-600 hover:text-indigo-900 mr-4"
                    >
                      <Pencil className="h-4 w-4 inline" />
                    </Link>
                    <button
                      onClick={() => handleDelete(course.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="h-4 w-4 inline" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
} 