'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import { createClient } from '../../../../lib/supabase'

export default function NewLessonPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const moduleId = searchParams.get('module_id')
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    module_id: moduleId || '',
    display_order: 1,
    is_published: false,
    vocabulary_items: [],
    key_phrases: [],
    listening_exercises: [],
    dialog_lines: [],
    application_practice: {},
    sample_dialogues: []
  })

  useEffect(() => {
    if (moduleId) {
      setFormData(prev => ({ ...prev, module_id: moduleId }))
    }
  }, [moduleId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const supabase = createClient()
      
      const { data, error } = await supabase
        .from('lessons')
        .insert([{
          title: formData.title,
          module_id: formData.module_id || null,
          display_order: formData.display_order,
          is_published: formData.is_published,
          vocabulary_items: formData.vocabulary_items,
          key_phrases: formData.key_phrases,
          listening_exercises: formData.listening_exercises,
          dialog_lines: formData.dialog_lines,
          application_practice: formData.application_practice,
          sample_dialogues: formData.sample_dialogues
        }])
        .select()
        .single()

      if (error) throw error

      router.push('/dashboard/lessons')
    } catch (error) {
      console.error('Error creating lesson:', error)
      alert('レッスンの作成に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <Link
          href="/dashboard/lessons"
          className="inline-flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          レッスン一覧に戻る
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">新規レッスン作成</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              レッスンタイトル <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
              placeholder="例: 基本的な挨拶"
            />
          </div>

          <div>
            <label htmlFor="module_id" className="block text-sm font-medium text-gray-700 mb-2">
              モジュールID
            </label>
            <input
              type="text"
              id="module_id"
              value={formData.module_id}
              onChange={(e) => setFormData({ ...formData, module_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
              placeholder="モジュールのUUID（オプション）"
            />
          </div>

          <div>
            <label htmlFor="display_order" className="block text-sm font-medium text-gray-700 mb-2">
              表示順序
            </label>
            <input
              type="number"
              id="display_order"
              min="1"
              value={formData.display_order}
              onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_published"
              checked={formData.is_published}
              onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
              className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
            />
            <label htmlFor="is_published" className="ml-2 block text-sm text-gray-900">
              公開する
            </label>
          </div>

          <div className="flex justify-end space-x-3">
            <Link
              href="/dashboard/lessons"
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
            >
              キャンセル
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  作成中...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  作成
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}