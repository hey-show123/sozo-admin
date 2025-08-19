'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { Save, Plus, Edit, Trash2, AlertCircle, CheckCircle, Brain } from 'lucide-react'
import { createClient } from '../../../lib/supabase'

interface GlobalPrompt {
  id: string
  activity_type: string
  prompt_category: string
  prompt_content: string
  prompt_variables: Record<string, any>
  ai_model: string
  ai_settings: Record<string, any>
  version: number
  is_active: boolean
  created_at: string
  updated_at: string
}

interface FeedbackSetting {
  id: string
  setting_name: string
  description: string
  json_template: Record<string, any>
  feedback_instructions: string
  hint_instructions: string
  ai_settings: Record<string, any>
  is_active: boolean
  created_at: string
  updated_at: string
}

const ACTIVITY_TYPES = [
  { value: 'application_practice', label: '応用練習' },
  { value: 'ai_conversation', label: 'AI会話実践' },
  { value: 'dialog_practice', label: '対話練習' },
  { value: 'vocabulary_practice', label: '語彙練習' },
  { value: 'pronunciation_practice', label: '発音練習' },
]

const PROMPT_CATEGORIES = [
  { value: 'system_prompt', label: 'システムプロンプト' },
  { value: 'evaluation_prompt', label: '評価プロンプト' },
]

// AIモデルはソースコードで固定管理（gpt-5-mini）

