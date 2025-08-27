'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { Save, Loader2, AlertCircle, CheckCircle } from 'lucide-react'

interface AIPrompt {
  id: string
  prompt_type: 'lesson_conversation' | 'session_evaluation' | 'general_conversation'
  prompt_key: string
  prompt_content: string
  description: string
  is_active: boolean
  created_at: string
  updated_at: string
}

const promptTypeLabels = {
  lesson_conversation: 'レッスン会話',
  session_evaluation: 'セッション評価',
  general_conversation: '一般会話'
}

export default function AITuningPage() {
  const [prompts, setPrompts] = useState<AIPrompt[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<AIPrompt['prompt_type']>('lesson_conversation')
  const [editedPrompts, setEditedPrompts] = useState<Record<string, string>>({})
  const [saveStatus, setSaveStatus] = useState<Record<string, 'success' | 'error' | null>>({})
  const supabase = createClient()

  const fetchPrompts = async () => {
    try {
      const { data, error } = await supabase
        .from('ai_prompts')
        .select('*')
        .order('prompt_type', { ascending: true })
        .order('prompt_key', { ascending: true })

      if (error) throw error
      setPrompts(data || [])
    } catch (error) {
      console.error('Error fetching prompts:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPrompts()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handlePromptChange = (promptId: string, newContent: string) => {
    setEditedPrompts(prev => ({
      ...prev,
      [promptId]: newContent
    }))
    setSaveStatus(prev => ({
      ...prev,
      [promptId]: null
    }))
  }

  const savePrompt = async (prompt: AIPrompt) => {
    const newContent = editedPrompts[prompt.id] ?? prompt.prompt_content
    if (newContent === prompt.prompt_content) return

    setSaving(prompt.id)
    try {
      const { error } = await supabase
        .from('ai_prompts')
        .update({ prompt_content: newContent })
        .eq('id', prompt.id)

      if (error) throw error

      // 成功したらローカルの状態を更新
      setPrompts(prev => 
        prev.map(p => 
          p.id === prompt.id 
            ? { ...p, prompt_content: newContent, updated_at: new Date().toISOString() }
            : p
        )
      )
      
      // 編集状態をクリア
      setEditedPrompts(prev => {
        const newState = { ...prev }
        delete newState[prompt.id]
        return newState
      })

      setSaveStatus(prev => ({
        ...prev,
        [prompt.id]: 'success'
      }))

      // 3秒後にステータスをクリア
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

  const filteredPrompts = prompts.filter(p => p.prompt_type === activeTab)

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
        <h1 className="text-2xl font-bold text-gray-900">AIチューニング</h1>
        <p className="mt-2 text-gray-600">
          AI会話と評価のプロンプトを管理します。プロンプトを編集して、AIの振る舞いをカスタマイズできます。
        </p>
      </div>

      {/* タブ */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {Object.entries(promptTypeLabels).map(([type, label]) => (
            <button
              key={type}
              onClick={() => setActiveTab(type as AIPrompt['prompt_type'])}
              className={`
                py-2 px-1 border-b-2 font-medium text-sm
                ${activeTab === type
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              {label}
            </button>
          ))}
        </nav>
      </div>

      {/* プロンプトエディター */}
      <div className="space-y-6">
        {filteredPrompts.map(prompt => (
          <div key={prompt.id} className="bg-white shadow rounded-lg p-6">
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-medium text-gray-900">
                  {prompt.description}
                </h3>
                <div className="flex items-center gap-2">
                  {saveStatus[prompt.id] === 'success' && (
                    <div className="flex items-center text-green-600 text-sm">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      保存しました
                    </div>
                  )}
                  {saveStatus[prompt.id] === 'error' && (
                    <div className="flex items-center text-red-600 text-sm">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      エラーが発生しました
                    </div>
                  )}
                  <button
                    onClick={() => savePrompt(prompt)}
                    disabled={
                      saving === prompt.id || 
                      (editedPrompts[prompt.id] ?? prompt.prompt_content) === prompt.prompt_content
                    }
                    className={`
                      inline-flex items-center px-4 py-2 text-sm font-medium rounded-md
                      ${(editedPrompts[prompt.id] ?? prompt.prompt_content) !== prompt.prompt_content
                        ? 'text-white bg-blue-600 hover:bg-blue-700'
                        : 'text-gray-400 bg-gray-100 cursor-not-allowed'
                      }
                      focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                      disabled:opacity-50 disabled:cursor-not-allowed
                    `}
                  >
                    {saving === prompt.id ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    保存
                  </button>
                </div>
              </div>
              <p className="text-sm text-gray-500">
                キー: {prompt.prompt_key}
              </p>
              {prompt.updated_at && (
                <p className="text-xs text-gray-400 mt-1">
                  最終更新: {new Date(prompt.updated_at).toLocaleString('ja-JP')}
                </p>
              )}
            </div>

            <div className="relative">
              <textarea
                value={editedPrompts[prompt.id] ?? prompt.prompt_content}
                onChange={(e) => handlePromptChange(prompt.id, e.target.value)}
                className="w-full h-64 p-3 border border-gray-300 rounded-md shadow-sm 
                         focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                placeholder="プロンプトを入力..."
              />
              {prompt.prompt_content.includes('${') && (
                <div className="mt-2 p-3 bg-blue-50 rounded-md">
                  <p className="text-sm text-blue-700">
                    <strong>変数:</strong> このプロンプトには以下の変数が含まれています：
                  </p>
                  <ul className="mt-1 text-sm text-blue-600 list-disc list-inside">
                    {Array.from(prompt.prompt_content.matchAll(/\$\{(\w+)\}/g))
                      .map(match => match[1])
                      .filter((value, index, self) => self.indexOf(value) === index)
                      .map(variable => (
                        <li key={variable}>${`{${variable}}`}</li>
                      ))
                    }
                  </ul>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ヘルプセクション */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-3">プロンプトの書き方</h3>
        <div className="space-y-3 text-sm text-gray-600">
          <div>
            <strong>レッスン会話プロンプト:</strong>
            <p>レッスン中のAI（お客様役）の振る舞いを定義します。ターゲットフレーズを自然に引き出すような状況を作るように設定してください。</p>
          </div>
          <div>
            <strong>セッション評価プロンプト:</strong>
            <p>練習セッション終了時の評価基準を定義します。建設的で励みになるフィードバックを生成するように設定してください。</p>
          </div>
          <div>
            <strong>一般会話プロンプト:</strong>
            <p>ホーム画面のフリー会話練習でのAIの振る舞いを定義します。様々な美容室シーンに対応できるように設定してください。</p>
          </div>
          <div className="mt-4 p-3 bg-yellow-50 rounded-md">
            <p className="text-yellow-800">
              <strong>注意:</strong> プロンプトの変更は即座にアプリに反映されます。変更前に内容をよく確認してください。
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 