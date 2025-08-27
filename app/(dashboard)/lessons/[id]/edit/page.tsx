'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, Trash2, Plus, Wand2, Eye, EyeOff } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { AutoLessonGenerator, SimpleTextInput } from '@/lib/auto-lesson-generator'

interface LessonData {
  id: string
  title: string
  description?: string
  curriculum_id?: string
  difficulty?: string
  estimated_minutes?: number
  lesson_type?: string
  objectives?: string[]
  key_phrases?: any[]
  vocabulary_questions?: any[]
  dialogues?: any[]
  application_practice?: any[]
  is_active?: boolean
  created_at?: string
  updated_at?: string
}

interface Curriculum {
  id: string
  title: string
}

export default function LessonEditPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [id, setId] = useState<string>('')
  const [lesson, setLesson] = useState<LessonData | null>(null)
  const [curriculums, setCurriculums] = useState<Curriculum[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [contentEditing, setContentEditing] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [editMode, setEditMode] = useState<'generate' | 'manual'>('generate')
  const [generationInput, setGenerationInput] = useState<SimpleTextInput>({
    title: '',
    description: '',
    topic: '',
    difficultyLevel: 'beginner',
    keyWords: [],
    japaneseContext: ''
  })
  const supabase = createClient()

  useEffect(() => {
    params.then((p) => setId(p.id))
  }, [params])

  useEffect(() => {
    if (id) {
      loadLessonData()
      loadCurriculums()
    }
  }, [id])

  const loadLessonData = async () => {
    try {
      const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      setLesson(data)
      
      // 自動生成フォームの初期値を設定
      if (data) {
        setGenerationInput({
          title: data.title || '',
          description: data.description || '',
          topic: extractTopicFromTitle(data.title) || '',
          difficultyLevel: data.difficulty as 'beginner' | 'elementary' | 'intermediate' | 'advanced' || 'beginner',
          keyWords: [],
          japaneseContext: ''
        })
      }
    } catch (error) {
      console.error('Error loading lesson:', error)
      alert('レッスンデータの読み込みに失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const loadCurriculums = async () => {
    try {
      const { data, error } = await supabase
        .from('curriculums')
        .select('id, title')
        .eq('is_active', true)
        .order('title')

      if (error) throw error
      setCurriculums(data || [])
    } catch (error) {
      console.error('Error loading curriculums:', error)
    }
  }

  const handleSave = async () => {
    if (!lesson) return

    setSaving(true)
    try {
      const { error } = await supabase
        .from('lessons')
        .update({
          title: lesson.title,
          description: lesson.description,
          curriculum_id: lesson.curriculum_id,
          difficulty: lesson.difficulty,
          estimated_minutes: lesson.estimated_minutes,
          lesson_type: lesson.lesson_type,
          objectives: lesson.objectives,
          key_phrases: lesson.key_phrases,
          vocabulary_questions: lesson.vocabulary_questions,
          dialogues: lesson.dialogues,
          application_practice: lesson.application_practice,
          is_active: lesson.is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)

      if (error) throw error

      alert('レッスンを保存しました！')
      router.push('/lessons')
    } catch (error) {
      console.error('Error saving lesson:', error)
      alert('保存に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('このレッスンを削除してもよろしいですか？')) return

    try {
      const { error } = await supabase
        .from('lessons')
        .delete()
        .eq('id', id)

      if (error) throw error

      alert('レッスンを削除しました')
      router.push('/lessons')
    } catch (error) {
      console.error('Error deleting lesson:', error)
      alert('削除に失敗しました')
    }
  }

  const addObjective = () => {
    if (!lesson) return
    setLesson({
      ...lesson,
      objectives: [...(lesson.objectives || []), '']
    })
  }

  const updateObjective = (index: number, value: string) => {
    if (!lesson) return
    const newObjectives = [...(lesson.objectives || [])]
    newObjectives[index] = value
    setLesson({
      ...lesson,
      objectives: newObjectives
    })
  }

  const removeObjective = (index: number) => {
    if (!lesson) return
    const newObjectives = [...(lesson.objectives || [])]
    newObjectives.splice(index, 1)
    setLesson({
      ...lesson,
      objectives: newObjectives
    })
  }

  const extractTopicFromTitle = (title: string): string => {
    // タイトルからトピックを抽出する簡単なロジック
    if (title.includes('趣味')) return '趣味'
    if (title.includes('家族')) return '家族'
    if (title.includes('仕事')) return '仕事'
    if (title.includes('自己紹介') || title.includes('自分')) return '自己紹介'
    return ''
  }

  const handleAutoGenerate = async () => {
    if (!generationInput.topic.trim()) {
      alert('トピックを入力してください')
      return
    }

    setGenerating(true)
    try {
      const generated = await AutoLessonGenerator.generateFromText(generationInput)
      
      // 生成されたコンテンツをレッスンデータにマージ
      if (lesson) {
        setLesson({
          ...lesson,
          key_phrases: generated.key_phrases,
          vocabulary_questions: generated.vocabulary_questions,
          dialogues: generated.dialogues,
          application_practice: generated.application_practice,
          objectives: generated.objectives,
          description: generated.description,
          estimated_minutes: generated.estimated_minutes
        })
      }
      
      alert('コンテンツを自動生成しました！')
      setShowPreview(true)
    } catch (error) {
      console.error('Auto-generation failed:', error)
      alert('自動生成に失敗しました')
    } finally {
      setGenerating(false)
    }
  }

  const handleTemplateSelect = (templateName: string) => {
    const template = AutoLessonGenerator.generateFromTemplate(templateName)
    setGenerationInput(template)
  }

  const addKeyPhrase = () => {
    if (!lesson) return
    setLesson({
      ...lesson,
      key_phrases: [...(lesson.key_phrases || []), {
        phrase: '',
        meaning: '',
        examples: [''],
        pronunciation: '',
        usage: ''
      }]
    })
  }

  const updateKeyPhrase = (index: number, field: string, value: any) => {
    if (!lesson) return
    const newKeyPhrases = [...(lesson.key_phrases || [])]
    newKeyPhrases[index] = { ...newKeyPhrases[index], [field]: value }
    setLesson({
      ...lesson,
      key_phrases: newKeyPhrases
    })
  }

  const removeKeyPhrase = (index: number) => {
    if (!lesson) return
    const newKeyPhrases = [...(lesson.key_phrases || [])]
    newKeyPhrases.splice(index, 1)
    setLesson({
      ...lesson,
      key_phrases: newKeyPhrases
    })
  }

  const addVocabularyQuestion = () => {
    if (!lesson) return
    setLesson({
      ...lesson,
      vocabulary_questions: [...(lesson.vocabulary_questions || []), {
        word: '',
        meaning: '',
        options: ['', '', '', ''],
        correct_answer: '',
        hint: ''
      }]
    })
  }

  const updateVocabularyQuestion = (index: number, field: string, value: any) => {
    if (!lesson) return
    const newQuestions = [...(lesson.vocabulary_questions || [])]
    newQuestions[index] = { ...newQuestions[index], [field]: value }
    setLesson({
      ...lesson,
      vocabulary_questions: newQuestions
    })
  }

  const removeVocabularyQuestion = (index: number) => {
    if (!lesson) return
    const newQuestions = [...(lesson.vocabulary_questions || [])]
    newQuestions.splice(index, 1)
    setLesson({
      ...lesson,
      vocabulary_questions: newQuestions
    })
  }

  const addDialogue = () => {
    if (!lesson) return
    setLesson({
      ...lesson,
      dialogues: [...(lesson.dialogues || []), {
        speaker: 'ai',
        text: '',
        translation: '',
        emotion: '',
        context: ''
      }]
    })
  }

  const updateDialogue = (index: number, field: string, value: any) => {
    if (!lesson) return
    const newDialogues = [...(lesson.dialogues || [])]
    newDialogues[index] = { ...newDialogues[index], [field]: value }
    setLesson({
      ...lesson,
      dialogues: newDialogues
    })
  }

  const removeDialogue = (index: number) => {
    if (!lesson) return
    const newDialogues = [...(lesson.dialogues || [])]
    newDialogues.splice(index, 1)
    setLesson({
      ...lesson,
      dialogues: newDialogues
    })
  }

  const addApplicationPractice = () => {
    if (!lesson) return
    setLesson({
      ...lesson,
      application_practice: [...(lesson.application_practice || []), {
        prompt: '',
        syntax_hint: '',
        expected_keywords: [],
        context: ''
      }]
    })
  }

  const updateApplicationPractice = (index: number, field: string, value: any) => {
    if (!lesson) return
    const newPractice = [...(lesson.application_practice || [])]
    newPractice[index] = { ...newPractice[index], [field]: value }
    setLesson({
      ...lesson,
      application_practice: newPractice
    })
  }

  const removeApplicationPractice = (index: number) => {
    if (!lesson) return
    const newPractice = [...(lesson.application_practice || [])]
    newPractice.splice(index, 1)
    setLesson({
      ...lesson,
      application_practice: newPractice
    })
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">読み込み中...</div>
      </div>
    )
  }

  if (!lesson) {
    return (
      <div className="p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">レッスンが見つかりません</h1>
          <Link
            href="/lessons"
            className="text-indigo-600 hover:text-indigo-800"
          >
            レッスン一覧に戻る
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
            href="/lessons"
            className="mr-4 text-gray-400 hover:text-gray-600"
          >
            <ArrowLeft className="h-6 w-6" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">レッスン編集</h1>
            <p className="mt-2 text-gray-600">レッスン情報と学習目標の編集</p>
          </div>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleDelete}
            className="px-4 py-2 border border-red-300 text-red-700 rounded-md hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4 mr-2 inline" />
            削除
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
          >
            <Save className="h-4 w-4 mr-2 inline" />
            {saving ? '保存中...' : '保存'}
          </button>
        </div>
      </div>

      {/* フォーム */}
      <div className="bg-white shadow rounded-lg p-6 space-y-6">
        {/* 基本情報 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              レッスンタイトル <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={lesson.title}
              onChange={(e) => setLesson({ ...lesson, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="レッスンのタイトル"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              カリキュラム
            </label>
            <select
              value={lesson.curriculum_id || ''}
              onChange={(e) => setLesson({ ...lesson, curriculum_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">カリキュラムを選択</option>
              {curriculums.map((curriculum) => (
                <option key={curriculum.id} value={curriculum.id}>
                  {curriculum.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              難易度
            </label>
            <select
              value={lesson.difficulty || ''}
              onChange={(e) => setLesson({ ...lesson, difficulty: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">選択してください</option>
              <option value="beginner">初級</option>
              <option value="elementary">初中級</option>
              <option value="intermediate">中級</option>
              <option value="advanced">上級</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              予想学習時間（分）
            </label>
            <input
              type="number"
              value={lesson.estimated_minutes || ''}
              onChange={(e) => setLesson({ ...lesson, estimated_minutes: parseInt(e.target.value) || undefined })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="30"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              レッスンタイプ
            </label>
            <select
              value={lesson.lesson_type || ''}
              onChange={(e) => setLesson({ ...lesson, lesson_type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">選択してください</option>
              <option value="conversation">会話練習</option>
              <option value="vocabulary">語彙学習</option>
              <option value="grammar">文法学習</option>
              <option value="pronunciation">発音練習</option>
              <option value="review">復習</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ステータス
            </label>
            <select
              value={lesson.is_active ? 'true' : 'false'}
              onChange={(e) => setLesson({ ...lesson, is_active: e.target.value === 'true' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="true">アクティブ</option>
              <option value="false">非アクティブ</option>
            </select>
          </div>
        </div>

        {/* 説明 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            レッスン説明
          </label>
          <textarea
            value={lesson.description || ''}
            onChange={(e) => setLesson({ ...lesson, description: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="レッスンの内容や目標について説明してください"
          />
        </div>

        {/* 学習目標 */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <label className="block text-sm font-medium text-gray-700">
              学習目標
            </label>
            <button
              onClick={addObjective}
              className="px-3 py-1 text-sm bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200"
            >
              <Plus className="h-4 w-4 mr-1 inline" />
              目標を追加
            </button>
          </div>
          <div className="space-y-2">
            {(lesson.objectives || []).map((objective, index) => (
              <div key={index} className="flex items-center space-x-2">
                <input
                  type="text"
                  value={objective}
                  onChange={(e) => updateObjective(index, e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder={`学習目標 ${index + 1}`}
                />
                <button
                  onClick={() => removeObjective(index)}
                  className="px-2 py-2 text-red-600 hover:text-red-800"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            {(!lesson.objectives || lesson.objectives.length === 0) && (
              <p className="text-gray-500 text-sm">まだ学習目標が設定されていません。</p>
            )}
          </div>
        </div>

        {/* レッスンコンテンツ編集 */}
        <div className="border-t pt-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">レッスンコンテンツ</h3>
            <button
              onClick={() => setContentEditing(!contentEditing)}
              className="px-4 py-2 text-sm bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200"
            >
              {contentEditing ? 'コンテンツ編集を閉じる' : 'コンテンツを編集'}
            </button>
          </div>

          {/* コンテンツ統計 */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-center mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {lesson.key_phrases?.length || 0}
              </div>
              <div className="text-sm text-blue-700">キーフレーズ</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {lesson.vocabulary_questions?.length || 0}
              </div>
              <div className="text-sm text-green-700">語彙問題</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {lesson.dialogues?.length || 0}
              </div>
              <div className="text-sm text-purple-700">ダイアログ</div>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {lesson.application_practice?.length || 0}
              </div>
              <div className="text-sm text-orange-700">応用問題</div>
            </div>
          </div>

          {/* コンテンツ編集エディター */}
          {contentEditing && (
            <div className="bg-gray-50 p-6 rounded-lg space-y-6">
              {/* 編集モード切り替えタブ */}
              <div className="flex space-x-4 mb-6">
                <button
                  onClick={() => setEditMode('generate')}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    editMode === 'generate'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  自動生成
                </button>
                <button
                  onClick={() => setEditMode('manual')}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    editMode === 'manual'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  手動編集
                </button>
              </div>

              {/* 自動生成モード */}
              {editMode === 'generate' && (
                <div>
                  <div className="text-center mb-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">
                      簡単テキスト入力で自動生成
                    </h4>
                    <p className="text-gray-600">
                      テキストを入力するだけで「初級：自分について話す」形式のコンテンツが自動生成されます
                    </p>
                  </div>

              {/* テンプレート選択 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  テンプレートから選択（オプション）
                </label>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                  {['自己紹介', '趣味について', '家族について', '仕事について'].map(template => (
                    <button
                      key={template}
                      onClick={() => handleTemplateSelect(template)}
                      className="px-3 py-2 text-sm bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors"
                    >
                      {template}
                    </button>
                  ))}
                </div>
              </div>

              {/* 生成パラメータ */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    トピック <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={generationInput.topic}
                    onChange={(e) => setGenerationInput({...generationInput, topic: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="例: 趣味、家族、仕事..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    難易度
                  </label>
                  <select
                    value={generationInput.difficultyLevel}
                    onChange={(e) => setGenerationInput({...generationInput, difficultyLevel: e.target.value as any})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="beginner">初級</option>
                    <option value="elementary">初中級</option>
                    <option value="intermediate">中級</option>
                    <option value="advanced">上級</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    キーワード（カンマ区切り）
                  </label>
                  <input
                    type="text"
                    value={generationInput.keyWords?.join(', ') || ''}
                    onChange={(e) => setGenerationInput({
                      ...generationInput, 
                      keyWords: e.target.value.split(',').map(w => w.trim()).filter(w => w)
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="例: 好き, 楽しむ, スポーツ..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    日本語の文脈
                  </label>
                  <input
                    type="text"
                    value={generationInput.japaneseContext}
                    onChange={(e) => setGenerationInput({...generationInput, japaneseContext: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="どのような場面で使う表現か"
                  />
                </div>
              </div>

              {/* 生成ボタン */}
              <div className="flex justify-center">
                <button
                  onClick={handleAutoGenerate}
                  disabled={generating || !generationInput.topic.trim()}
                  className="flex items-center px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {generating ? (
                    <>
                      <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"></div>
                      生成中...
                    </>
                  ) : (
                    <>
                      <Wand2 className="h-4 w-4 mr-2" />
                      コンテンツを自動生成
                    </>
                  )}
                </button>
              </div>

              {/* プレビュートグル */}
              {(lesson.key_phrases?.length || 0) > 0 && (
                <div className="border-t pt-4">
                  <button
                    onClick={() => setShowPreview(!showPreview)}
                    className="flex items-center px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                  >
                    {showPreview ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                    {showPreview ? 'プレビューを隠す' : 'コンテンツプレビューを表示'}
                  </button>

                  {/* コンテンツプレビュー */}
                  {showPreview && (
                    <div className="mt-4 space-y-4">
                      {/* キーフレーズプレビュー */}
                      {lesson.key_phrases && lesson.key_phrases.length > 0 && (
                        <div className="bg-white p-4 rounded border">
                          <h5 className="font-medium text-gray-900 mb-2">キーフレーズ ({lesson.key_phrases.length}件)</h5>
                          <div className="space-y-2">
                            {lesson.key_phrases.slice(0, 3).map((phrase: any, index: number) => (
                              <div key={index} className="text-sm">
                                <span className="font-medium">{phrase.phrase}</span>
                                <span className="text-gray-600 ml-2">- {phrase.meaning}</span>
                              </div>
                            ))}
                            {lesson.key_phrases.length > 3 && (
                              <p className="text-sm text-gray-500">...他 {lesson.key_phrases.length - 3} 件</p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* 応用問題プレビュー */}
                      {lesson.application_practice && lesson.application_practice.length > 0 && (
                        <div className="bg-white p-4 rounded border">
                          <h5 className="font-medium text-gray-900 mb-2">応用問題 ({lesson.application_practice.length}件)</h5>
                          <div className="space-y-2">
                            {lesson.application_practice.slice(0, 2).map((practice: any, index: number) => (
                              <div key={index} className="text-sm bg-indigo-50 p-2 rounded">
                                <div className="font-medium text-indigo-900">{practice.prompt}</div>
                                {practice.syntax_hint && (
                                  <div className="text-indigo-700 text-xs mt-1">ヒント: {practice.syntax_hint}</div>
                                )}
                              </div>
                            ))}
                            {lesson.application_practice.length > 2 && (
                              <p className="text-sm text-gray-500">...他 {lesson.application_practice.length - 2} 件</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
                </div>
              )}

              {/* 手動編集モード */}
              {editMode === 'manual' && (
                <div className="space-y-8">
                  <div className="text-center mb-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">
                      レッスンコンテンツを直接編集
                    </h4>
                    <p className="text-gray-600">
                      キーフレーズ、語彙問題、ダイアログ、応用問題を個別に編集できます
                    </p>
                  </div>

                  {/* キーフレーズ編集 */}
                  <div className="bg-white p-6 rounded-lg border">
                    <div className="flex justify-between items-center mb-4">
                      <h5 className="text-lg font-medium text-gray-900">キーフレーズ</h5>
                      <button
                        onClick={addKeyPhrase}
                        className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                      >
                        <Plus className="h-4 w-4 mr-1 inline" />
                        追加
                      </button>
                    </div>
                    <div className="space-y-4">
                      {(lesson.key_phrases || []).map((phrase: any, index: number) => (
                        <div key={index} className="border p-4 rounded-lg bg-gray-50">
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">フレーズ</label>
                              <input
                                type="text"
                                value={phrase.phrase || ''}
                                onChange={(e) => updateKeyPhrase(index, 'phrase', e.target.value)}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                placeholder="例: How are you?"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">意味</label>
                              <input
                                type="text"
                                value={phrase.meaning || ''}
                                onChange={(e) => updateKeyPhrase(index, 'meaning', e.target.value)}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                placeholder="例: 元気ですか？"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">発音</label>
                              <input
                                type="text"
                                value={phrase.pronunciation || ''}
                                onChange={(e) => updateKeyPhrase(index, 'pronunciation', e.target.value)}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                placeholder="例: haʊ ɑr ju"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">使い方</label>
                              <input
                                type="text"
                                value={phrase.usage || ''}
                                onChange={(e) => updateKeyPhrase(index, 'usage', e.target.value)}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                placeholder="例: カジュアルな挨拶"
                              />
                            </div>
                          </div>
                          <div className="mb-3">
                            <label className="block text-xs font-medium text-gray-600 mb-1">例文（改行区切り）</label>
                            <textarea
                              value={(phrase.examples || []).join('\n')}
                              onChange={(e) => updateKeyPhrase(index, 'examples', e.target.value.split('\n').filter(ex => ex.trim()))}
                              rows={2}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                              placeholder="例文1&#10;例文2"
                            />
                          </div>
                          <div className="flex justify-end">
                            <button
                              onClick={() => removeKeyPhrase(index)}
                              className="px-2 py-1 text-xs text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                      {(!lesson.key_phrases || lesson.key_phrases.length === 0) && (
                        <p className="text-gray-500 text-sm text-center py-4">まだキーフレーズがありません。追加ボタンで作成してください。</p>
                      )}
                    </div>
                  </div>

                  {/* 語彙問題編集 */}
                  <div className="bg-white p-6 rounded-lg border">
                    <div className="flex justify-between items-center mb-4">
                      <h5 className="text-lg font-medium text-gray-900">語彙問題</h5>
                      <button
                        onClick={addVocabularyQuestion}
                        className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200"
                      >
                        <Plus className="h-4 w-4 mr-1 inline" />
                        追加
                      </button>
                    </div>
                    <div className="space-y-4">
                      {(lesson.vocabulary_questions || []).map((question: any, index: number) => (
                        <div key={index} className="border p-4 rounded-lg bg-gray-50">
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">単語</label>
                              <input
                                type="text"
                                value={question.word || ''}
                                onChange={(e) => updateVocabularyQuestion(index, 'word', e.target.value)}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                                placeholder="例: beautiful"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">意味</label>
                              <input
                                type="text"
                                value={question.meaning || ''}
                                onChange={(e) => updateVocabularyQuestion(index, 'meaning', e.target.value)}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                                placeholder="例: 美しい"
                              />
                            </div>
                          </div>
                          <div className="mb-3">
                            <label className="block text-xs font-medium text-gray-600 mb-1">選択肢（4つ）</label>
                            <div className="grid grid-cols-2 gap-2">
                              {[0, 1, 2, 3].map((optionIndex) => (
                                <input
                                  key={optionIndex}
                                  type="text"
                                  value={(question.options || [])[optionIndex] || ''}
                                  onChange={(e) => {
                                    const newOptions = [...(question.options || ['', '', '', ''])]
                                    newOptions[optionIndex] = e.target.value
                                    updateVocabularyQuestion(index, 'options', newOptions)
                                  }}
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                                  placeholder={`選択肢 ${optionIndex + 1}`}
                                />
                              ))}
                            </div>
                          </div>
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">正解</label>
                              <input
                                type="text"
                                value={question.correct_answer || ''}
                                onChange={(e) => updateVocabularyQuestion(index, 'correct_answer', e.target.value)}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                                placeholder="正解の選択肢"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">ヒント</label>
                              <input
                                type="text"
                                value={question.hint || ''}
                                onChange={(e) => updateVocabularyQuestion(index, 'hint', e.target.value)}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                                placeholder="ヒント（任意）"
                              />
                            </div>
                          </div>
                          <div className="flex justify-end">
                            <button
                              onClick={() => removeVocabularyQuestion(index)}
                              className="px-2 py-1 text-xs text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                      {(!lesson.vocabulary_questions || lesson.vocabulary_questions.length === 0) && (
                        <p className="text-gray-500 text-sm text-center py-4">まだ語彙問題がありません。追加ボタンで作成してください。</p>
                      )}
                    </div>
                  </div>

                  {/* ダイアログ編集 */}
                  <div className="bg-white p-6 rounded-lg border">
                    <div className="flex justify-between items-center mb-4">
                      <h5 className="text-lg font-medium text-gray-900">ダイアログ</h5>
                      <button
                        onClick={addDialogue}
                        className="px-3 py-1 text-sm bg-purple-100 text-purple-700 rounded hover:bg-purple-200"
                      >
                        <Plus className="h-4 w-4 mr-1 inline" />
                        追加
                      </button>
                    </div>
                    <div className="space-y-4">
                      {(lesson.dialogues || []).map((dialogue: any, index: number) => (
                        <div key={index} className="border p-4 rounded-lg bg-gray-50">
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">話者</label>
                              <select
                                value={dialogue.speaker || 'ai'}
                                onChange={(e) => updateDialogue(index, 'speaker', e.target.value)}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-purple-500"
                              >
                                <option value="ai">AI</option>
                                <option value="user">ユーザー</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">感情</label>
                              <input
                                type="text"
                                value={dialogue.emotion || ''}
                                onChange={(e) => updateDialogue(index, 'emotion', e.target.value)}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-purple-500"
                                placeholder="例: friendly, excited"
                              />
                            </div>
                          </div>
                          <div className="mb-3">
                            <label className="block text-xs font-medium text-gray-600 mb-1">テキスト</label>
                            <textarea
                              value={dialogue.text || ''}
                              onChange={(e) => updateDialogue(index, 'text', e.target.value)}
                              rows={2}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-purple-500"
                              placeholder="話す内容"
                            />
                          </div>
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">翻訳</label>
                              <input
                                type="text"
                                value={dialogue.translation || ''}
                                onChange={(e) => updateDialogue(index, 'translation', e.target.value)}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-purple-500"
                                placeholder="日本語訳"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">文脈</label>
                              <input
                                type="text"
                                value={dialogue.context || ''}
                                onChange={(e) => updateDialogue(index, 'context', e.target.value)}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-purple-500"
                                placeholder="会話の状況"
                              />
                            </div>
                          </div>
                          <div className="flex justify-end">
                            <button
                              onClick={() => removeDialogue(index)}
                              className="px-2 py-1 text-xs text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                      {(!lesson.dialogues || lesson.dialogues.length === 0) && (
                        <p className="text-gray-500 text-sm text-center py-4">まだダイアログがありません。追加ボタンで作成してください。</p>
                      )}
                    </div>
                  </div>

                  {/* 応用問題編集 */}
                  <div className="bg-white p-6 rounded-lg border">
                    <div className="flex justify-between items-center mb-4">
                      <h5 className="text-lg font-medium text-gray-900">応用問題</h5>
                      <button
                        onClick={addApplicationPractice}
                        className="px-3 py-1 text-sm bg-orange-100 text-orange-700 rounded hover:bg-orange-200"
                      >
                        <Plus className="h-4 w-4 mr-1 inline" />
                        追加
                      </button>
                    </div>
                    <div className="space-y-4">
                      {(lesson.application_practice || []).map((practice: any, index: number) => (
                        <div key={index} className="border p-4 rounded-lg bg-gray-50">
                          <div className="mb-3">
                            <label className="block text-xs font-medium text-gray-600 mb-1">プロンプト</label>
                            <textarea
                              value={practice.prompt || ''}
                              onChange={(e) => updateApplicationPractice(index, 'prompt', e.target.value)}
                              rows={2}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500"
                              placeholder="学習者への指示や質問"
                            />
                          </div>
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">文法ヒント</label>
                              <input
                                type="text"
                                value={practice.syntax_hint || ''}
                                onChange={(e) => updateApplicationPractice(index, 'syntax_hint', e.target.value)}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500"
                                placeholder="文法や構文のヒント"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">文脈</label>
                              <input
                                type="text"
                                value={practice.context || ''}
                                onChange={(e) => updateApplicationPractice(index, 'context', e.target.value)}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500"
                                placeholder="問題の背景や状況"
                              />
                            </div>
                          </div>
                          <div className="mb-3">
                            <label className="block text-xs font-medium text-gray-600 mb-1">期待キーワード（カンマ区切り）</label>
                            <input
                              type="text"
                              value={(practice.expected_keywords || []).join(', ')}
                              onChange={(e) => updateApplicationPractice(index, 'expected_keywords', e.target.value.split(',').map(k => k.trim()).filter(k => k))}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500"
                              placeholder="解答に含まれるべきキーワード"
                            />
                          </div>
                          <div className="flex justify-end">
                            <button
                              onClick={() => removeApplicationPractice(index)}
                              className="px-2 py-1 text-xs text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                      {(!lesson.application_practice || lesson.application_practice.length === 0) && (
                        <p className="text-gray-500 text-sm text-center py-4">まだ応用問題がありません。追加ボタンで作成してください。</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}