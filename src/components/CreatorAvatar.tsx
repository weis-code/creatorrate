interface CreatorAvatarProps {
  displayName: string
  avatarUrl?: string | null
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const sizeClasses = {
  sm:  'w-10 h-10 text-sm rounded-xl',
  md:  'w-14 h-14 text-xl rounded-xl',
  lg:  'w-20 h-20 text-3xl rounded-2xl',
  xl:  'w-24 h-24 text-4xl rounded-2xl',
}

export default function CreatorAvatar({ displayName, avatarUrl, size = 'md', className = '' }: CreatorAvatarProps) {
  const initials = displayName
    ? displayName.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
    : '?'

  const base = `${sizeClasses[size]} flex-shrink-0 overflow-hidden ${className}`

  if (avatarUrl) {
    return (
      <div className={`${base} bg-gradient-to-br from-indigo-400 to-purple-500`}>
        <img
          src={avatarUrl}
          alt={displayName}
          className="w-full h-full object-cover"
        />
      </div>
    )
  }

  return (
    <div className={`${base} bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center shadow-md`}>
      <span className="text-white font-bold">{initials}</span>
    </div>
  )
}
