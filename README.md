# SubscList（サブスクリスト）

自分が入っているサブスクリプション（定額サービス）を管理し、毎月の固定費を可視化するアプリケーションです。
年払いサービスも、月額換算して計算することができます。

## アプリのURL
**こちらから実際に動作します！**
https://subsc-list-yg7n.vercel.app/

## 使用技術
* **Framework**: Next.js (App Router)
* **Language**: TypeScript
* **Styling**: Tailwind CSS
* **Database / Auth**: Supabase
* **Deployment**: Vercel

## 機能一覧
1.  **ユーザー認証**
    * メールアドレスによる新規登録・ログイン機能（Supabase Auth）
2.  **サブスク管理**
    * サービスの追加・一覧表示・削除
    * 支払いサイクル（月払い/年払い）の選択
3.  **自動計算**
    * 年払いの金額を自動で「月額」に換算して計算
    * 毎月の固定費合計をトップページに表示

## 工夫した点
* **UI/UX**: シンプルで見やすいデザインにし、合計金額が一目でわかるようにしました。
* **定期実行**: GitHub Actionsを使用し、Supabaseが停止しないように定期アクセスを設定しました。