'use client';

import {
    Bell,
    Search,
    Newspaper
} from 'lucide-react';

import { signIn, signOut, useSession } from 'next-auth/react';
import { useState, useRef, useEffect } from 'react';

function getInitials(name?: string | null, email?: string | null) {
    if (name) {
        const parts = name.trim().split(' ');
        if (parts.length >= 2) {
            return (parts[0][0] + parts[1][0]).toUpperCase();
        }
        return parts[0][0].toUpperCase();
    }
    if (email) {
        return email[0].toUpperCase();
    }

    return '?';
}


export default function Header() {
    const { data: session } = useSession();
    const [open, setOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const [imageError, setImageError] = useState(false);


    // Close dropdown on outside click
    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4 flex items-center justify-between gap-3 sm:gap-4">

                {/* Logo */}
                <div className="flex items-center gap-2 shrink-0">
                    <div className="w-8 h-8 sm:w-9 sm:h-9 lg:w-10 lg:h-10 bg-emerald-500 rounded-lg flex items-center justify-center">
                        <Newspaper className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                    </div>
                    <h1 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 whitespace-nowrap">
                        NewsFlow
                    </h1>
                </div>

                {/* Search */}
                <div className="flex-1 max-w-xl min-w-0 mx-2 sm:mx-4 lg:mx-8">
                    <div className="relative">
                        <Search className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                        <input
                            type="text"
                            placeholder="Search news..."
                            className="w-full text-black pl-8 sm:pl-10 pr-3 sm:pr-4 py-1.5 sm:py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs sm:text-sm"
                        />
                    </div>
                </div>

                {/* Right */}
                <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 shrink-0 relative">
                    <Bell className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600 cursor-pointer hover:text-emerald-500 transition" />

                    {session ? (
                        <div ref={menuRef} className="relative">
                            <button
                                onClick={() => setOpen(!open)}
                                className="w-8 h-8 sm:w-9 sm:h-9 lg:w-10 lg:h-10 rounded-full cursor-pointer flex items-center justify-center bg-emerald-500 text-white text-sm font-semibold overflow-hidden"
                            >
                                {session.user?.image && !imageError ? (
                                    <img
                                        src={session.user.image}
                                        alt=""
                                        className="w-full h-full object-cover"
                                        onError={() => setImageError(true)}
                                    />
                                ) : (
                                    getInitials(session.user?.name, session.user?.email)
                                )}
                            </button>



                            {open && (
                                <div className="absolute right-0 mt-2 w-40 bg-white border rounded-lg shadow-lg">
                                    <div className="px-3 py-2 text-xs text-gray-500 truncate">
                                        {session.user?.email}
                                    </div>
                                    <button
                                        onClick={() => signOut()}
                                        className="w-full text-left text-emerald-500 px-3 py-2 text-sm hover:text-emerald-600 hover:cursor-pointer"
                                    >
                                        Logout
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <button
                            onClick={() => signIn('google')}
                            className="text-xs sm:text-sm px-3 py-1.5 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition hover:cursor-pointer"
                        >
                            Sign in
                        </button>
                    )}
                </div>

            </div>
        </header>
    );
}
