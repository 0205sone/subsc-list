"use client";

import { useState, useEffect } from "react";
import { supabase } from "../utils/supabase";

// カテゴリのリストを定義
const CATEGORIES = ["エンタメ", "生活", "学習", "仕事", "その他"];

export default function Home() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState<any>(null);
  const [subs, setSubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // フィルタリング用の状態（初期値は'ALL'）
  const [filterCategory, setFilterCategory] = useState("ALL");

  // 追加モードかどうかのフラグ
  const [showModal, setShowModal] = useState(false);
  // 新規追加用の入力データ
  const [newName, setNewName] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newCycle, setNewCycle] = useState("monthly");
  const [newDate, setNewDate] = useState("");
  const [newCategory, setNewCategory] = useState("エンタメ"); // カテゴリの初期値

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      if (session?.user) fetchData();
    };
    checkUser();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("subscriptions")
      .select("*")
      .order('created_at', { ascending: false });
      
    if (error) console.error(error);
    else setSubs(data || []);
    setLoading(false);
  };

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert("エラー: " + error.message);
    else window.location.reload();
  };

  const handleSignUp = async () => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) alert("エラー: " + error.message);
    else alert("登録しました！");
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  // --- データを追加する機能 ---
  const handleAdd = async () => {
    if (!newName || !newPrice) return alert("名前と金額を入力してね");

    const { error } = await supabase.from("subscriptions").insert({
      name: newName,
      price: Number(newPrice),
      payment_cycle: newCycle,
      next_payment_date: newDate || null,
      category: newCategory, // カテゴリも保存
      user_id: user.id,
    });

    if (error) {
      alert("追加失敗: " + error.message);
    } else {
      setShowModal(false);
      setNewName("");
      setNewPrice("");
      setNewDate("");
      setNewCategory("エンタメ"); // リセット
      fetchData();
    }
  };

  // --- データを削除する機能 ---
  const handleDelete = async (id: string) => {
    if (!confirm("本当に削除しますか？")) return;
    const { error } = await supabase.from("subscriptions").delete().eq("id", id);
    if (error) alert("削除失敗: " + error.message);
    else fetchData();
  };

  // 日付計算ロジック
  const getDaysLeft = (dateStr: string) => {
    if (!dateStr) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(dateStr);
    target.setHours(0, 0, 0, 0);
    const diffTime = target.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // ★変更：フィルタリングと並び替えを同時に行う
  const filteredSubs = subs.filter((item) => {
    // 既存データにカテゴリがない場合は「その他」として扱う
    const itemCat = item.category || "その他";
    if (filterCategory === "ALL") return true;
    return itemCat === filterCategory;
  });

  const sortedSubs = [...filteredSubs].sort((a, b) => {
    const daysA = getDaysLeft(a.next_payment_date);
    const daysB = getDaysLeft(b.next_payment_date);

    if (daysA === null && daysB === null) return 0;
    if (daysA === null) return 1;
    if (daysB === null) return -1;

    const isUrgentA = daysA >= 0 && daysA <= 7;
    const isUrgentB = daysB >= 0 && daysB <= 7;

    if (isUrgentA && !isUrgentB) return -1;
    if (!isUrgentA && isUrgentB) return 1;
    return 0;
  });

  // ★変更：表示されているリストだけの合計金額を計算
  const totalMonthly = filteredSubs.reduce((sum, item) => {
    const price = item.payment_cycle === 'yearly' ? Math.round(item.price / 12) : item.price;
    return sum + price;
  }, 0);

  return (
    <div className="min-h-screen bg-gray-50 p-8 text-gray-800 font-sans">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-extrabold mb-8 text-center text-blue-600 tracking-tight">SubscList</h1>

        {!user ? (
          <div className="bg-white p-8 rounded-xl shadow-lg max-w-sm mx-auto border border-gray-100">
            <h2 className="text-xl font-bold mb-6 text-center">ログイン / 新規登録</h2>
            <input
              type="email"
              placeholder="メールアドレス"
              className="w-full p-3 mb-4 border rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              type="password"
              placeholder="パスワード"
              className="w-full p-3 mb-6 border rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <div className="flex gap-3">
              <button onClick={handleLogin} className="flex-1 bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition">ログイン</button>
              <button onClick={handleSignUp} className="flex-1 bg-green-500 text-white font-bold py-3 rounded-lg hover:bg-green-600 transition">新規登録</button>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex justify-between items-center mb-6 px-2">
              <p className="text-sm text-gray-600">ようこそ、{user.email} さん</p>
              <button onClick={handleLogout} className="text-sm text-red-500 hover:text-red-700 font-bold">ログアウト</button>
            </div>

            {/* カテゴリフィルタボタン */}
            <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
              <button
                onClick={() => setFilterCategory("ALL")}
                className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition ${
                  filterCategory === "ALL" ? "bg-gray-800 text-white" : "bg-white text-gray-600 border"
                }`}
              >
                すべて
              </button>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilterCategory(cat)}
                  className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition ${
                    filterCategory === cat ? "bg-blue-600 text-white" : "bg-white text-gray-600 border"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="bg-gradient-to-br from-blue-500 to-cyan-400 text-white p-8 rounded-2xl shadow-xl mb-10 text-center transform hover:scale-[1.02] transition duration-300">
              <p className="text-sm font-medium opacity-90 mb-1">
                {filterCategory === "ALL" ? "毎月の固定費合計" : `${filterCategory}の合計`}（概算）
              </p>
              <p className="text-5xl font-extrabold tracking-tight">¥{totalMonthly.toLocaleString()}</p>
            </div>

            <div className="flex justify-between items-end mb-4 px-2">
              <h2 className="font-bold text-xl text-gray-700">
                {filterCategory === "ALL" ? "登録済みサブスク" : `${filterCategory}リスト`}
              </h2>
              <button 
                onClick={() => setShowModal(true)}
                className="bg-blue-600 text-white px-5 py-2 rounded-full font-bold shadow-md hover:bg-blue-700 transition flex items-center gap-1"
              >
                <span>+</span> 追加
              </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              {loading ? (
                 <p className="p-8 text-center text-gray-400">読み込み中...</p>
              ) : sortedSubs.length === 0 ? (
                <p className="p-12 text-center text-gray-400">
                  {filterCategory === "ALL" ? "データがありません。" : `${filterCategory}のデータはありません。`}
                </p>
              ) : (
                <ul>
                  {sortedSubs.map((item) => {
                    const daysLeft = getDaysLeft(item.next_payment_date);
                    const isUrgent = daysLeft !== null && daysLeft >= 0 && daysLeft <= 7;
                    
                    return (
                      <li key={item.id} className={`border-b last:border-b-0 p-5 flex justify-between items-center hover:bg-gray-50 transition group ${isUrgent ? 'bg-red-50' : ''}`}>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-bold text-lg text-gray-800">{item.name}</p>
                            {isUrgent && (
                              <span className="text-xs font-bold bg-red-500 text-white px-2 py-0.5 rounded animate-pulse">
                                ⚠️ あと{daysLeft}日
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-2 text-xs">
                            <span className="px-2 py-1 rounded-full bg-gray-200 text-gray-600">
                              {item.category || "その他"}
                            </span>
                            <span className={`px-2 py-1 rounded-full ${item.payment_cycle === 'yearly' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>
                              {item.payment_cycle === 'yearly' ? '年払い' : '月払い'}
                            </span>
                            {item.next_payment_date && (
                              <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-500">
                                次回: {item.next_payment_date}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right flex items-center gap-4">
                          <div>
                            <p className="font-bold text-xl text-gray-800">¥{item.price.toLocaleString()}</p>
                            {item.payment_cycle === 'yearly' && (
                              <p className="text-xs text-gray-400">月換算: ¥{Math.round(item.price/12)}</p>
                            )}
                          </div>
                          <button 
                            onClick={() => handleDelete(item.id)}
                            className="text-gray-300 hover:text-red-500 p-2 rounded-full hover:bg-red-50 transition"
                            title="削除"
                          >
                            ✕
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        )}

        {/* 追加用モーダル */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-sm animate-bounce-in">
              <h3 className="font-bold text-xl mb-4">新しいサブスクを追加</h3>
              
              <label className="block text-sm font-bold text-gray-600 mb-1">サービス名</label>
              <input 
                className="w-full border p-3 rounded-lg mb-4 bg-gray-50"
                placeholder="例: Netflix"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />

              {/* ★追加：カテゴリ選択 */}
              <label className="block text-sm font-bold text-gray-600 mb-1">カテゴリ</label>
              <div className="flex flex-wrap gap-2 mb-4">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setNewCategory(cat)}
                    className={`px-3 py-2 rounded-lg text-sm border font-bold transition ${
                      newCategory === cat ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-500 border-gray-300"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <label className="block text-sm font-bold text-gray-600 mb-1">金額（円）</label>
              <input 
                type="number"
                className="w-full border p-3 rounded-lg mb-4 bg-gray-50"
                placeholder="例: 980"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
              />

              <label className="block text-sm font-bold text-gray-600 mb-1">次回の更新日（任意）</label>
              <input 
                type="date"
                className="w-full border p-3 rounded-lg mb-4 bg-gray-50"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
              />

              <label className="block text-sm font-bold text-gray-600 mb-1">支払いサイクル</label>
              <div className="flex gap-2 mb-6">
                <button 
                  onClick={() => setNewCycle('monthly')}
                  className={`flex-1 p-2 rounded-lg border ${newCycle === 'monthly' ? 'bg-blue-100 border-blue-500 text-blue-700 font-bold' : 'bg-white text-gray-500'}`}
                >
                  月払い
                </button>
                <button 
                  onClick={() => setNewCycle('yearly')}
                  className={`flex-1 p-2 rounded-lg border ${newCycle === 'yearly' ? 'bg-orange-100 border-orange-500 text-orange-700 font-bold' : 'bg-white text-gray-500'}`}
                >
                  年払い
                </button>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 rounded-lg font-bold text-gray-500 hover:bg-gray-100"
                >
                  キャンセル
                </button>
                <button 
                  onClick={handleAdd}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 shadow-md"
                >
                  追加する
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}