# 融資支援AI（仮）

> 融資・公庫・補助金の提出書類を「揃える／整える／答えられる」状態にするための、ドキュメント整理＆審査シミュレーション支援サービス。  
> 目的は **“提出・面談に向けた準備の成功確率を上げる”** ことであり、融資結果を保証するものではありません。

## 1. 概要

本サービスは、資金調達（銀行・日本政策金融公庫・信用金庫・補助金など）ごとに **プロジェクト** を作成し、必要書類のアップロード・不足チェック・改善ガイド・模擬面談（審査シミュレーション）までを一貫して支援します。

- **プロジェクト単位で管理**：調達元、目標額、用途、融資方法、調達時期、返済計画などを登録（PDF p.1）
- **書類アップロード**：財務書類等をアップロードし、AIが書類種別／年度を判別（PDF p.2）
- **提出書類のブラッシュアップ**：左メニューに必要書類一覧、状態表示（OK／不足／未提出）。AIチャットで改善指示、テンプレ提供（PDF p.3–5）
- **擬似審査体験（面談練習）**：提出書類をもとに金融機関が聞きそうな質問をAIが実施、最後に評価・良かった点・改善点を提示し保存（PDF p.6–8）


## 2.x 認証（ログイン）

本MVPでは **メールアドレス＋パスワード** によるログインを提供します。初期実装は「固定の仮アカウントでログインできる」方式（デモ用）とし、後から本番のユーザー管理（DB永続化、パスワードハッシュ、パスワード再発行、MFA等）へ拡張します。

### 2.x.1 デモ用ログイン情報（仮）
- Email: `demo@example.com`
- Password: `demo_password_1234`

### 2.x.2 画面/挙動
- ログイン画面：Email / Password の入力＋「ログイン」ボタン
- 認証成功：`Project Page` へ遷移
- 認証失敗：エラーメッセージを表示（例：「メールアドレスまたはパスワードが正しくありません」）

### 2.x.3 実装メモ（推奨）
- セッション方式：Cookieベース（HttpOnly）またはトークン（JWT）
- デモ段階：環境変数で固定アカウントを管理（`DEMO_EMAIL`, `DEMO_PASSWORD`）
- 本番移行：
  - ユーザーをDBに保存
  - パスワードは必ずハッシュ化（bcrypt/argon2等）
  - レート制限、ロックアウト、監査ログ


## 2. 主要機能（ユーザーストーリー）

### 2.1 プロジェクト作成／管理
- 資金調達の案件ごとにプロジェクトを作成
- 登録項目（例）
  - 調達元（銀行、公庫、信金、補助金 etc）
  - 調達目標金額
  - 調達目的（用途）
  - 融資方法（手形割引／手形貸付／証書貸付／当座貸付）
  - 調達時期
  - 返済計画（時期・返済方法）  
  ※調達元により必要書類が変わる（PDF p.1）

### 2.2 ドキュメントアップロード
- 申請に関連する財務関連書類をアップロード（PDF p.2）
- AIが以下を推定して自動分類（可能な範囲で）
  - 書類種別（損益計算書／貸借対照表／確定申告書／試算表など）
  - 対象年度（xx年度 など）
- 自動判別が難しい場合の代替案
  - 事前に「損益計算書」「貸借対照表」等のアップロード枠を用意し、ユーザーに紐づけてもらう（PDF p.2）

### 2.3 提出書類のブラッシュアップ（Document Checker）
- 左メニューに **必須書類／参考書類** を整理表示（PDF p.3–5）
- 状態表示
  - ✅：提出済み＆概ねOK（AI判定）
  - ⚠️：提出済みだが不備／不足の可能性
  - ❗：未提出（要注意）
- 画面内AIチャットで、改善方法のガイド
  - 「不足事項／改善事項」の提示
  - 具体的な修正手順の提示（質問→回答→次の指示）
  - 改善後のファイル再アップロードで✅へ遷移（PDF p.4）
- 未提出の場合のテンプレ提供＆ハンズオン入力支援（PDF p.5）
  - 例：勘定科目内訳明細書テンプレート（.xlsx）を配布し、入力の順序をAIがレクチャー

### 2.4 審査シミュレーション（Review Simulator）
- 必要書類が一定揃ったら「審査シミュレーション」を開始（所要時間の目安約15分）（PDF p.6）
- 提出書類の内容をもとに、金融機関が聞くであろう質問をAIが実施（PDF p.6–7）
  - なぜ赤字なのか
  - なぜこの融資が必要なのか
  - 返済原資は何か
  - 資金使途の妥当性
  - 代表者の経歴・体制・リスクなど
- 結果画面
  - 総合評価（例：A など）
  - 良かったポイント
  - 改善ポイント（経営課題として保存し、後から見返せる）（PDF p.8）
- 注意：融資結果の保証はしない旨を明確に表示（PDF p.8）

### 2.5 専門家への接続（アフィリエイト／広告モデル）
- 「さらに詳細には税理士に」「経営は中小企業診断士に」等の導線を提供し、外部サービスへ接続（PDF p.8）
- 将来的に、ユーザー属性／課題に応じたマッチングや比較表示も可能

