import { useState } from "react";
import { API_ENDPOINTS } from "../config/api";

interface LoginProps {
    onLogin: (token: string) => void;
}

const Login = ({ onLogin }: LoginProps) => {

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        setError("");
        setLoading(true);

        try {
            const response = await fetch(
                API_ENDPOINTS.AUTH_LOGIN,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        email,
                        password
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                setError(data.message || "Login failed");
                return;
            }

            // Save JWT
            localStorage.setItem(
                "token",
                data.token
            );

            // Save user information
            localStorage.setItem(
                "user",
                JSON.stringify(data.user)
            );

            onLogin(data.token);

        } catch (error) {
            setError("Unable to connect to server");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-shell">
                <section className="login-brand">
                    <div className="brand-mark">M</div>
                    <p className="eyebrow">BUSINESS MANAGEMENT</p>
                    <h1>Run your business with clarity.</h1>
                    <p>Manage customers, products, stock and sales in one focused workspace.</p>
                    <div className="brand-points">
                        <span>Customer management</span>
                        <span>Inventory visibility</span>
                        <span>Sales tracking</span>
                    </div>
                </section>

                <form className="login-form" onSubmit={handleLogin}>
                    <div className="login-heading">
                        <p className="eyebrow">WELCOME BACK</p>
                        <h2>Sign in to Mini ERP</h2>
                        <p>Enter your credentials to continue.</p>
                    </div>

                {error && (
                    <p className="error">
                        {error}
                    </p>
                )}

                    <label>
                        Email address
                        <input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                    </label>

                    <label>
                        Password
                        <input type="password" placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                    </label>

                    <button type="submit" disabled={loading}>{loading ? "Signing in..." : "Sign in"}</button>
                    <p className="login-help">Use your administrator account to access the workspace.</p>

                </form>
            </div>

        </div>
    );
};

export default Login;
