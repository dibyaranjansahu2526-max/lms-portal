import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8 lg:py-9">
        <Outlet />
      </main>
      <footer className="border-t border-slate-200 bg-white py-6 dark:border-slate-800 dark:bg-slate-900">
        <p className="text-center text-xs text-slate-400 dark:text-slate-500">
          LMS Portal · Learn something new, teach something valuable.
        </p>
      </footer>
    </div>
  )
}
