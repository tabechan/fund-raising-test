"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BlueprintBackground } from "@/components/Navigation";

export default function RegisterPage() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        try {
            const res = await fetch("/api/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, password }),
            });

            if (res.ok) {
                router.push("/login?registered=true");
            } else {
                const data = await res.json();
                setError(data.error || "登録中にエラーが発生しました");
            }
        } catch (err) {
            setError("通信エラーが発生しました");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-background relative overflow-hidden">
            <BlueprintBackground />

            <div className="max-w-md w-full">
                <div className="text-center mb-10">
                    <div className="blueprint-label mb-2">Join Us</div>
                    <h1 className="text-3xl font-bold tracking-tighter">新規アカウント登録</h1>
                    <p className="text-muted text-xs mt-2">融資支援AIを無料で始めましょう。</p>
                </div>

                <div className="blueprint-card p-8 relative overflow-hidden">
                    <form onSubmit={handleRegister} className="space-y-6">
                        <div>
                            <label className="blueprint-label block mb-2">Display Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                className="w-full bg-accent-surface border border-line rounded-lg py-3 px-4 text-xs focus:outline-none focus:border-ink transition-colors"
                                placeholder="融資太郎"
                            />
                        </div>

                        <div>
                            <label className="blueprint-label block mb-2">Email Address</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                autoComplete="email"
                                required
                                className="w-full bg-accent-surface border border-line rounded-lg py-3 px-4 text-xs focus:outline-none focus:border-ink transition-colors"
                                placeholder="your@email.com"
                            />
                        </div>

                        <div>
                            <label className="blueprint-label block mb-2">Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                autoComplete="new-password"
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
                            disabled={isLoading}
                            className="w-full blueprint-btn-primary py-4 text-sm mt-4 hover:opacity-90 transition-opacity disabled:opacity-50"
                        >
                            {isLoading ? "登録中..." : "アカウントを作成"}
                        </button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-line text-center">
                        <p className="text-[10px] text-muted font-bold">
                            すでにアカウントをお持ちですか？{" "}
                            <button
                                onClick={() => router.push("/login")}
                                className="text-ink hover:underline"
                            >
                                ログインはこちら
                            </button>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
