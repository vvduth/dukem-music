import { Providers } from "~/components/providers";

export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <Providers>{children}</Providers>;
}