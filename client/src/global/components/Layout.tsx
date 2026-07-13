import Footer from './Footer'
import { Outlet } from 'react-router-dom'
import Header from './Header'

const Layout = () => {
  return (
    <div className="flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1">
        <Outlet /> 
      </main>
      <Footer />
    </div>
  )
}

export default Layout