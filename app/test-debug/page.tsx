'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function TestDebugPage() {
  const [sessionInfo, setSessionInfo] = useState<any>(null)
  const [userInfo, setUserInfo] = useState<any>(null)
  const [profileInfo, setProfileInfo] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function testAuth() {
      try {
        console.log('🔍 Starting debug test...')
        // Use the singleton supabase client

        // Test 1: Get session
        console.log('1️⃣ Testing session...')
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          console.error('❌ Session error:', sessionError)
          setError(`Session error: ${sessionError.message}`)
        } else {
          console.log('✅ Session result:', session ? 'Found' : 'None')
          setSessionInfo(session)
        }

        // Test 2: Get user
        console.log('2️⃣ Testing user...')
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (userError) {
          console.error('❌ User error:', userError)
          setError(`User error: ${userError.message}`)
        } else {
          console.log('✅ User result:', user ? user.email : 'None')
          setUserInfo(user)
        }

        // Test 3: Try to fetch profile (if user exists)
        if (user) {
          console.log('3️⃣ Testing profile fetch...')
          const { data: profile, error: profileError } = await supabase
            .from('users')
            .select('id, name, email, avatar_url')
            .eq('id', user.id)
            .single()

          if (profileError) {
            console.error('❌ Profile error:', profileError)
            setError(`Profile error: ${profileError.message} (Code: ${profileError.code})`)
          } else {
            console.log('✅ Profile result:', profile ? profile.email : 'None')
            setProfileInfo(profile)
          }
        }

      } catch (err) {
        console.error('❌ Test failed:', err)
        setError(`Test failed: ${err instanceof Error ? err.message : 'Unknown error'}`)
      } finally {
        setLoading(false)
      }
    }

    testAuth()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Testing authentication...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">🔍 Authentication Debug Test</h1>
        
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <h2 className="text-lg font-semibold text-red-800 mb-2">❌ Error Detected</h2>
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <div className="grid gap-6">
          {/* Session Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">🔐 Session Information</h2>
            {sessionInfo ? (
              <div className="space-y-2">
                <p><strong>User ID:</strong> {sessionInfo.user?.id}</p>
                <p><strong>Email:</strong> {sessionInfo.user?.email}</p>
                <p><strong>Expires:</strong> {new Date(sessionInfo.expires_at * 1000).toLocaleString()}</p>
                <p><strong>Provider:</strong> {sessionInfo.user?.app_metadata?.provider}</p>
              </div>
            ) : (
              <p className="text-gray-500">No active session</p>
            )}
          </div>

          {/* User Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">👤 User Information</h2>
            {userInfo ? (
              <div className="space-y-2">
                <p><strong>ID:</strong> {userInfo.id}</p>
                <p><strong>Email:</strong> {userInfo.email}</p>
                <p><strong>Email Confirmed:</strong> {userInfo.email_confirmed_at ? 'Yes' : 'No'}</p>
                <p><strong>Created:</strong> {new Date(userInfo.created_at).toLocaleString()}</p>
                <p><strong>Last Sign In:</strong> {userInfo.last_sign_in_at ? new Date(userInfo.last_sign_in_at).toLocaleString() : 'Never'}</p>
              </div>
            ) : (
              <p className="text-gray-500">No user data</p>
            )}
          </div>

          {/* Profile Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">📋 Profile Information</h2>
            {profileInfo ? (
              <div className="space-y-2">
                <p><strong>ID:</strong> {profileInfo.id}</p>
                <p><strong>Name:</strong> {profileInfo.name}</p>
                <p><strong>Email:</strong> {profileInfo.email}</p>
                <p><strong>Avatar:</strong> {profileInfo.avatar_url || 'None'}</p>
              </div>
            ) : (
              <p className="text-gray-500">No profile data (this might be the issue!)</p>
            )}
          </div>

          {/* Debug Actions */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">🔧 Debug Actions</h2>
            <div className="space-y-4">
              <div>
                <a 
                  href="/login" 
                  className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  Go to Login
                </a>
              </div>
              <div>
                <a 
                  href="/signup" 
                  className="inline-block bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                >
                  Go to Signup
                </a>
              </div>
              <div>
                <a 
                  href="/dashboard" 
                  className="inline-block bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
                >
                  Try Dashboard (might hang)
                </a>
              </div>
            </div>
          </div>

          {/* Console Logs */}
          <div className="bg-gray-900 text-green-400 rounded-lg p-6 font-mono text-sm">
            <h2 className="text-xl font-semibold text-white mb-4">📝 Console Output</h2>
            <p>Check the browser console (F12) for detailed logs.</p>
            <p>Look for messages starting with 🔍, ✅, or ❌</p>
          </div>
        </div>
      </div>
    </div>
  )
}
