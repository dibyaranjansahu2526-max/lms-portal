import { Link } from 'react-router-dom'
import { BookOpenCheck, GraduationCap, ShieldCheck, Sparkles, UsersRound } from 'lucide-react'

const features = [
  { icon: BookOpenCheck, text: 'Structured courses with lessons and quizzes' },
  { icon: Sparkles, text: 'Progress tracking and completion certificates' },
  { icon: UsersRound, text: 'Dedicated spaces for students, teachers and admins' },
  { icon: ShieldCheck, text: 'Secure JWT authentication and role-based access' },
]

export default function AuthShell({ children }) {
  return (
    <div className="min-h-screen bg-slate-50 lg:grid lg:grid-cols-[1.05fr_1fr]">
      <aside className="relative hidden overflow-hidden bg-slate-950 px-10 py-12 lg:flex lg:flex-col lg:justify-between xl:px-16">
        <div className="pointer-events-none absolute -right-28 -top-28 h-96 w-96 rounded-full bg-indigo-600/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-20 h-80 w-80 rounded-full bg-violet-600/20 blur-3xl" />
        <div className="relative">
          <Link to="/" className="inline-flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-white ring-1 ring-white/20">
              <GraduationCap className="h-6 w-6" />
            </span>
            <span className="text-xl font-extrabold tracking-tight text-white">
              LMS<span className="text-indigo-300">Portal</span>
            </span>
          </Link>

          <div className="mt-20 max-w-lg">
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold text-indigo-200">
              <Sparkles className="h-3.5 w-3.5" />
              A better way to learn
            </p>
            <h2 className="text-4xl font-extrabold leading-[1.15] tracking-tight text-white xl:text-5xl">
              Your learning journey starts here.
            </h2>
            <p className="mt-5 text-base leading-relaxed text-slate-400">
              Learn at your own pace, track every milestone, and earn a certificate when you finish.
            </p>
          </div>

          <ul className="mt-12 space-y-4">
            {features.map((feature) => {
              const Icon = feature.icon
              return (
                <li key={feature.text} className="flex items-center gap-3 text-sm text-slate-300">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/5 text-indigo-300 ring-1 ring-white/10">
                    <Icon className="h-4 w-4" />
                  </span>
                  {feature.text}
                </li>
              )
            })}
          </ul>
        </div>

        <p className="relative text-xs text-slate-500">© {new Date().getFullYear()} LMS Portal. All rights reserved.</p>
      </aside>

      <main className="flex min-h-screen items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <Link to="/" className="mb-8 flex items-center justify-center gap-2.5 lg:hidden">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-md">
              <GraduationCap className="h-5 w-5" />
            </span>
            <span className="text-xl font-extrabold tracking-tight text-slate-900">
              LMS<span className="text-indigo-600">Portal</span>
            </span>
          </Link>
          {children}
        </div>
      </main>
    </div>
  )
}
