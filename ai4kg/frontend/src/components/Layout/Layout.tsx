import { Outlet } from 'react-router-dom'
import Header from './Header'
import Sidebar from './Sidebar'
import Footer from './Footer'

const Layout = () => {
  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <Header />
      <div className="flex flex-1 min-h-0">
        <Sidebar />
        <main className="flex-1 overflow-hidden">
          <Outlet />
        </main>
      </div>
      <Footer />
    </div>
  )
}

export default Layout