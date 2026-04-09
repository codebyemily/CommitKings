/* next/image blocks SVG in-app unless images.dangerouslyAllowSVG; favicon uses raw URL and still works. */
/* eslint-disable @next/next/no-img-element */

const LOGO_SRC = '/1058031.svg'

type SiteLogoProps = {
  variant: 'header' | 'auth'
  className?: string
  priority?: boolean
}

export function SiteLogo({ variant, className, priority }: SiteLogoProps) {
  const isHeader = variant === 'header'
  return (
    <img
      src={LOGO_SRC}
      alt="Forum Neighborhood"
      width={300}
      height={300}
      decoding="async"
      fetchPriority={(priority ?? isHeader) ? 'high' : 'auto'}
      className={[
        'site-logo',
        isHeader ? 'site-logo--header' : 'site-logo--auth',
        className ?? '',
      ]
        .filter(Boolean)
        .join(' ')}
    />
  )
}
