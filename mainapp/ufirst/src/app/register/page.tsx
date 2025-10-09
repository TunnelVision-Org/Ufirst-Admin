import Image from 'next/image';
import Link from 'next/link';
import AnimatedCard from '../components/AnimatedCard';

export default function RegisterPage() {
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
        {/* Left: Register Form */}
        <section className="flex-1 p-10 flex flex-col justify-center text-black">
          <div className="mb-8">
            <div className="text-2xl font-bold tracking-tight text-black mb-2 flex items-center gap-2">
              <span>Tunnel Vision Fitness</span>
            </div>
            <div className="text-sm text-black/60">Become the best version of you</div>
          </div>
          <h1 className="text-xl font-semibold mb-6 text-black">Create your account</h1>
          <form className="space-y-5">
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium mb-1 text-black">Full Name</label>
              <input id="fullName" name="fullName" type="text" autoComplete="name" required className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white/60 text-black placeholder-black/40" />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1 text-black">Email</label>
              <input id="email" name="email" type="email" autoComplete="email" required className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white/60 text-black placeholder-black/40" />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-1 text-black">Password</label>
              <input id="password" name="password" type="password" autoComplete="new-password" required className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white/60 text-black placeholder-black/40" />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium mb-1 text-black">Confirm Password</label>
              <input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" required className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white/60 text-black placeholder-black/40" />
            </div>
            <div className="flex items-center text-sm text-black">
              <label className="flex items-center gap-2">
                <input type="checkbox" className="accent-primary" required />
                <span>I agree to the <Link href="#" className="text-black hover:underline font-medium">Terms of Use</Link> and <Link href="#" className="text-black hover:underline font-medium">Privacy Policy</Link></span>
              </label>
            </div>
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
