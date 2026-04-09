'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import {
  type FormEvent,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react'
import { updateProfileAction } from '@/app/actions/profile'

type ProfileEditButtonProps = {
  initialDisplayName: string
  initialUsername: string
  initialBio: string
  initialAvatarUrl: string | null
}

export function ProfileEditButton({
  initialDisplayName,
  initialUsername,
  initialBio,
  initialAvatarUrl,
}: ProfileEditButtonProps) {
  const router = useRouter()
  const dialogTitleId = useId()
  const fileInputId = useId()
  const openBtnRef = useRef<HTMLButtonElement>(null)
  const [open, setOpen] = useState(false)
  const [displayName, setDisplayName] = useState(initialDisplayName)
  const [username, setUsername] = useState(initialUsername)
  const [bio, setBio] = useState(initialBio)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [removeAvatar, setRemoveAvatar] = useState(false)
  const [previewObjectUrl, setPreviewObjectUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  function clearLocalPhoto() {
    setPreviewObjectUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return null
    })
    setPendingFile(null)
  }

  function setLocalPhoto(file: File) {
    setPreviewObjectUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return URL.createObjectURL(file)
    })
    setPendingFile(file)
  }

  function openModal() {
    setDisplayName(initialDisplayName)
    setUsername(initialUsername)
    setBio(initialBio)
    clearLocalPhoto()
    setRemoveAvatar(false)
    setError(null)
    setOpen(true)
  }

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  const close = useCallback(() => {
    setOpen(false)
    setError(null)
    setPreviewObjectUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return null
    })
    setPendingFile(null)
    setRemoveAvatar(false)
    openBtnRef.current?.focus()
  }, [])

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') close()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, close])

  const previewSrc = removeAvatar ? null : previewObjectUrl ?? initialAvatarUrl
  const previewLetter =
    displayName.charAt(0).toUpperCase() ||
    initialDisplayName.charAt(0).toUpperCase() ||
    '?'
  const showRemovePhoto =
    Boolean(initialAvatarUrl || pendingFile) && !removeAvatar

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const fd = new FormData()
    fd.append('display_name', displayName)
    fd.append('username', username)
    fd.append('bio', bio)
    fd.append('remove_avatar', removeAvatar ? '1' : '0')
    if (pendingFile) {
      fd.append('avatar', pendingFile)
    }

    const result = await updateProfileAction(fd)
    setLoading(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    router.refresh()
    close()
  }

  return (
    <>
      <button
        ref={openBtnRef}
        type="button"
        className="profile-edit-btn"
        onClick={openModal}
      >
        Edit profile
      </button>

      {open ? (
        <div
          className="profile-edit-overlay"
          role="presentation"
          onMouseDown={(ev) => {
            if (ev.target === ev.currentTarget) close()
          }}
        >
          <div
            className="profile-edit-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby={dialogTitleId}
          >
            <div className="profile-edit-panel-head">
              <h2 id={dialogTitleId} className="profile-edit-panel-title">
                Edit profile
              </h2>
              <button
                type="button"
                className="profile-edit-panel-close"
                onClick={close}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <form className="profile-edit-form" onSubmit={handleSubmit} noValidate>
              <p className="profile-edit-label">Profile photo</p>
              <div className="profile-edit-avatar-row">
                <div
                  className={
                    previewSrc
                      ? 'profile-edit-avatar-preview profile-edit-avatar-preview--image'
                      : 'profile-edit-avatar-preview'
                  }
                >
                  {previewSrc ? (
                    <Image
                      src={previewSrc}
                      alt=""
                      width={72}
                      height={72}
                      className="profile-edit-avatar-img"
                      unoptimized={Boolean(previewObjectUrl)}
                    />
                  ) : (
                    <span className="profile-edit-avatar-letter" aria-hidden>
                      {previewLetter}
                    </span>
                  )}
                </div>
                <div className="profile-edit-avatar-actions">
                  <input
                    id={fileInputId}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="sr-only"
                    onChange={(e) => {
                      const f = e.target.files?.[0]
                      if (f) {
                        setLocalPhoto(f)
                        setRemoveAvatar(false)
                      }
                      e.target.value = ''
                    }}
                  />
                  <button
                    type="button"
                    className="profile-edit-choose-photo"
                    onClick={() =>
                      document.getElementById(fileInputId)?.click()
                    }
                  >
                    Choose photo
                  </button>
                  {showRemovePhoto ? (
                    <button
                      type="button"
                      className="profile-edit-remove-photo"
                      onClick={() => {
                        clearLocalPhoto()
                        setRemoveAvatar(true)
                      }}
                    >
                      Remove photo
                    </button>
                  ) : null}
                </div>
              </div>
              <p className="profile-edit-hint profile-edit-hint--tight">
                JPEG, PNG, WebP, or GIF · max 2 MB
              </p>

              <label className="profile-edit-label" htmlFor="profile-display-name">
                Display name
              </label>
              <input
                id="profile-display-name"
                name="display_name"
                type="text"
                autoComplete="name"
                className="profile-edit-input"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                maxLength={80}
                required
              />

              <label className="profile-edit-label" htmlFor="profile-username">
                Username
              </label>
              <input
                id="profile-username"
                name="username"
                type="text"
                autoComplete="username"
                className="profile-edit-input"
                value={username}
                onChange={(e) =>
                  setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))
                }
                maxLength={30}
                required
              />
              <p className="profile-edit-hint">3–30 characters: letters, numbers, underscores.</p>

              <label className="profile-edit-label" htmlFor="profile-bio">
                Bio
              </label>
              <textarea
                id="profile-bio"
                name="bio"
                className="profile-edit-textarea"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                maxLength={280}
                rows={4}
                placeholder="A short line about you"
              />
              <p className="profile-edit-counter">{bio.length}/280</p>

              {error ? <p className="profile-edit-error">{error}</p> : null}

              <div className="profile-edit-actions">
                <button
                  type="button"
                  className="profile-edit-cancel"
                  onClick={close}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button type="submit" className="profile-edit-save" disabled={loading}>
                  {loading ? 'Saving…' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  )
}
