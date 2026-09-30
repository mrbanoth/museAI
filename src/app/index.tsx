/**
 * Root Index Route ('/')
 *
 * Directs incoming users to the authentication and sign-in screen.
 */

import React from 'react';
import SignInScreen from '@/screens/SignInScreen';

export default function Index() {
  return <SignInScreen />;
}

