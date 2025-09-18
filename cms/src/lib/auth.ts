import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import type { User } from '@/payload-types'

let payloadClient: Awaited<ReturnType<typeof getPayload>> | null = null

async function getPayloadClient() {
  if (!payloadClient) {
    payloadClient = await getPayload({ config: await configPromise })
  }
  return payloadClient
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const payload = await getPayloadClient()
    const cookieStore = await cookies()

    // Get Payload's auth token from cookies
    const token = cookieStore.get('payload-token')

    if (!token?.value) {
      return null
    }

    // Verify the token with Payload
    const user = await payload.auth({
      headers: new Headers({
        'Authorization': `JWT ${token.value}`
      })
    })

    return user.user || null
  } catch (error) {
    console.error('Auth error:', error)
    return null
  }
}

export async function requireAuth(): Promise<User> {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/admin/login')
  }

  return user
}