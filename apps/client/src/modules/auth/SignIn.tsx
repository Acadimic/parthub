import { useState } from 'react';
import NextLink from 'next/link';
import { Button, TextInput } from '@components/core';

export const SignIn = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSignIn = async () => {
    // TODO: Implement sign in
    console.log('Sign in', email, password);
  };

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold text-color-primary">Sign In</h1>
      <p className="text-color-secondary">Welcome to ParthHub</p>
      <TextInput label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <TextInput label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      <Button onClick={handleSignIn} isFull>
        Sign In
      </Button>
      <div className="flex flex-col gap-2">
        <Button isSecondary isFull>
          Sign in with Google
        </Button>
        <Button isSecondary isFull>
          Sign in with Microsoft
        </Button>
      </div>
      <p className="text-center text-color-secondary">
        Don&apos;t have an account?{' '}
        <NextLink href="/sign-up" className="text-blue-primary">
          Sign Up
        </NextLink>
      </p>
    </div>
  );
};
