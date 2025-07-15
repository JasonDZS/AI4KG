import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/Button'
import { LogOut, User } from 'lucide-react'

const Header = () => {
  const { user, logout } = useAuth()

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-bold">AI4KG</h1>
          <span className="text-sm text-muted-foreground">知识图谱可视化平台</span>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <User className="h-4 w-4" />
            <span className="text-sm">{user?.username}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={logout}
            className="text-muted-foreground"
          >
            <LogOut className="h-4 w-4 mr-2" />
            退出
          </Button>
        </div>
      </div>
    </header>
  )
}

export default Header