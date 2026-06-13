<!-- {{TOPIC}}: Laravel（新模擬案件Bookshelf が前提とする Laravel 10.x。用語・記法は Laravel 公式ドキュメント 10.x に従う） -->

# Laravel 実践ステップアップ講座 — 新しい模擬案件に対応する力をつける

> 2026年2月以前の教材で学習を進めてきた方（Laravel でひととおり CRUD アプリを作れる）が、2026年3月以降の教材と同じ技術レベルに到達し、新しい模擬案件（テスト）に対応できるようになる教材。Laravel 10・Laravel Sail・PHPUnit を使い、公開 API・認可・自動テスト・多対多リレーション・集計といった、これまでの学習に上積みする技術を身につける。すでに学んだ内容は省き、新しく必要になる技術に集中する。

## ペルソナ（WHO）

**2026年2月以前の教材（学習準備 → HTML/CSS → コマンドライン → PHP基礎 → データベース基礎 → Laravel基礎講座 → Laravel演習講座）で学習してきた受講生**。これから新しい模擬案件に挑む。

Laravel 8 で「認証付きの画面 + DB アプリ（CRUD）」を独力で作った経験がある。具体的には、ルーティング・コントローラ・Blade・マイグレーション・基本的な Eloquent（hasMany / belongsTo）・**FormRequest バリデーション**・**Laravel Fortify 認証**・N+1 と `with()` による Eager Loading・Seeder / Factory・Git の基本操作（branch / PR / merge）は手を動かして経験済み。

一方で、**REST API の構築・Policy による認可・自動テストの「実装」・多対多のハンズオン・集計クエリは未経験**（または講座で一度見たが自分では書いていない）。環境は手書きの Docker Compose で作っており **Laravel Sail は未経験**、PHP の **OOP（クラス設計）も体系的には学んでいない**。Laravel も **8 → 10 の世代差**がある。

最大の不安は「すでに作れるものは多いのに、新しい模擬案件で何が新しく問われるのか、何を身につければよいのか分からない」こと。ギャップの全体像が見えていない。

### 前提知識

- **PHP / Laravel（既習）**: Laravel 8 でのルーティング、コントローラ、Blade（継承・コンポーネント含む）、マイグレーション、Eloquent CRUD、hasMany / belongsTo、FormRequest、Fortify 認証、N+1 対策、Seeder / Factory、ページネーション、fillable、ソフトデリート
- **データベース（既習）**: リレーショナル DB 設計、正規化、ER 図、基本的な SQL
- **ツール（既習）**: Git / GitHub の基本（add / commit / push / branch / pull request / merge）、Docker Compose の基礎（手書き compose の経験）
- **本教材で初めて扱う（差分）**: 公開 REST API、Policy 認可、PHPUnit の実装、多対多リレーションの実践、集計クエリ、Laravel Sail、PHP の OOP

### 技術スタック

- **Laravel 10.x**: 新テストの前提バージョン。旧教材の Laravel 8 との差分（ディレクトリ構成・記法・`casts()` 等）を橋渡しする
- **PHP 8.1+**: OOP の基礎（クラス・インスタンス・コンストラクタ）も補う
- **Laravel Sail（Docker）+ MySQL 8**: 旧教材の手書き Compose から Sail へ移行する
- **Laravel Fortify**: 認証。旧教材で既習のため、本教材では Laravel 10 での導入差分の確認にとどめる
- **PHPUnit 10**: Feature / Unit テスト。カバレッジ 60% 以上が目標
- **Tailwind CSS + Vite**: スターターキットのフロント。本教材の主眼はバックエンドであり、画面は提供アセットを利用する
- **題材**: タスク管理アプリ（スターターキット `coachtech-material/laravel-api-starter` 等を流用）。新模擬案件 Bookshelf 本体は**テストのため題材にしない**

## コンセプト（WHY）

> 以下は内部の背景・前提。**教材本文には書かない**（表現ルールは「カリキュラム（HOW）」の「表現の方針」を参照）。

