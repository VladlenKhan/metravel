import { useState } from "react";

export default function AuthLogin() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log({ email, password });
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-200  p-6">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">
                <div className="mb-6 text-center">
                    <h1 className="text-3xl font-bold text-gray-800">С возвращением!</h1>
                    <p className="text-sm text-gray-500 mt-1">Войдите в свой аккаунт</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="text-sm text-gray-600">Ваш Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            className="w-full mt-1 px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600"
                            required
                        />
                    </div>

                    <div>
                        <label className="text-sm text-gray-600">Пароль</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full mt-1 px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600"
                            required
                        />
                    </div>
                    <button className="w-full py-2.5 bg-indigo-600 text-white font-semibold rounded-xl hover:opacity-90 transition">
                        <a href="#"
                            type="submit">
                            Войти
                        </a>
                    </button>
                    <p className="text-xs text-center ">
                    

                        <a href="#" className="  text-gray-500">

                            Забыли свой пароль?
                        </a>
                    </p>
                </form>
            </div>
        </div>
    );
}