import React from 'react'
import Footer from './Footer'

export default function UserLayout({ children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <main style={{ flex: 1 }}>
        {children}
      </main>
      <Footer />
    </div>
  )
}
