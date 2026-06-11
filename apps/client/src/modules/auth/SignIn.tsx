import { useState } from 'react';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';

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
      <TextField
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        fullWidth
      />
      <TextField
        label="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        fullWidth
      />
      <Button variant="contained" onClick={handleSignIn} fullWidth>
        Sign In
      </Button>
      <div className="flex flex-col gap-2">
        <Button variant="outlined" fullWidth>
          Sign in with Google
        </Button>
        <Button variant="outlined" fullWidth>
          Sign in with Microsoft
        </Button>
      </div>
      <p className="text-center text-color-secondary">
        Don&apos;t have an account? <a href="/sign-up" className="text-blue-primary">Sign Up</a>
      </p>
    </div>
  );
};
