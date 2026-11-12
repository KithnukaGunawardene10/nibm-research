
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);

    try {
      const res = await fetch('/api/auth/logout', {
        method: 'POST'
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(result.error || 'Unable to log out.');
      }

      router.replace('/');
      router.refresh();
    } catch (error) {
      alert(error.message);
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      className="px-5 py-2.5 rounded-lg border border-white/15 text-gray-300 hover:bg-white/10 hover:text-white text-sm font-medium transition disabled:opacity-50"
    >
      {loading ? 'Logging out...' : 'Logout'}
    </button>
  );
}
