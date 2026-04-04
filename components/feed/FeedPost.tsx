import Image from 'next/image'
import {
  IconBookmark,
  IconBubble,
  IconHeart,
  IconSend,
} from './FeedIcons'

export type FeedPostData = {
  id: string
  username: string
  imageSrc: string
  imageAlt: string
  likes: number
  caption: string
  /** If set, show the top row (avatar + username + time). */
  timeAgo?: string
  avatarSrc?: string
}

export function FeedPost({
  username,
  imageSrc,
  imageAlt,
  likes,
  caption,
  timeAgo,
  avatarSrc,
}: FeedPostData) {
  const showHeader = Boolean(timeAgo && avatarSrc)

  return (
    <article className="feed-post">
      {showHeader ? (
        <div className="feed-post-header">
          <div className="feed-post-user">
            <Image
              src={avatarSrc!}
              alt=""
              width={32}
              height={32}
              className="feed-avatar"
            />
            <span className="feed-username">{username}</span>
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
          priority={!showHeader}
        />
      </div>

      <div className="feed-post-body">
        <div className="feed-actions">
          <div className="feed-actions-left">
            <button type="button" className="feed-icon-btn" aria-label="Like">
              <IconHeart className="feed-icon-stroke" />
            </button>
            <button type="button" className="feed-icon-btn" aria-label="Comment">
              <IconBubble className="feed-icon-stroke" />
            </button>
            <button type="button" className="feed-icon-btn" aria-label="Share">
              <IconSend className="feed-icon-stroke" />
            </button>
          </div>
          <button type="button" className="feed-icon-btn" aria-label="Save">
            <IconBookmark className="feed-icon-stroke" />
          </button>
        </div>

        <p className="feed-likes">{likes.toLocaleString()} likes</p>

        <p className="feed-caption">
          <span className="feed-username feed-caption-user">{username}</span>{' '}
          <span className="feed-caption-text">{caption}</span>
        </p>
      </div>
    </article>
  )
}
