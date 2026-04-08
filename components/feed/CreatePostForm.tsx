'use client'

import {
  type ChangeEvent,
  type FormEvent,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react'

export function CreatePostForm() {
  const galleryInputId = useId()
  const fallbackCameraInputId = useId()
  const galleryRef = useRef<HTMLInputElement>(null)
  const fallbackCameraRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [caption, setCaption] = useState('')
  const [hint, setHint] = useState<string | null>(null)
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
        setPreviewUrl((prev) => {
          revokePreview(prev)
          return URL.createObjectURL(blob)
        })
        setHint(null)
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
    setPreviewUrl((prev) => {
      revokePreview(prev)
      return URL.createObjectURL(file)
    })
    setHint(null)
    setCameraError(null)
  }

  function clearPhoto() {
    setPreviewUrl((prev) => {
      revokePreview(prev)
      return null
    })
    setCaption('')
    setHint(null)
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!previewUrl) return
    setHint(
      'Preview only—connect your backend to upload posts. Your caption is not saved.',
    )
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

        {hint ? <p className="create-post-hint">{hint}</p> : null}

        <button
          type="submit"
          className="create-post-submit"
          disabled={!previewUrl}
        >
          Share post
        </button>
      </form>
    </>
  )
}
