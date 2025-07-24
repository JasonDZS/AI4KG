import { Link, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { Home, Network, GitBranch, Settings } from 'lucide-react'

const Sidebar = () => {
  const location = useLocation()

  const navigation = [
    { name: '图谱列表', href: '/', icon: Home },
    { name: '图谱视图', href: '/graphs', icon: Network },
    { name: 'KG示例', href: '/kg-example', icon: GitBranch },
    { name: 'KG管理', href: '/kg-management', icon: Settings },
  ]

  return (
    <aside className="w-64 border-r bg-muted/30 min-h-[calc(100vh-4rem)]">
      <nav className="space-y-1 p-4">
        {navigation.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname === item.href
          
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                'flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{item.name}</span>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}

export default Sidebar