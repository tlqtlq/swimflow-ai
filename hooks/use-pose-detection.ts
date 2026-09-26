'use client'

import { useEffect, useRef, useState } from 'react'
import * as poseDetection from '@tensorflow-models/pose-detection'
import * as tf from '@tensorflow/tfjs-core'
import '@tensorflow/tfjs-backend-webgl'
import { useRngStore } from '@/store/use-rng-store'

type PhaseState = 'start' | 'top' | 'bottom'

type KeypointLike = {
  name?: string
  x: number
  y: number
  score?: number
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

const calculateAngle = (a: KeypointLike, b: KeypointLike, c: KeypointLike) => {
  const ab = { x: a.x - b.x, y: a.y - b.y }
  const cb = { x: c.x - b.x, y: c.y - b.y }

  const dot = ab.x * cb.x + ab.y * cb.y
  const abLen = Math.hypot(ab.x, ab.y)
  const cbLen = Math.hypot(cb.x, cb.y)

  if (!abLen || !cbLen) return 180

  const cosine = clamp(dot / (abLen * cbLen), -1, 1)
  return (Math.acos(cosine) * 180) / Math.PI
}

const getKeypoint = (keypoints: KeypointLike[], name: string) => keypoints.find((point) => point?.name === name)

export function usePoseDetection() {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const detectorRef = useRef<poseDetection.PoseDetector | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const lastPhaseRef = useRef<PhaseState>('start')
  const lastRepTimestampRef = useRef(0)
  const registerRep = useRngStore((state) => state.registerRep)

  const [status, setStatus] = useState('Position Body in Frame')
  const [feedback, setFeedback] = useState('Align your shoulders and hips in the frame.')
  const [isLoading, setIsLoading] = useState(true)
  const [isCameraReady, setIsCameraReady] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const initialize = async () => {
      try {
        setIsLoading(true)
        setError(null)

        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error('This browser does not support webcam access.')
        }

        await tf.ready()
        await tf.setBackend('webgl')

        const detector = await poseDetection.createDetector(poseDetection.SupportedModels.MoveNet, {
          modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
          enableTracking: true,
        })

        if (cancelled) {
          detector.dispose?.()
          return
        }

        detectorRef.current = detector

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'user',
            width: { ideal: 640 },
            height: { ideal: 480 },
          },
          audio: false,
        })

        if (!videoRef.current) {
          stream.getTracks().forEach((track) => track.stop())
          return
        }

        videoRef.current.srcObject = stream
        await videoRef.current.play()

        setIsCameraReady(true)
        setStatus('Position Body in Frame')
        setFeedback('Align your shoulders and hips in the frame.')

        const tick = async () => {
          if (cancelled) return

          const video = videoRef.current
          const detector = detectorRef.current
          const canvas = canvasRef.current

          if (video && canvas && detector && video.readyState >= 2) {
            try {
              const poses = await detector.estimatePoses(video, {
                flipHorizontal: true,
                maxPoses: 1,
              })

              drawPoseOverlay(canvas, video, poses[0] as any)

              if (poses[0]) {
                updateWorkoutState(poses[0].keypoints as KeypointLike[]) 
              } else {
                setStatus('Position Body in Frame')
                setFeedback('No full-body pose detected. Step into frame.')
              }
            } catch (poseError) {
              console.error('Pose detection failed:', poseError)
            }
          }

          animationFrameRef.current = requestAnimationFrame(tick)
        }

        animationFrameRef.current = requestAnimationFrame(tick)
      } catch (cameraError) {
        const message = cameraError instanceof Error ? cameraError.message : 'Unable to access the webcam.'
        setError(message)
        setStatus('Camera Unavailable')
        setFeedback('Grant camera permission to begin your workout.')
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    void initialize()

    return () => {
      cancelled = true
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }

      detectorRef.current?.dispose?.()

      const stream = videoRef.current?.srcObject as MediaStream | null
      stream?.getTracks().forEach((track) => track.stop())
    }
  }, [])

  const updateWorkoutState = (keypoints: KeypointLike[]) => {
    const leftShoulder = getKeypoint(keypoints, 'left_shoulder')
    const rightShoulder = getKeypoint(keypoints, 'right_shoulder')
    const leftElbow = getKeypoint(keypoints, 'left_elbow')
    const rightElbow = getKeypoint(keypoints, 'right_elbow')
    const leftWrist = getKeypoint(keypoints, 'left_wrist')
    const rightWrist = getKeypoint(keypoints, 'right_wrist')
    const leftHip = getKeypoint(keypoints, 'left_hip')
    const rightHip = getKeypoint(keypoints, 'right_hip')

    if (!leftShoulder || !rightShoulder || !leftHip || !rightHip) {
      setStatus('Position Body in Frame')
      setFeedback('Keep your torso visible for accurate rep detection.')
      return
    }

    const centerX = ((leftShoulder.x + rightShoulder.x + leftHip.x + rightHip.x) / 4)
    const width = canvasRef.current?.width || 640
    const bodyCentered = Math.abs(centerX - width / 2) < 140

    if (!bodyCentered) {
      setStatus('Position Body in Frame')
      setFeedback('Center yourself in frame for consistent tracking.')
      return
    }

    const leftAngle = leftShoulder && leftElbow && leftWrist ? calculateAngle(leftShoulder, leftElbow, leftWrist) : 180
    const rightAngle = rightShoulder && rightElbow && rightWrist ? calculateAngle(rightShoulder, rightElbow, rightWrist) : 180
    const minAngle = Math.min(leftAngle, rightAngle)

    const torsoSlope = Math.abs((leftShoulder.y + rightShoulder.y) / 2 - (leftHip.y + rightHip.y) / 2)
    if (torsoSlope > 70) {
      setStatus('Ready')
      setFeedback('Keep hips straight and spine aligned.')
      return
    }

    if (minAngle > 150) {
      lastPhaseRef.current = 'top'
      setStatus('Ready')
      setFeedback('Ready. Lower chest toward the floor.')
      return
    }

    if (minAngle <= 95) {
      lastPhaseRef.current = 'bottom'
      setStatus('Push Up')
      setFeedback('Drive through the floor and extend your arms.')
      return
    }

    if (lastPhaseRef.current === 'bottom' && minAngle > 140) {
      const now = Date.now()
      if (now - lastRepTimestampRef.current > 900) {
        lastRepTimestampRef.current = now
        registerRep()
      }
      lastPhaseRef.current = 'top'
      setStatus('Ready')
      setFeedback('Rep complete. Set for the next push-up.')
      return
    }

    setStatus('Lower Chest')
    setFeedback('Go lower—about 90° elbow bend required.')
  }

  return {
    videoRef,
    canvasRef,
    status,
    feedback,
    isLoading,
    isCameraReady,
    error,
  }
}

