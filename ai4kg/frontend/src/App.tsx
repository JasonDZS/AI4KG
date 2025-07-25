import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import Layout from '@/components/Layout/Layout'
import LoginPage from '@/pages/LoginPage'
import GraphsPage from '@/pages/GraphsPage'
import GraphViewPage from '@/pages/GraphViewPage'
import TestPage from '@/pages/TestPage'
import KGExamplePage from '@/pages/KGExamplePage'
import KGManagementPage from '@/pages/KGManagementPage'
import ProtectedRoute from '@/components/Auth/ProtectedRoute'

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/test" element={<TestPage />} />
          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<GraphsPage />} />
            <Route path="graphs/:graphId" element={<GraphViewPage />} />
            <Route path="kg-example" element={<KGExamplePage />} />
            <Route path="kg-management" element={<KGManagementPage />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App