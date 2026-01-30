'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Radio, AlertTriangle } from 'lucide-react';

export default function AuthErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#c81f25]">
            <Radio className="h-6 w-6 text-white" />
          </div>
          <span className="text-2xl font-bold text-gray-900">SweetFM</span>
        </div>

        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold">Authentication Error</CardTitle>
            <CardDescription className="mt-2">
              Something went wrong during authentication
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center text-gray-600">
            <p>This could happen if:</p>
            <ul className="mt-2 text-sm text-left list-disc list-inside space-y-1">
              <li>The verification link has expired</li>
              <li>The link has already been used</li>
              <li>There was a network error</li>
            </ul>
          </CardContent>
          <CardFooter className="flex flex-col gap-2">
            <Link href="/login" className="w-full">
              <Button className="w-full bg-[#c81f25] hover:bg-[#a01820]">
                Back to Login
              </Button>
            </Link>
            <Link href="/signup" className="w-full">
              <Button variant="outline" className="w-full">
                Create New Account
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