function drawPoseOverlay(canvas: HTMLCanvasElement, video: HTMLVideoElement, pose: any) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const width = video.videoWidth || 640
  const height = video.videoHeight || 480

  canvas.width = width
  canvas.height = height
  ctx.clearRect(0, 0, width, height)

  if (!pose) return

  const keypoints = pose.keypoints || []
  const adjacentPairs = poseDetection.util.getAdjacentPairs(poseDetection.SupportedModels.MoveNet)

  for (const [aIndex, bIndex] of adjacentPairs) {
    const a = keypoints[aIndex]
    const b = keypoints[bIndex]

    if (!a || !b) continue
    if (a.score && a.score < 0.2) continue
    if (b.score && b.score < 0.2) continue

    ctx.beginPath()
    ctx.moveTo(a.x, a.y)
    ctx.lineTo(b.x, b.y)
    ctx.strokeStyle = 'rgba(34, 211, 238, 0.9)'
    ctx.lineWidth = 3
    ctx.stroke()
  }

  for (const point of keypoints) {
    if (!point || point.score === undefined || point.score < 0.15) continue

    ctx.beginPath()
    ctx.fillStyle = '#A7F3D0'
    ctx.arc(point.x, point.y, 5, 0, Math.PI * 2)
    ctx.fill()
  }
}
