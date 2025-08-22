'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, Loader2, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { createClient } from '../../../../../lib/supabase'

interface KeyPhrase {
  phrase: string
  meaning: string
  phonetic: string
  voice?: string
}

interface Dialogue {
  speaker: string
  text: string
  japanese: string
  voice?: string
  emotion?: string
}

interface GrammarPoint {
  title: string
  explanation: string
  examples: string[]
}

interface VocabularyQuestion {
  question: string
  options: string[]
  correct_answer: number
  explanation: string
}

interface ApplicationPractice {
  prompt: string
  sample_answer: string
  syntax_hint?: string
}

// Available Voice Options
const VOICE_OPTIONS = [
  { value: 'alloy', label: 'Alloy' },
  { value: 'echo', label: 'Echo' },
  { value: 'fable', label: 'Fable' },
  { value: 'onyx', label: 'Onyx' },
  { value: 'nova', label: 'Nova' },
  { value: 'shimmer', label: 'Shimmer' },
]

export default function EditLessonPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [lessonId, setLessonId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [expandedSections, setExpandedSections] = useState({
    basic: true,
    keyPhrases: false,
    dialogues: false,
    grammar: false,
    vocabulary: false,
    application: false,
    ai: false
  })
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    curriculum_id: '',
    order_index: 1,
    lesson_type: 'conversation',
    difficulty_score: 1,
    is_active: true,
    // Complex fields
    key_phrases: [] as KeyPhrase[],
    dialogues: [] as Dialogue[],
    grammar_points: [] as GrammarPoint[],
    vocabulary_questions: [] as VocabularyQuestion[],
    application_practice: [] as ApplicationPractice[],
    cultural_notes: '',
    // AI conversation settings
    ai_conversation_system_prompt: '',
    ai_conversation_display_name: '',
    ai_conversation_display_description: '',
    ai_conversation_emotion: 'friendly'
  })

  useEffect(() => {
    async function getParams() {
      const resolvedParams = await params
      setLessonId(resolvedParams.id)
    }
    getParams()
  }, [params])

  useEffect(() => {
    if (lessonId) {
      fetchLesson()
    }
  }, [lessonId])

  async function fetchLesson() {
    if (!lessonId) return
    
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .eq('id', lessonId)
        .single()

      if (error) throw error

      if (data) {
        setFormData({
          title: data.title || '',
          description: data.description || '',
          curriculum_id: data.curriculum_id || '',
          order_index: data.order_index || 1,
          lesson_type: data.lesson_type || 'conversation',
          difficulty_score: data.difficulty_score || 1,
          is_active: data.is_active !== false,
          key_phrases: data.key_phrases || [],
          dialogues: data.dialogues || [],
          grammar_points: data.grammar_points || [],
          vocabulary_questions: data.vocabulary_questions || [],
          application_practice: data.application_practice || [],
          cultural_notes: data.cultural_notes || '',
          ai_conversation_system_prompt: data.ai_conversation_system_prompt || '',
          ai_conversation_display_name: data.ai_conversation_display_name || '',
          ai_conversation_display_description: data.ai_conversation_display_description || '',
          ai_conversation_emotion: data.ai_conversation_emotion || 'friendly'
        })
      }
    } catch (error) {
      console.error('Error fetching lesson:', error)
      alert('レッスンの取得に失敗しました')
    } finally {
      setFetching(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (!lessonId) {
      alert('レッスンIDが見つかりません')
      return
    }
    
    setLoading(true)
    console.log('Saving lesson data:', formData)

    try {
      const supabase = createClient()
      
      // Add tts_model to all key_phrases and dialogues
      const keyPhrasesWithTTS = formData.key_phrases.map(phrase => ({
        ...phrase,
        tts_model: 'gpt-4o-mini-tts'
      }))
      
      const dialoguesWithTTS = formData.dialogues.map(dialogue => ({
        ...dialogue,
        tts_model: 'gpt-4o-mini-tts'
      }))

      const updateData = {
        title: formData.title,
        description: formData.description,
        order_index: formData.order_index,
        lesson_type: formData.lesson_type,
        difficulty_score: formData.difficulty_score,
        is_active: formData.is_active,
        key_phrases: keyPhrasesWithTTS.length > 0 ? keyPhrasesWithTTS : null,
        dialogues: dialoguesWithTTS.length > 0 ? dialoguesWithTTS : null,
        grammar_points: formData.grammar_points.length > 0 ? formData.grammar_points : null,
        vocabulary_questions: formData.vocabulary_questions.length > 0 ? formData.vocabulary_questions : null,
        application_practice: formData.application_practice.length > 0 ? formData.application_practice : null,
        cultural_notes: formData.cultural_notes || null,
        ai_conversation_system_prompt: formData.ai_conversation_system_prompt || null,
        ai_conversation_display_name: formData.ai_conversation_display_name || null,
        ai_conversation_display_description: formData.ai_conversation_display_description || null,
        ai_conversation_emotion: formData.ai_conversation_emotion || null,
        updated_at: new Date().toISOString()
      }

      console.log('Updating lesson with ID:', lessonId)
      console.log('Update data:', updateData)

      const { data, error } = await supabase
        .from('lessons')
        .update(updateData)
        .eq('id', lessonId)
        .select()

      if (error) {
        console.error('Supabase update error:', error)
        throw error
      }

      console.log('Update successful:', data)

      alert('レッスンを更新しました')
      router.push('/dashboard/lessons')
    } catch (error: any) {
      console.error('Error updating lesson:', error)
      alert(`レッスンの更新に失敗しました: ${error.message || 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section as keyof typeof prev]
    }))
  }

  // Add Key Phrase
  const addKeyPhrase = () => {
    setFormData({
      ...formData,
      key_phrases: [...formData.key_phrases, { phrase: '', meaning: '', phonetic: '', voice: 'nova' }]
    })
  }

  const updateKeyPhrase = (index: number, field: keyof KeyPhrase, value: string) => {
    const updated = [...formData.key_phrases]
    updated[index] = { ...updated[index], [field]: value }
    setFormData({ ...formData, key_phrases: updated })
  }

  const removeKeyPhrase = (index: number) => {
    setFormData({
      ...formData,
      key_phrases: formData.key_phrases.filter((_, i) => i !== index)
    })
  }

  // Add Dialogue
  const addDialogue = () => {
    setFormData({
      ...formData,
      dialogues: [...formData.dialogues, { speaker: '', text: '', japanese: '', voice: 'nova', emotion: 'neutral' }]
    })
  }

  const updateDialogue = (index: number, field: keyof Dialogue, value: string) => {
    const updated = [...formData.dialogues]
    updated[index] = { ...updated[index], [field]: value }
    setFormData({ ...formData, dialogues: updated })
  }

  const removeDialogue = (index: number) => {
    setFormData({
      ...formData,
      dialogues: formData.dialogues.filter((_, i) => i !== index)
    })
  }

  // Add Grammar Point
  const addGrammarPoint = () => {
    setFormData({
      ...formData,
      grammar_points: [...formData.grammar_points, { title: '', explanation: '', examples: [] }]
    })
  }

  const updateGrammarPoint = (index: number, field: keyof GrammarPoint, value: any) => {
    const updated = [...formData.grammar_points]
    updated[index] = { ...updated[index], [field]: value }
    setFormData({ ...formData, grammar_points: updated })
  }

  const removeGrammarPoint = (index: number) => {
    setFormData({
      ...formData,
      grammar_points: formData.grammar_points.filter((_, i) => i !== index)
    })
  }

  // Add Vocabulary Question
  const addVocabularyQuestion = () => {
    setFormData({
      ...formData,
      vocabulary_questions: [...formData.vocabulary_questions, { 
        question: '', 
        options: ['', '', '', ''], 
        correct_answer: 0,
        explanation: ''
      }]
    })
  }

  const updateVocabularyQuestion = (index: number, field: keyof VocabularyQuestion, value: any) => {
    const updated = [...formData.vocabulary_questions]
    updated[index] = { ...updated[index], [field]: value }
    setFormData({ ...formData, vocabulary_questions: updated })
  }

  const removeVocabularyQuestion = (index: number) => {
    setFormData({
      ...formData,
      vocabulary_questions: formData.vocabulary_questions.filter((_, i) => i !== index)
    })
  }

  // Add Application Practice
  const addApplicationPractice = () => {
    setFormData({
      ...formData,
      application_practice: [...formData.application_practice, { 
        prompt: '', 
        sample_answer: '',
        syntax_hint: ''
      }]
    })
  }

  const updateApplicationPractice = (index: number, field: keyof ApplicationPractice, value: string) => {
    const updated = [...formData.application_practice]
    updated[index] = { ...updated[index], [field]: value }
    setFormData({ ...formData, application_practice: updated })
  }

  const removeApplicationPractice = (index: number) => {
    setFormData({
      ...formData,
      application_practice: formData.application_practice.filter((_, i) => i !== index)
    })
  }

  if (fetching) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-pink-600" />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <Link
          href="/dashboard/lessons"
          className="inline-flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          レッスン一覧に戻る
        </Link>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">レッスン編集</h1>

            {/* Basic Information Section */}
            <div className="mb-6">
              <button
                type="button"
                onClick={() => toggleSection('basic')}
                className="flex items-center justify-between w-full text-left font-semibold text-lg mb-4"
              >
                基本情報
                {expandedSections.basic ? <ChevronUp /> : <ChevronDown />}
              </button>
              
              {expandedSections.basic && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        レッスンタイトル <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        レッスンタイプ
                      </label>
                      <select
                        value={formData.lesson_type}
                        onChange={(e) => setFormData({ ...formData, lesson_type: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                      >
                        <option value="conversation">会話</option>
                        <option value="grammar">文法</option>
                        <option value="vocabulary">語彙</option>
                        <option value="listening">リスニング</option>
                        <option value="reading">リーディング</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      説明
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        表示順序
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={formData.order_index}
                        onChange={(e) => setFormData({ ...formData, order_index: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        難易度スコア (1-5)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="5"
                        value={formData.difficulty_score}
                        onChange={(e) => setFormData({ ...formData, difficulty_score: parseFloat(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                      />
                    </div>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="is_active"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
                    />
                    <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                      アクティブ
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Key Phrases Section */}
            <div className="mb-6 border-t pt-6">
              <button
                type="button"
                onClick={() => toggleSection('keyPhrases')}
                className="flex items-center justify-between w-full text-left font-semibold text-lg mb-4"
              >
                キーフレーズ
                {expandedSections.keyPhrases ? <ChevronUp /> : <ChevronDown />}
              </button>
              
              {expandedSections.keyPhrases && (
                <div className="space-y-4">
                  {formData.key_phrases.map((phrase, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
                        <input
                          type="text"
                          placeholder="フレーズ (英語)"
                          value={phrase.phrase}
                          onChange={(e) => updateKeyPhrase(index, 'phrase', e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-lg"
                        />
                        <input
                          type="text"
                          placeholder="意味 (日本語)"
                          value={phrase.meaning}
                          onChange={(e) => updateKeyPhrase(index, 'meaning', e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-lg"
                        />
                        <input
                          type="text"
                          placeholder="発音記号"
                          value={phrase.phonetic}
                          onChange={(e) => updateKeyPhrase(index, 'phonetic', e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <select
                          value={phrase.voice || 'nova'}
                          onChange={(e) => updateKeyPhrase(index, 'voice', e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-lg"
                        >
                          <option value="">音声なし</option>
                          {VOICE_OPTIONS.map(option => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                          ))}
                        </select>
                        <span className="text-sm text-gray-500">TTS: GPT-4o Mini</span>
                        <button
                          type="button"
                          onClick={() => removeKeyPhrase(index)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addKeyPhrase}
                    className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    キーフレーズを追加
                  </button>
                </div>
              )}
            </div>

            {/* Dialogues Section */}
            <div className="mb-6 border-t pt-6">
              <button
                type="button"
                onClick={() => toggleSection('dialogues')}
                className="flex items-center justify-between w-full text-left font-semibold text-lg mb-4"
              >
                ダイアログ
                {expandedSections.dialogues ? <ChevronUp /> : <ChevronDown />}
              </button>
              
              {expandedSections.dialogues && (
                <div className="space-y-4">
                  {formData.dialogues.map((dialogue, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <input
                          type="text"
                          placeholder="話者 (Staff/Customer等)"
                          value={dialogue.speaker}
                          onChange={(e) => updateDialogue(index, 'speaker', e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-lg"
                        />
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="感情表現 (例: friendly, excited)"
                            value={dialogue.emotion || ''}
                            onChange={(e) => updateDialogue(index, 'emotion', e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg w-full"
                            title="英語で感情を記述: friendly, polite, happy, excited, calm, professional等"
                          />
                          <div className="absolute -bottom-5 left-0 text-xs text-gray-500">
                            <a href="/docs/EMOTION_GUIDELINES.md" target="_blank" className="underline hover:text-blue-600">
                              感情表現ガイド
                            </a>
                            : friendly, polite, happy, excited等
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                        <textarea
                          placeholder="英語テキスト"
                          value={dialogue.text}
                          onChange={(e) => updateDialogue(index, 'text', e.target.value)}
                          rows={2}
                          className="px-3 py-2 border border-gray-300 rounded-lg"
                        />
                        <textarea
                          placeholder="日本語訳"
                          value={dialogue.japanese}
                          onChange={(e) => updateDialogue(index, 'japanese', e.target.value)}
                          rows={2}
                          className="px-3 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <select
                          value={dialogue.voice || 'nova'}
                          onChange={(e) => updateDialogue(index, 'voice', e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-lg"
                        >
                          <option value="">音声なし</option>
                          {VOICE_OPTIONS.map(option => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                          ))}
                        </select>
                        <span className="text-sm text-gray-500">TTS: GPT-4o Mini</span>
                        <button
                          type="button"
                          onClick={() => removeDialogue(index)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addDialogue}
                    className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    ダイアログを追加
                  </button>
                </div>
              )}
            </div>

            {/* Grammar Points Section */}
            <div className="mb-6 border-t pt-6">
              <button
                type="button"
                onClick={() => toggleSection('grammar')}
                className="flex items-center justify-between w-full text-left font-semibold text-lg mb-4"
              >
                文法ポイント
                {expandedSections.grammar ? <ChevronUp /> : <ChevronDown />}
              </button>
              
              {expandedSections.grammar && (
                <div className="space-y-4">
                  {formData.grammar_points.map((point, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <input
                        type="text"
                        placeholder="タイトル"
                        value={point.title}
                        onChange={(e) => updateGrammarPoint(index, 'title', e.target.value)}
                        className="w-full mb-2 px-3 py-2 border border-gray-300 rounded-lg"
                      />
                      <textarea
                        placeholder="説明"
                        value={point.explanation}
                        onChange={(e) => updateGrammarPoint(index, 'explanation', e.target.value)}
                        rows={2}
                        className="w-full mb-2 px-3 py-2 border border-gray-300 rounded-lg"
                      />
                      <div className="flex gap-2">
                        <textarea
                          placeholder="例文（改行区切り）"
                          value={point.examples.join('\n')}
                          onChange={(e) => updateGrammarPoint(index, 'examples', e.target.value.split('\n'))}
                          rows={2}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => removeGrammarPoint(index)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded self-start"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addGrammarPoint}
                    className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    文法ポイントを追加
                  </button>
                </div>
              )}
            </div>

            {/* Vocabulary Questions Section */}
            <div className="mb-6 border-t pt-6">
              <button
                type="button"
                onClick={() => toggleSection('vocabulary')}
                className="flex items-center justify-between w-full text-left font-semibold text-lg mb-4"
              >
                語彙問題
                {expandedSections.vocabulary ? <ChevronUp /> : <ChevronDown />}
              </button>
              
              {expandedSections.vocabulary && (
                <div className="space-y-4">
                  {formData.vocabulary_questions.map((question, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <input
                        type="text"
                        placeholder="問題文"
                        value={question.question}
                        onChange={(e) => updateVocabularyQuestion(index, 'question', e.target.value)}
                        className="w-full mb-2 px-3 py-2 border border-gray-300 rounded-lg"
                      />
                      <div className="grid grid-cols-2 gap-2 mb-2">
                        {question.options.map((option, optIndex) => (
                          <input
                            key={optIndex}
                            type="text"
                            placeholder={`選択肢 ${optIndex + 1}`}
                            value={option}
                            onChange={(e) => {
                              const newOptions = [...question.options]
                              newOptions[optIndex] = e.target.value
                              updateVocabularyQuestion(index, 'options', newOptions)
                            }}
                            className="px-3 py-2 border border-gray-300 rounded-lg"
                          />
                        ))}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <select
                          value={question.correct_answer}
                          onChange={(e) => updateVocabularyQuestion(index, 'correct_answer', parseInt(e.target.value))}
                          className="px-3 py-2 border border-gray-300 rounded-lg"
                        >
                          <option value={0}>正解: 選択肢1</option>
                          <option value={1}>正解: 選択肢2</option>
                          <option value={2}>正解: 選択肢3</option>
                          <option value={3}>正解: 選択肢4</option>
                        </select>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="解説"
                            value={question.explanation}
                            onChange={(e) => updateVocabularyQuestion(index, 'explanation', e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => removeVocabularyQuestion(index)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addVocabularyQuestion}
                    className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    語彙問題を追加
                  </button>
                </div>
              )}
            </div>

            {/* Application Practice Section */}
            <div className="mb-6 border-t pt-6">
              <button
                type="button"
                onClick={() => toggleSection('application')}
                className="flex items-center justify-between w-full text-left font-semibold text-lg mb-4"
              >
                応用練習
                {expandedSections.application ? <ChevronUp /> : <ChevronDown />}
              </button>
              
              {expandedSections.application && (
                <div className="space-y-4">
                  {formData.application_practice.map((practice, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <textarea
                        placeholder="練習問題のプロンプト"
                        value={practice.prompt}
                        onChange={(e) => updateApplicationPractice(index, 'prompt', e.target.value)}
                        rows={2}
                        className="w-full mb-2 px-3 py-2 border border-gray-300 rounded-lg"
                      />
                      <input
                        type="text"
                        placeholder="構文ヒント (任意)"
                        value={practice.syntax_hint || ''}
                        onChange={(e) => updateApplicationPractice(index, 'syntax_hint', e.target.value)}
                        className="w-full mb-2 px-3 py-2 border border-gray-300 rounded-lg"
                      />
                      <div className="flex gap-2">
                        <textarea
                          placeholder="サンプル回答"
                          value={practice.sample_answer}
                          onChange={(e) => updateApplicationPractice(index, 'sample_answer', e.target.value)}
                          rows={2}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => removeApplicationPractice(index)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded self-start"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addApplicationPractice}
                    className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    応用練習を追加
                  </button>
                </div>
              )}
            </div>

            {/* AI Conversation Section */}
            <div className="mb-6 border-t pt-6">
              <button
                type="button"
                onClick={() => toggleSection('ai')}
                className="flex items-center justify-between w-full text-left font-semibold text-lg mb-4"
              >
                AI会話設定
                {expandedSections.ai ? <ChevronUp /> : <ChevronDown />}
              </button>
              
              {expandedSections.ai && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      AIシステムプロンプト
                    </label>
                    <textarea
                      value={formData.ai_conversation_system_prompt}
                      onChange={(e) => setFormData({ ...formData, ai_conversation_system_prompt: e.target.value })}
                      rows={3}
                      placeholder="AIの振る舞いを定義するプロンプト"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        AI表示名
                      </label>
                      <input
                        type="text"
                        value={formData.ai_conversation_display_name}
                        onChange={(e) => setFormData({ ...formData, ai_conversation_display_name: e.target.value })}
                        placeholder="例: Emily先生"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        感情トーン
                      </label>
                      <select
                        value={formData.ai_conversation_emotion}
                        onChange={(e) => setFormData({ ...formData, ai_conversation_emotion: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                      >
                        <option value="friendly">friendly</option>
                        <option value="professional">professional</option>
                        <option value="encouraging">encouraging</option>
                        <option value="neutral">neutral</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      AI説明文
                    </label>
                    <input
                      type="text"
                      value={formData.ai_conversation_display_description}
                      onChange={(e) => setFormData({ ...formData, ai_conversation_display_description: e.target.value })}
                      placeholder="AIキャラクターの説明"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Cultural Notes */}
            <div className="mb-6 border-t pt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                文化的なメモ
              </label>
              <textarea
                value={formData.cultural_notes}
                onChange={(e) => setFormData({ ...formData, cultural_notes: e.target.value })}
                rows={3}
                placeholder="文化的な背景や注意事項"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
            </div>
          </div>
        </div>

        {/* Submit Buttons */}
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
                更新中...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                更新
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}