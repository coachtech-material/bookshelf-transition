# OUTLINE — Laravel 実践ステップアップ講座

> 本ファイルは内部設計ドキュメント。CLAUDE.md の哲学を Section 設計に落とし込んだもの。学習目標の根拠は `docs/diff-analysis.md` を参照。
>
> **教材の方針**: 概念 Section を主軸とし、各技術を **Why → What → How** の順で解説。構文の暗記より概念理解を優先する。ハンズオンは概念定着のための実践。
> **本文の表現ルール**: 「旧教材／新教材」「差分」「Bookshelf」「合格」は本文で使わない。旧側＝「2026年2月以前の教材」、新側＝「2026年3月以降の教材」、テストは「新しい模擬案件」と表現する（詳細は CLAUDE.md「表現の方針」）。
>
> 階層: 3層（Part > Chapter > Section）/ 全 4 部・10 章・31 節。
> 種類凡例: **概念** = 理論・仕組み / **ハンズオン** = 既習概念の実践（冒頭に概念 Section への逆リンク）/ **混合** = 概念＋即実践（実践見出しはまとめの直前）。
> **章末ハンズオン（4-3・8-3）と総合ハンズオン（Part 4）は完全に独立**（積み上げない）。例外として、2-3 で作るサンドボックスのみ Part 2 の混合 Section（3-2・5-1）の Tinker 実践で再利用する。詳細は末尾「ハンズオン設計」。

---

## Part 1: 前提と開発環境を整える

→ ゴール: この教材で身につける技術の全体像をつかみ、Laravel のクラス群を読み解く PHP OOP の基礎を固め、Laravel 10 + Sail の開発環境を整える。

### Chapter 1: 学習の地図と PHP OOP（2 Section）

**ゴール**: この教材で身につける技術の全体像と進め方を理解し、Laravel のクラス群を読み解くための PHP OOP の基礎を固める。

- **1-1 この教材の全体像と進め方**
  - 種類: 概念
  - ゴール: すでに身についていること（CRUD・FormRequest・認証・基本 Eloquent・N+1 対策）の上に、これから学ぶこと（公開 API・認可・自動テスト・多対多実践・集計・Sail）を地図として把握し、学習順序と到達点を理解する。
  - 参考資料: `docs/diff-analysis.md`（内部）
  - 意図: 全体像を最初に示す。位置づけ（2026年2月以前の教材→2026年3月以降のレベル→新しい模擬案件）はここで一度だけ軽く示す。運営事情・固有名・「合格」は出さない。

