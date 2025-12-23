"use client";

import { authClient } from "~/lib/auth-client";
import { Button } from "~/components/ui/button";

export function LogoutButton() {
  return (
    <Button 
      className="w-full" 
      onClick={() => authClient.signOut()}
    >
      Logout
    </Button>
  );
}
