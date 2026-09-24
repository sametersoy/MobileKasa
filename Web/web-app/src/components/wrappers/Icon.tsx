import { Icon as IconifyIcon, type IconProps } from '@iconify/react'

const Icon = ({ icon, style, ...props }: { icon: string } & IconProps) => {
  return <IconifyIcon icon={`tabler:${icon}`} style={{ display: 'inline', verticalAlign: 'middle', ...style }} {...props} />
}
export default Icon