- **1-2 PHP OOP の基礎**
  - 種類: 概念
  - ゴール: Laravel のクラス（コントローラ／モデル／FormRequest／Policy／Resource）を読み解くのに必要な OOP を身につける。クラスとインスタンス、プロパティとメソッド、コンストラクタ、型宣言、継承（`extends`）、名前空間と `use`、`$this` を理解し、Laravel のコードがクラスとしてどう書かれているかを読み解ける。
  - 前提: [1-1]
  - 参考資料: [PHP マニュアル: クラスとオブジェクト](https://www.php.net/manual/ja/language.oop5.php)

### Chapter 2: 開発環境 — Sail と Laravel 8→10（3 Section）

**ゴール**: Laravel Sail の役割と Laravel 8 から 10 への変更点を理解し、Sail で Laravel 10 プロジェクトを立ち上げて以降の実践用サンドボックスを用意する。

- **2-1 Laravel Sail で環境構築する**
  - 種類: 概念
  - ゴール: Sail の役割（手書き Docker Compose との違い）と、`sail up`/`sail artisan`/`sail composer`/`sail npm` の使い方、phpMyAdmin 追加・日本語ロケール設定の流れを理解する。
  - 前提: [1-1]
  - 参考資料: [Laravel Sail 10.x](https://readouble.com/laravel/10.x/ja/sail.html)

- **2-2 Laravel 8 から 10 への変更点**
  - 種類: 概念
  - ゴール: 2026年2月以前の教材（Laravel 8）と 2026年3月以降（Laravel 10）の主な変更点（PHP 8.1+ への引き上げと match/enum/readonly 等の PHP 8 機能、無名マイグレーションクラス `return new class extends Migration`、`lang/` がプロジェクトルートへ移動、生成コードのネイティブ型宣言など）を理解し、既習の知識を 10 で安全に使い直せる。
  - 前提: [2-1]
  - 参考資料: [Laravel 10.x リリースノート](https://readouble.com/laravel/10.x/ja/releases.html)
  - 意図: 変更点は限定的なので短く扱う。`casts()` メソッドや大きなディレクトリ刷新は Laravel 11 以降のため本章では扱わない（Laravel 10 のキャストは `$casts` プロパティ）。実装時は公式 Upgrade Guide で対象バージョンの挙動を裏取りする。

- **2-3 ハンズオン: Laravel Sail プロジェクトを立ち上げる**
  - 種類: ハンズオン（逆リンク: 2-1）
  - ゴール: Sail で Laravel 10 プロジェクトを新規作成し、phpMyAdmin・日本語ロケールを設定して起動する。**以降の混合 Section（3-2 / 5-1）の「Tinker で実践」で使う実験用サンドボックス**を用意する。
  - 前提: [2-1, 2-2]

---

## Part 2: Laravel の新概念（多対多・認可・集計・テスト）

→ ゴール: 多対多の実践・Policy 認可・集計と N+1・自動テストという、2026年2月以前の教材で未習または手薄なモデル層〜認可〜検証の技術を習得する。認可は専用スターターキットでハンズオン、多対多・集計は混合（Tinker 実践）、テストは概念（演習は総合ハンズオン）。

### Chapter 3: 多対多リレーションの実践（2 Section）

**ゴール**: ピボットテーブルを設計・実装し、`belongsToMany` と `attach`/`sync`/`toggle` で多対多を操作できる。

- **3-1 多対多とピボットテーブル**
  - 種類: 概念
  - ゴール: 多対多の仕組みと 2 パターンのピボット（純粋ピボット＝複合主キー／属性付き・複合 unique ピボット）の設計・マイグレーションを理解し、`belongsToMany` を定義（規約／明示テーブル指定）できる。
  - 前提: [2-2]
  - 参考資料: [Eloquent：リレーション（多対多）10.x](https://readouble.com/laravel/10.x/ja/eloquent-relationships.html#many-to-many)

- **3-2 ピボット操作（attach / detach / sync / toggle）**
  - 種類: 混合
  - ゴール: `attach`/`detach`/`sync`/`syncWithoutDetaching`/`toggle` の違いと使いどころを理解し、サンドボックス（2-3）の Tinker で動かして確認できる。トグル機能を `toggle` で実装する考え方を説明できる。
  - 前提: [3-1, 2-3]
  - 参考資料: [Eloquent：リレーション（多対多の更新）10.x](https://readouble.com/laravel/10.x/ja/eloquent-relationships.html#updating-many-to-many-relationships)

### Chapter 4: 認可 — Policy で所有者を守る（3 Section）

**ゴール**: Gate と Policy の違いを理解し、所有者だけが編集・削除できる認可を Policy で実装できる。

- **4-1 認可とは／Gate**
  - 種類: 概念
  - ゴール: 認証（誰か）と認可（何をしてよいか）の違いを理解し、Gate による単純な認可を説明できる。既習の auth ミドルウェア（ログイン必須）との違いを理解する。
  - 前提: [2-1]
  - 参考資料: [認可 10.x](https://readouble.com/laravel/10.x/ja/authorization.html)

- **4-2 Policy の作成・登録・適用**
  - 種類: 概念
  - ゴール: `make:policy` でモデルに紐づく Policy を作り、登録（自動探索／`$policies`）し、`authorize()`・`@can` で適用できる。所有者チェック（`$user->id === $model->user_id`）→ 403 を実装できる。
  - 前提: [4-1]
  - 参考資料: [認可（ポリシーの作成）10.x](https://readouble.com/laravel/10.x/ja/authorization.html#creating-policies)

- **4-3 ハンズオン: 投稿の所有者だけ編集・削除できるようにする**
  - 種類: ハンズオン（逆リンク: 4-1, 4-2）/ **独立**
  - ゴール: スターターキット `laravel-authorization-starter`（Fortify 認証・Post モデル・PostController・シーダー・Blade を同梱、認可は未実装）をクローンし、PostPolicy を実装。所有者のみ編集・削除可、非所有者は 403、他人の投稿に編集/削除ボタンを出さない（`@can`）。
  - 前提: [4-2]
  - スターターキット: `https://github.com/coachtech-material/laravel-authorization-starter.git`

### Chapter 5: 集計とパフォーマンス（2 Section）

**ゴール**: 集計クエリでランキング等を作り、`with`/`load` の使い分けで N+1 を回避できる。

- **5-1 集計クエリとランキング**
  - 種類: 混合
  - ゴール: `withCount`/`withAvg`/`withSum`・`has`/`whereHas`・`orderByDesc` を使い、関連レコードの集計やランキングを作れる。サンドボックス（2-3）の Tinker で集計クエリを動かして確認できる。
  - 前提: [3-1, 2-3]
  - 参考資料: [Eloquent：リレーション（関連モデルの集計）10.x](https://readouble.com/laravel/10.x/ja/eloquent-relationships.html#aggregating-related-models)

- **5-2 Eager Loading の使い分けと N+1**
  - 種類: 概念
  - ゴール: コレクションの `with`/`withCount` と単一モデルの `load`/`loadCount` の使い分け、API での Eager Loading を理解する。
  - 前提: [5-1]
  - 参考資料: [Eloquent：リレーション（Eager Loading）10.x](https://readouble.com/laravel/10.x/ja/eloquent-relationships.html#eager-loading)
  - 意図: N+1 と `with()` 自体は既習。本 Section は使い分け（with vs load、withCount 等）に絞る。

### Chapter 6: 自動テストを書く（3 Section）

**ゴール**: PHPUnit でモデル・機能・API のテストを書き、カバレッジ 60% 以上を達成できる。すべて概念（理論と書き方）として解説し、本格的な演習は総合ハンズオン（10-4）で行う。

- **6-1 テストの基礎（PHPUnit / Factory / RefreshDatabase）**
  - 種類: 概念
  - ゴール: テストの目的と Feature/Unit の違い、`RefreshDatabase`・Factory・`actingAs`、テスト用 DB の設定を理解し、基本的なテストの書き方を説明できる。
  - 前提: [2-1]
  - 参考資料: [テスト：はじめに 10.x](https://readouble.com/laravel/10.x/ja/testing.html) / [データベースのテスト 10.x](https://readouble.com/laravel/10.x/ja/database-testing.html)
  - 意図: 2026年2月以前の教材では一度触れた程度。ここで「自分で書ける」水準まで概念を固める。

- **6-2 機能テスト（CRUD・認可・バリデーション）**
  - 種類: 概念
  - ゴール: HTTP アサーション（`assertOk`/`assertRedirect`/`assertForbidden`/`assertSessionHasErrors`）と DB アサーション（`assertDatabaseHas`/`Missing`/`Count`、ピボット検証）で CRUD・認可・バリデーションをテストする方法を理解する。
  - 前提: [6-1, 4-2]
  - 参考資料: [HTTP テスト 10.x](https://readouble.com/laravel/10.x/ja/http-tests.html)

- **6-3 API テストとカバレッジ**
  - 種類: 概念
  - ゴール: `getJson`/`postJson` 系と `assertJsonStructure`/`assertJsonPath`/`assertJsonCount`/`assertJsonValidationErrors` で JSON API をテストする方法、`sail artisan test --coverage` でのカバレッジ確認（目標 60%）を理解する。
  - 前提: [6-2]（テスト対象の公開 API は Part 3 で実装する。本 Section はその型を先取りで紹介する位置づけ）
  - 参考資料: [HTTP テスト（JSON API のテスト）10.x](https://readouble.com/laravel/10.x/ja/http-tests.html#testing-json-apis)
  - 意図: 公開 API（apiResource・JsonResource・JSON 例外）は Part 3 で扱うため、本 Section の時点では読者はまだ API を実装していない。ここでは「API をどうテストするか」の型を示すに留め、本文では「今は概要だけ把握すれば十分。API の実物は Part 3 で実装し、テスト一式は総合ハンズオン 10-4 で書く」と明示的に誘導する（writing.md「先の Section で扱う内容は概要だけ」に従う）。

---

## Part 3: 公開 REST API

→ ゴール: これまで未経験の REST API を、ルート設計から API Resource・検索/ページネーション・JSON 例外まで一通り設計・実装できる。API は専用スターターキットでハンズオンする。

### Chapter 7: API の基礎と Resource（2 Section）

**ゴール**: REST API のルートを設計し、API Resource でレスポンスを整形できる。

- **7-1 REST API とルート設計**
  - 種類: 概念
  - ゴール: REST/JSON API の考え方、`routes/api.php`・`apiResource`・バージョニング（`/v1` と `Api\V1` 名前空間による Web/API コントローラの分離）・`--api` コントローラ・CORS を理解し、API ルートを設計できる。Web ルートとの違いを説明できる。コントローラのアクション引数でモデルを受け取る暗黙のルートモデルバインディング（`show(Task $task)` で URL の ID から自動解決。Web/API 共通）も押さえる。
  - 前提: [2-2]
  - 参考資料: [ルーティング 10.x](https://readouble.com/laravel/10.x/ja/routing.html) / [コントローラ（API リソースルート）10.x](https://readouble.com/laravel/10.x/ja/controllers.html#api-resource-routes)

- **7-2 API Resource でレスポンスを整形する**
  - 種類: 概念
  - ゴール: `JsonResource`/`ResourceCollection` でレスポンスを整形（フィールド選択・リレーションのネスト・`whenLoaded`・集計値整形・`data`/`meta`）できる。
  - 前提: [7-1, 5-1]
  - 参考資料: [Eloquent：API リソース 10.x](https://readouble.com/laravel/10.x/ja/eloquent-resources.html)

### Chapter 8: 検索・ページネーションとエラー設計（3 Section）

**ゴール**: 検索・絞り込み・ページネーションを実装し、HTTP ステータスと JSON 例外を適切に設計し、公開 API を実装できる。

- **8-1 検索・絞り込み・ページネーション**
  - 種類: 概念
  - ゴール: クエリパラメータによる動的クエリビルド（`when`/`filled` 分岐・LIKE 検索・`whereHas`）とページネーション（`paginate` と `data`/`meta`、`per_page` の指定・デフォルト値・上限クランプ）を実装できる。
  - 前提: [7-2]
  - 参考資料: [ページネーション 10.x](https://readouble.com/laravel/10.x/ja/pagination.html) / [データベース：クエリビルダ 10.x](https://readouble.com/laravel/10.x/ja/queries.html)

- **8-2 エラー設計と JSON 例外**
  - 種類: 概念
  - ゴール: HTTP ステータス（200/201/204/404/422）を適切に返し、`Handler` で API 向けに例外を JSON 化（ModelNotFound→404、バリデーション→422）できる。
  - 前提: [8-1]
  - 参考資料: [エラー処理 10.x](https://readouble.com/laravel/10.x/ja/errors.html) / [バリデーション 10.x](https://readouble.com/laravel/10.x/ja/validation.html)

- **8-3 ハンズオン: 公開タスク API を実装する**
  - 種類: ハンズオン（逆リンク: 7-1, 7-2, 8-1, 8-2）/ **独立**
  - ゴール: スターターキット `laravel-api-starter`（Task・User のモデル/マイグレーション/シーダーまでが土台。**コントローラと API ルートは未実装**・認証なし）をクローンし、公開 REST API（一覧=検索/ページネーション付き・詳細・登録・更新・削除）を実装する。`Api\V1` 名前空間のコントローラと API 用 FormRequest、API Resource、JSON 例外、`per_page` の上限クランプを含める。
  - 前提: [7-1, 7-2, 8-1, 8-2]
  - スターターキット: `https://github.com/coachtech-material/laravel-api-starter.git`

---

## Part 4: 総合ハンズオン（タスク管理アプリをゼロから）

→ ゴール: タスク管理アプリをゼロから Sail で構築し、Part 1〜3 で学んだ技術（多対多・認可・集計・公開 API・自動テスト）をすべて統合する。**最初から順にコピペすればアプリが完成する**よう、詳細かつ緻密に書く。

> 題材: タスク管理アプリ（User / Category〈1対多〉/ Task / Tag〈多対多〉）。新しい模擬案件そのものは題材にしない。Blade アセットは 9-2 で一括提供（コピペ配置）。「提供コードありき」で、提供 Blade を読み解いてバックエンドを実装するフロー。各 Step は実行場所・ファイル配置先・新規依存を明示し、その時点で定義済みのものだけを参照する（前方参照しない）。writing.md「コピペで完成するハンズオン」に従う。

### Chapter 9: 総合ハンズオン① — 設計から CRUD まで（5 Section）

**ゴール**: タスク管理アプリをゼロから Sail で構築し、認証付きの CRUD まで完成させる。

- **9-1 要件定義と設計**
  - 種類: ハンズオン（設計中心。コードは書かない）
  - ゴール: 与えられたタスク管理アプリの要件（あいまいさを含む）を読み解き、ER 図・テーブル定義・画面/API・バリデーションを設計する。「要件の行間を読む」観点もここで実地に扱う。
  - 前提: [1-1]
  - 意図: 「設計を説明できる／決められた」として書く（「完成チェックリスト」表現は使わない）。

- **9-2 環境構築と提供 Blade アセットの配置**
  - 種類: ハンズオン
  - ゴール: Sail で Laravel 10 プロジェクトを新規作成し、phpMyAdmin・日本語ロケール（`locale=ja` と `lang/ja` 言語ファイル）を設定。提供 Blade アセット一式をコピペで配置し、`@vite` で表示確認する。
  - 前提: [2-1]

- **9-3 マイグレーションとモデル（リレーション定義）**
  - 種類: ハンズオン
  - ゴール: users/categories/tasks/tags/task_tag/favorites のマイグレーションを作成し、**FK 制約と ON DELETE CASCADE**（タスク削除で task_tag・favorites も自動削除）を設定する。モデルに 1対多・多対多リレーションと `$fillable`/`casts` を定義する。`migrate:fresh --seed` 用のシーダー/ファクトリも用意。
  - 前提: [3-1, 9-2]

- **9-4 認証（Fortify）**
  - 種類: ハンズオン
  - ゴール: Fortify を導入し、登録・ログイン・ログアウトと認証ページ保護を実装する（既習のため要点と Laravel 10 での書き方を中心に、コピペで通る形で）。
  - 前提: [9-3]

- **9-5 CRUD（カテゴリ・タスク）と多対多操作**
  - 種類: ハンズオン
  - ゴール: カテゴリとタスクの CRUD をリソースコントローラ・FormRequest 込みで実装する。多対多操作として、タスクへのタグ付けを `sync`（純粋ピボット）、お気に入りの追加/解除を `toggle`（複合 unique ピボット）で実装する。FormRequest では **DB 連動バリデーション**（更新時の `Rule::unique()->ignore()`・`exists`・配列要素 `tags.*`）を扱い、カテゴリ削除時は **関連タスクがあれば削除を拒否**する削除ガード（日本語フラッシュ文言）も実装する。
  - 前提: [3-2, 9-4]

### Chapter 10: 総合ハンズオン② — 認可・集計・API・テスト・仕上げ（6 Section）

**ゴール**: CRUD に認可・集計・公開 API・自動テストを積み上げ、提出できる品質に仕上げる。教材全体を締め括る。

- **10-1 認可（Policy）**
  - 種類: ハンズオン
  - ゴール: TaskPolicy を実装し、所有者のみ編集・削除可・非所有者 403・`@can` でボタン制御を行う。
  - 前提: [4-2, 9-5]

- **10-2 集計機能**
  - 種類: ハンズオン
  - ゴール: カテゴリ別タスク数・タスクのお気に入り数（`withCount`）や、お気に入りの多い順ランキング等の集計機能を、N+1 を回避して実装する。
  - 前提: [5-1, 5-2, 9-5]

- **10-3 公開 API**
  - 種類: ハンズオン
  - ゴール: タスクの公開 REST API（`Api\V1` 名前空間のコントローラ・API 用 FormRequest・検索/ページネーション・API Resource・JSON 例外・ステータス制御）を実装する。
  - 前提: [7-2, 8-1, 8-2, 9-5]

- **10-4 自動テスト**
  - 種類: ハンズオン
  - ゴール: CRUD・認可・集計・API の Feature/Unit テストを書き、`test --coverage` で 60% 以上にする。
  - 前提: [6-1, 6-2, 6-3, 10-1, 10-3]

- **10-5 仕上げ（Pint・README・Issue 駆動の振り返り・提出前チェック）**
  - 種類: ハンズオン
  - ゴール: Laravel Pint で整形、README（環境構築手順・ER 図・API 一覧・使用技術）を整備、Issue 駆動/PR の流れを振り返り、提出前チェックリストで仕上げる。
  - 前提: [10-4]

- **10-6 まとめ — 身につけた力と次のステップ**
  - 種類: 概念
  - ゴール: 教材全体で身につけた技術（公開 API・認可・テスト・多対多・集計・Sail）を振り返り、新しい模擬案件にどう臨むかの指針を持つ。
  - 前提: [10-5]
  - 意図: 教材全体の最終 Section。締め括り（学んだことの振り返り + 次のステップ）。固有名・「合格」は出さず「新しい模擬案件」と表現。

---

## ハンズオン設計

**方針**: 章末ハンズオンと総合ハンズオンは**完全に独立**（積み上げない）。章末ハンズオンは「単一概念をスターターキット上で集中練習」、総合ハンズオンは「ゼロから 1 つのアプリを構築して全概念を統合」。

**スターターキット**（`coachtech-material` org。2026年3月以降の教材で実際に使われているものを流用）:

| 用途 | リポジトリ | 同梱物 | 使う Section |
|---|---|---|---|
| 認可（Policy） | `laravel-authorization-starter` | Fortify 認証 / Post モデル(user_id) / PostController(認可未実装) / シーダー(2ユーザー・4投稿) / Blade | 4-3 |
| 公開 API | `laravel-api-starter` | Task・User モデル / マイグレーション / シーダー（コントローラ・API ルート・認証なし） | 8-3 |

- **多対多（3-2）・集計（5-1）**: 専用スターターキットは存在しないため、**2-3 で立ち上げたサンドボックス上の Tinker で小さく実践**（混合）。各 Section が必要な小モデルをその場で作って試す使い捨て実験で、成果物は積み上げない。
- **テスト（Ch6）**: すべて概念（理論と書き方）。本格的なテスト一式は総合ハンズオン 10-4 で書く。
- **総合ハンズオン（Ch9〜10）**: スターターキットを使わず**ゼロから Sail で構築**。Blade アセットは 9-2 で一括コピペ提供。**最初から順にコピペすればアプリが完成する**よう、実行場所・ファイル配置先・依存を明示し、前方参照しない。

**注**: 公開 API・認可は「章末ハンズオン（スターターキットで単発練習）」と「総合ハンズオン（ゼロから統合実装）」の両方で扱う（独立・反復による定着）。テストは概念（Ch6）＋総合ハンズオン（10-4）で扱う。

**総合ハンズオンのアプリ仕様**（学んだ技術を一通り含むよう設計）:
- User / Category（1対多: Category→Task）/ Task（belongsTo User・Category）/ Tag（多対多: Task↔Tag via `task_tag` ＝純粋ピボット）/ Favorite（多対多トグル: User↔Task via `favorites` ＝複合 unique ピボット）
- 多対多は **2パターン**（純粋ピボット `task_tag` ＋ 複合 unique `favorites`）を備え、3-1 の学びを総合で再現する。FK は ON DELETE CASCADE。
- 認証（Fortify）・タスク/カテゴリ CRUD・タグ付け（`sync`）・お気に入り（`toggle`）・所有者認可（Policy）・カテゴリ削除ガード・集計（カテゴリ別タスク数/お気に入り数ランキング、`withCount`）・公開 API（`Api\V1`・Resource・検索・ページネーション・JSON 例外）・テスト（カバレッジ 60%）
