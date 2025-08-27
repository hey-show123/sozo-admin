'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AlertCircle, CheckCircle, Loader2, Settings, MessageSquare, Lightbulb } from 'lucide-react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface GlobalSetting {
  id: string
  setting_key: string
  setting_value: any
  description: string
}

interface EditableField {
  label: string
  key: string
  type: 'text' | 'textarea' | 'number' | 'json'
  placeholder?: string
  rows?: number
}

export default function AISettingsEditor() {
  const [settings, setSettings] = useState<GlobalSetting[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [editedSettings, setEditedSettings] = useState<Record<string, any>>({})

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('ai_global_settings')
        .select('*')
        .eq('is_active', true)
        .order('setting_key')

      if (error) throw error
      setSettings(data || [])
      
      // 初期値を設定
      const initial: Record<string, any> = {}
      data?.forEach(setting => {
        initial[setting.setting_key] = setting.setting_value
      })
      setEditedSettings(initial)
    } catch (error) {
      console.error('Error fetching settings:', error)
      setMessage({ type: 'error', text: '設定の読み込みに失敗しました' })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (settingKey: string) => {
    setSaving(true)
    setMessage(null)
    try {
      const { error } = await supabase
        .from('ai_global_settings')
        .update({ 
          setting_value: editedSettings[settingKey],
          updated_at: new Date().toISOString()
        })
        .eq('setting_key', settingKey)

      if (error) throw error
      
      setMessage({ type: 'success', text: '設定を保存しました' })
      await fetchSettings()
    } catch (error) {
      console.error('Error saving setting:', error)
      setMessage({ type: 'error', text: '設定の保存に失敗しました' })
    } finally {
      setSaving(false)
    }
  }

  const handleFieldChange = (settingKey: string, fieldPath: string, value: any) => {
    setEditedSettings(prev => {
      const newSettings = { ...prev }
      const keys = fieldPath.split('.')
      let current = newSettings[settingKey]
      
      // ネストされたオブジェクトを辿る
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) {
          current[keys[i]] = {}
        }
        current = current[keys[i]]
      }
      
      // 最後のキーに値を設定
      current[keys[keys.length - 1]] = value
      
      return newSettings
    })
  }

  const renderEditableField = (settingKey: string, field: EditableField, value: any) => {
    const currentValue = value || ''
    
    if (field.type === 'textarea') {
      return (
        <Textarea
          value={currentValue}
          onChange={(e) => handleFieldChange(settingKey, field.key, e.target.value)}
          className="font-mono text-sm"
          rows={field.rows || 3}
          placeholder={field.placeholder}
        />
      )
    }
    
    if (field.type === 'json') {
      return (
        <Textarea
          value={typeof currentValue === 'object' ? JSON.stringify(currentValue, null, 2) : currentValue}
          onChange={(e) => {
            try {
              const parsed = JSON.parse(e.target.value)
              handleFieldChange(settingKey, field.key, parsed)
            } catch {
              // JSONパースエラーの場合は文字列として保存
              handleFieldChange(settingKey, field.key, e.target.value)
            }
          }}
          className="font-mono text-sm"
          rows={field.rows || 5}
          placeholder={field.placeholder}
        />
      )
    }
    
    return (
      <input
        type={field.type}
        value={currentValue}
        onChange={(e) => handleFieldChange(settingKey, field.key, e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
        placeholder={field.placeholder}
      />
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Settings className="h-8 w-8 text-blue-500" />
        <div>
          <h2 className="text-2xl font-bold">AI会話設定</h2>
          <p className="text-sm text-muted-foreground">グローバルなAI会話練習の設定を管理します</p>
        </div>
      </div>

      {message && (
        <Alert className={message.type === 'success' ? 'border-green-500' : 'border-red-500'}>
          {message.type === 'success' ? (
            <CheckCircle className="h-4 w-4 text-green-500" />
          ) : (
            <AlertCircle className="h-4 w-4 text-red-500" />
          )}
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="feedback" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="feedback" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            フィードバック設定
          </TabsTrigger>
          <TabsTrigger value="hints" className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            ヒント設定
          </TabsTrigger>
          <TabsTrigger value="global" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            グローバル設定
          </TabsTrigger>
        </TabsList>

        <TabsContent value="feedback" className="space-y-4">
          {settings.find(s => s.setting_key === 'feedback_instructions') && (
            <Card>
              <CardHeader>
                <CardTitle>フィードバック指示</CardTitle>
                <CardDescription>
                  AIがユーザーの英語に対してフィードバックを返す際の指示です。
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6">
                  <div className="space-y-2">
                    <Label>フィードバックの基本ルール</Label>
                    {renderEditableField('feedback_instructions', {
                      label: '基本ルール',
                      key: 'feedback_rules.base_rules',
                      type: 'textarea',
                      rows: 4,
                      placeholder: 'フィードバックは必ず日本語で記述...'
                    }, editedSettings['feedback_instructions']?.feedback_rules?.base_rules)}
                  </div>
                  
                  <div className="space-y-2">
                    <Label>カジュアル表現への対応</Label>
                    <div className="grid gap-2">
                      {renderEditableField('feedback_instructions', {
                        label: '重要度',
                        key: 'feedback_rules.casual_expressions.severity',
                        type: 'text',
                        placeholder: 'minor'
                      }, editedSettings['feedback_instructions']?.feedback_rules?.casual_expressions?.severity)}
                      
                      {renderEditableField('feedback_instructions', {
                        label: '改善提案例',
                        key: 'feedback_rules.casual_expressions.example',
                        type: 'textarea',
                        rows: 2,
                        placeholder: 'Yeahではなく、Yesと言いましょう...'
                      }, editedSettings['feedback_instructions']?.feedback_rules?.casual_expressions?.example)}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>感情表現（emotion）の選択肢</Label>
                    {renderEditableField('feedback_instructions', {
                      label: '利用可能な感情',
                      key: 'feedback_rules.available_emotions',
                      type: 'textarea',
                      rows: 2,
                      placeholder: 'friendly, concerned, curious, pleased等（AIが状況に応じて選択）'
                    }, editedSettings['feedback_instructions']?.feedback_rules?.available_emotions)}
                  </div>
                  
                  <div className="space-y-2">
                    <Label>重要度レベル</Label>
                    {renderEditableField('feedback_instructions', {
                      label: 'Severityレベル',
                      key: 'feedback_rules.severity_levels',
                      type: 'text',
                      placeholder: 'none, minor, major'
                    }, editedSettings['feedback_instructions']?.feedback_rules?.severity_levels?.join?.(', ') || editedSettings['feedback_instructions']?.feedback_rules?.severity_levels)}
                  </div>
                </div>
                
                <Button 
                  onClick={() => handleSave('feedback_instructions')}
                  disabled={saving}
                  className="w-full"
                >
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      保存中...
                    </>
                  ) : (
                    '保存'
                  )}
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="hints" className="space-y-4">
          {settings.find(s => s.setting_key === 'hint_instructions') && (
            <Card>
              <CardHeader>
                <CardTitle>ヒント表示設定</CardTitle>
                <CardDescription>
                  学習者に対してヒントを表示する条件とタイミングの設定です。
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6">
                  <div className="space-y-2">
                    <Label>ヒント表示条件（シンプル）</Label>
                    {renderEditableField('hint_instructions', {
                      label: '表示条件',
                      key: 'key_phrase_suggestions.simple_condition',
                      type: 'textarea',
                      rows: 2,
                      placeholder: '3回以上応答してもターゲットフレーズ未使用時のみ'
                    }, editedSettings['hint_instructions']?.key_phrase_suggestions?.simple_condition)}
                  </div>
                  
                  <div className="space-y-2">
                    <Label>ヒントの内容</Label>
                    {renderEditableField('hint_instructions', {
                      label: 'ヒント形式',
                      key: 'key_phrase_suggestions.hint_format',
                      type: 'textarea',
                      rows: 3,
                      placeholder: 'ターゲットフレーズから1つを提示（具体的な使い方は示さない）'
                    }, editedSettings['hint_instructions']?.key_phrase_suggestions?.hint_format)}
                  </div>
                  
                  <div className="space-y-2">
                    <Label>デフォルト設定</Label>
                    {renderEditableField('hint_instructions', {
                      label: 'デフォルト動作',
                      key: 'key_phrase_suggestions.default_behavior',
                      type: 'text',
                      placeholder: '通常はヒントを表示しない（should_suggest: false）'
                    }, editedSettings['hint_instructions']?.key_phrase_suggestions?.default_behavior)}
                  </div>
                </div>
                
                <Button 
                  onClick={() => handleSave('hint_instructions')}
                  disabled={saving}
                  className="w-full"
                >
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      保存中...
                    </>
                  ) : (
                    '保存'
                  )}
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="global" className="space-y-4">
          {settings.find(s => s.setting_key === 'global_prompt_additions') && (
            <Card>
              <CardHeader>
                <CardTitle>グローバルプロンプト追加設定</CardTitle>
                <CardDescription>
                  すべてのAI会話練習で共通して使用されるプロンプトの追加指示です。
                  JSON形式の応答フォーマットや重要な注意事項を設定します。
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>設定内容（JSON形式）</Label>
                  <Textarea
                    value={editedSettings['global_prompt_additions'] || ''}
                    onChange={(e) => handleTextChange('global_prompt_additions', e.target.value)}
                    className="font-mono text-sm min-h-[400px]"
                    placeholder="JSON形式で設定を入力"
                  />
                  {!validateJSON(editedSettings['global_prompt_additions'] || '{}') && (
                    <p className="text-sm text-red-500">JSONフォーマットが正しくありません</p>
                  )}
                </div>
                <Button 
                  onClick={() => handleSave('global_prompt_additions')}
                  disabled={saving || !validateJSON(editedSettings['global_prompt_additions'] || '{}')}
                >
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      保存中...
                    </>
                  ) : (
                    '保存'
                  )}
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900">使用方法</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-blue-800">
          <p>• 各設定はJSON形式で管理されます。編集後は「保存」ボタンをクリックしてください。</p>
          <p>• フィードバック設定：AIが文法エラーや改善提案を返す際のルールを設定します。</p>
          <p>• ヒント設定：学習者にヒントを表示するタイミングと内容を制御します。</p>
          <p>• グローバル設定：すべてのレッスンに共通する応答フォーマットを定義します。</p>
          <p>• 変更は即座にアプリケーションに反映されます。</p>
        </CardContent>
      </Card>
    </div>
  )
}