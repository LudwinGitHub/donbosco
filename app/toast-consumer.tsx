"use client"

import { useEffect } from "react"
import { useSearchParams, useRouter, usePathname } from "next/navigation"
import { toast } from "sonner"

export default function ToastConsumer() {
  const searchParams = useSearchParams()
  const router       = useRouter()
  const pathname     = usePathname()

  useEffect(() => {
    const message   = searchParams.get("toast")
    const toastType = searchParams.get("toastType") ?? "success"
    if (!message) return

    if (toastType === "error") toast.error(message)
    else toast.success(message)

    const params = new URLSearchParams(searchParams.toString())
    params.delete("toast")
    params.delete("toastType")
    const newUrl = params.size > 0 ? `${pathname}?${params}` : pathname
    router.replace(newUrl, { scroll: false })
  }, [searchParams, router, pathname])

  return null
}
