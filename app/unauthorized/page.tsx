import Link from 'next/link'
import { AlertCircle } from 'lucide-react'

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <AlertCircle className="mx-auto h-16 w-16 text-red-500" />
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            アクセス権限がありません
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            この管理画面はスーパー管理者専用です。
          </p>
          <p className="mt-4 text-sm text-gray-600">
            別のアカウントでログインするか、管理者にお問い合わせください。
          </p>
          <div className="mt-6">
            <Link
              href="/login"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              ログインページへ戻る
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
} 