//@ts-nocheck
"use client"

import Image from "next/image"
import { useEffect, useState } from 'react'
import { Mail } from "./components/mail"

export default function MailPage() {
  const [layout, setLayout] = useState<number[] | undefined>(undefined)
  const [collapsed, setCollapsed] = useState<boolean>(false)

  useEffect(() => {
    const layoutCookie = document.cookie
      .split('; ')
      .find(row => row.startsWith('react-resizable-panels:layout:mail'))
    
    const collapsedCookie = document.cookie
      .split('; ')
      .find(row => row.startsWith('react-resizable-panels:collapsed'))

    if (layoutCookie) {
      setLayout(JSON.parse(layoutCookie.split('=')[1]))
    }

    if (collapsedCookie) {
      setCollapsed(JSON.parse(collapsedCookie.split('=')[1]))
    }
  }, [])

  return (
    <>
      <div className="md:hidden">
        <Image
          src="/examples/mail-dark.png"
          width={1280}
          height={727}
          alt="Mail"
          className="hidden dark:block"
        />
        <Image
          src="/examples/mail-light.png"
          width={1280}
          height={727}
          alt="Mail"
          className="block dark:hidden"
        />
      </div>
      <div className="hidden flex-col md:flex">
        <Mail
          defaultLayout={layout}
          defaultCollapsed={collapsed}
          navCollapsedSize={4}
        />
      </div>
    </>
  )
}