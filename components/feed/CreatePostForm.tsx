'use client'

import { createPostAction } from '@/app/actions/posts'
import { useRouter } from 'next/navigation'
import {
  type ChangeEvent,
  type FormEvent,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react'

const MAX_BYTES = 10 * 1024 * 1024
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])

export function CreatePostForm() {
  const router = useRouter()
  const galleryInputId = useId()
  const fallbackCameraInputId = useId()
  const galleryRef = useRef<HTMLInputElement>(null)
  const fallbackCameraRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [caption, setCaption] = useState('')
  const [postError, setPostError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [cameraOpen, setCameraOpen] = useState(false)
  const [cameraReady, setCameraReady] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)

  const revokePreview = useCallback((url: string | null) => {
    if (url) URL.revokeObjectURL(url)
  }, [])

  useEffect(() => {
    return () => revokePreview(previewUrl)
  }, [previewUrl, revokePreview])

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
  }, [])

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setCameraReady(false)
    setCameraOpen(false)
  }, [])

  useEffect(() => {
    if (!cameraOpen) return
    const video = videoRef.current
    const stream = streamRef.current
    if (!video || !stream) return
    video.srcObject = stream
    const play = video.play()
    if (play !== undefined) {
      void play.catch(() => {})
    }
    return () => {
      video.srcObject = null
    }
  }, [cameraOpen])

  useEffect(() => {
    if (!cameraOpen) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') stopCamera()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [cameraOpen, stopCamera])

  const openLiveCamera = useCallback(async () => {
    setCameraError(null)
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      fallbackCameraRef.current?.click()
      return
    }
    try {
      setCameraReady(false)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      })
      streamRef.current = stream
      setCameraOpen(true)
    } catch {
      setCameraError(
        'Camera unavailable. Allow access in your browser settings, or use Photo library.',
      )
      fallbackCameraRef.current?.click()
    }
  }, [])

  const captureFromCamera = useCallback(() => {
    const video = videoRef.current
    if (!video || video.readyState < 2) {
      setCameraError('Wait for the preview to start, then try again.')
      return
    }
    const w = video.videoWidth
    const h = video.videoHeight
    if (w === 0 || h === 0) return

    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.drawImage(video, 0, 0)

    canvas.toBlob(
      (blob) => {
        if (!blob) return
        stopCamera()
        const file = new File([blob], 'photo.jpg', { type: 'image/jpeg' })
        setUploadFile(file)
        setPreviewUrl((prev) => {
          revokePreview(prev)
          return URL.createObjectURL(blob)
        })
        setPostError(null)
        setCameraError(null)
      },
      'image/jpeg',
      0.92,
    )
  }, [revokePreview, stopCamera])

  function onPickFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !file.type.startsWith('image/')) return
    if (!ALLOWED_TYPES.has(file.type)) {
      setPostError('Use a JPEG, PNG, WebP, or GIF image.')
      return
    }
    if (file.size > MAX_BYTES) {
      setPostError('Image must be 10 MB or smaller.')
      return
    }
    setUploadFile(file)
    setPreviewUrl((prev) => {
      revokePreview(prev)
      return URL.createObjectURL(file)
    })
    setPostError(null)
    setCameraError(null)
  }

  function clearPhoto() {
    setUploadFile(null)
    setPreviewUrl((prev) => {
      revokePreview(prev)
      return null
    })
    setCaption('')
    setPostError(null)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!uploadFile || submitting) return
    setSubmitting(true)
    setPostError(null)
    try {
      const fd = new FormData()
      fd.append('image', uploadFile)
      fd.append('caption', caption)
      const result = await createPostAction(fd)
      if (result.ok) {
        router.push('/home')
        router.refresh()
        return
      }
      setPostError(result.error)
    } catch {
      setPostError('Could not publish your post. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      {cameraOpen ? (
        <div
          className="create-post-camera-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Take a photo"
        >
          <video
            ref={videoRef}
            className="create-post-camera-video"
            autoPlay
            playsInline
            muted
            onLoadedData={() => setCameraReady(true)}
          />
          <div className="create-post-camera-toolbar">
            <button
              type="button"
              className="create-post-camera-btn create-post-camera-btn-secondary"
              onClick={stopCamera}
            >
              Cancel
            </button>
            <button
              type="button"
              className="create-post-camera-btn create-post-camera-btn-primary"
              onClick={captureFromCamera}
              disabled={!cameraReady}
            >
              Capture
            </button>
          </div>
        </div>
      ) : null}

      <form className="create-post-form" onSubmit={handleSubmit}>
        <div className="create-post-preview-wrap">
          {previewUrl ? (
            <div className="create-post-preview-frame">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt="Selected for your post"
                className="create-post-preview-img"
              />
              <button
                type="button"
                className="create-post-clear-photo"
                onClick={clearPhoto}
              >
                Remove
              </button>
            </div>
          ) : (
            <div className="create-post-placeholder">
              <p className="create-post-placeholder-title">Add a photo</p>
              <p className="create-post-placeholder-sub">
                Choose from your device or use your camera to take a new picture.
              </p>
            </div>
          )}
        </div>

        <div className="create-post-actions-row">
          <input
            ref={galleryRef}
            id={galleryInputId}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={onPickFile}
          />
          <button
            type="button"
            className="create-post-source-btn"
            onClick={() => galleryRef.current?.click()}
          >
            Photo library
          </button>
          <input
            ref={fallbackCameraRef}
            id={fallbackCameraInputId}
            type="file"
            accept="image/*"
            capture="environment"
            className="sr-only"
            onChange={onPickFile}
          />
          <button
            type="button"
            className="create-post-source-btn"
            onClick={() => void openLiveCamera()}
          >
            Take photo
          </button>
        </div>

        {cameraError ? <p className="create-post-camera-error">{cameraError}</p> : null}

        <label className="create-post-caption-label" htmlFor="create-caption">
          Caption
        </label>
        <textarea
          id="create-caption"
          name="caption"
          className="create-post-caption"
          rows={3}
          maxLength={2200}
          placeholder="Write a caption…"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
        />

        {postError ? <p className="create-post-submit-error">{postError}</p> : null}

        <button
          type="submit"
          className="create-post-submit"
          disabled={!uploadFile || submitting}
        >
          {submitting ? 'Posting…' : 'Share post'}
        </button>
      </form>
    </>
  )
}
