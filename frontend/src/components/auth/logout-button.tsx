"use client";

import { authClient } from "~/lib/auth-client";
import { Button } from "~/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function LogoutButton() {

  const router = useRouter();
  const handleSignOut = async () => {
    await authClient.signOut();
    router.refresh();
  }
  return (
    <div className="flex flex-col gap-2">
    <Button 
      className="w-full" 
      onClick={handleSignOut}
    >
      Logout
    </Button>
    <Button className="w-full">
      <Link href="/customer-portal">Customer Portal</Link>
    </Button>
    </div>
  );
}
