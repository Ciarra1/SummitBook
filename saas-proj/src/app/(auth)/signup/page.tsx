// app/signup/page.tsx
import { Suspense } from 'react';
import SignupPage from './singuppage'; // move the component to a separate file

export default function Page() {
  return (
    <Suspense>
      <SignupPage />
    </Suspense>
  );
}