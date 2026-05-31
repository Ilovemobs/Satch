"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";

export function Navbar() {
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-xl font-bold tracking-tight text-amber-500">
          Satch
        </Link>

        <div className="hidden items-center gap-6 sm:flex">
          <Link href="/explore" className="text-sm text-zinc-400 hover:text-zinc-100 transition-colors">
            Explore
          </Link>
          {session ? (
            <>
              <Link href="/draw" className="text-sm text-zinc-400 hover:text-zinc-100 transition-colors">
                Create
              </Link>
              <Link href="/wallet" className="text-sm text-zinc-400 hover:text-zinc-100 transition-colors">
                Wallet
              </Link>
              <Link
                href={`/profile/${session.user.id}`}
                className="text-sm text-zinc-400 hover:text-zinc-100 transition-colors"
              >
                {session.user.username}
              </Link>
              <button
                onClick={() => signOut()}
                className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-400 hover:border-zinc-500 hover:text-zinc-100 transition-colors"
              >
                Logout
              </button>
            </>
          ) : (
            <Link
              href="/auth/login"
              className="rounded-lg bg-amber-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-amber-500 transition-colors"
            >
              Sign In
            </Link>
          )}
        </div>

        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="sm:hidden text-zinc-400"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {menuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {menuOpen && (
        <div className="border-t border-zinc-800 px-4 py-3 sm:hidden">
          <div className="flex flex-col gap-3">
            <Link href="/explore" className="text-sm text-zinc-400">Explore</Link>
            {session ? (
              <>
                <Link href="/draw" className="text-sm text-zinc-400">Create</Link>
                <Link href="/wallet" className="text-sm text-zinc-400">Wallet</Link>
                <Link href={`/profile/${session.user.id}`} className="text-sm text-zinc-400">Profile</Link>
                <button onClick={() => signOut()} className="text-left text-sm text-red-400">Logout</button>
              </>
            ) : (
              <Link href="/auth/login" className="text-sm text-amber-500">Sign In</Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
