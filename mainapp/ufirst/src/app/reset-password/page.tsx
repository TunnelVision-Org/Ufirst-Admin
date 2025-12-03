'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import AnimatedCard from '../components/AnimatedCard';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Validate password length
    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    // Here you would normally send the new password to your API
    // For now, we'll just navigate to the login page
    router.push('/login');
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#F7F5ED] font-sans relative overflow-hidden">
      {/* Full screen background image */}
      <div className="absolute inset-0 w-full h-full">
        <Image
          src="/background.jpg"
          alt="Gym background"
          fill
          className="object-cover w-full h-full"
          priority
        />
        {/* Light cream overlay */}
        <div className="absolute inset-0 bg-[#F7F5ED]/40"></div>
      </div>
      <AnimatedCard>
        {/* Left: Reset Password Form */}
        <section className="flex-1 p-10 flex flex-col justify-center text-black">
          <div className="mb-8">
            <div className="text-2xl font-bold tracking-tight text-black mb-2 flex items-center gap-2">
              <span>UFirst</span>
            </div>
            <div className="text-sm text-black/60">Become the best version of you</div>
          </div>
          
          <h1 className="text-xl font-semibold mb-2 text-black">Reset Your Password</h1>
          <p className="text-sm text-black/60 mb-6">
            Enter your email and create a new password for your account.
          </p>
          
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1 text-black">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white/60 text-black placeholder-black/40"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-1 text-black">
                New Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white/60 text-black placeholder-black/40"
                placeholder="Enter new password"
              />
            </div>

            <div>
              <label htmlFor="confirm-password" className="block text-sm font-medium mb-1 text-black">
                Confirm New Password
              </label>
              <input
                id="confirm-password"
                name="confirm-password"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white/60 text-black placeholder-black/40"
                placeholder="Confirm new password"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-black/70">
                <strong className="text-black">Password requirements:</strong>
                <br />
                • At least 8 characters long
                <br />
                • Mix of letters, numbers, and symbols recommended
              </p>
            </div>
            
            <button
              type="submit"
              className="w-full py-2 bg-black text-white rounded-lg font-semibold hover:bg-primary transition"
            >
              Reset Password
            </button>
          </form>
          
          <div className="mt-6 text-center">
            <Link
              href="/login"
              className="text-sm text-black/70 hover:text-black flex items-center justify-center gap-2"
            >
              <span>←</span>
              <span>Back to Login</span>
            </Link>
          </div>
          
          <div className="mt-8 flex justify-center gap-6 text-xs text-black/50">
            <Link href="#" className="hover:underline text-black/70">Terms of Use</Link>
            <Link href="#" className="hover:underline text-black/70">Privacy Policy</Link>
          </div>
        </section>
        
        {/* Right: Image */}
        <section className="hidden md:block flex-1 relative bg-[#3C4526]">
          <div className="absolute inset-0 flex items-center justify-center">
            <Image
              src="/ufirst.svg"
              alt="Fitness"
              width={400}
              height={400}
              className="object-contain rounded-2xl"
              priority
            />
          </div>
        </section>
      </AnimatedCard>
    </main>
  );
}
