"use client";

import { useActionState } from "react";
import { loginAction } from "@/server/actions/admin";
import { btn, field } from "../ui";

export function LoginForm({ email, password }: { email: string; password: string }) {
  const [state, action, pending] = useActionState(loginAction, {});
  return (
    <form action={action} className="mt-6 space-y-3">
      <label className="block"><span className="mb-1.5 block text-sm font-medium">Email</span><input name="email" type="email" required autoComplete="username" defaultValue={email} className={field} /></label>
      <label className="block"><span className="mb-1.5 block text-sm font-medium">Password</span><input name="password" type="password" required autoComplete="current-password" defaultValue={password} className={field} /></label>
      {state?.error && <p role="alert" className="pop bg-sale/10 px-3 py-2 text-sm font-medium text-sale">{state.error}</p>}
      <button disabled={pending} className={btn.primary + " w-full"}>{pending ? <span className="size-5 animate-spin rounded-full border-2 border-white/40 border-t-white" /> : "Sign in"}</button>
    </form>
  );
}
