'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Pencil, Plus, BookOpen, Clock, CheckCircle, XCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase'

interface Lesson {
  id: string
  title: string
  description?: string
  difficulty?: string
  estimated_minutes?: number
  lesson_type?: string
  is_active: boolean
  order_index: number
  created_at: string
  updated_at: string
}

interface Curriculum {
  id: string
  title: string
  description?: string
  difficulty_level: number
}

export default function CurriculumLessonsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [id, setId] = useState<string>('')
  const [curriculum, setCurriculum] = useState<Curriculum | null>(null)
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    params.then((p) => setId(p.id))
  }, [params])

  useEffect(() => {
    if (id) {
      loadData()
    }
  }, [id])

  const loadData = async () => {
    try {
      // カリキュラム情報を取得
      const { data: curriculumData, error: curriculumError } = await supabase
        .from('curriculums')
        .select('*')
        .eq('id', id)
        .single()

      if (curriculumError) throw curriculumError
      setCurriculum(curriculumData)

      // レッスン一覧を取得
      const { data: lessonsData, error: lessonsError } = await supabase
        .from('lessons')
        .select('*')
        .eq('curriculum_id', id)
        .order('order_index', { ascending: true })

      if (lessonsError) throw lessonsError
      setLessons(lessonsData || [])
    } catch (error) {
      console.error('Error loading data:', error)
      alert('データの読み込みに失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const getDifficultyLabel = (difficulty?: string) => {
    const labels: { [key: string]: string } = {
      beginner: '初級',
      elementary: '初中級', 
      intermediate: '中級',
      advanced: '上級'
    }
    return labels[difficulty || ''] || difficulty || '-'
  }

  const getLessonTypeLabel = (type?: string) => {
    const labels: { [key: string]: string } = {
      conversation: '会話練習',
      vocabulary: '語彙学習',
      grammar: '文法学習',
      pronunciation: '発音練習',
      review: '復習'
    }
    return labels[type || ''] || type || '-'
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">読み込み中...</div>
      </div>
    )
  }

  if (!curriculum) {
    return (
      <div className="p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">カリキュラムが見つかりません</h1>
          <Link
            href="/courses"
            className="text-indigo-600 hover:text-indigo-800"
          >
            カリキュラム一覧に戻る
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* ヘッダー */}
      <div className="mb-8 flex justify-between items-center">
        <div className="flex items-center">
          <Link
            href="/courses"
            className="mr-4 text-gray-400 hover:text-gray-600"
          >
            <ArrowLeft className="h-6 w-6" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{curriculum.title}</h1>
            <p className="mt-2 text-gray-600">
              {curriculum.description || 'このカリキュラムのレッスン一覧'} ({lessons.length} レッスン)
            </p>
          </div>
        </div>
      </div>

      {/* 統計カード */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <BookOpen className="h-8 w-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">総レッスン数</p>
              <p className="text-2xl font-bold text-gray-900">{lessons.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">公開中</p>
              <p className="text-2xl font-bold text-gray-900">
                {lessons.filter(l => l.is_active).length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <XCircle className="h-8 w-8 text-red-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">非公開</p>
              <p className="text-2xl font-bold text-gray-900">
                {lessons.filter(l => !l.is_active).length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-purple-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">予想時間</p>
              <p className="text-2xl font-bold text-gray-900">
                {lessons.reduce((sum, l) => sum + (l.estimated_minutes || 0), 0)}分
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* レッスン一覧 */}
      {lessons.length === 0 ? (
        <div className="bg-white shadow rounded-lg p-12 text-center">
          <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">このカリキュラムにはまだレッスンがありません</p>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  順番
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  レッスン名
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  難易度
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  タイプ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  予想時間
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ステータス
                </th>
                <th className="relative px-6 py-3">
                  <span className="sr-only">アクション</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {lessons.map((lesson) => (
                <tr key={lesson.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {lesson.order_index}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {lesson.title}
                      </div>
                      {lesson.description && (
                        <div className="text-sm text-gray-500">
                          {lesson.description}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {getDifficultyLabel(lesson.difficulty)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {getLessonTypeLabel(lesson.lesson_type)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {lesson.estimated_minutes ? `${lesson.estimated_minutes}分` : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      lesson.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {lesson.is_active ? '公開中' : '非公開'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link
                      href={`/lessons/${lesson.id}/edit`}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      <Pencil className="h-4 w-4 inline" />
                      <span className="ml-1">編集</span>
                    </Link>
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