## 3. 画面フロー（MVP）

1. **Project Page（プロジェクト一覧／新規作成）**  
2. **Document Upload（書類アップロード）**  
3. **Document Checker（提出書類のブラッシュアップ）**  
4. **Review Simulator（審査シミュレーション開始→対話→結果）**  

※UI上はタブ（Document Upload / Document Checker / Review Simulator）で遷移する想定。

## 4. データモデル（例）

### 4.1 エンティティ
- `User`
- `Project`
  - `funding_source`（銀行／公庫／信金／補助金…）
  - `target_amount`
  - `purpose`
  - `loan_type`
  - `timing`
  - `repayment_plan`（JSON）
- `Document`
  - `project_id`
  - `category`（PL/BS/確定申告/試算表/…）
  - `fiscal_year`
  - `file_url`（S3/R2等）
  - `status`（missing / needs_fix / ok）
  - `issues`（AI抽出の指摘、JSON）
- `Template`
  - `category`
  - `file_url`
- `ReviewSession`
  - `project_id`
  - `session_id`
  - `transcript`
  - `score`
  - `good_points`
  - `improvements`

## 5. AIの役割（推奨構成）

### 5.1 ドキュメント分類（Document Ingestion）
- 入力：PDF/画像/Excel/Word
- 出力：
  - 種別推定（例：貸借対照表）
  - 年度推定
  - 必須項目の充足判定（例：昨年度分がない）
- 技術要素（例）
  - OCR（画像PDFなど）
  - 文書レイアウト理解（表、見出し、科目）
  - ルール×LLM（「必要書類チェック」はルールが強い）

### 5.2 書類チェック＆改善ガイド（Document Checker Chat）
- 目的：ユーザーが「何を直せば良いか」を迷わない状態にする
- 出力：不足事項→改善手順→テンプレ案内→再アップロードで完了
- ガードレール：医療・法律同様、**“助言であり保証しない”**／必要に応じ専門家相談を促す

### 5.3 審査シミュレーション（Review Simulator Agent）
- 入力：プロジェクト情報＋提出書類の要約（RAG）
- 対話：金融機関担当者の立場で質問→回答評価→深掘り
- 出力：総合評価、良かった点、改善点（次回アクション化）
- 保存：セッション結果をプロジェクトに紐付けて履歴化（PDF p.8）

## 6. システム構成（実装例）

### 6.1 フロントエンド
- Next.js / React（App Router）
- UI：Tailwind + Componentライブラリ（Radix等）
- 主要画面：Project / Upload / Checker / Simulator / Result

### 6.2 バックエンド
- API：Node.js（Next API Routes / Express）または FastAPI
- DB：PostgreSQL（Supabase/Neon等）
- ファイル：Cloudflare R2 / S3
- ジョブ：文書解析は非同期（Queue：BullMQ/Cloud Tasks等）

### 6.3 AIサービス
- LLM（分類／要約／対話）
- Embeddings + Vector DB（RAG）
- OCR（必要に応じ）

## 7. API設計（例）

### Auth
- `POST /api/auth/login` ログイン（Email/Password）
- `POST /api/auth/logout` ログアウト
- `GET /api/auth/me` ログイン状態取得

### Projects
- `POST /api/projects` 作成
- `GET /api/projects` 一覧
- `GET /api/projects/:id` 詳細
- `PATCH /api/projects/:id` 編集

### Documents
- `POST /api/projects/:id/documents` アップロード登録
- `POST /api/documents/:id/analyze` 解析ジョブ起動
- `GET /api/projects/:id/documents` 一覧（ステータス含む）

### Document Checker Chat
- `POST /api/projects/:id/checker/chat` メッセージ送信
- `GET /api/projects/:id/checker/issues` 指摘一覧

### Review Simulator
- `POST /api/projects/:id/review-sessions` セッション開始
- `POST /api/review-sessions/:sid/chat` 対話
- `POST /api/review-sessions/:sid/finish` 結果確定
- `GET /api/review-sessions/:sid` 結果取得

## 8. MVPの実装優先順位

1) **プロジェクト作成**（必要項目登録）  
2) **書類アップロード**（カテゴリ手動紐付けでOK）  
3) **チェックリスト＋ステータスUI**（missing/needs_fix/ok）  
4) **テンプレ配布**（未提出の穴を埋める）  
5) **AIチャット（ルールベース＋LLM）**  
6) **審査シミュレーション（RAG + 会話）**  
7) **履歴・改善点の保存**（学習ループ）  
8) **専門家導線**（リンク／紹介）

## 9. 注意事項（必須の表示・運用）
- 本サービスは融資の可否や採択を保証しません（PDF p.8）
- 最終判断は金融機関・審査機関に依存します
- 個人情報／財務情報を扱うため、暗号化・権限・監査ログを徹底してください

---
## 参考
- 仕様イメージ資料：`融資AIアイデア.pdf`
