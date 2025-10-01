'use client'

import { useState, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import { createClient } from '../../../../lib/supabase'

function NewLessonForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [isComposing, setIsComposing] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    display_order: 1,
    is_published: false,
    vocabulary_items: [],
    key_phrases: [],
    listening_exercises: [],
    dialog_lines: [],
    application_practice: {},
    sample_dialogues: []
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const supabase = createClient()
      
      const { data, error } = await supabase
        .from('lessons')
        .insert([{
          title: formData.title,
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

        <form 
          onSubmit={handleSubmit} 
          className="space-y-6"
          onKeyDown={(e) => {
            // Prevent form submission on Enter key
            // except when Shift+Enter is pressed (for multiline input)
            if (e.key === 'Enter' && !e.shiftKey) {
              // Allow Enter in textareas
              if (e.target instanceof HTMLTextAreaElement) {
                return;
              }
              // Prevent submission if IME is composing or in any other case
              if (isComposing || !(e.target instanceof HTMLButtonElement)) {
                e.preventDefault();
              }
            }
          }}
          onCompositionStart={() => setIsComposing(true)}
          onCompositionEnd={() => setIsComposing(false)}
        >
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

export default function NewLessonPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-pink-600" /></div>}>
      <NewLessonForm />
    </Suspense>
  )
}