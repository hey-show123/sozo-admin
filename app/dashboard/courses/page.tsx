'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Edit, Trash2, BookOpen, Loader2 } from 'lucide-react'
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => {
            const lessonCount = course.lessons?.[0]?.count || 0
            
            return (
              <div key={course.id} className="bg-white rounded-lg shadow hover:shadow-lg transition cursor-pointer">
                <Link href={`/dashboard/courses/${course.id}`}>
                  {course.image_url && (
                    <img 
                      src={course.image_url} 
                      alt={course.title}
                      className="w-full h-48 object-cover rounded-t-lg"
                    />
                  )}
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 hover:text-purple-600 transition">
                        {course.title}
                      </h3>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        course.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {course.is_active ? 'アクティブ' : '非公開'}
                      </span>
                    </div>

                    {course.description && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {course.description}
                      </p>
                    )}

                    <div className="flex items-center gap-4 mb-3">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getDifficultyColor(course.difficulty_level)}`}>
                        {getDifficultyLabel(course.difficulty_level)}
                      </span>
                      <span className="text-xs text-gray-500">{course.category}</span>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <BookOpen className="h-4 w-4 mr-2" />
                        <span>{lessonCount} レッスン</span>
                      </div>
                    </div>
                  </div>
                </Link>
                
                <div className="px-6 pb-6">
                  <div className="flex space-x-2">
                    <Link
                      href={`/dashboard/courses/${course.id}`}
                      className="flex-1 flex items-center justify-center px-3 py-2 bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition"
                    >
                      <BookOpen className="h-4 w-4 mr-1" />
                      カリキュラム
                    </Link>
                    <Link
                      href={`/dashboard/courses/${course.id}/edit`}
                      className="flex-1 flex items-center justify-center px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      編集
                    </Link>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDelete(course.id)
                      }}
                      className="px-3 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200 transition"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}