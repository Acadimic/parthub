import { useState } from 'react';
import NextLink from 'next/link';
import { Button, TextInput } from '@components/core';

export const SignUp = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSignUp = async () => {
    console.log('Sign up', name, email, password);
  };

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold text-color-primary">Sign Up</h1>
      <p className="text-color-secondary">Create your ParthHub account</p>
      <TextInput label="Name" value={name} onChange={(e) => setName(e.target.value)} />
      <TextInput label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <TextInput label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      <Button onClick={handleSignUp} isFull>
        Sign Up
      </Button>
      <p className="text-center text-color-secondary">
        Already have an account?{' '}
        <NextLink href="/sign-in" className="text-blue-primary">
          Sign In
        </NextLink>
      </p>
    </div>
  );
};
