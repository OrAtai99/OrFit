import Link from "next/link";
import { S } from "@/lib/strings";

export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 text-center">
      <div className="card max-w-sm w-full space-y-4">
        <h1 className="text-3xl font-bold text-primary">404</h1>
        <p className="text-muted">{S.errors.notFound}</p>
        <Link
          href="/"
          className="block w-full min-h-[48px] bg-primary text-white font-semibold rounded-xl flex items-center justify-center"
        >
          {S.nav.home}
        </Link>
      </div>
    </main>
  );
}
