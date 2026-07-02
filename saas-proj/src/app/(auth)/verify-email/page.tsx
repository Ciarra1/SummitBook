import Link from 'next/link';

export default function VerifyEmailPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6 px-4">
      {/* Optional: Add a nice mail icon here */}
      <div className="bg-blue-100 p-4 rounded-full">
        <svg 
          className="w-12 h-12 text-blue-600" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      </div>

      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Check your email</h1>
        <p className="text-gray-600 max-w-md mx-auto">
          We've sent a verification link to your email address. Please click the link to verify your account and continue.
        </p>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg w-full max-w-md text-sm text-gray-600">
        <p><strong>Didn't receive the email?</strong></p>
        <ul className="list-disc text-left pl-5 mt-2 space-y-1">
          <li>Check your spam or junk folder.</li>
          <li>Make sure you entered the correct email address.</li>
        </ul>
      </div>

      <div className="pt-4">
        <Link 
          href="/signin" 
          className="text-blue-600 hover:text-blue-800 font-medium hover:underline"
        >
          &larr; Back to sign in
        </Link>
      </div>
    </div>
  );
}