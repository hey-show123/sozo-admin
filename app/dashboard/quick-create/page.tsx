'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { AlertCircle, ArrowLeft } from 'lucide-react'
import SimpleLessonCreator from '@/components/simple-lesson-creator'
import Link from 'next/link'

interface Curriculum {
  id: string
  title: string
  description?: string
}

export default function QuickCreatePage() {
  const [curriculums, setCurriculums] = useState<Curriculum[]>([])
  const [selectedCurriculum, setSelectedCurriculum] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    loadCurriculums()
  }, [])

  const loadCurriculums = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const { data, error: fetchError } = await supabase
        .from('curriculums')
        .select('id, title, description')
        .order('title')

      if (fetchError) throw fetchError
      setCurriculums(data || [])
      
      // 初級「自分について話す」をデフォルト選択
      const defaultCurriculum = data?.find(c => c.title === '初級：自分について話す')
      if (defaultCurriculum) {
        setSelectedCurriculum(defaultCurriculum.id)
      }
    } catch (err) {
      console.error('Error loading curriculums:', err)
      setError(err instanceof Error ? err.message : 'カリキュラムの読み込みに失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleLessonCreated = (lesson: any) => {
    // 成功時の処理（必要に応じて）
    console.log('Lesson created:', lesson)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">読み込み中...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">エラー</h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* ヘッダー */}
      <div className="mb-6">
        <Link
          href="/lessons"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          レッスン一覧に戻る
        </Link>
      </div>

      {/* カリキュラム選択 */}
      {curriculums.length > 0 && (
        <div className="mb-6 bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-3">保存先カリキュラム</h2>
          <select
            value={selectedCurriculum}
            onChange={(e) => setSelectedCurriculum(e.target.value)}
            className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">カリキュラムを選択してください</option>
            {curriculums.map(curriculum => (
              <option key={curriculum.id} value={curriculum.id}>
                {curriculum.title}
              </option>
            ))}
          </select>
          {selectedCurriculum && (
            <p className="text-sm text-gray-600 mt-2">
              選択中: {curriculums.find(c => c.id === selectedCurriculum)?.title}
            </p>
          )}
        </div>
      )}

      {/* かんたんレッスン作成ツール */}
      <SimpleLessonCreator
        curriculumId={selectedCurriculum || undefined}
        onLessonCreated={handleLessonCreated}
      />

      {/* 使い方ガイド */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">使い方ガイド</h3>
        <div className="space-y-2 text-sm text-blue-800">
          <div className="flex items-start">
            <span className="bg-blue-200 text-blue-900 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">1</span>
            <div>
              <strong>トピックを入力:</strong> 「趣味」「家族」「仕事」など、話したいテーマを入力
            </div>
          </div>
          <div className="flex items-start">
            <span className="bg-blue-200 text-blue-900 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">2</span>
            <div>
              <strong>テンプレート利用:</strong> よく使われるトピックはテンプレートから選択可能
            </div>
          </div>
          <div className="flex items-start">
            <span className="bg-blue-200 text-blue-900 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">3</span>
            <div>
              <strong>自動生成:</strong> 「初級：自分について話す」形式で以下が自動生成されます
              <ul className="list-disc ml-4 mt-1">
                <li>キーフレーズ（発音記号付き）</li>
                <li>語彙問題（4択問題）</li>
                <li>ダイアログ（会話練習）</li>
                <li>学習目標</li>
                <li>AI会話システムプロンプト</li>
              </ul>
            </div>
          </div>
          <div className="flex items-start">
            <span className="bg-blue-200 text-blue-900 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">4</span>
            <div>
              <strong>プレビュー・保存:</strong> 生成結果を確認してから保存、またはJSON形式でダウンロード
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}