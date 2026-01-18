import React from 'react'

/**
 * Starburst explosion effect with rays and core
 */
export default function Starburst() {
  return (
    <>
      {/* Outer large rays */}
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={`starburst-large-${i}`}
          className="starburst-ray starburst-large"
          style={{
            '--ray-index': i,
          } as React.CSSProperties & { '--ray-index': number }}
        />
      ))}
      {/* Middle rays offset */}
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={`starburst-medium-${i}`}
          className="starburst-ray starburst-medium"
          style={{
            '--ray-index': i,
          } as React.CSSProperties & { '--ray-index': number }}
        />
      ))}
      {/* Core burst */}
      <div className="starburst-core" />
    </>
  )
}
