'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState, useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import AnimatedCard from '../components/AnimatedCard';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Auto-dismiss error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleSubmit = async(e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    
    console.log('🔐 [Login] Attempting login with email:', email);
    
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password })
      });

      console.log('📡 [Login] Response status:', response.status);
      console.log('📡 [Login] Response ok:', response.ok);

      const data = await response.json();
      console.log('📦 [Login] Response data:', data);

      if (response.ok && data.user){
        console.log('✅ [Login] Login successful, storing user data');
        
        // Store user info in localStorage
        localStorage.setItem('user', JSON.stringify({
          id: data.user.id,
          firstName: data.user.firstName,
          lastName: data.user.lastName,
          email: data.user.email,
        }));
        
        console.log('✅ [Login] Redirecting to dashboard');
        router.push('/dashboard');
      } else {
        console.error('❌ [Login] Login failed:', data.error || data.errors || 'Unknown error');
        setError(data.error || 'Invalid email or password. Please try again.');
      }
    } catch (error) {
      console.error('❌ [Login] Exception occurred:', error);
      setError('An error occurred during login. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <main className="min-h-screen flex items-center justify-center bg-[#F7F5ED] font-sans relative overflow-hidden">
      {/* Full screen background image */}
      <div className="absolute inset-0 w-full h-full">
        <Image
          src="/background.jpg" // Place your background image in /public
          alt="Gym background"
          fill
          className="object-cover w-full h-full"
          priority
        />
        {/* Light cream overlay */}
        <div className="absolute inset-0 bg-[#F7F5ED]/40"></div>
      </div>
      <AnimatedCard>
        {/* Left: Login Form */}
  <section className="flex-1 p-10 flex flex-col  justify-center text-black">
          <div className="mb-8">
            <div className="text-2xl font-bold tracking-tight text-black mb-2 flex items-center gap-2">
             
              <span>UFirst</span>
            </div>
            <div className="text-sm text-black/60">Become the best version of you</div>
          </div>
          <h1 className="text-xl font-semibold mb-6 text-black">Log in</h1>
          
          {/* Error Notification */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
              <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-red-600">Invalid email or password. Please try again.</p>
              </div>
              <button 
                onClick={() => setError(null)} 
                className="text-red-400 hover:text-red-600 transition-colors"
                aria-label="Dismiss error"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1 text-black">Email</label>
              <input id="email" name="email" type="email" autoComplete="email" required onChange={e => setEmail(e.target.value)}className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white/60 text-black placeholder-black/40" />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-1 text-black">Password</label>
              <input id="password" name="password" type="password" autoComplete="current-password" required onChange={e => setPassword(e.target.value) }className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white/60 text-black placeholder-black/40" />
            </div>
            <div className="flex items-center justify-between text-sm text-black">
              <label className="flex items-center gap-2">
                <input type="checkbox" className="accent-primary" />
                Keep me logged in
              </label>
              <Link href="/forgot-password"  className="text-primary hover:underline text-black/70">Forgot password?</Link>
            </div>
            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full py-2 bg-black text-white rounded-lg font-semibold hover:bg-primary transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Logging in...' : 'Log in'}
            </button>
          </form>
          <div className="mt-6 text-center text-sm text-black/70">
            Don't have an account? <Link href="/register" className="text-primary hover:underline text-black">Register</Link>
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
              src="/ufirst.svg" // Replace with your gym image in /public
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