2026年2月以前の教材で学んできた受講生にも、2026年3月以降の新しい模擬案件（テスト）に対応してもらう方針になった。しかし 2026年2月以前の教材と新しい模擬案件の間には、**公開 API・認可・自動テストの実装**といった明確なスキルギャップがある。市販の Laravel 入門書や公式ドキュメントは「ゼロから網羅的に」教えるため既習部分の重複が多く、限られた時間で「新しく必要な技術だけ」を最短で身につけるには向かない。

本教材は、**すでに学んだことは思い切って省き、新しく必要になる技術だけに集中する**。「あなたはすでにここまで作れる。あと身につけるのはこれだけ」という地図を最初に示し、最短ルートを引く。これは、対象読者の現在地を正確に把握しているからこそ書ける、この教材にしかない価値である。

## ゴール（WHAT）

本教材を終えると、**新模擬案件 Bookshelf（Basic）を合格水準で完成させられる**。行動レベルでは次のとおり。

1. **公開 REST API を設計・実装できる** — `routes/api.php` のルート設計（apiResource・バージョニング）、API Resource によるレスポンス整形、検索・絞り込み・ページネーション、HTTP ステータスコードの制御、JSON 例外ハンドリング
2. **Policy で所有者ベースの認可を実装できる** — Gate / Policy の作成・登録・適用、`authorize()`、`@can`
3. **多対多リレーションを実装できる** — ピボットテーブルの設計（2 パターン）、`belongsToMany`、`attach` / `sync` / `toggle`
4. **集計とパフォーマンスを扱える** — `withAvg` / `withCount` による集計・ランキング、`with` / `load` の使い分けと N+1 回避
5. **自動テストを書ける** — PHPUnit の Feature / Unit テスト（`RefreshDatabase`・Factory・`actingAs`・DB / JSON アサーション）、カバレッジ 60% 以上
6. **Laravel 10 + Sail で開発できる** — Sail による環境構築、Laravel 8 → 10 の作法の差分を踏まえた実装
7. **あいまいな要件を設計に落とせる** — 要件の行間を読み、ER 図・テーブル設計に落とし込む

**優先順位・注記**: 採点は Basic 113 項目 / 140 点。配点の重い**公開 API（19 点）と自動テスト（36 点）**を特に重視する。本教材は **Basic の確実な完答**を目標とする（最上位の S 評価は Advance 機能を前提とする採点設計のため、Basic 単体では届かない。本教材は Advance を扱わない）。

## カリキュラム（HOW）

### 教材の方針

本教材は **概念 Section を主軸**とする。各技術を **Why（なぜ必要か）→ What（何か）→ How（どう使うか）** の順で解説し、体系的・構造的な理解を最優先する。ハンズオン中心の断片的な「具体」に意識が向いて全体像を見失う構成は避け、**構文の暗記よりも概念の理解**を優先する。ハンズオンは概念を定着させるための実践と位置づけ、主役は概念理解に置く。

### 表現の方針（本文）

- **「旧教材／新教材」「差分」という語は本文で使わない**（読者に劣等感を与えないため）。旧側は **「2026年2月以前の教材」**、新側は **「2026年3月以降の教材」** と日付で表現する（境界は 2026年2月／3月）。
- 本教材の位置づけは「2026年2月以前の教材で学習してきた方が、2026年3月以降の教材と同じ技術レベルに到達し、**新しい模擬案件（テスト）** に対応できるようになる」こと。1-1 で一度だけ軽く示す。
- 運営側の背景（テストの難易度・所属など）、**採点に関する表現（合格・成績・配点・点数・採点ライン）**、固有名 **「Bookshelf」** は本文に出さない（テストは「新しい模擬案件」と一般化）。

### 階層構造

**階層**: 3層（Part > Chapter > Section）。全 4 部 / 10 章 / 31 節。概念 Section を主軸に、認可・API は章末ハンズオン（スターターキット）で実践し、最後の総合ハンズオンでゼロから 1 つのアプリを構築して統合する。

