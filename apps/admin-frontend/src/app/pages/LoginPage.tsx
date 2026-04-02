/**
 * Login Page - Authentication with Phone/OTP and Biometric
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Switch } from '../components/ui/switch';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../../services/api';
import { Fingerprint, Phone, Lock } from 'lucide-react';
import { toast } from 'sonner';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, biometricLogin } = useAuth();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);



  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || !password) {
      toast.error('Please enter phone and password');
      return;
    }
    setLoading(true);
    try {
      await login(phone, password);
      toast.success('Login successful');
      navigate('/dashboard');
    } catch (error) {
      toast.error('Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleBiometricLogin = async () => {
    setLoading(true);
    try {
      // In production, this would use actual biometric API
      await biometricLogin('U001'); // Demo: auto-login as master admin
      toast.success('Biometric authentication successful');
      navigate('/dashboard');
    } catch (error) {
      toast.error('Biometric authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-border shadow-lg">
        <CardHeader className="space-y-2 text-center">
          <div className="mx-auto w-16 h-16 bg-primary rounded-full flex items-center justify-center mb-2">
            <Lock className="w-8 h-8 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl">MaiHoonNa</CardTitle>
          <CardDescription>Senior Care Operations Portal</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+91-9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="pl-10 bg-input-background"
                  disabled={loading}
                />
              </div>
              <p className="text-xs text-muted-foreground">Demo: +91-9876543210</p>
            </div>

            <div className="space-y-2 mt-4">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 bg-input-background"
                  disabled={loading}
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 mt-6"
              disabled={loading}
            >
              {loading ? 'Logging in...' : 'Login'}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Or</span>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-input-background">
            <div className="flex items-center gap-2">
              <Fingerprint className="w-5 h-5 text-primary" />
              <span className="text-sm">Biometric Login</span>
            </div>
            <Switch
              checked={biometricEnabled}
              onCheckedChange={setBiometricEnabled}
              disabled={loading}
            />
          </div>

          {biometricEnabled && (
            <Button
              type="button"
              variant="outline"
              className="w-full border-primary text-primary hover:bg-primary/10"
              onClick={handleBiometricLogin}
              disabled={loading}
            >
              <Fingerprint className="w-4 h-4 mr-2" />
              Authenticate with Biometric
            </Button>
          )}

          <div className="text-center text-xs text-muted-foreground pt-4 border-t border-border">
            <p>© 2026 MaiHoonNa Senior Care</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
