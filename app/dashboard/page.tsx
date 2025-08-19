'use client'

import { useState, useEffect } from 'react'
import { createClient } from '../../lib/supabase'
import { Loader2 } from 'lucide-react'

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalLessons: 0,
    totalCurriculums: 0,
    activeLessons: 0,
    activeCurriculums: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  async function fetchStats() {
    try {
      const supabase = createClient()
      
      // レッスン数を取得
      const { count: totalLessons } = await supabase
        .from('lessons')
        .select('*', { count: 'exact', head: true })
      
      // アクティブなレッスン数を取得
      const { count: activeLessons } = await supabase
        .from('lessons')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)
      
      // カリキュラム数を取得
      const { count: totalCurriculums } = await supabase
        .from('curriculums')
        .select('*', { count: 'exact', head: true })
      
      // アクティブなカリキュラム数を取得
      const { count: activeCurriculums } = await supabase
        .from('curriculums')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)
      
      setStats({
        totalLessons: totalLessons || 0,
        totalCurriculums: totalCurriculums || 0,
        activeLessons: activeLessons || 0,
        activeCurriculums: activeCurriculums || 0
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">ダッシュボード</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">総レッスン数</h3>
          <p className="text-3xl font-bold text-gray-900">{stats.totalLessons}</p>
          <p className="text-xs text-gray-500 mt-1">アクティブ: {stats.activeLessons}</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">総カリキュラム数</h3>
          <p className="text-3xl font-bold text-gray-900">{stats.totalCurriculums}</p>
          <p className="text-xs text-gray-500 mt-1">アクティブ: {stats.activeCurriculums}</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">公開率（レッスン）</h3>
          <p className="text-3xl font-bold text-gray-900">
            {stats.totalLessons > 0 
              ? Math.round((stats.activeLessons / stats.totalLessons) * 100) 
              : 0}%
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">公開率（カリキュラム）</h3>
          <p className="text-3xl font-bold text-gray-900">
            {stats.totalCurriculums > 0 
              ? Math.round((stats.activeCurriculums / stats.totalCurriculums) * 100) 
              : 0}%
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">最近のアクティビティ</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-gray-600">新規レッスン作成</span>
              <span className="text-sm text-gray-500">2時間前</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-gray-600">ユーザー登録</span>
              <span className="text-sm text-gray-500">5時間前</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-gray-600">AI設定更新</span>
              <span className="text-sm text-gray-500">1日前</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">クイックアクション</h2>
          <div className="grid grid-cols-2 gap-4">
            <a href="/lessons/new" className="block p-4 text-center bg-pink-50 rounded-lg hover:bg-pink-100 transition">
              <span className="text-pink-600 font-medium">新規レッスン</span>
            </a>
            <a href="/courses/new" className="block p-4 text-center bg-purple-50 rounded-lg hover:bg-purple-100 transition">
              <span className="text-purple-600 font-medium">新規コース</span>
            </a>
            <a href="/users" className="block p-4 text-center bg-blue-50 rounded-lg hover:bg-blue-100 transition">
              <span className="text-blue-600 font-medium">ユーザー管理</span>
            </a>
            <a href="/ai-settings" className="block p-4 text-center bg-green-50 rounded-lg hover:bg-green-100 transition">
              <span className="text-green-600 font-medium">AI設定</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}