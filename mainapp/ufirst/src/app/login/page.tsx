'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import AnimatedCard from '../components/AnimatedCard';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleSubmit = async(e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
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
        alert(`Login failed: ${data.error || 'Invalid credentials. Please check your email and password.'}`);
      }
    } catch (error) {
      console.error('❌ [Login] Exception occurred:', error);
      alert('An error occurred during login. Please check the console for details.');
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
             
              <span>Tunnel Vision Fitness</span>
            </div>
            <div className="text-sm text-black/60">Become the best version of you</div>
          </div>
          <h1 className="text-xl font-semibold mb-6 text-black">Log in</h1>
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
            <button type="submit" className="w-full py-2 bg-black text-white rounded-lg font-semibold hover:bg-primary transition">Log in</button>
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