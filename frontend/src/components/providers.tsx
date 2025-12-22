"use client"

import { useRouter } from "next/navigation"
import type { ReactNode } from "react"
import { authClient } from "~/lib/auth-client"
import { Toaster } from "~/components/ui/sonner"



export function Providers({ children }: { children: ReactNode }) {
    const router = useRouter()

    return (
        <>
            {children}
            
        </>
    )
}