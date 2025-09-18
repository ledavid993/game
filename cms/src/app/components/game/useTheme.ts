'use client'

import { useEffect, useState } from 'react'
import { Theme } from '@/app/lib/themes/types'
import { christmasTheme } from '@/app/lib/themes/christmas'
import { halloweenTheme } from '@/app/lib/themes/halloween'

const themes: Record<string, Theme> = {
  christmas: christmasTheme,
  halloween: halloweenTheme,
}

export function useTheme() {
  const [currentTheme, setCurrentTheme] = useState<Theme>(christmasTheme)
  const [themeName, setThemeName] = useState<string>('christmas')

  useEffect(() => {
    // Load theme from localStorage
    const savedTheme = localStorage.getItem('murder-game-theme')
    if (savedTheme && themes[savedTheme]) {
      setThemeName(savedTheme)
      setCurrentTheme(themes[savedTheme])
    }
  }, [])

  useEffect(() => {
    // Apply theme to document
    applyTheme(currentTheme)
  }, [currentTheme])

  const applyTheme = (theme: Theme) => {
    const root = document.documentElement

    // Apply CSS custom properties
    Object.entries(theme.colors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, value)
    })

    // Apply theme class to body
    document.body.className = document.body.className.replace(/theme-\w+/g, '')
    document.body.classList.add(`theme-${theme.name}`)

    // Set data attribute for theme-specific styling
    document.body.setAttribute('data-theme', theme.name)

    // Apply font family
    root.style.setProperty('--font-family', theme.typography.fontFamily)

    // Apply background effects
    if (theme.decorations.backgroundEffect === 'none') {
      removeBackgroundEffect()
    } else {
      createBackgroundEffect(theme)
    }
  }

  const createBackgroundEffect = (theme: Theme) => {
    // Remove existing effect
    removeBackgroundEffect()

    if (theme.decorations.backgroundEffect === 'snowfall' && theme.decorations.particles) {
      createSnowfall(theme.decorations.particles)
    } else if (theme.decorations.backgroundEffect === 'bats' && theme.decorations.particles) {
      createBats(theme.decorations.particles)
    }
  }

  const createSnowfall = (particles: NonNullable<Theme['decorations']['particles']>) => {
    const container = document.createElement('div')
    container.className = 'snowfall'
    container.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      pointer-events: none;
      z-index: 1;
    `

    for (let i = 0; i < particles.count; i++) {
      const snowflake = document.createElement('div')
      snowflake.className = 'snowflake'
      snowflake.textContent = particles.symbol
      snowflake.style.cssText = `
        position: absolute;
        color: rgba(255, 255, 255, 0.8);
        user-select: none;
        pointer-events: none;
        font-size: ${particles.size};
        left: ${Math.random() * 100}%;
        animation: snowfall ${particles.duration}s linear infinite;
        animation-delay: ${Math.random() * particles.duration}s;
      `
      container.appendChild(snowflake)
    }

    document.body.appendChild(container)
  }

  const createBats = (particles: NonNullable<Theme['decorations']['particles']>) => {
    const container = document.createElement('div')
    container.className = 'bats-effect'
    container.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      pointer-events: none;
      z-index: 1;
    `

    for (let i = 0; i < particles.count; i++) {
      const bat = document.createElement('div')
      bat.className = 'bat'
      bat.textContent = particles.symbol
      bat.style.cssText = `
        position: absolute;
        color: rgba(139, 69, 19, 0.8);
        user-select: none;
        pointer-events: none;
        font-size: ${particles.size};
        left: ${Math.random() * 100}%;
        top: ${Math.random() * 100}%;
        animation: batFly ${particles.duration}s ease-in-out infinite;
        animation-delay: ${Math.random() * particles.duration}s;
      `
      container.appendChild(bat)
    }

    document.body.appendChild(container)

    // Add bat animation keyframes if not already present
    if (!document.getElementById('bat-animations')) {
      const style = document.createElement('style')
      style.id = 'bat-animations'
      style.textContent = `
        @keyframes batFly {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          25% { transform: translate(20px, -30px) rotate(5deg); }
          50% { transform: translate(-20px, -60px) rotate(-5deg); }
          75% { transform: translate(30px, -30px) rotate(3deg); }
        }
      `
      document.head.appendChild(style)
    }
  }

  const removeBackgroundEffect = () => {
    const existingEffects = document.querySelectorAll('.snowfall, .bats-effect')
    existingEffects.forEach((effect) => effect.remove())
  }

  const changeTheme = (newThemeName: string) => {
    if (themes[newThemeName]) {
      setThemeName(newThemeName)
      setCurrentTheme(themes[newThemeName])
      localStorage.setItem('murder-game-theme', newThemeName)
    }
  }

  const getAvailableThemes = () => {
    return Object.keys(themes).map((key) => ({
      name: key,
      displayName: themes[key].displayName,
      theme: themes[key],
    }))
  }

  const playSound = (soundType: keyof NonNullable<Theme['decorations']['sounds']>) => {
    const soundPath = currentTheme.decorations.sounds?.[soundType]
    if (soundPath) {
      const audio = new Audio(soundPath)
      audio.volume = 0.3 // Keep sounds subtle
      audio.play().catch(console.error)
    }
  }

  return {
    currentTheme,
    themeName,
    changeTheme,
    getAvailableThemes,
    playSound,
  }
}
