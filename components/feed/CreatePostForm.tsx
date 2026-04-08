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
  const cameraInputId = useId()
  const galleryRef = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)

  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [caption, setCaption] = useState('')
  const [hint, setHint] = useState<string | null>(null)

  const revokePreview = useCallback((url: string | null) => {
    if (url) URL.revokeObjectURL(url)
  }, [])

  useEffect(() => {
    return () => revokePreview(previewUrl)
  }, [previewUrl, revokePreview])

  function onPickFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !file.type.startsWith('image/')) return
    setPreviewUrl((prev) => {
      revokePreview(prev)
      return URL.createObjectURL(file)
    })
    setHint(null)
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
    <form className="create-post-form" onSubmit={handleSubmit}>
      <div className="create-post-preview-wrap">
        {previewUrl ? (
          <div className="create-post-preview-frame">
            {/* Blob preview from device; next/image does not handle object URLs cleanly here. */}
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
              Choose from your device or take a picture with your camera.
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
          ref={cameraRef}
          id={cameraInputId}
          type="file"
          accept="image/*"
          capture="environment"
          className="sr-only"
          onChange={onPickFile}
        />
        <button
          type="button"
          className="create-post-source-btn"
          onClick={() => cameraRef.current?.click()}
        >
          Take photo
        </button>
      </div>

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
  )
}
