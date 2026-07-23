import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Html, OrbitControls, Sparkles, Stars } from '@react-three/drei'
import type { Group, Mesh } from 'three'
import * as THREE from 'three'
import type { Skill } from '../roadmap-data'

type SkillUniverseProps = {
  skills: Skill[]
  selectedId: string
  onSelect: (skill: Skill) => void
}

const colors = {
  cyan: '#44e2cd', // Match our authoritative secondary/cyan color scheme!
  lavender: '#c0c1ff', // Match our authoritative primary/lavender color scheme!
  ink: '#051424', // Match our authoritative background!
  muted: '#908fa0', // Match our outline/muted color!
  white: '#d4e4fa', // Match our foreground text color!
}

function Connection({ from, to, complete }: { from: Skill; to: Skill; complete: boolean }) {
  const start = useMemo(() => new THREE.Vector3(...from.position), [from.position])
  const end = useMemo(() => new THREE.Vector3(...to.position), [to.position])
  const midpoint = useMemo(() => start.clone().add(end).multiplyScalar(0.5), [start, end])
  const direction = useMemo(() => end.clone().sub(start), [start, end])
  const length = direction.length()
  const quaternion = useMemo(() => {
    const value = new THREE.Quaternion()
    value.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.clone().normalize())
    return value
  }, [direction])

  return (
    <mesh position={midpoint} quaternion={quaternion}>
      <cylinderGeometry args={[0.018, 0.018, length, 8]} />
      <meshBasicMaterial color={complete ? colors.cyan : colors.muted} transparent opacity={complete ? 0.6 : 0.25} />
    </mesh>
  )
}

function createPlanetTexture(base: string, detail: string, seed: number) {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 256
  const context = canvas.getContext('2d')
  if (!context) return null

  context.fillStyle = base
  context.fillRect(0, 0, canvas.width, canvas.height)
  let random = seed
  const next = () => {
    random = (random * 9301 + 49297) % 233280
    return random / 233280
  }

  for (let y = 0; y < canvas.height; y += 3) {
    const wave = Math.sin(y * 0.075 + seed) * 11
    context.globalAlpha = 0.05 + next() * 0.13
    context.fillStyle = detail
    context.fillRect(0, y + wave, canvas.width, 1 + next() * 4)
  }
  for (let index = 0; index < 85; index += 1) {
    const radius = 2 + next() * 19
    context.globalAlpha = 0.025 + next() * 0.1
    context.beginPath()
    context.arc(next() * canvas.width, next() * canvas.height, radius, 0, Math.PI * 2)
    context.fill()
  }
  context.globalAlpha = 1
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.wrapS = THREE.RepeatWrapping
  texture.anisotropy = 4
  return texture
}

function SkillNode({
  skill,
  selected,
  reducedMotion,
  onSelect,
}: {
  skill: Skill
  selected: boolean
  reducedMotion: boolean
  onSelect: (skill: Skill) => void
}) {
  const group = useRef<Group>(null)
  const core = useRef<Mesh>(null)
  const [hovered, setHovered] = useState(false)
  const isCurrent = skill.status === 'current'
  const isComplete = skill.status === 'completed'
  const isDestination = skill.status === 'destination'
  const planetPalette: Record<string, [string, string]> = {
    fundamentals: ['#12355b', '#c0c1ff'], // Adapting to app palette
    javascript: ['#234f1e', '#44e2cd'],
    apis: ['#3e1f5c', '#c0c1ff'],
    webhooks: ['#5c2c1f', '#44e2cd'],
    agents: ['#1a4d44', '#d4e4fa'],
    rag: ['#4d1a3a', '#c0c1ff'],
    portfolio: ['#2a1f5c', '#44e2cd'],
  }
  const [nodeColor, detailColor] = planetPalette[skill.id] ?? [colors.muted, colors.white]
  const planetTexture = useMemo(
    () => createPlanetTexture(nodeColor, detailColor, skill.id.length * 37),
    [detailColor, nodeColor, skill.id.length],
  )

  useEffect(() => {
    return () => planetTexture?.dispose()
  }, [planetTexture])

  useEffect(() => {
    document.body.style.cursor = hovered ? 'pointer' : 'auto'
    return () => { document.body.style.cursor = 'auto' }
  }, [hovered])

  useFrame((state) => {
    if (!group.current || reducedMotion) return
    if (isCurrent) {
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 2.2) * 0.06
      group.current.scale.setScalar(pulse)
      group.current.rotation.y += 0.006
    } else {
      group.current.rotation.y += isDestination ? 0.002 : 0.001
    }
    if (core.current && hovered) core.current.rotation.y += 0.006
  })

  return (
    <group ref={group} position={skill.position}>
      {(isCurrent || selected) && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.66, 0.025, 12, 64]} />
          <meshBasicMaterial color={isCurrent ? colors.cyan : colors.lavender} transparent opacity={0.75} />
        </mesh>
      )}
      {isCurrent && (
        <pointLight color={colors.cyan} intensity={6} distance={3.5} />
      )}
      <mesh
        ref={core}
        onClick={(event) => { event.stopPropagation(); onSelect(skill) }}
        onPointerEnter={(event) => { event.stopPropagation(); setHovered(true) }}
        onPointerLeave={() => setHovered(false)}
        scale={hovered ? 1.14 : 1}
      >
        <sphereGeometry args={[isCurrent ? 0.46 : isDestination ? 0.5 : 0.37, 48, 32]} />
        <meshStandardMaterial
          map={planetTexture}
          color={nodeColor}
          emissive={nodeColor}
          emissiveIntensity={isCurrent ? 0.34 : selected ? 0.18 : 0.025}
          metalness={0.02}
          roughness={0.82}
          transparent
          opacity={skill.status === 'locked' ? 0.68 : 1}
        />
      </mesh>
      {isDestination && (
        <mesh rotation={[Math.PI * 0.42, 0.2, 0]}>
          <ringGeometry args={[0.62, 0.88, 72]} />
          <meshStandardMaterial color={colors.lavender} side={THREE.DoubleSide} transparent opacity={0.48} roughness={0.75} />
        </mesh>
      )}
      {isCurrent && (
        <mesh scale={1.045}>
          <sphereGeometry args={[0.46, 36, 24]} />
          <meshBasicMaterial color={colors.cyan} transparent opacity={0.08} side={THREE.BackSide} />
        </mesh>
      )}
      {isComplete && (
        <Html center transform distanceFactor={7.5} position={[0, 0, 0.05]}>
          <span className="node-check" aria-hidden="true">✓</span>
        </Html>
      )}
      <Html center transform distanceFactor={6.6} position={[0, -0.76, 0]}>
        <button
          type="button"
          className={`node-label ${selected ? 'is-selected' : ''}`}
          onClick={() => onSelect(skill)}
          aria-label={`${skill.name}, ${skill.status}`}
        >
          {skill.shortName}
        </button>
      </Html>
    </group>
  )
}function CameraRig() {
  const { camera, size } = useThree()
  useEffect(() => {
    const isSmall = size.width < 700
    camera.position.set(0, isSmall ? 1.6 : 0.8, isSmall ? 19.5 : 16.5)
    camera.lookAt(0.05, 0, 0)
  }, [camera, size.width])
  return null
}

