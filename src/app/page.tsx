import { Observatory } from '@/components/observatory/Observatory'
import { SceneWrapper } from '@/components/three/SceneWrapper'
import { ThresholdPrompt } from '@/components/ui/ThresholdPrompt'
import { DIMENSIONS } from '@/lib/constants'

export default function Home() {
  // Dimensions after the observatory hub (skip first item)
  const portalDimensions = DIMENSIONS.slice(1)

  return (
    <>
      {/* Fixed particle canvas — rendered behind all content */}
      <SceneWrapper />

      {/* Scrollable content layer */}
      <main className="relative z-10">
        {/* Hub / entry point */}
        <Observatory />

        {/* Dimension sections */}
        {portalDimensions.map((dim) => (
          <section
            key={dim.id}
            data-theme={dim.id}
            className="relative"
            style={{ background: 'var(--dim-bg)' }}
          >
            <ThresholdPrompt
              label={dim.label}
              heading={dim.thresholdText}
              description={dim.description}
              dimensionId={dim.id}
            />
          </section>
        ))}
      </main>
    </>
  )
}
