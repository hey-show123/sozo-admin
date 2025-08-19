'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import { createClient } from '../../../../../lib/supabase'

interface Curriculum {
  id: string
  title: string
  description: string | null
  difficulty_level: number
  category: string
  image_url: string | null
  prerequisites: string[] | null
  is_active: boolean | null
}

export default function EditCoursePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [curriculum, setCurriculum] = useState<Curriculum | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    difficulty_level: 1,
    category: '',
    image_url: '',
    prerequisites: [] as string[],
    is_active: false
  })

  useEffect(() => {
    fetchCurriculum()
  }, [id])

  async function fetchCurriculum() {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('curriculums')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error

      setCurriculum(data)
      setFormData({
        title: data.title || '',
        description: data.description || '',
        difficulty_level: data.difficulty_level || 1,
        category: data.category || '',
        image_url: data.image_url || '',
        prerequisites: data.prerequisites || [],
        is_active: data.is_active || false
      })
    } catch (error) {
      console.error('Error fetching curriculum:', error)
      alert('カリキュラムの取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('curriculums')
        .update({
          title: formData.title,
          description: formData.description || null,
          difficulty_level: formData.difficulty_level,
          category: formData.category,
          image_url: formData.image_url || null,
          prerequisites: formData.prerequisites.length > 0 ? formData.prerequisites : null,
          is_active: formData.is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)

      if (error) throw error

      alert('カリキュラムを更新しました')
      router.push(`/dashboard/courses/${id}`)
    } catch (error) {
      console.error('Error updating curriculum:', error)
      alert('カリキュラムの更新に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  const handlePrerequisitesChange = (value: string) => {
    const prerequisites = value.split(',').map(item => item.trim()).filter(item => item)
    setFormData({ ...formData, prerequisites })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    )
  }

  if (!curriculum) {
    return (
      <div className="bg-red-50 p-4 rounded-lg">
        <p className="text-red-600">カリキュラムが見つかりません</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <Link
          href={`/dashboard/courses/${id}`}
          className="inline-flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          カリキュラム詳細に戻る
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">カリキュラム編集</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              タイトル <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              説明
            </label>
            <textarea
              id="description"
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="difficulty_level" className="block text-sm font-medium text-gray-700 mb-2">
                難易度 <span className="text-red-500">*</span>
              </label>
              <select
                id="difficulty_level"
                required
                value={formData.difficulty_level}
                onChange={(e) => setFormData({ ...formData, difficulty_level: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value={1}>初級</option>
                <option value={2}>中級</option>
                <option value={3}>上級</option>
              </select>
            </div>

            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                カテゴリー <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="category"
                required
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="例: 日常会話"
              />
            </div>
          </div>

          <div>
            <label htmlFor="image_url" className="block text-sm font-medium text-gray-700 mb-2">
              画像URL
            </label>
            <input
              type="url"
              id="image_url"
              value={formData.image_url}
              onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="https://example.com/image.jpg"
            />
          </div>

          <div>
            <label htmlFor="prerequisites" className="block text-sm font-medium text-gray-700 mb-2">
              前提条件（カンマ区切り）
            </label>
            <input
              type="text"
              id="prerequisites"
              value={formData.prerequisites.join(', ')}
              onChange={(e) => handlePrerequisitesChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="例: 基本的な挨拶, ひらがなの読み書き"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
            />
            <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
              アクティブ（公開）
            </label>
          </div>

          <div className="flex justify-end space-x-3">
            <Link
              href={`/dashboard/courses/${id}`}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
            >
              キャンセル
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  保存中...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  保存
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}