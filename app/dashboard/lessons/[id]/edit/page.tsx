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

interface CharacterSettings {
  name: string
  voice: string
}

interface Dialogue {
  speaker: string
  text: string
  japanese: string
  voice?: string
  emotion?: string
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
  const [isComposing, setIsComposing] = useState(false)
  const [expandedSections, setExpandedSections] = useState({
    basic: true,
    keyPhrases: false,
    dialogues: false,
    vocabulary: false,
    application: false,
    ai: false
  })
  const [activeAiTab, setActiveAiTab] = useState<'session1' | 'session2' | 'session3'>('session1')
  
  const [characterSettings, setCharacterSettings] = useState<CharacterSettings[]>([
    { name: 'Staff', voice: 'nova' },
    { name: 'Customer', voice: 'alloy' }
  ])

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    curriculum_id: '',
    order_index: 1,
    is_active: true,
    objectives: [] as string[],  // 学習目標を追加
    // Complex fields
    key_phrases: [] as KeyPhrase[],
    dialogues: [] as Dialogue[],
    vocabulary_questions: [] as VocabularyQuestion[],
    application_practice: [] as ApplicationPractice[],
    // AI conversation settings - 3セッション個別設定
    // セッション1
    session1_ai_role: '',  // AIの役割
    session1_user_role: '',  // ユーザーの役割
    session1_situation: '',  // シチュエーション
    session1_personality: '',  // AIの性格特性
    // セッション2
    session2_ai_role: '',
    session2_user_role: '',
    session2_situation: '',
    session2_personality: '',
    // セッション3
    session3_ai_role: '',
    session3_user_role: '',
    session3_situation: '',
    session3_personality: '',
    // フィードバック設定
    ai_feedback_style: 'encouraging',
    ai_evaluation_focus: '文法,語彙,流暢さ,適切さ',
    ai_evaluation_strictness: 'medium',
    ai_score_weight_grammar: 25,
    ai_score_weight_vocabulary: 25,
    ai_score_weight_fluency: 25,
    ai_score_weight_appropriateness: 25
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
      
      // レッスンデータを取得
      const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .eq('id', lessonId)
        .single()

      if (error) throw error
      
      // AI会話設定を取得
      const { data: aiPromptData, error: aiError } = await supabase
        .from('lesson_ai_prompts')
        .select('*')
        .eq('lesson_id', lessonId)
        .eq('activity_type', 'ai_conversation')
        .eq('is_active', true)
        .maybeSingle()

