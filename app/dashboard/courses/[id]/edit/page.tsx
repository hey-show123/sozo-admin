'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, Loader2, Upload, X, Image } from 'lucide-react'
import { createClient } from '../../../../../lib/supabase'
import { CURRICULUM_CATEGORIES } from '../../../../../lib/constants/categories'
import { DIFFICULTY_OPTIONS } from '../../../../../lib/constants/difficulty-levels'

interface Curriculum {
  id: string
  title: string
  description: string | null
  difficulty_level: number
  category: string
  image_url: string | null
  is_active: boolean | null
}

export default function EditCoursePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [curriculum, setCurriculum] = useState<Curriculum | null>(null)
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

      console.log('Fetched curriculum data:', data)
      console.log('Category value:', data.category)

      setCurriculum(data)
      setFormData({
        title: data.title || '',
        description: data.description || '',
        difficulty_level: data.difficulty_level || 1,
        category: data.category || '',
        image_url: data.image_url || '',
        is_active: data.is_active || false
      })
      
      // 既存の画像URLをプレビューに設定
      if (data.image_url) {
        setImagePreview(data.image_url)
      }
    } catch (error) {
      console.error('Error fetching curriculum:', error)
      alert('カリキュラムの取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  async function handleImageUpload() {
    if (!imageFile) return formData.image_url

    setUploadingImage(true)
    try {
      const supabase = createClient()
      const fileExt = imageFile.name.split('.').pop()
      const fileName = `${id}-${Date.now()}.${fileExt}`
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
      return formData.image_url
    } finally {
      setUploadingImage(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    try {
      const supabase = createClient()

      // 画像をアップロード（新しい画像が選択されている場合）
      let imageUrl = formData.image_url
      if (imageFile) {
        imageUrl = await handleImageUpload()
      }

      console.log('Updating curriculum with data:', {
        title: formData.title,
        description: formData.description || null,
        difficulty_level: formData.difficulty_level,
        category: formData.category,
        image_url: imageUrl || null,
        is_active: formData.is_active,
      })

      // まず現在のユーザーを確認
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      console.log('Current user:', user)
      if (userError) {
        console.error('User auth error:', userError)
      }

      // 更新データを準備
      const updateData = {
        title: formData.title,
        description: formData.description || null,
        difficulty_level: formData.difficulty_level,
        category: formData.category,
        image_url: imageUrl || null,
        is_active: formData.is_active,
        updated_at: new Date().toISOString()
      }

      console.log('Sending update data:', updateData)
      console.log('Target ID:', id)

      // 更新を実行（返り値を期待しない）
      const { error } = await supabase
        .from('curriculums')
        .update(updateData)
        .eq('id', id)

      if (error) {
        console.error('Supabase update error details:', {
          error,
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        })
        throw error
      }

      console.log('Update query executed successfully')

      // 更新後のデータを再取得して確認
      const { data: verifyData, error: verifyError } = await supabase
        .from('curriculums')
        .select('*')
        .eq('id', id)
        .single()

      console.log('Verification after update:', verifyData)
      if (verifyError) {
        console.error('Verification error:', verifyError)
      }

      alert('カリキュラムを更新しました')
      router.push(`/dashboard/courses/${id}`)
    } catch (error: any) {
      console.error('Error updating curriculum:', error)
      alert(`カリキュラムの更新に失敗しました: ${error.message || 'Unknown error'}`)
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
    setFormData({ ...formData, image_url: '' })
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
                {DIFFICULTY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
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