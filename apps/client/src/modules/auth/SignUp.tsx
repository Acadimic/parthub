import { useState } from 'react';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';

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
      <TextField label="Name" value={name} onChange={(e) => setName(e.target.value)} fullWidth />
      <TextField label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} fullWidth />
      <TextField label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} fullWidth />
      <Button variant="contained" onClick={handleSignUp} fullWidth>
        Sign Up
      </Button>
      <p className="text-center text-color-secondary">
        Already have an account? <a href="/sign-in" className="text-blue-primary">Sign In</a>
      </p>
    </div>
  );
};
