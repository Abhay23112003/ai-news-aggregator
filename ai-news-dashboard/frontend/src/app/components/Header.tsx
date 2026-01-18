'use client'
import {
  Bell,
  Search,
  Newspaper
} from 'lucide-react';

export default function Header() {
    return (
        <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4 flex items-center justify-between gap-3 sm:gap-4">
                <div className="flex items-center gap-2 shrink-0">
                    <div className="w-8 h-8 sm:w-9 sm:h-9 lg:w-10 lg:h-10 bg-emerald-500 rounded-lg flex items-center justify-center">
                        <Newspaper className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                    </div>
                    <h1 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 whitespace-nowrap">NewsFlow</h1>
                </div>

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

                <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 shrink-0">
                    <Bell className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600 cursor-pointer hover:text-emerald-500 transition" />
                    <div className="w-8 h-8 sm:w-9 sm:h-9 lg:w-10 lg:h-10 bg-gray-300 rounded-full cursor-pointer hover:bg-gray-400 transition" />
                </div>
            </div>
        </header>
    )
}