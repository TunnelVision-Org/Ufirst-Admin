'use client'

import Image from 'next/image';
import Link from 'next/link';
import AnimatedCard from '../components/AnimatedCard';
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, X } from 'lucide-react';

export default function RegisterPage() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordsDoNotMatch, setPasswordsDoNotMatch] = useState(false)
  const [notification, setNotification] = useState<{message: string; type: 'error'} | null>(null);
  const router = useRouter();

  const handleSubmit = async(e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Validation to ensure that the passwords match
    if (password !== confirmPassword) {
      setPasswordsDoNotMatch(true);
      return;
    }
    
    setPasswordsDoNotMatch(false);

    console.log('📝 [Register] Attempting signup with email:', email);

    try {
      const response = await fetch('/api/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ firstName, lastName, email, password} )
      });

      console.log('📡 [Register] Response status:', response.status);
      console.log('📡 [Register] Response ok:', response.ok);

      const data = await response.json();
      console.log('📦 [Register] Response data:', data);

      if (response.ok && data.success){
        console.log('✅ [Register] Signup successful, storing user data');
        
        // Store user info in localStorage
        if (data.user) {
          localStorage.setItem('user', JSON.stringify({
            id: data.user.id,
            firstName: data.user.firstName,
            lastName: data.user.lastName,
            email: data.user.email,
          }));
        }
        
        console.log('✅ [Register] Redirecting to dashboard');
        router.push('/dashboard')
      } else {
        console.error('❌ [Register] Signup failed:', data.error || data.errors || 'Unknown error');
        setNotification({ message: data.error || 'Please check your information and try again.', type: 'error' });
        setTimeout(() => setNotification(null), 4000);
      }
    } catch (error) {
      console.error('❌ [Register] Exception occurred:', error);
      setNotification({ message: 'An error occurred during signup. Please try again.', type: 'error' });
      setTimeout(() => setNotification(null), 4000);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#F7F5ED] font-sans relative overflow-hidden">
      {/* Notification Toast */}
      {notification && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2 fade-in duration-300">
          <div className="flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border bg-red-50 border-red-200 text-red-800">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <p className="font-medium text-sm">{notification.message}</p>
            <button 
              onClick={() => setNotification(null)}
              className="ml-2 hover:opacity-70 transition-opacity"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
      
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
        {/* Left: Register Form */}
        <section className="flex-1 p-10 flex flex-col justify-center text-black">
          <div className="mb-8">
            <div className="text-2xl font-bold tracking-tight text-black mb-2 flex items-center gap-2">
              <span>Tunnel Vision Fitness</span>
            </div>
            <div className="text-sm text-black/60">Become the best version of you</div>
          </div>
          <h1 className="text-xl font-semibold mb-6 text-black">Create your account</h1>
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium mb-1 text-black">First Name</label>
                <input id="firstName" name="firstName" type="text" autoComplete="given-name" required onChange={e => setFirstName(e.target.value)} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white/60 text-black placeholder-black/40" />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium mb-1 text-black">Last Name</label>
                <input id="lastName" name="lastName" type="text" autoComplete="family-name" required onChange={e => setLastName(e.target.value)} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white/60 text-black placeholder-black/40" />
              </div>
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1 text-black">Email</label>
              <input id="email" name="email" type="email" autoComplete="email" required onChange={e => setEmail(e.target.value)} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white/60 text-black placeholder-black/40" />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-1 text-black">Password</label>
              <input id="password" name="password" type="password" autoComplete="new-password" required onChange={e => setPassword(e.target.value)} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white/60 text-black placeholder-black/40" />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium mb-1 text-black">Confirm Password</label>
              <input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" required onChange={e => setConfirmPassword(e.target.value)} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white/60 text-black placeholder-black/40" />
            </div>
            <div className="flex items-center text-sm text-black">
              <label className="flex items-center gap-2">
                <input type="checkbox" className="accent-primary" required />
                <span>I agree to the <Link href="#" className="text-black hover:underline font-medium">Terms of Use</Link> and <Link href="#" className="text-black hover:underline font-medium">Privacy Policy</Link></span>
              </label>
            </div>
            
            {passwordsDoNotMatch && (
              <div style={{ color: 'red', fontSize: '0.9em', marginTop: '4px' }}>
                Passwords do not match.
              </div>
            )}

            <button type="submit" className="w-full py-2 bg-black text-white rounded-lg font-semibold hover:bg-primary transition">Create Account</button>
          </form>
          <div className="mt-6 text-center text-sm text-black/70">
            Already have an account? <Link href="/login" className="text-primary hover:underline text-black">Log in</Link>
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
