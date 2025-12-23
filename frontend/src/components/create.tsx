"use client"

import React from 'react'
import { Button } from './ui/button'
import { queueSong } from '~/actions/generate'

const CreateSong = () => {
  return (
    <Button className="w-full mt-4"
    onClick={queueSong}
        >
        Create New Song
    </Button>
  )
}

export default CreateSong