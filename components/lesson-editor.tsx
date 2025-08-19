'use client'

import React, { useState, useCallback, useMemo } from 'react'
import { Plus, Trash2, GripVertical, Copy, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react'
import { LessonData, KeyPhrase, Dialogue, VocabularyQuestion, GrammarPoint, ApplicationPractice } from '@/lib/lesson-service'

interface LessonEditorProps {
  initialData?: Partial<LessonData>
  onSubmit: (data: LessonData) => Promise<void>
  onCancel?: () => void
  curriculums?: Array<{ id: string; title: string }>
  loading?: boolean
}

export default function LessonEditor({
  initialData,
  onSubmit,
  onCancel,
  curriculums = [],
  loading = false
}: LessonEditorProps) {
  const [formData, setFormData] = useState<Partial<LessonData>>({
    title: '',
    description: '',
    curriculum_id: '',
    type: 'conversation',
    difficulty: 'beginner',
    estimated_minutes: 30,
    character_id: 'sarah',
    objectives: [],
    key_phrases: [],
    dialogues: [],
    vocabulary_questions: [],
    application_practice: [],
    grammar_points: [],
    is_active: true,
    ...initialData
  })

  const [activeTab, setActiveTab] = useState('basic')
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [showPreview, setShowPreview] = useState(false)

  const updateField = useCallback((field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setValidationErrors([])
  }, [])

  const addObjective = useCallback(() => {
    updateField('objectives', [...(formData.objectives || []), ''])
  }, [formData.objectives, updateField])

  const updateObjective = useCallback((index: number, value: string) => {
    const objectives = [...(formData.objectives || [])]
    objectives[index] = value
    updateField('objectives', objectives)
  }, [formData.objectives, updateField])

  const removeObjective = useCallback((index: number) => {
    const objectives = [...(formData.objectives || [])]
    objectives.splice(index, 1)
    updateField('objectives', objectives)
  }, [formData.objectives, updateField])

  const addKeyPhrase = useCallback(() => {
    const newPhrase: KeyPhrase = {
      phrase: '',
      meaning: '',
      phonetic: '',
      examples: []
    }
    updateField('key_phrases', [...(formData.key_phrases || []), newPhrase])
  }, [formData.key_phrases, updateField])

  const updateKeyPhrase = useCallback((index: number, field: keyof KeyPhrase, value: any) => {
    const phrases = [...(formData.key_phrases || [])]
    phrases[index] = { ...phrases[index], [field]: value }
    updateField('key_phrases', phrases)
  }, [formData.key_phrases, updateField])

  const removeKeyPhrase = useCallback((index: number) => {
    const phrases = [...(formData.key_phrases || [])]
    phrases.splice(index, 1)
    updateField('key_phrases', phrases)
  }, [formData.key_phrases, updateField])

  const addDialogue = useCallback(() => {
    const newDialogue: Dialogue = {
      speaker: 'AI',
      text: '',
      japanese: ''
    }
    updateField('dialogues', [...(formData.dialogues || []), newDialogue])
  }, [formData.dialogues, updateField])

  const updateDialogue = useCallback((index: number, field: keyof Dialogue, value: any) => {
    const dialogues = [...(formData.dialogues || [])]
    dialogues[index] = { ...dialogues[index], [field]: value }
    updateField('dialogues', dialogues)
  }, [formData.dialogues, updateField])

  const removeDialogue = useCallback((index: number) => {
    const dialogues = [...(formData.dialogues || [])]
    dialogues.splice(index, 1)
    updateField('dialogues', dialogues)
  }, [formData.dialogues, updateField])

  const addVocabularyQuestion = useCallback(() => {
    const newQuestion: VocabularyQuestion = {
      question: '',
      options: ['', '', '', ''],
      correct_answer: 0,
      explanation: ''
    }
    updateField('vocabulary_questions', [...(formData.vocabulary_questions || []), newQuestion])
  }, [formData.vocabulary_questions, updateField])

  const updateVocabularyQuestion = useCallback((index: number, field: keyof VocabularyQuestion, value: any) => {
    const questions = [...(formData.vocabulary_questions || [])]
    questions[index] = { ...questions[index], [field]: value }
    updateField('vocabulary_questions', questions)
  }, [formData.vocabulary_questions, updateField])

  const removeVocabularyQuestion = useCallback((index: number) => {
    const questions = [...(formData.vocabulary_questions || [])]
    questions.splice(index, 1)
    updateField('vocabulary_questions', questions)
  }, [formData.vocabulary_questions, updateField])

  const addApplicationPractice = useCallback(() => {
    const newPractice: ApplicationPractice = {
      prompt: '',
      syntax_hint: '',
      sample_answer: ''
    }
    updateField('application_practice', [...(formData.application_practice || []), newPractice])
  }, [formData.application_practice, updateField])

  const updateApplicationPractice = useCallback((index: number, field: keyof ApplicationPractice, value: any) => {
    const practices = [...(formData.application_practice || [])]
    practices[index] = { ...practices[index], [field]: value }
    updateField('application_practice', practices)
  }, [formData.application_practice, updateField])

  const removeApplicationPractice = useCallback((index: number) => {
    const practices = [...(formData.application_practice || [])]
    practices.splice(index, 1)
    updateField('application_practice', practices)
  }, [formData.application_practice, updateField])

  const addGrammarPoint = useCallback(() => {
    const newGrammar: GrammarPoint = {
      name: '',
      explanation: '',
      structure: '',
      examples: [],
      commonMistakes: []
    }
    updateField('grammar_points', [...(formData.grammar_points || []), newGrammar])
  }, [formData.grammar_points, updateField])

  const updateGrammarPoint = useCallback((index: number, field: keyof GrammarPoint, value: any) => {
    const points = [...(formData.grammar_points || [])]
    points[index] = { ...points[index], [field]: value }
    updateField('grammar_points', points)
  }, [formData.grammar_points, updateField])

  const removeGrammarPoint = useCallback((index: number) => {
    const points = [...(formData.grammar_points || [])]
    points.splice(index, 1)
    updateField('grammar_points', points)
  }, [formData.grammar_points, updateField])

  const validateForm = useCallback(() => {
    const errors: string[] = []

    if (!formData.title?.trim()) {
      errors.push('タイトルは必須です')
    }

    if (!formData.type) {
      errors.push('レッスンタイプを選択してください')
    }

    if (!formData.difficulty) {
      errors.push('難易度を選択してください')
    }

    const hasContent = 
      (formData.key_phrases && formData.key_phrases.length > 0) ||
      (formData.dialogues && formData.dialogues.length > 0) ||
      (formData.vocabulary_questions && formData.vocabulary_questions.length > 0) ||
      (formData.application_practice && formData.application_practice.length > 0) ||
      (formData.grammar_points && formData.grammar_points.length > 0)

    if (!hasContent) {
      errors.push('少なくとも1つのコンテンツを追加してください')
    }

    setValidationErrors(errors)
    return errors.length === 0
  }, [formData])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    await onSubmit(formData as LessonData)
  }, [formData, onSubmit, validateForm])

  const tabs = [
    { id: 'basic', label: '基本情報', icon: null },
    { id: 'objectives', label: '学習目標', count: formData.objectives?.length },
    { id: 'key_phrases', label: 'キーフレーズ', count: formData.key_phrases?.length },
    { id: 'dialogues', label: 'ダイアログ', count: formData.dialogues?.length },
    { id: 'vocabulary', label: '語彙', count: formData.vocabulary_questions?.length },
    { id: 'application', label: '応用練習', count: formData.application_practice?.length },
    { id: 'grammar', label: '文法', count: formData.grammar_points?.length },
    { id: 'ai_settings', label: 'AI設定', icon: null }
  ]

  return (
    <div className="max-w-6xl mx-auto">
      {validationErrors.length > 0 && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 mr-2" />
            <div>
              <h3 className="text-sm font-medium text-red-800">入力エラー</h3>
              <ul className="mt-2 text-sm text-red-700 list-disc list-inside">
                {validationErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow">
        <div className="border-b">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2
                  ${activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <span>{tab.label}</span>
                {tab.count !== undefined && tab.count > 0 && (
                  <span className="ml-2 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {activeTab === 'basic' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  タイトル <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => updateField('title', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="レッスンのタイトルを入力"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  説明
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="レッスンの説明を入力"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    カリキュラム
                  </label>
                  <select
                    value={formData.curriculum_id}
                    onChange={(e) => updateField('curriculum_id', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">選択してください</option>
                    {curriculums.map(curriculum => (
                      <option key={curriculum.id} value={curriculum.id}>
                        {curriculum.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    レッスンタイプ <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => updateField('type', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="conversation">会話</option>
                    <option value="pronunciation">発音</option>
                    <option value="vocabulary">語彙</option>
                    <option value="grammar">文法</option>
                    <option value="review">復習</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    難易度 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.difficulty}
                    onChange={(e) => updateField('difficulty', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="beginner">初級</option>
                    <option value="elementary">初中級</option>
                    <option value="intermediate">中級</option>
                    <option value="advanced">上級</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    推定時間（分）
                  </label>
                  <input
                    type="number"
                    value={formData.estimated_minutes}
                    onChange={(e) => updateField('estimated_minutes', parseInt(e.target.value))}
                    min="5"
                    max="120"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    キャラクター
                  </label>
                  <select
                    value={formData.character_id}
                    onChange={(e) => updateField('character_id', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="sarah">Sarah</option>
                    <option value="maya">Maya</option>
                    <option value="alex">Alex</option>
                    <option value="emma">Emma</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => updateField('is_active', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                  このレッスンを有効にする
                </label>
              </div>
            </div>
          )}

          {activeTab === 'objectives' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">学習目標</h3>
                <button
                  type="button"
                  onClick={addObjective}
                  className="flex items-center px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  追加
                </button>
              </div>

              {(formData.objectives || []).map((objective, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <GripVertical className="h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={objective}
                    onChange={(e) => updateObjective(index, e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="学習目標を入力"
                  />
                  <button
                    type="button"
                    onClick={() => removeObjective(index)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}

              {(!formData.objectives || formData.objectives.length === 0) && (
                <div className="text-center py-8 text-gray-500">
                  学習目標がまだ追加されていません
                </div>
              )}
            </div>
          )}

          {activeTab === 'key_phrases' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">キーフレーズ</h3>
                <button
                  type="button"
                  onClick={addKeyPhrase}
                  className="flex items-center px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  追加
                </button>
              </div>

              {(formData.key_phrases || []).map((phrase, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        value={phrase.phrase}
                        onChange={(e) => updateKeyPhrase(index, 'phrase', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="フレーズ"
                      />
                      <input
                        type="text"
                        value={phrase.meaning}
                        onChange={(e) => updateKeyPhrase(index, 'meaning', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="意味"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeKeyPhrase(index)}
                      className="ml-2 p-2 text-red-500 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <input
                    type="text"
                    value={phrase.phonetic || ''}
                    onChange={(e) => updateKeyPhrase(index, 'phonetic', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="発音記号（オプション）"
                  />
                  
                  {/* 音声・感情設定フィールド */}
                  <div className="grid grid-cols-3 gap-3">
                    <select
                      value={phrase.emotion || ''}
                      onChange={(e) => updateKeyPhrase(index, 'emotion', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">感情設定なし</option>
                      <option value="friendly">フレンドリー</option>
                      <option value="polite">丁寧</option>
                      <option value="happy">嬉しい</option>
                      <option value="encouraging">励ます</option>
                      <option value="calm">冷静</option>
                      <option value="apologetic">申し訳ない</option>
                    </select>
                    
                    <select
                      value={phrase.voice || ''}
                      onChange={(e) => updateKeyPhrase(index, 'voice', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">音声設定なし</option>
                      <option value="nova">Nova (デフォルト)</option>
                      <option value="fable">Fable</option>
                      <option value="onyx">Onyx</option>
                      <option value="shimmer">Shimmer</option>
                      <option value="echo">Echo</option>
                      <option value="alloy">Alloy</option>
                    </select>
                    
                    <select
                      value={phrase.tts_model || ''}
                      onChange={(e) => updateKeyPhrase(index, 'tts_model', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">TTSモデル設定なし</option>
                      <option value="gpt-4o-mini-tts">GPT-4o-mini-TTS</option>
                      <option value="tts-1">TTS-1</option>
                      <option value="tts-1-hd">TTS-1-HD</option>
                    </select>
                  </div>
                </div>
              ))}

              {(!formData.key_phrases || formData.key_phrases.length === 0) && (
                <div className="text-center py-8 text-gray-500">
                  キーフレーズがまだ追加されていません
                </div>
              )}
            </div>
          )}

          {activeTab === 'dialogues' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">ダイアログ</h3>
                <button
                  type="button"
                  onClick={addDialogue}
                  className="flex items-center px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  追加
                </button>
              </div>

              {(formData.dialogues || []).map((dialogue, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-3">
                  <div className="flex items-center space-x-3">
                    <input
                      type="text"
                      value={dialogue.speaker}
                      onChange={(e) => updateDialogue(index, 'speaker', e.target.value)}
                      className="w-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="話者名"
                    />
                    <input
                      type="text"
                      value={dialogue.text}
                      onChange={(e) => updateDialogue(index, 'text', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="テキスト"
                    />
                    <button
                      type="button"
                      onClick={() => removeDialogue(index)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <input
                    type="text"
                    value={dialogue.japanese || dialogue.translation || ''}
                    onChange={(e) => updateDialogue(index, 'japanese', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="日本語翻訳（オプション）"
                  />
                  
                  {/* 音声・感情設定フィールド（オプション） */}
                  <div className="grid grid-cols-3 gap-3 mt-3">
                    <select
                      value={dialogue.emotion || ''}
                      onChange={(e) => updateDialogue(index, 'emotion', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">感情設定なし</option>
                      <option value="friendly">フレンドリー</option>
                      <option value="polite">丁寧</option>
                      <option value="happy">嬉しい</option>
                      <option value="encouraging">励ます</option>
                      <option value="calm">冷静</option>
                      <option value="apologetic">申し訳ない</option>
                    </select>
                    
                    <select
                      value={dialogue.voice || ''}
                      onChange={(e) => updateDialogue(index, 'voice', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">音声設定なし</option>
                      <option value="nova">Nova</option>
                      <option value="fable">Fable (デフォルト)</option>
                      <option value="onyx">Onyx</option>
                      <option value="shimmer">Shimmer</option>
                      <option value="echo">Echo</option>
                      <option value="alloy">Alloy</option>
                    </select>
                    
                    <select
                      value={dialogue.tts_model || ''}
                      onChange={(e) => updateDialogue(index, 'tts_model', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">TTSモデル設定なし</option>
                      <option value="gpt-4o-mini-tts">GPT-4o-mini-TTS</option>
                      <option value="tts-1">TTS-1</option>
                      <option value="tts-1-hd">TTS-1-HD</option>
                    </select>
                  </div>
                </div>
              ))}

              {(!formData.dialogues || formData.dialogues.length === 0) && (
                <div className="text-center py-8 text-gray-500">
                  ダイアログがまだ追加されていません
                </div>
              )}
            </div>
          )}

          {activeTab === 'vocabulary' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">語彙問題</h3>
                <button
                  type="button"
                  onClick={addVocabularyQuestion}
                  className="flex items-center px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  追加
                </button>
              </div>

              {(formData.vocabulary_questions || []).map((question, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 space-y-3">
                      <div className="w-full">
                        <input
                          type="text"
                          value={question.question}
                          onChange={(e) => updateVocabularyQuestion(index, 'question', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="問題の単語"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">選択肢</label>
                        <div className="grid grid-cols-2 gap-2">
                          {question.options.map((option, optIndex) => (
                            <input
                              key={optIndex}
                              type="text"
                              value={option}
                              onChange={(e) => {
                                const newOptions = [...question.options]
                                newOptions[optIndex] = e.target.value
                                updateVocabularyQuestion(index, 'options', newOptions)
                              }}
                              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder={`選択肢 ${optIndex + 1}`}
                            />
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <select
                          value={question.correct_answer}
                          onChange={(e) => updateVocabularyQuestion(index, 'correct_answer', parseInt(e.target.value))}
                          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value={0}>選択肢 1</option>
                          <option value={1}>選択肢 2</option>
                          <option value={2}>選択肢 3</option>
                          <option value={3}>選択肢 4</option>
                        </select>
                        <input
                          type="text"
                          value={question.explanation || ''}
                          onChange={(e) => updateVocabularyQuestion(index, 'explanation', e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="解説（オプション）"
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeVocabularyQuestion(index)}
                      className="ml-2 p-2 text-red-500 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}

              {(!formData.vocabulary_questions || formData.vocabulary_questions.length === 0) && (
                <div className="text-center py-8 text-gray-500">
                  語彙問題がまだ追加されていません
                </div>
              )}
            </div>
          )}

          {activeTab === 'grammar' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">文法ポイント</h3>
                <button
                  type="button"
                  onClick={addGrammarPoint}
                  className="flex items-center px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  追加
                </button>
              </div>

              {(formData.grammar_points || []).map((point, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 space-y-3">
                      <input
                        type="text"
                        value={point.name}
                        onChange={(e) => updateGrammarPoint(index, 'name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="文法項目名"
                      />
                      <textarea
                        value={point.explanation}
                        onChange={(e) => updateGrammarPoint(index, 'explanation', e.target.value)}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="説明"
                      />
                      <input
                        type="text"
                        value={point.structure}
                        onChange={(e) => updateGrammarPoint(index, 'structure', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="構造・パターン"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeGrammarPoint(index)}
                      className="ml-2 p-2 text-red-500 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}

              {(!formData.grammar_points || formData.grammar_points.length === 0) && (
                <div className="text-center py-8 text-gray-500">
                  文法ポイントがまだ追加されていません
                </div>
              )}
            </div>
          )}

          {activeTab === 'application' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">応用練習</h3>
                <button
                  type="button"
                  onClick={addApplicationPractice}
                  className="flex items-center px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  追加
                </button>
              </div>

              {(formData.application_practice || []).map((practice, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          プロンプト（練習課題）
                        </label>
                        <textarea
                          value={practice.prompt}
                          onChange={(e) => updateApplicationPractice(index, 'prompt', e.target.value)}
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="例: 友人のドライブの誘いを断る理由を説明してください。"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          文法ヒント（オプション）
                        </label>
                        <input
                          type="text"
                          value={practice.syntax_hint || ''}
                          onChange={(e) => updateApplicationPractice(index, 'syntax_hint', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="例: I'd love to + [活動] + but I can't + [動詞]"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          サンプル回答（オプション）
                        </label>
                        <input
                          type="text"
                          value={practice.sample_answer || ''}
                          onChange={(e) => updateApplicationPractice(index, 'sample_answer', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="例: I'd love to go, but I can't drive."
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeApplicationPractice(index)}
                      className="ml-2 p-2 text-red-500 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}

              {(!formData.application_practice || formData.application_practice.length === 0) && (
                <div className="text-center py-8 text-gray-500">
                  応用練習がまだ追加されていません
                </div>
              )}
            </div>
          )}

          {activeTab === 'ai_settings' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  AI会話システムプロンプト
                </label>
                <textarea
                  value={formData.ai_conversation_system_prompt || ''}
                  onChange={(e) => updateField('ai_conversation_system_prompt', e.target.value)}
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="AI会話のシステムプロンプトを入力"
                />
                <p className="mt-1 text-sm text-gray-500">
                  このプロンプトはAI会話練習時にAIの振る舞いを制御します
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  AI会話表示名
                </label>
                <input
                  type="text"
                  value={formData.ai_conversation_display_name || ''}
                  onChange={(e) => updateField('ai_conversation_display_name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="例: カフェの店員"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  AI会話説明
                </label>
                <textarea
                  value={formData.ai_conversation_display_description || ''}
                  onChange={(e) => updateField('ai_conversation_display_description', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="例: カフェで注文する練習をしましょう"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  AI会話音声モデル
                </label>
                <select
                  value={formData.ai_conversation_voice_model || 'nova'}
                  onChange={(e) => updateField('ai_conversation_voice_model', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="nova">Nova (デフォルト)</option>
                  <option value="fable">Fable</option>
                  <option value="onyx">Onyx</option>
                  <option value="shimmer">Shimmer</option>
                  <option value="echo">Echo</option>
                  <option value="alloy">Alloy</option>
                </select>
                <p className="mt-1 text-sm text-gray-500">
                  AI会話練習で使用する固定音声モデル（感情はAIが動的に決定）
                </p>
              </div>

            </div>
          )}

          <div className="mt-6 flex justify-end space-x-3 pt-6 border-t">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                キャンセル
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 flex items-center"
            >
              {showPreview ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
              プレビュー
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {loading ? (
                <>
                  <span className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"></span>
                  保存中...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  保存
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {showPreview && (
        <div className="mt-6 bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-medium mb-4">プレビュー</h3>
          <div className="bg-white rounded-lg p-4">
            <pre className="text-sm text-gray-700 whitespace-pre-wrap">
              {JSON.stringify(formData, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  )
}