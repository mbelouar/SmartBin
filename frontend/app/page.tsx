import Link from "next/link"
import { Button } from "@/components/ui/button"
import { SmartBinLogo } from "@/components/smartbin-logo"

export default function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-emerald-900">
      <div className="text-center max-w-2xl px-4">
        <div className="mb-8">
          <div className="mb-6 flex justify-center">
            <SmartBinLogo size="lg" />
          </div>
          <h1 className="text-5xl font-bold text-white mb-4">
            Welcome to SmartBin
          </h1>
          <p className="text-xl text-gray-300 mb-8">
            Smart Waste Management System - Earn rewards for responsible waste disposal
          </p>
        </div>
        
        <div className="flex gap-4 justify-center">
          <Link href="/sign-in">
            <Button size="lg" className="bg-primary hover:bg-primary/90">
              Sign In
            </Button>
          </Link>
          <Link href="/sign-up">
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
              Sign Up
            </Button>
          </Link>
        </div>
        
        <p className="text-gray-400 mt-8 text-sm">
          Access your dashboard to find bins, track points, and make a difference
        </p>
      </div>
    </div>
  )
}
