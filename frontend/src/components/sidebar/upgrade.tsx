"use client"
import React from 'react'
import { Button } from '../ui/button'
import { authClient } from '~/lib/auth-client'

const Upgrade = () => {

  const upgrade = async () => {
    await authClient.checkout({
      products: [
        "b6519d4d-ed40-4e55-ba9e-2ea5fb9c83de",
        "94958c81-19de-4b0b-b239-1e3964921feb",
        "91bdbd25-9a70-497e-83cc-fe2defc02b8a"

      ]
    })
  }
  return (
    <Button variant={"outline"} size={"sm"}
    className='ml-2 cursor-pointer text-orange-500'
    onClick={upgrade}
    >Upgrade</Button>
  )
}

export default Upgrade