function Scene({ skills, selectedId, onSelect, reducedMotion }: SkillUniverseProps & { reducedMotion: boolean }) {
  const controlsRef = useRef<any>(null)

  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.zoomToCursor = true
      controlsRef.current.target.set(0.05, 0, 0)
      controlsRef.current.update()
    }
  }, [])

  return (
    <>
      <color attach="background" args={[colors.ink]} />
      <fog attach="fog" args={[colors.ink, 22, 50]} />
      <CameraRig />
      <ambientLight intensity={0.2} />
      <hemisphereLight args={[colors.lavender, colors.ink, 0.55]} />
      <directionalLight position={[-4, 6, 8]} intensity={3.4} color={colors.white} />
      <pointLight position={[4, -2, 3]} intensity={12} distance={11} color={colors.cyan} />
      <Stars radius={42} depth={26} count={3200} factor={2.3} saturation={0.32} fade speed={reducedMotion ? 0 : 0.12} />
      <Sparkles count={240} scale={[24, 4, 10]} size={1.7} speed={reducedMotion ? 0 : 0.08} color={colors.lavender} opacity={0.3} />
      <Sparkles count={110} scale={[22, 6, 8]} size={0.8} speed={reducedMotion ? 0 : 0.04} color={colors.white} opacity={0.42} />
      {skills.slice(0, -1).map((skill, index) => (
        <Connection
          key={`${skill.id}-${skills[index + 1].id}`}
          from={skill}
          to={skills[index + 1]}
          complete={index < 2}
        />
      ))}
      {skills.map((skill) => (
        <SkillNode
          key={skill.id}
          skill={skill}
          selected={skill.id === selectedId}
          reducedMotion={reducedMotion}
          onSelect={onSelect}
        />
      ))}
      <OrbitControls
        ref={controlsRef}
        zoomToCursor={true}
        enablePan={true}
        enableRotate={true}
        screenSpacePanning={true}
        panSpeed={1.4}
        rotateSpeed={0.8}
        enableDamping
        dampingFactor={0.08}
        minDistance={2}
        maxDistance={35}
        minPolarAngle={0.05}
        maxPolarAngle={Math.PI - 0.05}
      />
    </>
  )
}

export function SkillUniverse3D(props: SkillUniverseProps) {
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReducedMotion(query.matches)
    update()
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])

  return (
    <div className="universe-canvas relative w-full h-full min-h-[360px] lg:min-h-[420px] flex-1 flex flex-col" aria-label="Interactive learning path visualization">
      <Canvas dpr={[1, 1.5]} gl={{ antialias: true, alpha: true }} camera={{ fov: 42 }} style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
        <Scene {...props} reducedMotion={reducedMotion} />
      </Canvas>
      <div className="canvas-hint" aria-hidden="true">Drag to explore · select a skill</div>
    </div>
  )
}