export default function AISettingsPage() {
  const [prompts, setPrompts] = useState<GlobalPrompt[]>([])
  const [feedbackSettings, setFeedbackSettings] = useState<FeedbackSetting[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<{ [key: string]: boolean }>({})
  const [editingContent, setEditingContent] = useState<{ [key: string]: string }>({})
  const [editingSettings, setEditingSettings] = useState<{ [key: string]: string }>({})
  const [editingFeedback, setEditingFeedback] = useState<{ [key: string]: string }>({})
  const [editingHints, setEditingHints] = useState<{ [key: string]: string }>({})
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    fetchUserPermissions()
  }, [])

  const fetchUserPermissions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserEmail(user.email)
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()
        
        setUserRole(profile?.role || null)
        
        // 権限チェック後にデータを取得
        const isSuperAdmin = profile?.role === 'super_admin' || user.email === 'hey_show@icloud.com'
        if (isSuperAdmin) {
          await Promise.all([
            fetchGlobalPrompts(),
            fetchFeedbackSettings()
          ])
        }
      }
    } catch (error) {
      console.error('Error fetching user permissions:', error)
      setLoading(false)
    }
  }

  const isSuperAdmin = () => {
    return userRole === 'super_admin' || userEmail === 'hey_show@icloud.com'
  }

  const fetchGlobalPrompts = async () => {
    try {
      // グローバルプロンプト（lesson_id が null のもの）を取得
      const { data: promptsData, error: promptsError } = await supabase
        .from('lesson_ai_prompts')
        .select('*')
        .is('lesson_id', null)
        .order('activity_type, prompt_category')

      if (promptsError) throw promptsError
      console.log('Fetched prompts data:', promptsData)
      setPrompts(promptsData || [])

    } catch (error) {
      console.error('Error fetching global prompts:', error)
      showMessage('error', 'データの取得に失敗しました')
    }
  }

  const fetchFeedbackSettings = async () => {
    try {
      const { data: feedbackData, error: feedbackError } = await supabase
        .from('ai_feedback_settings')
        .select('*')
        .order('setting_name')

      if (feedbackError) throw feedbackError
      console.log('Fetched feedback settings:', feedbackData)
      setFeedbackSettings(feedbackData || [])

    } catch (error) {
      console.error('Error fetching feedback settings:', error)
      showMessage('error', 'フィードバック設定の取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 5000)
  }

  // インライン編集の開始
  const startEditing = (prompt: GlobalPrompt, field: 'content' | 'settings') => {
    if (field === 'content') {
      setEditingContent({ ...editingContent, [prompt.id]: prompt.prompt_content })
    } else {
      const maxTokens = prompt.ai_settings?.max_completion_tokens || 800
      setEditingSettings({ ...editingSettings, [prompt.id]: maxTokens.toString() })
    }
  }

  // インライン編集のキャンセル
  const cancelEditing = (promptId: string, field: 'content' | 'settings') => {
    if (field === 'content') {
      const { [promptId]: _, ...rest } = editingContent
      setEditingContent(rest)
    } else {
      const { [promptId]: _, ...rest } = editingSettings
      setEditingSettings(rest)
    }
  }

  // インライン編集の保存
  const saveInlineEdit = async (promptId: string, field: 'content' | 'settings') => {
    try {
      setSaving({ ...saving, [promptId]: true })
      
      let updateData: any = {}
      
      if (field === 'content') {
        updateData.prompt_content = editingContent[promptId]
      } else {
        // 数値を取得してJSONオブジェクトとして保存
        const tokens = parseInt(editingSettings[promptId]) || 800
        updateData.ai_settings = {
          max_completion_tokens: tokens,
          response_format: { type: 'json_object' }
        }
      }

      const { error } = await supabase
        .from('lesson_ai_prompts')
        .update(updateData)
        .eq('id', promptId)

      if (error) throw error

      showMessage('success', 'プロンプトを更新しました')
      
      // 編集状態をクリア
      cancelEditing(promptId, field)
      
      // データを再取得
      await fetchGlobalPrompts()
    } catch (error) {
      console.error('Error saving prompt:', error)
      showMessage('error', 'プロンプトの保存に失敗しました')
    } finally {
      setSaving({ ...saving, [promptId]: false })
    }
  }

  const handleSavePrompt = async (promptData: Partial<GlobalPrompt>) => {
    try {
      setSaving({ ...saving, 'create-form': true })
      
      // 新規作成のみ（lesson_id は null でグローバル設定として保存）
      const { error } = await supabase
        .from('lesson_ai_prompts')
        .insert({
          lesson_id: null, // グローバル設定
          activity_type: promptData.activity_type,
          prompt_category: promptData.prompt_category,
          prompt_content: promptData.prompt_content,
          prompt_variables: promptData.prompt_variables || {},
          ai_settings: promptData.ai_settings || {},
        })

      if (error) throw error
      showMessage('success', 'プロンプトを作成しました')

      setShowCreateForm(false)
      await fetchGlobalPrompts()
    } catch (error) {
      console.error('Error saving prompt:', error)
      showMessage('error', 'プロンプトの保存に失敗しました')
    } finally {
      setSaving({ ...saving, 'create-form': false })
    }
  }

  const handleDeletePrompt = async (promptId: string) => {
    if (!confirm('このプロンプトを削除しますか？')) return

    try {
      const { error } = await supabase
        .from('lesson_ai_prompts')
        .delete()
        .eq('id', promptId)

      if (error) throw error
      showMessage('success', 'プロンプトを削除しました')
      await fetchGlobalPrompts()
    } catch (error) {
      console.error('Error deleting prompt:', error)
      showMessage('error', 'プロンプトの削除に失敗しました')
    }
  }

  const togglePromptActive = async (promptId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('lesson_ai_prompts')
        .update({ is_active: !isActive })
        .eq('id', promptId)

      if (error) throw error
      showMessage('success', `プロンプトを${!isActive ? '有効' : '無効'}にしました`)
      await fetchGlobalPrompts()
    } catch (error) {
      console.error('Error toggling prompt active:', error)
      showMessage('error', 'プロンプトの状態変更に失敗しました')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!isSuperAdmin()) {
    return (
      <div className="container mx-auto px-6 py-8 max-w-4xl">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <div className="mb-6">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              アクセス権限が不足しています
            </h1>
            <p className="text-gray-600 mb-4">
              AI設定の管理にはスーパーアドミン権限が必要です。
            </p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
              <p className="font-medium mb-1">権限について：</p>
              <p>JSON形式の設定は技術的な知識が必要なため、スーパーアドミンのみがアクセス可能です。</p>
              <p className="mt-2">現在の権限: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{userRole || '不明'}</span></p>
            </div>
          </div>
          <button
            onClick={() => window.location.href = '/'}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            ダッシュボードに戻る
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-6 py-8 max-w-6xl">
      {/* メッセージ表示 */}
      {message && (
        <div className={`mb-6 p-4 rounded-lg flex items-center gap-2 ${
          message.type === 'success' 
            ? 'bg-green-50 text-green-700 border border-green-200' 
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          {message.text}
        </div>
      )}

      {/* ヘッダー */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Brain className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">
            AI設定管理
          </h1>
        </div>
        <p className="text-gray-600">
          全レッスン共通のAI評価プロンプトとモデル設定を管理できます
        </p>
        <p className="text-sm text-gray-500 mt-2">
          ここで設定したプロンプトが、全てのレッスンのAI評価で使用されます
        </p>
      </div>

      {/* 応用練習プロンプト管理 */}
      <ApplicationPracticeSection 
        prompts={prompts.filter(p => p.activity_type === 'application_practice')}
        onDelete={handleDeletePrompt}
        onToggleActive={togglePromptActive}
        editingContent={editingContent}
        editingSettings={editingSettings}
        saving={saving}
        onStartEditing={startEditing}
        onCancelEditing={cancelEditing}
        onSaveEdit={saveInlineEdit}
        onContentChange={(promptId, content) => setEditingContent({ ...editingContent, [promptId]: content })}
        onSettingsChange={(promptId, settings) => setEditingSettings({ ...editingSettings, [promptId]: settings })}
      />

      {/* AI会話フィードバック設定 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <Brain className="text-blue-600" size={24} />
              AI会話フィードバック設定
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              AI会話のフィードバック生成方法とヒント表示の設定を管理します
            </p>
          </div>
        </div>
        
        <div className="p-6 space-y-4">
          {feedbackSettings.map((setting) => (
            <div key={setting.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-medium text-gray-900">{setting.setting_name}</h3>
                  <p className="text-sm text-gray-600">{setting.description}</p>
                </div>
                <button
                  className={`px-3 py-1 rounded text-sm font-medium ${
                    setting.is_active 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {setting.is_active ? '有効' : '無効'}
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* フィードバック指示 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    フィードバック指示
                  </label>
                  <textarea
                    value={setting.feedback_instructions}
                    rows={8}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-mono"
                    placeholder="フィードバック生成の指示を入力..."
                    readOnly
                  />
                </div>

                {/* ヒント指示 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ヒント指示
                  </label>
                  <textarea
                    value={setting.hint_instructions}
                    rows={8}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-mono"
                    placeholder="ヒント表示の指示を入力..."
                    readOnly
                  />
                </div>

                {/* AI設定 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    AI設定
                  </label>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        最大トークン数
                      </label>
                      <input
                        type="number"
                        value={setting.ai_settings?.max_completion_tokens || 300}
                        min="100"
                        max="2000"
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        readOnly
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        レスポンス形式
                      </label>
                      <input
                        type="text"
                        value={setting.ai_settings?.response_format?.type || 'text'}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-gray-50"
                        readOnly
                      />
                    </div>
                  </div>
                </div>

                {/* JSON テンプレート */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    JSON レスポンステンプレート
                  </label>
                  <textarea
                    value={JSON.stringify(setting.json_template, null, 2)}
                    rows={12}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-mono bg-gray-50"
                    placeholder="JSON形式のレスポンステンプレート..."
                    readOnly
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AIセッション評価設定 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">AIセッション評価設定</h2>
          <p className="text-sm text-gray-600">レッスン終了時のAIによる全体評価フィードバック生成の設定です</p>
        </div>
        
        <div className="p-6">
          {feedbackSettings.filter(setting => setting.setting_name === 'session_evaluation').map(setting => (
            <div key={setting.id} className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    システムプロンプト指示
                  </label>
                  <textarea
                    value={setting.hint_instructions}
                    rows={8}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    placeholder="AI評価エンジンのシステムプロンプト..."
                    readOnly
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    評価ルールとフィードバック指示
                  </label>
                  <textarea
                    value={setting.feedback_instructions}
                    rows={8}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    placeholder="評価ルールとフィードバック指示..."
                    readOnly
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    AI設定
                  </label>
                  <textarea
                    value={JSON.stringify(setting.ai_settings, null, 2)}
                    rows={6}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-mono bg-gray-50"
                    placeholder="AI設定 (JSON形式)..."
                    readOnly
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    JSON レスポンステンプレート
                  </label>
                  <textarea
                    value={JSON.stringify(setting.json_template, null, 2)}
                    rows={6}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-mono bg-gray-50"
                    placeholder="JSON形式のレスポンステンプレート..."
                    readOnly
                  />
                </div>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-md">
                <h4 className="text-sm font-medium text-blue-900 mb-2">設定情報</h4>
                <div className="text-sm text-blue-800 space-y-1">
                  <p><span className="font-medium">設定名:</span> {setting.setting_name}</p>
                  <p><span className="font-medium">状態:</span> {setting.is_active ? 'アクティブ' : '非アクティブ'}</p>
                  <p><span className="font-medium">最大トークン数:</span> {setting.ai_settings?.max_completion_tokens || 'N/A'}</p>
                  <p><span className="font-medium">レスポンス形式:</span> {setting.ai_settings?.response_format?.type || 'N/A'}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* その他のプロンプト一覧 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">その他のプロンプト設定</h2>
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus size={20} />
            新規プロンプト
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-4 font-medium text-gray-700">アクティビティ</th>
                <th className="text-left p-4 font-medium text-gray-700">カテゴリ</th>
                <th className="text-left p-4 font-medium text-gray-700">状態</th>
                <th className="text-left p-4 font-medium text-gray-700">更新日</th>
                <th className="text-left p-4 font-medium text-gray-700">操作</th>
              </tr>
            </thead>
            <tbody>
              {prompts.filter(p => p.activity_type !== 'application_practice').map((prompt) => (
                <tr key={prompt.id} className="border-t border-gray-200 hover:bg-gray-50">
                  <td className="p-4">
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                      {ACTIVITY_TYPES.find(t => t.value === prompt.activity_type)?.label || prompt.activity_type}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-sm">
                      {PROMPT_CATEGORIES.find(c => c.value === prompt.prompt_category)?.label || prompt.prompt_category}
                    </span>
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => togglePromptActive(prompt.id, prompt.is_active)}
                      className={`px-2 py-1 rounded text-sm font-medium ${
                        prompt.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {prompt.is_active ? '有効' : '無効'}
                    </button>
                  </td>
                  <td className="p-4 text-sm text-gray-600">
                    {new Date(prompt.updated_at).toLocaleDateString('ja-JP')}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setEditingPrompt(prompt)}
                        className="text-blue-600 hover:text-blue-800 p-1"
                        title="編集"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDeletePrompt(prompt.id)}
                        className="text-red-600 hover:text-red-800 p-1"
                        title="削除"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {prompts.filter(p => p.activity_type !== 'application_practice').length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">
                    <div className="flex flex-col items-center gap-4">
                      <Brain className="h-12 w-12 text-gray-300" />
                      <div>
                        <p className="font-medium">プロンプトが設定されていません</p>
                        <p className="text-sm">「新規プロンプト」ボタンから最初の設定を作成してください</p>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 新規プロンプト作成フォーム */}
      {showCreateForm && (
        <CreatePromptForm
          onSave={handleSavePrompt}
          onCancel={() => setShowCreateForm(false)}
          saving={Object.values(saving).some(s => s)}
        />
      )}
    </div>
  )
}

interface ApplicationPracticeSectionProps {
  prompts: GlobalPrompt[]
  onDelete: (promptId: string) => void
  onToggleActive: (promptId: string, isActive: boolean) => void
  editingContent: { [key: string]: string }
  editingSettings: { [key: string]: string }
  saving: { [key: string]: boolean }
  onStartEditing: (prompt: GlobalPrompt, field: 'content' | 'settings') => void
  onCancelEditing: (promptId: string, field: 'content' | 'settings') => void
  onSaveEdit: (promptId: string, field: 'content' | 'settings') => void
  onContentChange: (promptId: string, content: string) => void
  onSettingsChange: (promptId: string, settings: string) => void
}

function ApplicationPracticeSection({ 
  prompts, 
  onDelete, 
  onToggleActive,
  editingContent,
  editingSettings,
  saving,
  onStartEditing,
  onCancelEditing,
  onSaveEdit,
  onContentChange,
  onSettingsChange
}: ApplicationPracticeSectionProps) {
  const systemPrompt = prompts.find(p => p.prompt_category === 'system_prompt')
  const evaluationPrompt = prompts.find(p => p.prompt_category === 'evaluation_prompt')

  const getStatusBadge = (prompt: GlobalPrompt | undefined) => {
    if (!prompt) {
      return <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-sm">未設定</span>
    }
    return (
      <button
        onClick={() => onToggleActive(prompt.id, prompt.is_active)}
        className={`px-2 py-1 rounded text-sm font-medium ${
          prompt.is_active 
            ? 'bg-green-100 text-green-800' 
            : 'bg-gray-100 text-gray-600'
        }`}
      >
        {prompt.is_active ? '有効' : '無効'}
      </button>
    )
  }

  const renderPromptContent = (prompt: GlobalPrompt) => {
    const isEditing = editingContent[prompt.id] !== undefined
    const isSaving = saving[prompt.id] || false

    if (isEditing) {
      return (
        <div className="space-y-3">
          <textarea
            value={editingContent[prompt.id]}
            onChange={(e) => onContentChange(prompt.id, e.target.value)}
            rows={20}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm leading-relaxed resize-y"
            placeholder="プロンプトの内容を入力してください..."
          />
          <div className="flex items-center gap-2">
            <button
              onClick={() => onSaveEdit(prompt.id, 'content')}
              disabled={isSaving}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 text-sm"
            >
              <Save size={16} />
              {isSaving ? '保存中...' : '保存'}
            </button>
            <button
              onClick={() => onCancelEditing(prompt.id, 'content')}
              disabled={isSaving}
              className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 disabled:opacity-50 text-sm"
            >
              キャンセル
            </button>
          </div>
        </div>
      )
    }

    return (
      <div className="space-y-3">
        <div className="bg-gray-50 p-4 rounded-lg border text-sm text-gray-700 min-h-[200px] max-h-[400px] overflow-y-auto leading-relaxed cursor-pointer hover:bg-gray-100 transition-colors"
             onClick={() => onStartEditing(prompt, 'content')}>
          <pre className="whitespace-pre-wrap font-sans">{prompt.prompt_content}</pre>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onStartEditing(prompt, 'content')}
            className="text-blue-600 hover:text-blue-800 p-1 flex items-center gap-1 text-sm"
            title="編集"
          >
            <Edit size={16} />
            編集
          </button>
          <button
            onClick={() => onDelete(prompt.id)}
            className="text-red-600 hover:text-red-800 p-1 flex items-center gap-1 text-sm"
            title="削除"
          >
            <Trash2 size={16} />
            削除
          </button>
        </div>
      </div>
    )
  }

  const renderSettingsContent = (prompt: GlobalPrompt) => {
    const isEditing = editingSettings[prompt.id] !== undefined
    const isSaving = saving[prompt.id] || false
    const maxTokens = prompt.ai_settings?.max_completion_tokens || 800

    if (isEditing) {
      const currentTokens = editingSettings[prompt.id] || maxTokens.toString()
      return (
        <div className="space-y-3">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700">最大トークン数:</label>
            <input
              type="number"
              value={currentTokens}
              onChange={(e) => onSettingsChange(prompt.id, e.target.value)}
              min={100}
              max={4000}
              step={100}
              className="w-32 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
            <span className="text-xs text-gray-500">（100〜4000）</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const tokens = parseInt(currentTokens) || 800
                const settings = {
                  max_completion_tokens: tokens,
                  response_format: { type: 'json_object' }
                }
                onSettingsChange(prompt.id, JSON.stringify(settings))
                onSaveEdit(prompt.id, 'settings')
              }}
              disabled={isSaving}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 text-sm"
            >
              <Save size={16} />
              {isSaving ? '保存中...' : '保存'}
            </button>
            <button
              onClick={() => onCancelEditing(prompt.id, 'settings')}
              disabled={isSaving}
              className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 disabled:opacity-50 text-sm"
            >
              キャンセル
            </button>
          </div>
        </div>
      )
    }

    return (
      <div className="space-y-3">
        <div className="bg-gray-50 p-4 rounded-lg border text-sm text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors"
             onClick={() => onStartEditing(prompt, 'settings')}>
          <div className="flex items-center justify-between">
            <div>
              <span className="font-medium">最大トークン数: </span>
              <span className="text-blue-600 font-mono">{maxTokens}</span>
            </div>
            <span className="text-xs text-gray-500">クリックで編集</span>
          </div>
        </div>
        <button
          onClick={() => onStartEditing(prompt, 'settings')}
          className="text-blue-600 hover:text-blue-800 p-1 flex items-center gap-1 text-sm"
          title="設定編集"
        >
          <Edit size={16} />
          トークン数を変更
        </button>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-blue-100 p-2 rounded-lg">
            <Brain className="h-6 w-6 text-blue-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">応用練習 AI設定</h2>
        </div>
        <p className="text-gray-600 text-sm">
          応用練習で使用されるAI評価プロンプトを管理します。2つのコンポーネントで構成されています。
        </p>
      </div>

      <div className="p-6 space-y-6">
        {/* システムプロンプト */}
        <div className="border border-gray-200 rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
                システムプロンプト
              </span>
              {getStatusBadge(systemPrompt)}
            </div>
          </div>
          <p className="text-gray-600 text-sm mb-3">
            AIの役割と基本的な評価方針を定義するプロンプト（クリックで編集開始）
          </p>
          {systemPrompt ? (
            renderPromptContent(systemPrompt)
          ) : (
            <div className="bg-red-50 p-4 rounded-lg border text-sm text-red-600">
              システムプロンプトが設定されていません
            </div>
          )}
        </div>

        {/* 評価プロンプト */}
        <div className="border border-gray-200 rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                評価プロンプト
              </span>
              {getStatusBadge(evaluationPrompt)}
            </div>
          </div>
          <p className="text-gray-600 text-sm mb-3">
            具体的な評価指示、スコア基準、JSON形式指定を含む統合プロンプト（クリックで編集開始）
          </p>
          {evaluationPrompt ? (
            renderPromptContent(evaluationPrompt)
          ) : (
            <div className="bg-red-50 p-4 rounded-lg border text-sm text-red-600">
              評価プロンプトが設定されていません
            </div>
          )}
        </div>

        {/* AI設定 */}
        {systemPrompt && (
          <div className="border border-gray-200 rounded-lg p-5">
            <div className="flex items-center gap-3 mb-4">
              <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
                AI設定
              </span>
            </div>
            <p className="text-gray-600 text-sm mb-3">
              OpenAI APIのパラメータ設定（JSON形式、クリックで編集開始）
            </p>
            {renderSettingsContent(systemPrompt)}
          </div>
        )}

        {/* 進行状況 */}
        <div className="bg-blue-50 p-5 rounded-lg border border-blue-200">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle className="h-5 w-5 text-blue-600" />
            <span className="font-medium text-blue-900">設定状況</span>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className={`p-3 rounded-lg ${systemPrompt?.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
              システム: {systemPrompt?.is_active ? '有効' : '無効'}
            </div>
            <div className={`p-3 rounded-lg ${evaluationPrompt?.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
              評価: {evaluationPrompt?.is_active ? '有効' : '無効'}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

interface AIConversationSectionProps {
  prompts: GlobalPrompt[]
  onDelete: (promptId: string) => void
  onToggleActive: (promptId: string, isActive: boolean) => void
  editingContent: { [key: string]: string }
  editingSettings: { [key: string]: string }
  saving: { [key: string]: boolean }
  onStartEditing: (prompt: GlobalPrompt, field: 'content' | 'settings') => void
  onCancelEditing: (promptId: string, field: 'content' | 'settings') => void
  onSaveEdit: (promptId: string, field: 'content' | 'settings') => void
  onContentChange: (promptId: string, content: string) => void
  onSettingsChange: (promptId: string, settings: string) => void
}

function AIConversationSection({ 
  prompts, 
  onDelete, 
  onToggleActive,
  editingContent,
  editingSettings,
  saving,
  onStartEditing,
  onCancelEditing,
  onSaveEdit,
  onContentChange,
  onSettingsChange
}: AIConversationSectionProps) {
  console.log('AI Conversation Section - prompts:', prompts)
  const systemPrompt = prompts.find(p => p.prompt_category === 'system_prompt')
  console.log('AI Conversation Section - systemPrompt:', systemPrompt)

  const getStatusBadge = (prompt: GlobalPrompt | undefined) => {
    if (!prompt) {
      return <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-sm">未設定</span>
    }
    return (
      <button
        onClick={() => onToggleActive(prompt.id, prompt.is_active)}
        className={`px-2 py-1 rounded text-sm font-medium ${
          prompt.is_active 
            ? 'bg-green-100 text-green-800' 
            : 'bg-gray-100 text-gray-600'
        }`}
      >
        {prompt.is_active ? '有効' : '無効'}
      </button>
    )
  }

  const renderPromptContent = (prompt: GlobalPrompt) => {
    const isEditing = editingContent[prompt.id] !== undefined
    const isSaving = saving[prompt.id] || false

    if (isEditing) {
      return (
        <div className="space-y-3">
          <textarea
            value={editingContent[prompt.id]}
            onChange={(e) => onContentChange(prompt.id, e.target.value)}
            rows={20}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm leading-relaxed resize-y"
            placeholder="プロンプトの内容を入力してください..."
          />
          <div className="flex items-center gap-2">
            <button
              onClick={() => onSaveEdit(prompt.id, 'content')}
              disabled={isSaving}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 text-sm"
            >
              <Save size={16} />
              {isSaving ? '保存中...' : '保存'}
            </button>
            <button
              onClick={() => onCancelEditing(prompt.id, 'content')}
              disabled={isSaving}
              className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 disabled:opacity-50 text-sm"
            >
              キャンセル
            </button>
          </div>
        </div>
      )
    }

    return (
      <div className="space-y-3">
        <div className="bg-gray-50 p-4 rounded-lg border text-sm text-gray-700 min-h-[200px] max-h-[400px] overflow-y-auto leading-relaxed cursor-pointer hover:bg-gray-100 transition-colors"
             onClick={() => onStartEditing(prompt, 'content')}>
          <pre className="whitespace-pre-wrap font-sans">{prompt.prompt_content}</pre>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onStartEditing(prompt, 'content')}
            className="text-blue-600 hover:text-blue-800 p-1 flex items-center gap-1 text-sm"
            title="編集"
          >
            <Edit size={16} />
            編集
          </button>
          <button
            onClick={() => onDelete(prompt.id)}
            className="text-red-600 hover:text-red-800 p-1 flex items-center gap-1 text-sm"
            title="削除"
          >
            <Trash2 size={16} />
            削除
          </button>
        </div>
      </div>
    )
  }

  const renderSettingsContent = (prompt: GlobalPrompt) => {
    const isEditing = editingSettings[prompt.id] !== undefined
    const isSaving = saving[prompt.id] || false
    const maxTokens = prompt.ai_settings?.max_completion_tokens || 300

    if (isEditing) {
      const currentTokens = editingSettings[prompt.id] || maxTokens.toString()
      return (
        <div className="space-y-3">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700">最大トークン数:</label>
            <input
              type="number"
              value={currentTokens}
              onChange={(e) => onSettingsChange(prompt.id, e.target.value)}
              min={100}
              max={1000}
              step={50}
              className="w-32 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
            <span className="text-xs text-gray-500">（100〜1000）</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const tokens = parseInt(currentTokens) || 300
                const settings = {
                  max_completion_tokens: tokens,
                  response_format: { type: 'text' }
                }
                onSettingsChange(prompt.id, JSON.stringify(settings))
                onSaveEdit(prompt.id, 'settings')
              }}
              disabled={isSaving}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 text-sm"
            >
              <Save size={16} />
              {isSaving ? '保存中...' : '保存'}
            </button>
            <button
              onClick={() => onCancelEditing(prompt.id, 'settings')}
              disabled={isSaving}
              className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 disabled:opacity-50 text-sm"
            >
              キャンセル
            </button>
          </div>
        </div>
      )
    }

    return (
      <div className="space-y-3">
        <div className="bg-gray-50 p-4 rounded-lg border text-sm text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors"
             onClick={() => onStartEditing(prompt, 'settings')}>
          <div className="flex items-center justify-between">
            <div>
              <span className="font-medium">最大トークン数: </span>
              <span className="text-blue-600 font-mono">{maxTokens}</span>
            </div>
            <span className="text-xs text-gray-500">クリックで編集</span>
          </div>
        </div>
        <button
          onClick={() => onStartEditing(prompt, 'settings')}
          className="text-blue-600 hover:text-blue-800 p-1 flex items-center gap-1 text-sm"
          title="設定編集"
        >
          <Edit size={16} />
          トークン数を変更
        </button>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-green-100 p-2 rounded-lg">
            <Brain className="h-6 w-6 text-green-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">AI会話実践 設定</h2>
        </div>
        <p className="text-gray-600 text-sm">
          AI会話実践で使用されるシステムプロンプトを管理します。会話のトーンや指導方針を設定できます。
        </p>
      </div>

      <div className="p-6 space-y-6">
        {/* システムプロンプト */}
        <div className="border border-gray-200 rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
                システムプロンプト
              </span>
              {getStatusBadge(systemPrompt)}
            </div>
          </div>
          <p className="text-gray-600 text-sm mb-3">
            AIコーチの役割と会話指導方針を定義するプロンプト（クリックで編集開始）
          </p>
          {systemPrompt ? (
            renderPromptContent(systemPrompt)
          ) : (
            <div className="bg-red-50 p-4 rounded-lg border text-sm text-red-600">
              システムプロンプトが設定されていません
            </div>
          )}
        </div>

        {/* AI設定 */}
        {systemPrompt && (
          <div className="border border-gray-200 rounded-lg p-5">
            <div className="flex items-center gap-3 mb-4">
              <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
                AI設定
              </span>
            </div>
            <p className="text-gray-600 text-sm mb-3">
              会話の応答速度とトークン数の設定（クリックで編集開始）
            </p>
            {renderSettingsContent(systemPrompt)}
          </div>
        )}

        {/* 設定状況 */}
        <div className="bg-green-50 p-5 rounded-lg border border-green-200">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="font-medium text-green-900">設定状況</span>
          </div>
          <div className="text-sm text-green-800">
            {systemPrompt?.is_active ? (
              <span>✅ AI会話実践のシステムプロンプトが有効です</span>
            ) : (
              <span>⚠️ システムプロンプトが無効または未設定です</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

interface CreatePromptFormProps {
  onSave: (data: Partial<GlobalPrompt>) => void
  onCancel: () => void
  saving: boolean
}

function CreatePromptForm({ onSave, onCancel, saving }: CreatePromptFormProps) {
  const [formData, setFormData] = useState({
    activity_type: '',
    prompt_category: '',
    prompt_content: '',
    prompt_variables: '{}',
    ai_settings: JSON.stringify({
      max_completion_tokens: 800,
      response_format: { type: 'json_object' }
    }, null, 2),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const data = {
        ...formData,
        prompt_variables: JSON.parse(formData.prompt_variables),
        ai_settings: JSON.parse(formData.ai_settings),
      }
      onSave(data)
    } catch (error) {
      alert('JSON形式が正しくありません')
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-xl font-semibold text-gray-900">新規プロンプト作成</h3>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              アクティビティタイプ *
            </label>
            <select
              value={formData.activity_type}
              onChange={(e) => setFormData({ ...formData, activity_type: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              required
            >
              <option value="">選択してください</option>
              {ACTIVITY_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              プロンプトカテゴリ *
            </label>
            <select
              value={formData.prompt_category}
              onChange={(e) => setFormData({ ...formData, prompt_category: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              required
            >
              <option value="">選択してください</option>
              {PROMPT_CATEGORIES.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            プロンプト内容 *
          </label>
          <textarea
            value={formData.prompt_content}
            onChange={(e) => setFormData({ ...formData, prompt_content: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-4 py-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm leading-relaxed resize-y min-h-[200px]"
            placeholder="プロンプトの内容を入力してください..."
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              AI設定 (JSON)
            </label>
            <textarea
              value={formData.ai_settings}
              onChange={(e) => setFormData({ ...formData, ai_settings: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm leading-relaxed"
              rows={4}
              placeholder='{"max_completion_tokens": 800, "response_format": {"type": "json_object"}}'
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              プロンプト変数 (JSON)
            </label>
            <textarea
              value={formData.prompt_variables}
              onChange={(e) => setFormData({ ...formData, prompt_variables: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm leading-relaxed"
              rows={4}
              placeholder='{}'
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 font-medium"
          >
            キャンセル
          </button>
          <button
            type="submit"
            disabled={saving}
            className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 font-medium shadow-sm"
          >
            <Save size={16} />
            {saving ? '保存中...' : '作成'}
          </button>
        </div>
      </form>
    </div>
  )
}