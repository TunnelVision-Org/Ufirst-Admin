import Image from 'next/image';
import Link from 'next/link';
import AnimatedCard from '../../components/AnimatedCard';

export default function ResetLinkSentPage() {
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
        {/* Left: Confirmation Message */}
        <section className="flex-1 p-10 flex flex-col justify-center text-black">
          <div className="mb-8">
            <div className="text-2xl font-bold tracking-tight text-black mb-2 flex items-center gap-2">
              <span>Tunnel Vision Fitness</span>
            </div>
            <div className="text-sm text-black/60">Become the best version of you</div>
          </div>
          
          {/* Success Icon */}
          <div className="mb-6 flex justify-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <svg 
                className="w-8 h-8 text-green-600" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M5 13l4 4L19 7" 
                />
              </svg>
            </div>
          </div>

          <h1 className="text-xl font-semibold mb-2 text-black text-center">Check Your Email</h1>
          <p className="text-sm text-black/70 mb-6 text-center">
            We've sent a password reset link to your email address. 
            Please check your inbox and follow the instructions to reset your password.
          </p>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-black/70">
              <strong className="text-black">Didn't receive the email?</strong>
              <br />
              Check your spam folder or try requesting another reset link.
            </p>
          </div>
          
          <div className="space-y-3">
            <Link
              href="/login"
              className="w-full py-2 bg-black text-white rounded-lg font-semibold hover:bg-primary transition block text-center"
            >
              Return to Login
            </Link>
            
            <Link
              href="/forgot-password"
              className="w-full py-2 border border-black/20 text-black rounded-lg font-semibold hover:bg-black/5 transition block text-center"
            >
              Resend Reset Link
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