| Part | テーマ | 扱うテーマ |
|---|---|---|
| **Part 1** | 前提と開発環境を整える | PHP OOP の基礎、Laravel Sail、Laravel 8 → 10 の変更点 |
| **Part 2** | Laravel の新概念（多対多・認可・集計・テスト） | 多対多リレーションの実践、Policy 認可、集計と N+1、自動テスト |
| **Part 3** | 公開 REST API | ルート設計、API Resource、検索・ページネーション、JSON 例外・ステータス |
| **Part 4** | 総合ハンズオン | タスク管理アプリをゼロから構築し、学んだ技術を統合 |

各層の設計詳細（各 Section のゴール・種類・前提・参考資料）は `OUTLINE.md` を参照。

CLAUDE.md は教材の哲学（WHO / WHY / WHAT / HOW）を定義し、`OUTLINE.md` はその哲学を具体的な設計に落とし込む。執筆上の判断（題材の選択・構成のアレンジ・外部調査）は `OUTLINE.md` の設計に従いつつ、臨機応変に行うこと。旧教材で既習の内容と新テストの差分の根拠は `docs/diff-analysis.md` にまとめてある。

## プロジェクトマップ（MAP）

執筆ルールは `.claude/rules/writing.md` を参照。

### Skills

| Skill | 用途 |
|---|---|
| `/setup` | 初期設定（CLAUDE.md・OUTLINE.md・writing.md の作成） |
| `/write` | 執筆（任意の階層単位） |
| `/review` | レビュー（品質・整合性チェック） |
| `/check-updates` | 公式ドキュメントとの鮮度チェック |
| `/illustrate` | Gemini による教材概念図の生成・挿入 |
| `/animate` | Remotion による Section 解説動画の生成・挿入 |
| `/github-pages` | MkDocs Material + GitHub Actions で教材を GitHub Pages に公開 |

### 参考資料・調査結果

| ファイル | 内容 |
|---|---|
| `docs/diff-analysis.md` | 旧教材 → 新テスト Bookshelf の差分分析（本教材の設計根拠） |
| `docs/all-curriculums.json` / `docs/curriculums_repaired.json` | 旧教材・新教材の全カリキュラムデータ（後者は不正エスケープ修復済み） |
| `~/ExampleAnswer-mockcase-BookShelf`（basic ブランチ） | 新模擬案件 Bookshelf の模範解答コード |
| `~/ExampleAnswer-mockcase-BookShelf/関連ドキュメント/要件シート_詳細度100%.md` | 要件シート（Basic / Advance 区別。本教材は Basic のみ） |
| `~/ExampleAnswer-mockcase-BookShelf/関連ドキュメント/評価シート.md` | 採点基準（合格バー） |
| `~/ExampleAnswer-mockcase-BookShelf/関連ドキュメント/復習教材/` | 既存のフルビルド型チュートリアル（参照用。学習目標・新概念コンテンツの供給源） |

### フォルダ構造・命名規則

```
project-root/
├── CLAUDE.md                # 教材の哲学（WHO/WHY/WHAT/HOW/MAP）
├── OUTLINE.md               # カリキュラム設計
├── docs/                    # 設計根拠・調査結果
├── .claude/
│   ├── rules/writing.md     # 執筆ルール
│   ├── skills/              # Skill 定義
│   └── settings.json
├── curriculums/             # 教材本体
└── assets/                  # 画像
```

**3層**（Part > Chapter > Section）:
- `curriculums/part-XX_タイトル/chapter-XX_タイトル/X-X-X_タイトル.md`

**命名規則**:
- ディレクトリ名はゼロパディング（01始まり）
- ファイル名のセクション番号はゼロパディングなし
- ディレクトリ・ファイル名のタイトル部分は OUTLINE.md の見出しをそのまま使用する（日英混在可。スペースはハイフンに置換）
- 画像は内容がわかる英語名
