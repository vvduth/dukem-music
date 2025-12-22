import { Providers } from "~/components/providers";
import "~/styles/globals.css";
export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
        <body className="flex min-h-svh flex-col">
            <Providers>{children}</Providers>
        </body>
    </html>
  );
}   
  