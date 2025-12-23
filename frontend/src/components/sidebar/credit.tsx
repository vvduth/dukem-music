"use server"
import { headers } from 'next/headers'
import React from 'react'
import { auth } from '~/lib/auth'
import { db } from '~/server/db'

const Credits = async () => {
const session = await auth.api.getSession({
    headers: await headers(),
})
if (!session) {
    return null
}

const user = await db.user.findUniqueOrThrow({
    where: {
        id: session.user.id,
    },select: {
        credits: true,
    }
})

    return (
    <div>
      <p className='font-semibold'>{user.credits}</p>
      <p  className='text-muted-foreground'> credits</p>
    </div>
  )
}

export default Credits
