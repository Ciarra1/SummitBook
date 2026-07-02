// app/signup/page.tsx
import { Suspense } from 'react';
import SignupPage from './SignupPage'; // move the component to a separate file

export default function Page() {
  return (
    <Suspense>
      <SignupPage />
    </Suspense>
  );
}