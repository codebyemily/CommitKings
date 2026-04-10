import Image from 'next/image'
import { FeedPostEngagement } from './FeedPostEngagement'

export type FeedPostData = {
  id: string
  username: string
  displayName: string
  imageSrc: string
  imageAlt: string
  likes: number
  commentsCount: number
  likedByViewer: boolean
  savedByViewer: boolean
  caption: string
  /** If set, show the top row (avatar + username + time). */
  timeAgo?: string
  avatarSrc?: string
  /** Prefer LCP for the first image in the feed. */
  imagePriority?: boolean
}

export function FeedPost({
  id,
  username,
  displayName,
  imageSrc,
  imageAlt,
  likes,
  commentsCount,
  likedByViewer,
  savedByViewer,
  caption,
  timeAgo,
  avatarSrc,
  imagePriority,
}: FeedPostData) {
  const showHeader = Boolean(timeAgo)
  const authorLabel = displayName || username

  return (
    <article className="feed-post">
      {showHeader ? (
        <div className="feed-post-header">
          <div className="feed-post-user">
            {avatarSrc ? (
              <Image
                src={avatarSrc}
                alt=""
                width={32}
                height={32}
                className="feed-avatar"
              />
            ) : (
              <span className="feed-avatar feed-avatar-fallback" aria-hidden>
                {authorLabel.charAt(0).toUpperCase()}
              </span>
            )}
            <span className="feed-username">{authorLabel}</span>
          </div>
          <span className="feed-time">{timeAgo}</span>
        </div>
      ) : null}

      <div className="feed-post-media">
        <Image
          src={imageSrc}
          alt={imageAlt}
          fill
          sizes="100vw"
          className="feed-post-image"
          priority={imagePriority ?? false}
        />
      </div>

      <FeedPostEngagement
        postId={id}
        captionAuthorLabel={authorLabel}
        shareAuthorUsername={username}
        caption={caption}
        imageSrc={imageSrc}
        initialLikesCount={likes}
        initialLiked={likedByViewer}
        initialSaved={savedByViewer}
        initialCommentsCount={commentsCount}
      />
    </article>
  )
}
