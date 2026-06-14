---
hide:
  - navigation
  - toc
---

# COACHTECH × Laravel ステップアップガイド

<div class="hero" markdown>

**CRUD の次に必要な Laravel の実践技術**

公開 REST API・認可・自動テスト・多対多リレーション・集計・Laravel Sail を解説します。すでに学んだ内容は繰り返さず、新しく必要になる技術だけに絞ります。

</div>

---

## カリキュラム

3層構成（Part > Chapter > Section）/ 全 4 部・10 章・32 節。

| Part | 内容 | |
|---|---|---|
| **Part 1 前提と開発環境を整える** | この教材で身につける技術の全体像、PHP OOP の基礎、Laravel Sail、Laravel 8 から 10 への変更点 | [学習を始める](part-01/chapter-01/1-1.md) |
| **Part 2 Laravel の新概念** | 多対多リレーションの実践、Policy による認可、集計と N+1、PHPUnit による自動テスト | [学習を始める](part-02/chapter-03/3-1.md) |
| **Part 3 公開 REST API** | ルート設計（apiResource）、API Resource、検索・絞り込み・ページネーション、JSON 例外とステータス制御 | [学習を始める](part-03/chapter-07/7-1.md) |
| **Part 4 総合ハンズオン** | タスク管理アプリをゼロから構築し、設計・CRUD・認可・集計・API・テストを一つに統合 | [学習を始める](part-04/chapter-09/9-1.md) |

---

## この教材で身につくこと

| 領域 | 到達点 |
|---|---|
| **公開 REST API** | `routes/api.php` のルート設計、API Resource によるレスポンス整形、検索・絞り込み・ページネーション、HTTP ステータスと JSON 例外の制御ができる |
| **認可（Policy）** | Gate / Policy を作成・登録・適用し、所有者ベースのアクセス制御を実装できる |
| **多対多リレーション** | ピボットテーブルを設計し、`belongsToMany` と `attach` / `sync` / `toggle` で関連を操作できる |
| **集計とパフォーマンス** | `withCount` / `withAvg` による集計・ランキングと、`with` / `load` の使い分けによる N+1 回避ができる |
| **自動テスト** | PHPUnit の Feature / Unit テストを `RefreshDatabase`・Factory・`actingAs` とともに書き、JSON / DB アサーションで検証できる |
| **開発環境** | Laravel Sail（Docker）で環境を構築し、Laravel 10 の作法と PHP OOP の基礎を踏まえて実装できる |

---

## 対象読者

COACHTECH の 2026年2月以前の教材（Laravel 基礎・演習）で学習を進め、認証付きの CRUD アプリを独力で作れるようになった方を対象とします。ルーティング・コントローラ・Blade・マイグレーション・基本的な Eloquent（hasMany / belongsTo）・FormRequest バリデーション・Fortify 認証・N+1 対策・Seeder / Factory・Git の基本操作は、すでに身についている前提です。その先に必要になる実践技術に絞って解説するため、重複を省いて学べます。

まずは [1-1 この教材の全体像と進め方](part-01/chapter-01/1-1.md) で、これから身につける技術の全体像と進め方を確認してください。
