'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { Save, Loader2, AlertCircle, CheckCircle, Plus, Trash2, Copy, Users } from 'lucide-react'

interface AIConversationPrompt {
  id: string
  lesson_id: string | null
  activity_type: string
  prompt_category: string
  prompt_content: any
  is_active: boolean
  created_at: string
  updated_at: string
}

interface SessionSettings {
  session_number: number
  character_name: string
  character_background: string
  personality_traits: string[]
  situation: string
  difficulty_level: 'beginner' | 'intermediate' | 'advanced'
  focus_points: string[]
}

interface FeedbackTemplate {
  id: string
  name: string
  description: string
  template: {
    positive_feedback: string[]
    improvement_feedback: string[]
    encouragement: string[]
  }
}

export default function AIConversationSettingsPage() {
  const [prompts, setPrompts] = useState<AIConversationPrompt[]>([])
  const [feedbackTemplates, setFeedbackTemplates] = useState<FeedbackTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'sessions' | 'prompts' | 'feedback' | 'hints'>('sessions')
  const [editedPrompts, setEditedPrompts] = useState<Record<string, any>>({})
  const [saveStatus, setSaveStatus] = useState<Record<string, 'success' | 'error' | null>>({})
  const [hints, setHints] = useState<string[]>([])
  const [activeSession, setActiveSession] = useState(1)
  const supabase = createClient()

  const fetchData = async () => {
    try {
      // AI会話プロンプトを取得
      const { data: promptData, error: promptError } = await supabase
        .from('lesson_ai_prompts')
        .select('*')
        .eq('activity_type', 'ai_conversation')
        .order('lesson_id', { ascending: false, nullsFirst: true })

      if (promptError) throw promptError
      setPrompts(promptData || [])

      // デフォルトプロンプトからヒントを抽出
      const defaultPrompt = promptData?.find(p => p.lesson_id === null)
      if (defaultPrompt?.prompt_content?.hints) {
        setHints(defaultPrompt.prompt_content.hints)
      }

      // フィードバックテンプレートを作成（仮データ）
      setFeedbackTemplates([
        {
          id: '1',
          name: 'Encouraging (励まし型)',
          description: '学習者を励まし、モチベーションを高めるフィードバック',
          template: {
            positive_feedback: [
              'とても良い表現ですね！',
              'その調子です！',
              '完璧な文法です！'
            ],
            improvement_feedback: [
              'もう少し丁寧な表現を使ってみましょう',
              'この部分を言い換えてみると...',
              '次はこの表現を試してみてください'
            ],
            encouragement: [
              '素晴らしい進歩です！',
              '着実に上達していますね',
              '続けていけばもっと良くなります'
            ]
          }
        },
        {
          id: '2',
          name: 'Detailed (詳細型)',
          description: '具体的で詳細な文法説明を含むフィードバック',
          template: {
            positive_feedback: [
              '文法的に正確で、自然な表現です',
              '適切な時制の使い方ができています',
              '語彙の選択が的確です'
            ],
            improvement_feedback: [
              'この文法ポイントに注意してください: ',
              '正しい形は次のようになります: ',
              'より自然な言い方は: '
            ],
            encouragement: [
              '理解度が高まっています',
              '基礎がしっかりしてきました',
              '応用力がついてきています'
            ]
          }
        }
      ])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handlePromptChange = (promptId: string, field: string, value: any) => {
    setEditedPrompts(prev => ({
      ...prev,
      [promptId]: {
        ...prev[promptId],
        [field]: value
      }
    }))
    setSaveStatus(prev => ({
      ...prev,
      [promptId]: null
    }))
  }

  const handleSessionSettingChange = (promptId: string, sessionNumber: number, settings: any) => {
    const currentPrompt = prompts.find(p => p.id === promptId)
    if (!currentPrompt) return

    const currentContent = editedPrompts[promptId] || currentPrompt.prompt_content || {}
    const sessionSettings = currentContent.session_settings || {}
    sessionSettings[`session_${sessionNumber}`] = settings

    setEditedPrompts(prev => ({
      ...prev,
      [promptId]: {
        ...prev[promptId],
        ...currentContent,
        session_settings: sessionSettings
      }
    }))
    
    setSaveStatus(prev => ({
      ...prev,
      [promptId]: null
    }))
  }

  const savePrompt = async (prompt: AIConversationPrompt) => {
    const edited = editedPrompts[prompt.id]
    if (!edited) return

    setSaving(prompt.id)
    try {
      const updatedContent = {
        ...prompt.prompt_content,
        ...edited
      }

      const { error } = await supabase
        .from('lesson_ai_prompts')
        .update({ 
          prompt_content: updatedContent,
          updated_at: new Date().toISOString()
        })
        .eq('id', prompt.id)

      if (error) throw error

      setPrompts(prev => 
        prev.map(p => 
          p.id === prompt.id 
            ? { ...p, prompt_content: updatedContent }
            : p
        )
      )
      
      setEditedPrompts(prev => {
        const newState = { ...prev }
        delete newState[prompt.id]
        return newState
      })

      setSaveStatus(prev => ({
        ...prev,
        [prompt.id]: 'success'
      }))

      setTimeout(() => {
        setSaveStatus(prev => ({
          ...prev,
          [prompt.id]: null
        }))
      }, 3000)
    } catch (error) {
      console.error('Error saving prompt:', error)
      setSaveStatus(prev => ({
        ...prev,
        [prompt.id]: 'error'
      }))
    } finally {
      setSaving(null)
    }
  }

  const addHint = () => {
    const newHint = prompt('新しいヒントを入力してください:')
    if (newHint) {
      setHints([...hints, newHint])
      // デフォルトプロンプトに保存
      const defaultPrompt = prompts.find(p => p.lesson_id === null)
      if (defaultPrompt) {
        handlePromptChange(defaultPrompt.id, 'hints', [...hints, newHint])
      }
    }
  }

  const removeHint = (index: number) => {
    const newHints = hints.filter((_, i) => i !== index)
    setHints(newHints)
    // デフォルトプロンプトに保存
    const defaultPrompt = prompts.find(p => p.lesson_id === null)
    if (defaultPrompt) {
      handlePromptChange(defaultPrompt.id, 'hints', newHints)
    }
  }

  const getSessionSettings = (prompt: AIConversationPrompt, sessionNumber: number) => {
    const edited = editedPrompts[prompt.id]?.session_settings?.[`session_${sessionNumber}`]
    if (edited) return edited

    const promptContent = prompt.prompt_content || {}
    return promptContent.session_settings?.[`session_${sessionNumber}`] || {
      character_name: `Session ${sessionNumber} Character`,
      character_background: '',
      personality_traits: [],
      situation: '',
      difficulty_level: sessionNumber === 1 ? 'beginner' : sessionNumber === 2 ? 'intermediate' : 'advanced',
      focus_points: []
    }
  }

  const getDefaultSessionTemplates = () => {
    return {
      session_1: {
        character_name: '初回来店のお客様',
        character_background: '高級サロンを初めて訪れる慎重なお客様。サービスの詳細を知りたがっている。',
        personality_traits: ['慎重', '好奇心旺盛', '礼儀正しい'],
        situation: 'カウンセリングと施術の相談',
        difficulty_level: 'beginner',
        focus_points: ['基本的な挨拶', 'サービスの説明', '丁寧な対応']
      },
      session_2: {
        character_name: 'VIP常連客',
        character_background: '長年通っているVIP客。パーソナライズされたサービスを期待している。',
        personality_traits: ['要求が高い', '洗練されている', 'フレンドリー'],
        situation: 'いつものトリートメントとスタイリング',
        difficulty_level: 'intermediate',
        focus_points: ['親しみやすさ', '専門知識', 'カスタマイズ提案']
      },
      session_3: {
        character_name: 'インフルエンサー',
        character_background: 'SNSで影響力のあるインフルエンサー。トレンドに敏感で完璧を求める。',
        personality_traits: ['トレンド重視', '創造的', 'SNS意識', '完璧主義'],
        situation: '新しいヘアカラートレンドの相談とSNS用撮影',
        difficulty_level: 'advanced',
        focus_points: ['最新トレンド', '創造的提案', 'SNS映えの考慮', 'プロフェッショナルな対応']
      }
    }
  }

  const applyTemplate = (promptId: string) => {
    const templates = getDefaultSessionTemplates()
    Object.entries(templates).forEach(([key, settings]) => {
      const sessionNumber = parseInt(key.split('_')[1])
      handleSessionSettingChange(promptId, sessionNumber, settings)
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">AI会話設定</h1>
        <p className="mt-2 text-gray-600">
          AI会話練習のセッション別設定、フィードバックテンプレート、ヒントを管理します
        </p>
      </div>

      {/* タブ */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('sessions')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'sessions'
                ? 'border-pink-500 text-pink-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Users className="inline-block w-4 h-4 mr-1" />
            セッション別設定
          </button>
          <button
            onClick={() => setActiveTab('prompts')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'prompts'
                ? 'border-pink-500 text-pink-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            基本プロンプト
          </button>
          <button
            onClick={() => setActiveTab('feedback')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'feedback'
                ? 'border-pink-500 text-pink-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            フィードバックテンプレート
          </button>
          <button
            onClick={() => setActiveTab('hints')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'hints'
                ? 'border-pink-500 text-pink-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            文法ヒント
          </button>
        </nav>
      </div>

      {/* コンテンツ */}
      <div className="bg-white rounded-lg shadow">
        {activeTab === 'sessions' && (
          <div className="p-6 space-y-6">
            {prompts.filter(p => !p.lesson_id).map(prompt => (
              <div key={prompt.id} className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">セッション別AI設定</h3>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => applyTemplate(prompt.id)}
                      className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm flex items-center"
                    >
                      <Copy className="h-4 w-4 mr-1" />
                      テンプレート適用
                    </button>
                    {saveStatus[prompt.id] === 'success' && (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    )}
                    {saveStatus[prompt.id] === 'error' && (
                      <AlertCircle className="h-5 w-5 text-red-500" />
                    )}
                    <button
                      onClick={() => savePrompt(prompt)}
                      disabled={saving === prompt.id || !editedPrompts[prompt.id]}
                      className={`px-4 py-2 rounded text-sm font-medium flex items-center space-x-1 ${
                        editedPrompts[prompt.id]
                          ? 'bg-pink-500 text-white hover:bg-pink-600'
                          : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {saving === prompt.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                      <span>すべて保存</span>
                    </button>
                  </div>
                </div>

                {/* セッション選択タブ - 3セッションのみ */}
                <div className="border-b border-gray-200">
                  <nav className="-mb-px flex space-x-4">
                    {[1, 2, 3].map(num => (
                      <button
                        key={num}
                        onClick={() => setActiveSession(num)}
                        className={`py-2 px-4 border-b-2 text-sm font-medium ${
                          activeSession === num
                            ? 'border-pink-500 text-pink-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        Session {num}
                      </button>
                    ))}
                  </nav>
                </div>

                {/* セッション設定フォーム */}
                <div className="border rounded-lg p-4 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        キャラクター名
                      </label>
                      <input
                        type="text"
                        value={getSessionSettings(prompt, activeSession).character_name || ''}
                        onChange={(e) => {
                          const currentSettings = getSessionSettings(prompt, activeSession)
                          handleSessionSettingChange(prompt.id, activeSession, {
                            ...currentSettings,
                            character_name: e.target.value
                          })
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                        placeholder="例: VIP常連客"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        難易度
                      </label>
                      <select
                        value={getSessionSettings(prompt, activeSession).difficulty_level || 'beginner'}
                        onChange={(e) => {
                          const currentSettings = getSessionSettings(prompt, activeSession)
                          handleSessionSettingChange(prompt.id, activeSession, {
                            ...currentSettings,
                            difficulty_level: e.target.value
                          })
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                      >
                        <option value="beginner">初級</option>
                        <option value="intermediate">中級</option>
                        <option value="advanced">上級</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      キャラクター背景
                    </label>
                    <textarea
                      value={getSessionSettings(prompt, activeSession).character_background || ''}
                      onChange={(e) => {
                        const currentSettings = getSessionSettings(prompt, activeSession)
                        handleSessionSettingChange(prompt.id, activeSession, {
                          ...currentSettings,
                          character_background: e.target.value
                        })
                      }}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                      placeholder="キャラクターの背景や状況を記述"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      シチュエーション
                    </label>
                    <input
                      type="text"
                      value={getSessionSettings(prompt, activeSession).situation || ''}
                      onChange={(e) => {
                        const currentSettings = getSessionSettings(prompt, activeSession)
                        handleSessionSettingChange(prompt.id, activeSession, {
                          ...currentSettings,
                          situation: e.target.value
                        })
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                      placeholder="例: カウンセリングと施術の相談"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      性格特性（カンマ区切り）
                    </label>
                    <input
                      type="text"
                      value={getSessionSettings(prompt, activeSession).personality_traits?.join(', ') || ''}
                      onChange={(e) => {
                        const currentSettings = getSessionSettings(prompt, activeSession)
                        handleSessionSettingChange(prompt.id, activeSession, {
                          ...currentSettings,
                          personality_traits: e.target.value.split(',').map(t => t.trim()).filter(t => t)
                        })
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                      placeholder="例: 洗練されている, 要求が高い, フレンドリー"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      フォーカスポイント（カンマ区切り）
                    </label>
                    <input
                      type="text"
                      value={getSessionSettings(prompt, activeSession).focus_points?.join(', ') || ''}
                      onChange={(e) => {
                        const currentSettings = getSessionSettings(prompt, activeSession)
                        handleSessionSettingChange(prompt.id, activeSession, {
                          ...currentSettings,
                          focus_points: e.target.value.split(',').map(t => t.trim()).filter(t => t)
                        })
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                      placeholder="例: 基本的な挨拶, サービスの説明, 丁寧な対応"
                    />
                  </div>
                </div>

                {/* セッション説明 */}
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Session {activeSession} の推奨設定</h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    {activeSession === 1 && (
                      <>
                        <p>• 初級レベル：基本的な挨拶と簡単な会話</p>
                        <p>• 理解のあるお客様で、ゆっくりとした会話</p>
                        <p>• ターゲットフレーズの基本的な使用を促す</p>
                      </>
                    )}
                    {activeSession === 2 && (
                      <>
                        <p>• 中級レベル：少し複雑な要望を含む会話</p>
                        <p>• 親しみやすいが期待値の高いお客様</p>
                        <p>• 専門用語の適切な使用を評価</p>
                      </>
                    )}
                    {activeSession === 3 && (
                      <>
                        <p>• 上級レベル：トレンドや創造性を含む複雑な会話</p>
                        <p>• 高度な要求と期待を持つお客様</p>
                        <p>• 創造的提案と専門知識の統合を評価</p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {prompts.filter(p => !p.lesson_id).length === 0 && (
              <div className="text-center py-8 text-gray-500">
                デフォルト設定が見つかりません。データベースを確認してください。
              </div>
            )}
          </div>
        )}

        {activeTab === 'prompts' && (
          <div className="p-6 space-y-6">
            {prompts.map(prompt => (
              <div key={prompt.id} className="border rounded-lg p-4 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg">
                      {prompt.lesson_id ? `レッスン固有設定` : 'デフォルト設定'}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {prompt.prompt_category || 'default'}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {saveStatus[prompt.id] === 'success' && (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    )}
                    {saveStatus[prompt.id] === 'error' && (
                      <AlertCircle className="h-5 w-5 text-red-500" />
                    )}
                    <button
                      onClick={() => savePrompt(prompt)}
                      disabled={saving === prompt.id || !editedPrompts[prompt.id]}
                      className={`px-3 py-1 rounded text-sm font-medium flex items-center space-x-1 ${
                        editedPrompts[prompt.id]
                          ? 'bg-pink-500 text-white hover:bg-pink-600'
                          : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {saving === prompt.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                      <span>保存</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      基本キャラクター設定
                    </label>
                    <textarea
                      value={editedPrompts[prompt.id]?.character_setting?.background || 
                             prompt.prompt_content?.character_setting?.background || ''}
                      onChange={(e) => handlePromptChange(prompt.id, 'character_setting', {
                        ...prompt.prompt_content?.character_setting,
                        background: e.target.value
                      })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                      placeholder="AIキャラクターの基本設定"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      評価設定
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <select
                        value={editedPrompts[prompt.id]?.evaluation_settings?.feedback_style || 
                               prompt.prompt_content?.evaluation_settings?.feedback_style || 'encouraging'}
                        onChange={(e) => handlePromptChange(prompt.id, 'evaluation_settings', {
                          ...prompt.prompt_content?.evaluation_settings,
                          feedback_style: e.target.value
                        })}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                      >
                        <option value="encouraging">励まし型</option>
                        <option value="detailed">詳細型</option>
                        <option value="strict">厳格型</option>
                      </select>
                      <select
                        value={editedPrompts[prompt.id]?.evaluation_settings?.strictness || 
                               prompt.prompt_content?.evaluation_settings?.strictness || 'medium'}
                        onChange={(e) => handlePromptChange(prompt.id, 'evaluation_settings', {
                          ...prompt.prompt_content?.evaluation_settings,
                          strictness: e.target.value
                        })}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                      >
                        <option value="low">低い</option>
                        <option value="medium">中程度</option>
                        <option value="high">高い</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'feedback' && (
          <div className="p-6 space-y-6">
            {feedbackTemplates.map(template => (
              <div key={template.id} className="border rounded-lg p-4 space-y-4">
                <div>
                  <h3 className="font-semibold text-lg">{template.name}</h3>
                  <p className="text-sm text-gray-500">{template.description}</p>
                </div>

                <div className="space-y-3">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">ポジティブフィードバック</h4>
                    <div className="space-y-1">
                      {template.template.positive_feedback.map((feedback, i) => (
                        <div key={i} className="text-sm text-gray-600 pl-4">• {feedback}</div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">改善フィードバック</h4>
                    <div className="space-y-1">
                      {template.template.improvement_feedback.map((feedback, i) => (
                        <div key={i} className="text-sm text-gray-600 pl-4">• {feedback}</div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">励ましの言葉</h4>
                    <div className="space-y-1">
                      {template.template.encouragement.map((feedback, i) => (
                        <div key={i} className="text-sm text-gray-600 pl-4">• {feedback}</div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'hints' && (
          <div className="p-6 space-y-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-lg">文法ヒント一覧</h3>
              <button
                onClick={addHint}
                className="px-4 py-2 bg-pink-500 text-white rounded-md hover:bg-pink-600 flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>ヒントを追加</span>
              </button>
            </div>

            <div className="space-y-2">
              {hints.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  ヒントがまだ登録されていません
                </p>
              ) : (
                hints.map((hint, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm">{hint}</span>
                    <button
                      onClick={() => removeHint(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">ヒントの使用方法</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• ヒントは学習者の画面に10秒ごとにローテーション表示されます</li>
                <li>• ターゲットフレーズに関連した実用的なヒントを追加してください</li>
                <li>• 文法構造や丁寧な表現方法を簡潔に説明するのが効果的です</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}