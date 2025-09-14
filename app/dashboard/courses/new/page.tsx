'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, Loader2, Upload, X, Image } from 'lucide-react'
import { createClient } from '../../../../lib/supabase'
import { CURRICULUM_CATEGORIES } from '../../../../lib/constants/categories'

export default function NewCoursePage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [isComposing, setIsComposing] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    difficulty_level: 1,
    category: '',
    image_url: '',
    is_active: false
  })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)

  async function handleImageUpload(curriculumId: string) {
    if (!imageFile) return ''

    setUploadingImage(true)
    try {
      const supabase = createClient()
      const fileExt = imageFile.name.split('.').pop()
      const fileName = `${curriculumId}-${Date.now()}.${fileExt}`
      const filePath = `curriculum-images/${fileName}`

      // 画像をアップロード
      const { error: uploadError } = await supabase.storage
        .from('curriculum-images')
        .upload(filePath, imageFile, {
          cacheControl: '3600',
          upsert: true
        })

      if (uploadError) throw uploadError

      // パブリックURLを取得
      const { data: { publicUrl } } = supabase.storage
        .from('curriculum-images')
        .getPublicUrl(filePath)

      return publicUrl
    } catch (error) {
      console.error('Error uploading image:', error)
      alert('画像のアップロードに失敗しました')
      return ''
    } finally {
      setUploadingImage(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    try {
      const supabase = createClient()

      // 新しいカリキュラムを作成
      const { data: newCurriculum, error } = await supabase
        .from('curriculums')
        .insert({
          title: formData.title,
          description: formData.description || null,
          difficulty_level: formData.difficulty_level,
          category: formData.category,
          image_url: null, // 一旦nullで作成
          is_active: formData.is_active,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error

      // 画像をアップロード（カリキュラム作成後）
      if (imageFile && newCurriculum) {
        const imageUrl = await handleImageUpload(newCurriculum.id)
        if (imageUrl) {
          // 画像URLを更新
          const { error: updateError } = await supabase
            .from('curriculums')
            .update({ image_url: imageUrl })
            .eq('id', newCurriculum.id)

          if (updateError) {
            console.error('Error updating image URL:', updateError)
          }
        }
      }

      alert('カリキュラムを作成しました')
      router.push('/dashboard/courses')
    } catch (error) {
      console.error('Error creating curriculum:', error)
      alert('カリキュラムの作成に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // ファイルタイプの検証
      if (!file.type.startsWith('image/')) {
        alert('画像ファイルを選択してください')
        return
      }

      // ファイルサイズの検証（5MB以下）
      if (file.size > 5 * 1024 * 1024) {
        alert('画像サイズは5MB以下にしてください')
        return
      }

      setImageFile(file)

      // プレビュー用のURLを生成
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setImageFile(null)
    setImagePreview(null)
  }


  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <Link
          href="/dashboard/courses"
          className="inline-flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          カリキュラム一覧に戻る
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">新規カリキュラム作成</h1>

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
              <select
                id="category"
                required
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">カテゴリーを選択</option>
                {CURRICULUM_CATEGORIES.map((category) => (
                  <option key={category.id} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              カリキュラム画像
            </label>

            {/* 画像プレビュー */}
            {imagePreview && (
              <div className="mb-4 relative">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full max-w-md h-48 object-cover rounded-lg border border-gray-300"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* ファイル選択 */}
            <div className="flex items-center space-x-4">
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  onChange={handleImageChange}
                  className="hidden"
                />
                <div className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                  <Upload className="h-5 w-5 mr-2 text-gray-600" />
                  <span className="text-sm text-gray-700">
                    {imageFile ? imageFile.name : '画像を選択'}
                  </span>
                </div>
              </label>

              {!imagePreview && (
                <div className="flex items-center text-sm text-gray-500">
                  <Image className="h-4 w-4 mr-1" />
                  PNG, JPG, WEBP (最大5MB)
                </div>
              )}
            </div>

            {uploadingImage && (
              <div className="mt-2 text-sm text-gray-600">
                <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
                画像をアップロード中...
              </div>
            )}
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
              href="/dashboard/courses"
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