      if (data) {
        console.log('=== AI Prompt Load Debug ===');
        console.log('aiPromptData:', aiPromptData);
        if (aiPromptData) {
          console.log('Session 1 Role from DB:', aiPromptData.session_1_role);
          console.log('Session 1 User Role from DB:', aiPromptData.session_1_user_role);
          console.log('Session 1 Personality from DB:', aiPromptData.session_1_personality);
          console.log('Session 2 Role from DB:', aiPromptData.session_2_role);
          console.log('Session 2 User Role from DB:', aiPromptData.session_2_user_role);
          console.log('Session 2 Personality from DB:', aiPromptData.session_2_personality);
          console.log('Session 3 Role from DB:', aiPromptData.session_3_role);
          console.log('Session 3 User Role from DB:', aiPromptData.session_3_user_role);
          console.log('Session 3 Personality from DB:', aiPromptData.session_3_personality);
        }
        console.log('===========================');

        // 基本データを設定
        const baseFormData: any = {
          title: data.title || '',
          description: data.description || '',
          curriculum_id: data.curriculum_id || '',
          order_index: data.order_index || 1,
          is_active: data.is_active !== false,
          key_phrases: data.key_phrases || [],
          objectives: data.objectives || [],
          dialogues: data.dialogues || [],
          vocabulary_questions: data.vocabulary_questions || [],
          application_practice: data.application_practice || [],
          // AI設定 - 3セッション個別設定
          // セッション1
          session1_ai_role: aiPromptData?.session_1_role || '',
          session1_user_role: aiPromptData?.session_1_user_role || '',
          session1_situation: aiPromptData?.session_1_situation || '',
          session1_personality: aiPromptData?.session_1_personality || '',
          // セッション2
          session2_ai_role: aiPromptData?.session_2_role || '',
          session2_user_role: aiPromptData?.session_2_user_role || '',
          session2_situation: aiPromptData?.session_2_situation || '',
          session2_personality: aiPromptData?.session_2_personality || '',
          // セッション3
          session3_ai_role: aiPromptData?.session_3_role || '',
          session3_user_role: aiPromptData?.session_3_user_role || '',
          session3_situation: aiPromptData?.session_3_situation || '',
          session3_personality: aiPromptData?.session_3_personality || '',
          // フィードバック設定（デフォルト値）
          ai_feedback_style: 'encouraging',
          ai_evaluation_focus: '文法,語彙,流暢さ,適切さ',
          ai_evaluation_strictness: 'medium',
          ai_score_weight_grammar: 25,
          ai_score_weight_vocabulary: 25,
          ai_score_weight_fluency: 25,
          ai_score_weight_appropriateness: 25
        }
        
        // AIプロンプト設定を取得
        const { data: promptData } = await supabase
          .from('lesson_ai_prompts')
          .select('*')
          .eq('lesson_id', lessonId)
          .eq('activity_type', 'ai_conversation')
          .eq('is_active', true)
          .maybeSingle()
        
        if (promptData) {
          let content = promptData.prompt_content
          // JSON文字列の場合はパース
          if (typeof content === 'string') {
            try {
              content = JSON.parse(content)
            } catch (e) {
              console.error('Failed to parse prompt_content:', e)
              content = {}
            }
          }
          
          // AI設定を読み込み（フラット構造が空の場合のみフォールバック）
          if (content.session_settings && !baseFormData['session1_ai_role']) {
            // 各セッションの設定を個別に読み込み
            const session1 = content.session_settings['session_1']
            const session2 = content.session_settings['session_2']
            const session3 = content.session_settings['session_3']

            if (session1) {
              baseFormData['session1_ai_role'] = session1.character_name || ''
              baseFormData['session1_user_role'] = session1.user_role || ''
              baseFormData['session1_situation'] = session1.situation || ''
              baseFormData['session1_personality'] = (session1.personality_traits || []).join('、')
            }
            if (session2) {
              baseFormData['session2_ai_role'] = session2.character_name || ''
              baseFormData['session2_user_role'] = session2.user_role || ''
              baseFormData['session2_situation'] = session2.situation || ''
              baseFormData['session2_personality'] = (session2.personality_traits || []).join('、')
            }
            if (session3) {
              baseFormData['session3_ai_role'] = session3.character_name || ''
              baseFormData['session3_user_role'] = session3.user_role || ''
              baseFormData['session3_situation'] = session3.situation || ''
              baseFormData['session3_personality'] = (session3.personality_traits || []).join('、')
            }
          } else if (content.character_setting && !baseFormData['session1_ai_role']) {
            // 既存データ形式から読み込み
            const role = content.character_setting.role || ''
            const background = content.character_setting.background || ''
            const personality = content.character_setting.personality || {}
            const instructions = `性格: ${(personality.traits || []).join(', ')}\n話し方: ${personality.speaking_style || ''}\n態度: ${personality.attitude || ''}`
            
            // シナリオ設定
            const situation = content.scenario_setting?.situation || ''

            // セッション1の設定として適用（互換性のため）
            baseFormData['session1_ai_role'] = role
            baseFormData['session1_user_role'] = '美容師'  // デフォルト
            baseFormData['session1_situation'] = situation
            baseFormData['session1_personality'] = (personality.traits || []).join('、')
            // セッション2,3は同じ値で初期化
            baseFormData['session2_ai_role'] = role
            baseFormData['session2_user_role'] = '美容師'
            baseFormData['session2_situation'] = situation
            baseFormData['session2_personality'] = (personality.traits || []).join('、')
            baseFormData['session3_ai_role'] = role
            baseFormData['session3_user_role'] = '美容師'
            baseFormData['session3_situation'] = situation
            baseFormData['session3_personality'] = (personality.traits || []).join('、')
          } else if (content.system_prompt) {
            // system_prompt形式から読み込み
            const displayName = content.preparation_display?.ai_display_name || ''
            const description = content.preparation_display?.description || ''
            
            baseFormData['session1_ai_role'] = displayName
            baseFormData['session1_user_role'] = '美容師'
            baseFormData['session1_situation'] = description
            baseFormData['session1_personality'] = ''
            // セッション2,3も同じ値で初期化
            baseFormData['session2_ai_role'] = displayName
            baseFormData['session2_user_role'] = '美容師'
            baseFormData['session2_situation'] = description
            baseFormData['session2_personality'] = ''
            baseFormData['session3_ai_role'] = displayName
            baseFormData['session3_user_role'] = '美容師'
            baseFormData['session3_situation'] = description
            baseFormData['session3_personality'] = ''
          }
          
          // フィードバック設定を読み込み
          const evaluation = content.evaluation_settings || {}
          const weights = evaluation.scoring_weights || {}
          
          baseFormData.ai_feedback_style = evaluation.feedback_style || 'encouraging'
          baseFormData.ai_evaluation_focus = (evaluation.focus_points || []).join(',') || '文法,語彙,流暢さ,適切さ'
          baseFormData.ai_evaluation_strictness = evaluation.strictness || 'medium'
          baseFormData.ai_score_weight_grammar = weights.grammar || 25
          baseFormData.ai_score_weight_vocabulary = weights.vocabulary || 25
          baseFormData.ai_score_weight_fluency = weights.fluency || 25
          baseFormData.ai_score_weight_appropriateness = weights.appropriateness || 25
        }
        
        setFormData(baseFormData)
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
        is_active: formData.is_active,
        objectives: formData.objectives.length > 0 ? formData.objectives : null,
        key_phrases: keyPhrasesWithTTS.length > 0 ? keyPhrasesWithTTS : null,
        dialogues: dialoguesWithTTS.length > 0 ? dialoguesWithTTS : null,
        vocabulary_questions: formData.vocabulary_questions.length > 0 ? formData.vocabulary_questions : null,
        application_practice: formData.application_practice.length > 0 ? formData.application_practice : null,
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

      // AIプロンプト設定を保存（3セッション個別設定）
      console.log('=== AI Prompt Save Debug ===');
      console.log('Session 1 AI Role:', formData.session1_ai_role);
      console.log('Session 1 User Role:', formData.session1_user_role);
      console.log('Session 1 Personality:', formData.session1_personality);
      console.log('Session 2 AI Role:', formData.session2_ai_role);
      console.log('Session 2 User Role:', formData.session2_user_role);
      console.log('Session 2 Personality:', formData.session2_personality);
      console.log('Session 3 AI Role:', formData.session3_ai_role);
      console.log('Session 3 User Role:', formData.session3_user_role);
      console.log('Session 3 Personality:', formData.session3_personality);
      console.log('===========================');
      const aiPromptData = {
        lesson_id: lessonId,
        activity_type: 'ai_conversation',
        is_active: true,
        prompt_category: 'conversation',
        prompt_content: JSON.stringify({
        session_settings: {
          // 各セッション個別設定
          session_1: {
            character_name: formData.session1_ai_role || '美容室のお客様',
            user_role: formData.session1_user_role || '美容師',
            personality_traits: formData.session1_personality ? formData.session1_personality.split('、').map(s => s.trim()) : ['親切', '理解がある'],
            situation: formData.session1_situation || ''
          },
          session_2: {
            character_name: formData.session2_ai_role || '美容室のお客様',
            user_role: formData.session2_user_role || '美容師',
            personality_traits: formData.session2_personality ? formData.session2_personality.split('、').map(s => s.trim()) : ['親切', '理解がある'],
            situation: formData.session2_situation || ''
          },
          session_3: {
            character_name: formData.session3_ai_role || '美容室のお客様',
            user_role: formData.session3_user_role || '美容師',
            personality_traits: formData.session3_personality ? formData.session3_personality.split('、').map(s => s.trim()) : ['親切', '理解がある'],
            situation: formData.session3_situation || ''
          }
        },
        evaluation_settings: {
          focus_points: (formData.ai_evaluation_focus || '文法,語彙,流暢さ,適切さ').split(',').map(s => s.trim()),
          strictness: formData.ai_evaluation_strictness || 'medium',
          feedback_style: formData.ai_feedback_style || 'encouraging',
          scoring_weights: {
            grammar: formData.ai_score_weight_grammar || 25,
            vocabulary: formData.ai_score_weight_vocabulary || 25,
            fluency: formData.ai_score_weight_fluency || 25,
            appropriateness: formData.ai_score_weight_appropriateness || 25,
          }
        },
        preparation_display: {
          title: 'AI会話実践',
          description: formData.session1_situation || '',  // セッション1の情報を表示用に使用
          ai_display_name: formData.session1_ai_role || '美容室のお客様',
          key_points: [
            '今日学んだフレーズを使ってみましょう',
            'AIは優しいので間違いを恐れずに',
            '自然な会話を楽しむことが大切です'
          ]
        }
      }),
        // 新しいフラット形式のカラムにも保存（3セッション個別設定）
        session_1_role: formData.session1_ai_role,
        session_1_user_role: formData.session1_user_role,
        session_1_situation: formData.session1_situation,
        session_1_personality: formData.session1_personality,
        session_1_difficulty_level: 'standard',
        session_2_role: formData.session2_ai_role,
        session_2_user_role: formData.session2_user_role,
        session_2_situation: formData.session2_situation,
        session_2_personality: formData.session2_personality,
        session_2_difficulty_level: 'standard',
        session_3_role: formData.session3_ai_role,
        session_3_user_role: formData.session3_user_role,
        session_3_situation: formData.session3_situation,
        session_3_personality: formData.session3_personality,
        session_3_difficulty_level: 'standard',
        ai_settings: {
          model: 'gpt-4o-mini',
          response_format: { type: 'json_object' },
          max_tokens: 500
        },
        updated_at: new Date().toISOString()
      }

      // 既存のAI設定があるか確認
      const { data: existingAiData } = await supabase
        .from('lesson_ai_prompts')
        .select('id')
        .eq('lesson_id', lessonId)
        .eq('activity_type', 'ai_conversation')
        .maybeSingle()
      
      if (existingAiData) {
        // 更新
        console.log('Updating existing AI prompt with ID:', existingAiData.id);
        console.log('AI Prompt Data being saved:', JSON.stringify(aiPromptData, null, 2));
        const { error: promptError } = await supabase
          .from('lesson_ai_prompts')
          .update(aiPromptData)
          .eq('id', existingAiData.id)

        if (promptError) {
          console.error('Error updating AI prompts:', promptError)
        } else {
          console.log('AI prompts updated successfully')
        }
      } else {
        // 新規作成
        const { error: promptError } = await supabase
          .from('lesson_ai_prompts')
          .insert(aiPromptData)
        
        if (promptError) {
          console.error('Error inserting AI prompts:', promptError)
        } else {
          console.log('AI prompts inserted successfully')
        }
      }

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
    // デフォルトで最初のキャラクター設定を使用
    const defaultSpeaker = characterSettings[0]?.name || 'Staff'
    const defaultVoice = characterSettings[0]?.voice || 'nova'
    setFormData({
      ...formData,
      dialogues: [...formData.dialogues, { speaker: defaultSpeaker, text: '', japanese: '', voice: defaultVoice, emotion: 'neutral' }]
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

      <form 
        onSubmit={handleSubmit}
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

                  {/* 学習目標セクション */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      学習目標
                    </label>
                    <div className="space-y-2">
                      {formData.objectives.map((objective, index) => (
                        <div key={index} className="flex gap-2">
                          <input
                            type="text"
                            value={objective}
                            onChange={(e) => {
                              const newObjectives = [...formData.objectives]
                              newObjectives[index] = e.target.value
                              setFormData({ ...formData, objectives: newObjectives })
                            }}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                            placeholder={`目標 ${index + 1}`}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const newObjectives = formData.objectives.filter((_, i) => i !== index)
                              setFormData({ ...formData, objectives: newObjectives })
                            }}
                            className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => {
                          setFormData({ ...formData, objectives: [...formData.objectives, ''] })
                        }}
                        className="flex items-center gap-2 px-3 py-2 text-pink-600 hover:bg-pink-50 rounded-lg"
                      >
                        <Plus className="h-4 w-4" />
                        目標を追加
                      </button>
                    </div>
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
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
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
                  {/* キャラクター設定セクション */}
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-gray-700 mb-3">キャラクター設定</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {characterSettings.map((character, charIndex) => (
                        <div key={charIndex} className="bg-white p-3 rounded-lg border border-blue-200">
                          <div className="space-y-2">
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">
                                キャラクター{charIndex + 1}の名前
                              </label>
                              <input
                                type="text"
                                value={character.name}
                                onChange={(e) => {
                                  const updated = [...characterSettings]
                                  updated[charIndex] = { ...updated[charIndex], name: e.target.value }
                                  setCharacterSettings(updated)
                                  // 既存のダイアログの話者名も更新
                                  const oldName = characterSettings[charIndex].name
                                  const newDialogues = formData.dialogues.map(d =>
                                    d.speaker === oldName ? { ...d, speaker: e.target.value } : d
                                  )
                                  setFormData({ ...formData, dialogues: newDialogues })
                                }}
                                placeholder="例: Staff, Customer"
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">
                                音声モデル
                              </label>
                              <select
                                value={character.voice}
                                onChange={(e) => {
                                  const updated = [...characterSettings]
                                  updated[charIndex] = { ...updated[charIndex], voice: e.target.value }
                                  setCharacterSettings(updated)
                                  // 既存のダイアログの音声も更新
                                  const charName = character.name
                                  const newDialogues = formData.dialogues.map(d =>
                                    d.speaker === charName ? { ...d, voice: e.target.value } : d
                                  )
                                  setFormData({ ...formData, dialogues: newDialogues })
                                }}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                              >
                                {VOICE_OPTIONS.map(option => (
                                  <option key={option.value} value={option.value}>{option.label}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-gray-600 mt-2">
                      ※ ダイアログを追加する際、これらのキャラクター設定が自動的に適用されます
                    </p>
                  </div>

                  {/* ダイアログ入力セクション */}
                  {formData.dialogues.map((dialogue, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-4">
                          <select
                            value={dialogue.speaker}
                            onChange={(e) => {
                              const selectedChar = characterSettings.find(c => c.name === e.target.value)
                              updateDialogue(index, 'speaker', e.target.value)
                              if (selectedChar) {
                                updateDialogue(index, 'voice', selectedChar.voice)
                              }
                            }}
                            className="px-3 py-1 text-sm font-medium border border-gray-300 rounded-lg bg-gray-50"
                          >
                            {characterSettings.map(char => (
                              <option key={char.name} value={char.name}>{char.name}</option>
                            ))}
                          </select>
                          <span className="text-xs text-gray-500">
                            音声: {VOICE_OPTIONS.find(v => v.value === dialogue.voice)?.label || 'なし'}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeDialogue(index)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">英語テキスト</label>
                          <textarea
                            placeholder="Hello, how can I help you today?"
                            value={dialogue.text}
                            onChange={(e) => updateDialogue(index, 'text', e.target.value)}
                            rows={2}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">日本語訳</label>
                          <textarea
                            placeholder="こんにちは、今日はどのようなご用件でしょうか？"
                            value={dialogue.japanese}
                            onChange={(e) => updateDialogue(index, 'japanese', e.target.value)}
                            rows={2}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                          />
                        </div>
                      </div>

                      <div className="mt-2">
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          感情表現（オプション）
                        </label>
                        <input
                          type="text"
                          placeholder="例: friendly, polite, excited, calm"
                          value={dialogue.emotion || ''}
                          onChange={(e) => updateDialogue(index, 'emotion', e.target.value)}
                          className="w-full px-3 py-1 text-sm border border-gray-300 rounded-lg"
                        />
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


            {/* Vocabulary Questions Section */}
            <div className="mb-6 border-t pt-6">
              <button
                type="button"
                onClick={() => toggleSection('vocabulary')}
                className="flex items-center justify-between w-full text-left font-semibold text-lg mb-4"
              >
                語彙問題（4択クイズ）
                {expandedSections.vocabulary ? <ChevronUp /> : <ChevronDown />}
              </button>
              
              {expandedSections.vocabulary && (
                <div className="space-y-4">
                  {/* 使い方の説明 */}
                  <div className="bg-blue-50 p-4 rounded-lg mb-4">
                    <p className="text-sm text-blue-800 font-medium mb-2">📝 入力方法</p>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>• <strong>英単語/フレーズ</strong>: 問題となる英語を入力（例: "Hello", "Thank you"）</li>
                      <li>• <strong>選択肢1〜4</strong>: 日本語の選択肢を4つ入力</li>
                      <li>• <strong>正解</strong>: 正しい選択肢の番号を選択</li>
                      <li>• <strong>解説</strong>: なぜその答えが正解なのかの説明</li>
                    </ul>
                  </div>
                  
                  {formData.vocabulary_questions.map((question, index) => (
                    <div key={index} className="border rounded-lg p-4 bg-gray-50">
                      <div className="mb-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          問題 {index + 1}: 英単語/フレーズ <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="例: Hello, Thank you, How are you?"
                          value={question.question}
                          onChange={(e) => updateVocabularyQuestion(index, 'question', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white"
                        />
                      </div>
                      
                      <div className="mb-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          日本語の選択肢（4つ）
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          {question.options.map((option, optIndex) => (
                            <div key={optIndex} className="relative">
                              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500">
                                {optIndex + 1}.
                              </span>
                              <input
                                type="text"
                                placeholder={`選択肢 ${optIndex + 1} (日本語)`}
                                value={option}
                                onChange={(e) => {
                                  const newOptions = [...question.options]
                                  newOptions[optIndex] = e.target.value
                                  updateVocabularyQuestion(index, 'options', newOptions)
                                }}
                                className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg bg-white"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            正解の選択肢
                          </label>
                          <select
                            value={question.correct_answer}
                            onChange={(e) => updateVocabularyQuestion(index, 'correct_answer', parseInt(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white"
                          >
                            <option value={0}>選択肢1が正解</option>
                            <option value={1}>選択肢2が正解</option>
                            <option value={2}>選択肢3が正解</option>
                            <option value={3}>選択肢4が正解</option>
                          </select>
                        </div>
                        <div className="flex gap-2">
                          <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              解説（任意）
                            </label>
                            <input
                              type="text"
                              placeholder="なぜこれが正解なのか説明"
                              value={question.explanation}
                              onChange={(e) => updateVocabularyQuestion(index, 'explanation', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => removeVocabularyQuestion(index)}
                            className="mt-6 p-2 text-red-600 hover:bg-red-50 rounded"
                            title="この問題を削除"
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
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-sm text-blue-700">
                      3つのセッションでそれぞれ異なるAIの役割を設定できます。各セッションで4つのパラメータを入力してください。
                    </p>
                  </div>

                  {/* セッションタブ */}
                  <div className="flex space-x-2 border-b">
                    <button
                      type="button"
                      onClick={() => setActiveAiTab('session1')}
                      className={`px-4 py-2 font-medium ${activeAiTab === 'session1'
                        ? 'text-pink-600 border-b-2 border-pink-600'
                        : 'text-gray-600 hover:text-gray-900'}`}
                    >
                      セッション1
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveAiTab('session2')}
                      className={`px-4 py-2 font-medium ${activeAiTab === 'session2'
                        ? 'text-pink-600 border-b-2 border-pink-600'
                        : 'text-gray-600 hover:text-gray-900'}`}
                    >
                      セッション2
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveAiTab('session3')}
                      className={`px-4 py-2 font-medium ${activeAiTab === 'session3'
                        ? 'text-pink-600 border-b-2 border-pink-600'
                        : 'text-gray-600 hover:text-gray-900'}`}
                    >
                      セッション3
                    </button>
                  </div>

                  {/* セッション1の設定 */}
                  {activeAiTab === 'session1' && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            AIの役割 <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={formData.session1_ai_role}
                            onChange={(e) => setFormData({ ...formData, session1_ai_role: e.target.value })}
                            placeholder="例: 美容室のお客様"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            ユーザーの役割 <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={formData.session1_user_role}
                            onChange={(e) => setFormData({ ...formData, session1_user_role: e.target.value })}
                            placeholder="例: 美容師・スタッフ"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            required
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          シチュエーション <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          value={formData.session1_situation}
                          onChange={(e) => setFormData({ ...formData, session1_situation: e.target.value })}
                          rows={2}
                          placeholder="例: 初めての来店でヘアカットを希望しているお客様。好みのスタイルを相談中。"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          AIの性格特性 <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.session1_personality}
                          onChange={(e) => setFormData({ ...formData, session1_personality: e.target.value })}
                          placeholder="例: 親切、理解がある、フレンドリー、忍耐強い"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          required
                        />
                      </div>
                    </div>
                  )}

                  {/* セッション2の設定 */}
                  {activeAiTab === 'session2' && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            AIの役割 <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={formData.session2_ai_role}
                            onChange={(e) => setFormData({ ...formData, session2_ai_role: e.target.value })}
                            placeholder="例: フレンドリーな同僚"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            ユーザーの役割 <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={formData.session2_user_role}
                            onChange={(e) => setFormData({ ...formData, session2_user_role: e.target.value })}
                            placeholder="例: 美容師・スタッフ"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            required
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          シチュエーション <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          value={formData.session2_situation}
                          onChange={(e) => setFormData({ ...formData, session2_situation: e.target.value })}
                          rows={2}
                          placeholder="例: 休憩時間の雑談。最近の仕事やトレンドについて話す。"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          AIの性格特性 <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.session2_personality}
                          onChange={(e) => setFormData({ ...formData, session2_personality: e.target.value })}
                          placeholder="例: 明るい、フレンドリー、リラックス、協力的"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          required
                        />
                      </div>
                    </div>
                  )}

                  {/* セッション3の設定 */}
                  {activeAiTab === 'session3' && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            AIの役割 <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={formData.session3_ai_role}
                            onChange={(e) => setFormData({ ...formData, session3_ai_role: e.target.value })}
                            placeholder="例: スタイリストのマネージャー"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            ユーザーの役割 <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={formData.session3_user_role}
                            onChange={(e) => setFormData({ ...formData, session3_user_role: e.target.value })}
                            placeholder="例: 美容師・スタッフ"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            required
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          シチュエーション <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          value={formData.session3_situation}
                          onChange={(e) => setFormData({ ...formData, session3_situation: e.target.value })}
                          rows={2}
                          placeholder="例: 業務報告会議で今週の成果を発表。改善点を話し合う。"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          AIの性格特性 <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.session3_personality}
                          onChange={(e) => setFormData({ ...formData, session3_personality: e.target.value })}
                          placeholder="例: プロフェッショナル、支援的、経験豊富、指導的"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          required
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
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