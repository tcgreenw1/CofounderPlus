import React from 'react';
import { useParams } from 'react-router-dom';
import { InviteAcceptance } from './InviteAcceptance';

export function InviteAcceptanceWrapper() {
  const { token } = useParams<{ token: string }>();

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Invalid Invitation Link
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            This invitation link is missing required information.
          </p>
        </div>
      </div>
    );
  }

  return <InviteAcceptance token={token} />;
}
