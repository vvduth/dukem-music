import { headers } from 'next/headers'
import Link from 'next/link'
import React from 'react'
import CreateSong from '~/components/create'
import { auth } from '~/lib/auth'

const Dashboard = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session?.user) {
    return (<div className="p-4">Please log in to access the dashboard.
      <Link href="/auth/login" className="text-blue-500 underline">Go to Login</Link>
    </div>)

  }
  return (
      <div className="p-4">
      <h1 className="text-3xl font-bold tracking-tight">Discover Music</h1>
      <CreateSong />
    </div>
  )
}

export default Dashboard