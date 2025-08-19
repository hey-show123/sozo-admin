'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeft, 
  Plus, 
  Edit, 
  Trash2, 
  Loader2, 
  BookOpen,
  ChevronRight,
  Save
} from 'lucide-react'
import { createClient } from '../../../../lib/supabase'

interface Curriculum {
  id: string
  title: string
  description: string | null
  difficulty_level: number
  category: string
  is_active: boolean | null
}

interface Lesson {
  id: string
  curriculum_id: string
  title: string
  description: string | null
  order_index: number | null
  lesson_type: string | null
  difficulty_score: number | null
  is_active: boolean | null
}

export default function CourseDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [curriculum, setCurriculum] = useState<Curriculum | null>(null)
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingLesson, setEditingLesson] = useState<string | null>(null)
  const [newLessonTitle, setNewLessonTitle] = useState('')

  useEffect(() => {
    fetchCourseData()
  }, [params.id])

  async function fetchCourseData() {
    try {
      const supabase = createClient()
      
      // カリキュラム情報を取得
      const { data: curriculumData, error: curriculumError } = await supabase
        .from('curriculums')
        .select('*')
        .eq('id', params.id)
        .single()

      if (curriculumError) throw curriculumError
      setCurriculum(curriculumData)

      // レッスンを取得
      const { data: lessonsData, error: lessonsError } = await supabase
        .from('lessons')
        .select('*')
        .eq('curriculum_id', params.id)
        .order('order_index', { ascending: true })

      if (lessonsError) throw lessonsError
      setLessons(lessonsData || [])
    } catch (error) {
      console.error('Error fetching curriculum data:', error)
      setError('カリキュラムデータの取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  async function handleAddLesson() {
    if (!newLessonTitle.trim()) return

    try {
      const supabase = createClient()
      const maxOrder = Math.max(...lessons.map(l => l.order_index || 0), 0)
      
      const { data, error } = await supabase
        .from('lessons')
        .insert([{
          curriculum_id: params.id,
          title: newLessonTitle,
          order_index: maxOrder + 1,
          is_active: true
        }])
        .select()
        .single()

      if (error) throw error

      setLessons([...lessons, data])
      setNewLessonTitle('')
    } catch (error) {
      console.error('Error adding lesson:', error)
      alert('レッスンの追加に失敗しました')
    }
  }

  async function handleUpdateLesson(lessonId: string, title: string) {
    try {
      const supabase = createClient()
      
      const { error } = await supabase
        .from('lessons')
        .update({ title })
        .eq('id', lessonId)

      if (error) throw error

      setLessons(lessons.map(l => 
        l.id === lessonId ? { ...l, title } : l
      ))
      setEditingLesson(null)
    } catch (error) {
      console.error('Error updating lesson:', error)
      alert('レッスンの更新に失敗しました')
    }
  }

  async function handleDeleteLesson(lessonId: string) {
    if (!confirm('このレッスンを削除してもよろしいですか？')) return

    try {
      const supabase = createClient()
      
      const { error } = await supabase
        .from('lessons')
        .delete()
        .eq('id', lessonId)

      if (error) throw error

      setLessons(lessons.filter(l => l.id !== lessonId))
    } catch (error) {
      console.error('Error deleting lesson:', error)
      alert('レッスンの削除に失敗しました')
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

  if (error || !curriculum) {
    return (
      <div className="bg-red-50 p-4 rounded-lg">
        <p className="text-red-600">{error || 'カリキュラムが見つかりません'}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href="/dashboard/courses"
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{curriculum.title}</h1>
            {curriculum.description && (
              <p className="text-gray-600 mt-1">{curriculum.description}</p>
            )}
            <div className="flex items-center gap-4 mt-2">
              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getDifficultyColor(curriculum.difficulty_level)}`}>
                {getDifficultyLabel(curriculum.difficulty_level)}
              </span>
              <span className="text-sm text-gray-500">{curriculum.category}</span>
            </div>
          </div>
        </div>
        <Link
          href={`/dashboard/courses/${params.id}/edit`}
          className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
        >
          <Edit className="h-4 w-4 mr-2" />
          カリキュラム編集
        </Link>
      </div>

      {/* レッスン一覧セクション */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">レッスン構成</h2>
          <p className="text-sm text-gray-600 mt-1">
            全{lessons.length}レッスン
          </p>
        </div>

        <div className="p-6">
          {/* 新規レッスン追加 */}
          <div className="mb-6">
            <div className="flex space-x-2">
              <input
                type="text"
                value={newLessonTitle}
                onChange={(e) => setNewLessonTitle(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddLesson()}
                placeholder="新しいレッスンのタイトル"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <button
                onClick={handleAddLesson}
                className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
              >
                <Plus className="h-4 w-4 mr-2" />
                レッスン追加
              </button>
            </div>
          </div>

          {/* レッスン一覧 */}
          <div className="space-y-2">
            {lessons.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                まだレッスンがありません
              </div>
            ) : (
              lessons.map((lesson, index) => (
                <div key={lesson.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-sm text-gray-500 font-medium">
                        レッスン {index + 1}
                      </span>
                      {editingLesson === lesson.id ? (
                        <input
                          type="text"
                          defaultValue={lesson.title}
                          onBlur={(e) => handleUpdateLesson(lesson.id, e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              handleUpdateLesson(lesson.id, (e.target as HTMLInputElement).value)
                            }
                          }}
                          className="px-2 py-1 border rounded"
                          autoFocus
                        />
                      ) : (
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {lesson.title}
                          </h3>
                          {lesson.description && (
                            <p className="text-sm text-gray-600 mt-1">{lesson.description}</p>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      {lesson.lesson_type && (
                        <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                          {lesson.lesson_type}
                        </span>
                      )}
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        lesson.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {lesson.is_active ? 'アクティブ' : '非公開'}
                      </span>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setEditingLesson(lesson.id)}
                          className="p-1 text-gray-600 hover:text-gray-900"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <Link
                          href={`/dashboard/lessons/${lesson.id}/edit`}
                          className="p-1 text-purple-600 hover:text-purple-900"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => handleDeleteLesson(lesson.id)}
                          className="p-1 text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}