"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BlueprintBackground } from "@/components/Navigation";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const router = useRouter();

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (email === "demo@example.com" && password === "demo_password_1234") {
            router.push("/");
        } else {
            setError("メールアドレスまたはパスワードが正しくありません");
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-background relative overflow-hidden">
            <BlueprintBackground />

            <div className="max-w-md w-full">
                <div className="text-center mb-10">
                    <div className="blueprint-label mb-2">Welcome Back</div>
                    <h1 className="text-3xl font-bold tracking-tighter">融資支援AI（仮）</h1>
                    <p className="text-muted text-xs mt-2">融資・補助金の準備をAIでスマートに。</p>
                </div>

                <div className="blueprint-card p-8 relative overflow-hidden">
                    {/* Abstract geometric decoration */}
                    <div className="absolute top-0 right-0 -trink-y-1/2 translate-x-1/2 w-40 h-40 rounded-full border border-line opacity-10 pointer-events-none" />

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div>
                            <label className="blueprint-label block mb-2">Email Address</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                autoComplete="email"
                                required
                                className="w-full bg-accent-surface border border-line rounded-lg py-3 px-4 text-xs focus:outline-none focus:border-ink transition-colors"
                                placeholder="demo@example.com"
                            />
                        </div>

                        <div>
                            <label className="blueprint-label block mb-2">Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                autoComplete="current-password"
                                required
                                className="w-full bg-accent-surface border border-line rounded-lg py-3 px-4 text-xs focus:outline-none focus:border-ink transition-colors"
                                placeholder="••••••••"
                            />
                        </div>

                        {error && (
                            <div className="text-[10px] text-ink font-bold bg-accent-surface border border-line p-3 rounded-lg flex items-center gap-2">
                                <span className="w-4 h-4 rounded-full border border-ink flex items-center justify-center text-[8px]">!</span>
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            className="w-full blueprint-btn-primary py-4 text-sm mt-4 hover:opacity-90 transition-opacity"
                        >
                            ログイン
                        </button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-line text-center">
                        <p className="text-[10px] text-muted uppercase tracking-widest">
                            Dedicated to Successful Fundraising
                        </p>
                    </div>
                </div>

                <div className="mt-8 text-center">
                    <div className="blueprint-label !text-muted">Demo Credentials:</div>
                    <div className="text-[10px] mt-1">
                        Email: <code className="font-mono">demo@example.com</code><br />
                        Pass: <code className="font-mono">demo_password_1234</code>
                    </div>
                </div>
            </div>
        </div>
    );
}
