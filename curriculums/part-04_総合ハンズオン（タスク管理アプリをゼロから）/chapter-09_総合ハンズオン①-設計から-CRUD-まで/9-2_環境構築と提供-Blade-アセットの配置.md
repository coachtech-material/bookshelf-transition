# 9-2 環境構築と提供 Blade アセットの配置

📝 **このハンズオンで使う機能**: Laravel Sail（2-1 Laravel Sail で環境構築する で学習）、日本語ロケール（2-3 ハンズオン: Laravel Sail プロジェクトを立ち上げる で学習）

📝 **前提知識**: このセクションは 2-1 Laravel Sail で環境構築する と 2-3 ハンズオン: Laravel Sail プロジェクトを立ち上げる の内容を前提としています。

## 🎯 このセクションで学ぶこと

- Sail で Laravel 10 のプロジェクトを新規作成し、phpMyAdmin と日本語ロケールを設定する
- Tailwind CSS を導入し、Vite でビルドできるようにする
- 提供される Blade アセット一式と `routes/web.php` を配置し、`@vite` で画面が表示されることを確認する

このセクションでは、9-1 で設計したアプリの土台を作り、画面（Blade）を一式そろえます。このあとのセクションは、ここで配置した画面が動くように、モデル・認証・コントローラを実装していく流れです。

---

## 導入: 「画面はある、中身はこれから」の状態を作る

実務では、画面のデザインが先にできていて、そこにバックエンドをつないでいくことがよくあります。この総合ハンズオンでも同じ進め方を取ります。このセクションで画面（Blade）と URL（ルート）を先に配置し、9-3 以降で、その画面が必要とするテーブル・モデル・コントローラを実装していきます。

そのため、このセクションを終えた時点では、トップページ（ウェルカム画面）だけが表示でき、タスクやカテゴリの画面はまだ開けません（中身のコントローラがないため）。それで正常です。画面という「型」を先に置き、これから命を吹き込んでいきます。

### 🧠 先輩エンジニアの思考プロセス

> 新しいアプリを作るとき、私はまず「画面とルートの地図」を先に置いてしまいます。先にゴール（どんな画面があるか）が見えていると、バックエンドを実装するときに「今どの画面のために何を作っているか」を見失いません。テーブルから作り始めると、画面とつながるまで成果が見えず、手探りになりがちです。

---

## 📌 作業前の確認

- [ ] Docker（Docker Desktop または Docker Engine）が起動している
- [ ] 2-1 で設定した `sail` エイリアスが使える（未設定の場合は `./vendor/bin/sail` で読み替えてください）
- [ ] 他の Sail プロジェクト（2-3 のサンドボックスなど）が起動していない（起動中なら、そのディレクトリで `sail stop` する。ポート 80・8080 が競合するため）
- [ ] `git` が使える / インターネットに接続している

> ⚠️ **注意**: Windows をお使いの場合は、以降のコマンドを WSL2 のターミナルで実行してください。`$(pwd)` や `$(id -u)` の記法は WSL2・macOS・Linux で動作します。

---

## 🏃 実践: タスク管理アプリの土台を作る

### 🏃 Step 1: Laravel 10 プロジェクトを作成して Sail を導入する

プロジェクトを置きたいディレクトリ（例: ホームディレクトリ）で、Laravel 10 のプロジェクトを作成します。2-3 と同じく、手元に PHP がなくても作れるよう、PHP と Composer の入った Docker イメージを一時的に借りて実行します。プロジェクト名は `task-app` とします。

```bash
# プロジェクトを置きたいディレクトリで実行（例: cd ~ してから）
docker run --rm \
    -u "$(id -u):$(id -g)" \
    -v "$(pwd):/var/www/html" \
    -w /var/www/html \
    -e COMPOSER_CACHE_DIR=/tmp/composer_cache \
    laravelsail/php82-composer:latest \
    composer create-project laravel/laravel:^10.0 task-app
```

できた `task-app` に移動します。以降の作業はすべてこの中で行います。

```bash
cd task-app
```

続けて、Sail をインストールし、MySQL を使う構成で `compose.yaml` を生成します。`vendor/bin/sail` がまだ使えないので、この 2 つも Docker イメージ越しに実行します。

```bash
# task-app ディレクトリで実行
docker run --rm \
    -u "$(id -u):$(id -g)" \
    -v "$(pwd):/var/www/html" \
    -w /var/www/html \
    -e COMPOSER_CACHE_DIR=/tmp/composer_cache \
    laravelsail/php82-composer:latest \
    composer require laravel/sail --dev
```

```bash
# task-app ディレクトリで実行
docker run --rm \
    -u "$(id -u):$(id -g)" \
    -v "$(pwd):/var/www/html" \
    -w /var/www/html \
    laravelsail/php82-composer:latest \
    php artisan sail:install --with=mysql
```

### 🏃 Step 2: phpMyAdmin を追加し、`.env` を設定する

まず `.env` を用意します。

```bash
# task-app ディレクトリで実行
cp .env.example .env
```

生成された `compose.yaml` に phpMyAdmin を追記します。`services:` の下、`mysql` サービスのブロックの後ろに、次を加えます（`mysql:` と同じ深さに `phpmyadmin:` を置きます）。

```yaml
# compose.yaml （services: の下、mysql サービスの後ろに追記する）
    phpmyadmin:
        image: 'phpmyadmin:latest'
        ports:
            - '${FORWARD_PHPMYADMIN_PORT:-8080}:80'
        environment:
            PMA_HOST: mysql
            PMA_USER: '${DB_USERNAME}'
            PMA_PASSWORD: '${DB_PASSWORD}'
        networks:
            - sail
        depends_on:
            - mysql
```

続けて `.env` を開き、データベース接続情報が次のようになっていることを確認します（`sail:install` が設定します。異なる場合はこの内容に合わせてください）。

```ini
# .env （データベース接続情報を確認する）
DB_CONNECTION=mysql
DB_HOST=mysql
DB_PORT=3306
DB_DATABASE=task_app
DB_USERNAME=sail
DB_PASSWORD=password
```

🔑 `DB_HOST` はコンテナ名の `mysql` を指定します（`localhost` ではありません）。`DB_DATABASE` は、`sail:install` が付ける既定値（プロジェクト名に由来する `task_app`）のままで構いません。

### 🏃 Step 3: コンテナを起動し、アプリケーションキーを生成する

ここからは `vendor` が用意できているので、`sail` コマンドが使えます。コンテナをバックグラウンドで起動し、アプリケーションキーを生成します。

```bash
# task-app ディレクトリで実行
sail up -d
sail artisan key:generate
```

> ⚠️ **注意**: 初回の `sail up` は、コンテナのイメージ構築のため数分かかることがあります。完了するまで待ってください。Apple Silicon の Mac でプラットフォームのエラーが出る場合は、`compose.yaml` の該当サービスに `platform: linux/amd64` を追記してから再実行します。

このセクションではまだデータベースのテーブルを使いません（マイグレーションは 9-3 で行います）。`sail ps` で `laravel.test`・`mysql`・`phpmyadmin` の 3 つが `running` になっていれば、起動は完了です。

### 🏃 Step 4: 日本語ロケールを設定する

エラーメッセージなどを日本語で表示できるよう、ロケールを設定します。まず `config/app.php` の `locale` を `ja` に変更します。

```php
// config/app.php （'locale' の値を 'ja' に変更する）
'locale' => 'ja',
```

次に、2-3 で確認したとおり、Laravel 10 の言語ファイルはプロジェクトルートの `lang/` に置きます。ディレクトリと 2 つのファイルを作成します。

```bash
# task-app ディレクトリで実行
mkdir -p lang/ja
touch lang/ja/validation.php
touch lang/ja/auth.php
```

`lang/ja/validation.php` を、本アプリで使うバリデーションメッセージと項目名（`attributes`）を含む内容で編集します。`attributes` に項目名を登録しておくと、`:attribute` がその日本語名に置き換わります。

<details>
<summary>lang/ja/validation.php の全体（クリックで展開）</summary>

```php
// lang/ja/validation.php
<?php

return [
    'required' => ':attributeは必須です。',
    'string' => ':attributeは文字列で入力してください。',
    'integer' => ':attributeは整数で入力してください。',
    'array' => ':attributeは配列で入力してください。',
    'date' => ':attributeは正しい日付形式で入力してください。',
    'email' => ':attributeはメールアドレス形式で入力してください。',
    'confirmed' => ':attributeが確認用と一致しません。',
    'unique' => 'その:attributeは既に使用されています。',
    'exists' => '選択された:attributeは存在しません。',
    'in' => '選択された:attributeは正しくありません。',
    'max' => [
        'string' => ':attributeは:max文字以内で入力してください。',
        'numeric' => ':attributeは:max以下で指定してください。',
    ],
    'min' => [
        'string' => ':attributeは:min文字以上で入力してください。',
        'numeric' => ':attributeは:min以上で指定してください。',
    ],

    'attributes' => [
        'name' => '名前',
        'email' => 'メールアドレス',
        'password' => 'パスワード',
        'title' => 'タイトル',
        'description' => '説明',
        'status' => '状態',
        'due_date' => '期限',
        'category_id' => 'カテゴリ',
        'tags' => 'タグ',
        'per_page' => '1ページあたりの件数',
        'page' => 'ページ番号',
        'user_id' => '登録者',
        'keyword' => 'キーワード',
    ],
];
```

</details>

`lang/ja/auth.php` を、ログイン失敗時のメッセージを含む内容で編集します。

```php
// lang/ja/auth.php
<?php

return [
    'failed' => 'ログイン情報が登録されていません。',
    'password' => 'パスワードが正しくありません。',
    'throttle' => 'ログインの試行回数が多すぎます。:seconds 秒後にお試しください。',
];
```

💡 設定が反映されないときは、`sail artisan config:clear` を実行してから確認してください。

### 🏃 Step 5: Tailwind CSS を導入する

画面のスタイルには Tailwind CSS を使います。Sail 経由で必要なパッケージをインストールします（`@tailwindcss/forms` はフォーム部品を整えるプラグインです）。

```bash
# task-app ディレクトリで実行
sail npm install -D tailwindcss@^3.4 @tailwindcss/forms postcss autoprefixer
```

Tailwind と PostCSS の設定ファイルを作成します。

```bash
# task-app ディレクトリで実行
touch tailwind.config.js
touch postcss.config.js
```

`tailwind.config.js` を、次の内容で編集します。`content` に、Tailwind がクラスを探す対象（Blade ファイルなど）を指定します。

```javascript
// tailwind.config.js
import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
    ],
    theme: {
        extend: {},
    },
    plugins: [forms],
};
```

`postcss.config.js` を、次の内容で編集します。

```javascript
// postcss.config.js
export default {
    plugins: {
        tailwindcss: {},
        autoprefixer: {},
    },
};
```

最後に、`resources/css/app.css` を、Tailwind の読み込みだけの内容に **まるごと書き換えます**。

```css
/* resources/css/app.css */
@tailwind base;
@tailwind components;
@tailwind utilities;
```

📝 `vite.config.js` は Laravel 10 が最初から `resources/css/app.css` と `resources/js/app.js` を入力に設定しているので、変更は不要です。

### 🏃 Step 6: ルートを定義する

画面の URL を `routes/web.php` に定義します。内容を次のように **まるごと書き換えます**。トップページ（`/`）以外は、すべてログイン必須（`auth` ミドルウェア）のグループにまとめます。

```php
// routes/web.php
<?php

use App\Http\Controllers\CategoryController;
use App\Http\Controllers\FavoriteController;
use App\Http\Controllers\RankingController;
use App\Http\Controllers\TaskController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
})->name('home');

// ここで参照しているコントローラは 9-5・10-2 で作成します。
// ルート名（route() で使う名前）はこの時点で確定するため、画面のリンクは先に動きます。
Route::middleware('auth')->group(function () {
    Route::resource('categories', CategoryController::class)->except(['show']);
    Route::resource('tasks', TaskController::class);
    Route::post('/tasks/{task}/favorite', [FavoriteController::class, 'toggle'])->name('favorites.toggle');
    Route::get('/favorites', [FavoriteController::class, 'index'])->name('favorites.index');
    Route::get('/ranking', [RankingController::class, 'index'])->name('ranking.index');
});
```

🔑 この時点で `CategoryController` などのクラスはまだ存在しませんが、それで問題ありません。`TaskController::class` は文字列としてのクラス名に解決されるだけで、ルートの **名前** （`tasks.index` など）はここで確定します。画面のリンク（`route('tasks.index')` など）は、この名前を使って URL を組み立てるので、コントローラを作る前から正しく表示されます。実際にそのルートを開く（コントローラを呼ぶ）のは、コントローラを実装した後です。

> ⚠️ **注意**: コントローラを作る前に `sail artisan route:list` を実行すると、未作成のコントローラを読み込もうとしてエラーになることがあります。`route:list` での確認は、コントローラを実装する 9-5 以降で行ってください。

### 🏃 Step 7: 提供 Blade アセットを配置する

画面一式を配置します。まず、ビューのディレクトリと空ファイルを作成します。

```bash
# task-app ディレクトリで実行
mkdir -p resources/views/layouts resources/views/auth resources/views/tasks resources/views/categories resources/views/favorites resources/views/ranking
touch resources/views/layouts/app.blade.php
touch resources/views/auth/login.blade.php
touch resources/views/auth/register.blade.php
touch resources/views/tasks/index.blade.php
touch resources/views/tasks/create.blade.php
touch resources/views/tasks/edit.blade.php
touch resources/views/tasks/show.blade.php
touch resources/views/categories/index.blade.php
touch resources/views/categories/create.blade.php
touch resources/views/categories/edit.blade.php
touch resources/views/favorites/index.blade.php
touch resources/views/ranking/index.blade.php
```

`resources/views/welcome.blade.php` は Laravel が最初から用意しているので、新規作成はせず、中身を差し替えます。

ここから、各ファイルの中身を順に配置します。コードを上から順にコピー＆ペーストしてください。

**共通レイアウトとトップページ**

`resources/views/layouts/app.blade.php` は、全画面共通の枠（ナビゲーション・フラッシュメッセージ・`@vite`）です。`@auth` / `@guest` でログイン状態に応じてナビを出し分けます。

<details>
<summary>resources/views/layouts/app.blade.php の全体（クリックで展開）</summary>

```blade
{{-- resources/views/layouts/app.blade.php --}}
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>@yield('title', 'タスク管理アプリ')</title>
    @vite(['resources/css/app.css', 'resources/js/app.js'])
</head>
<body class="min-h-screen bg-gray-100 text-gray-900 antialiased">
    <nav class="bg-white shadow">
        <div class="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
            <a href="{{ route('home') }}" class="text-lg font-bold text-indigo-600">タスク管理アプリ</a>
            <div class="flex items-center gap-4 text-sm">
                @auth
                    <a href="{{ route('tasks.index') }}" class="text-gray-700 hover:text-indigo-600">タスク一覧</a>
                    <a href="{{ route('categories.index') }}" class="text-gray-700 hover:text-indigo-600">カテゴリ</a>
                    <a href="{{ route('favorites.index') }}" class="text-gray-700 hover:text-indigo-600">お気に入り</a>
                    <a href="{{ route('ranking.index') }}" class="text-gray-700 hover:text-indigo-600">ランキング</a>
                    <span class="text-gray-500">{{ Auth::user()->name }}</span>
                    <form action="{{ route('logout') }}" method="POST" class="inline">
                        @csrf
                        <button type="submit" class="text-gray-700 hover:text-indigo-600">ログアウト</button>
                    </form>
                @else
                    <a href="{{ route('login') }}" class="text-gray-700 hover:text-indigo-600">ログイン</a>
                    <a href="{{ route('register') }}" class="text-gray-700 hover:text-indigo-600">会員登録</a>
                @endauth
            </div>
        </div>
    </nav>

    <main class="max-w-5xl mx-auto px-4 py-8">
        @if (session('success'))
            <div class="mb-4 rounded-md border border-green-400 bg-green-100 px-4 py-3 text-green-700">
                {{ session('success') }}
            </div>
        @endif
        @if (session('error'))
            <div class="mb-4 rounded-md border border-red-400 bg-red-100 px-4 py-3 text-red-700">
                {{ session('error') }}
            </div>
        @endif

        @yield('content')
    </main>
</body>
</html>
```

</details>

`resources/views/welcome.blade.php` は、共通レイアウトを使わない独立したトップページです。中身を次のように **まるごと書き換えます**。

<details>
<summary>resources/views/welcome.blade.php の全体（クリックで展開）</summary>

```blade
{{-- resources/views/welcome.blade.php --}}
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>タスク管理アプリ</title>
    @vite(['resources/css/app.css', 'resources/js/app.js'])
</head>
<body class="bg-gray-100 text-gray-900 antialiased">
    <div class="min-h-screen flex flex-col items-center justify-center px-4 text-center">
        <h1 class="text-3xl font-bold text-indigo-600 mb-2">タスク管理アプリ</h1>
        <p class="text-gray-600 mb-8">タスクを分類・タグ付けし、お気に入りやランキングで整理できます。</p>
        @guest
            <div class="flex gap-4">
                <a href="/login" class="rounded-md bg-indigo-600 px-6 py-2 text-white hover:bg-indigo-700">ログイン</a>
                <a href="/register" class="rounded-md border border-gray-300 bg-white px-6 py-2 text-gray-700 hover:bg-gray-50">会員登録</a>
            </div>
        @else
            <a href="{{ route('tasks.index') }}" class="rounded-md bg-indigo-600 px-6 py-2 text-white hover:bg-indigo-700">タスク一覧へ</a>
        @endguest
    </div>
</body>
</html>
```

</details>

📝 トップページのログイン・会員登録リンクは、`route('login')` ではなく `/login` と直接書いています。認証（ログイン用のルート）は 9-4 で導入するため、この時点ではまだ `login` という名前のルートが存在しないからです。直接パスを書いておけば、認証を入れる前のこのセクションでも表示確認ができます。

**認証画面（ログイン・会員登録）**

`resources/views/auth/login.blade.php` と `resources/views/auth/register.blade.php` を配置します。これらは 9-4 で Fortify を導入すると動き始めます。

<details>
<summary>resources/views/auth/login.blade.php の全体（クリックで展開）</summary>

```blade
{{-- resources/views/auth/login.blade.php --}}
@extends('layouts.app')
@section('title', 'ログイン')

@section('content')
<div class="max-w-md mx-auto bg-white rounded-lg shadow p-6">
    <h1 class="text-xl font-bold mb-6">ログイン</h1>

    <form method="POST" action="{{ route('login') }}" class="space-y-5">
        @csrf
        <div>
            <label for="email" class="block text-sm font-medium text-gray-700 mb-1">メールアドレス</label>
            <input id="email" type="email" name="email" value="{{ old('email') }}" required autofocus
                class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
            @error('email') <p class="mt-1 text-sm text-red-600">{{ $message }}</p> @enderror
        </div>
        <div>
            <label for="password" class="block text-sm font-medium text-gray-700 mb-1">パスワード</label>
            <input id="password" type="password" name="password" required
                class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
            @error('password') <p class="mt-1 text-sm text-red-600">{{ $message }}</p> @enderror
        </div>
        <div class="flex items-center">
            <input id="remember" type="checkbox" name="remember"
                class="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500">
            <label for="remember" class="ml-2 text-sm text-gray-600">ログイン状態を保持する</label>
        </div>
        <button type="submit" class="w-full rounded-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700">ログイン</button>
    </form>

    <p class="mt-4 text-center text-sm text-gray-600">
        アカウントをお持ちでない方は
        <a href="{{ route('register') }}" class="text-indigo-600 hover:underline">会員登録</a>
    </p>
</div>
@endsection
```

</details>

<details>
<summary>resources/views/auth/register.blade.php の全体（クリックで展開）</summary>

```blade
{{-- resources/views/auth/register.blade.php --}}
@extends('layouts.app')
@section('title', '会員登録')

@section('content')
<div class="max-w-md mx-auto bg-white rounded-lg shadow p-6">
    <h1 class="text-xl font-bold mb-6">会員登録</h1>

    <form method="POST" action="{{ route('register') }}" class="space-y-5">
        @csrf
        <div>
            <label for="name" class="block text-sm font-medium text-gray-700 mb-1">名前</label>
            <input id="name" type="text" name="name" value="{{ old('name') }}" required autofocus
                class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
            @error('name') <p class="mt-1 text-sm text-red-600">{{ $message }}</p> @enderror
        </div>
        <div>
            <label for="email" class="block text-sm font-medium text-gray-700 mb-1">メールアドレス</label>
            <input id="email" type="email" name="email" value="{{ old('email') }}" required
                class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
            @error('email') <p class="mt-1 text-sm text-red-600">{{ $message }}</p> @enderror
        </div>
        <div>
            <label for="password" class="block text-sm font-medium text-gray-700 mb-1">パスワード</label>
            <input id="password" type="password" name="password" required
                class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
            @error('password') <p class="mt-1 text-sm text-red-600">{{ $message }}</p> @enderror
        </div>
        <div>
            <label for="password_confirmation" class="block text-sm font-medium text-gray-700 mb-1">パスワード（確認）</label>
            <input id="password_confirmation" type="password" name="password_confirmation" required
                class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
        </div>
        <button type="submit" class="w-full rounded-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700">登録する</button>
    </form>

    <p class="mt-4 text-center text-sm text-gray-600">
        すでにアカウントをお持ちの方は
        <a href="{{ route('login') }}" class="text-indigo-600 hover:underline">ログイン</a>
    </p>
</div>
@endsection
```

</details>

**タスクの画面（一覧・登録・編集・詳細）**

タスクの 4 画面を配置します。登録・編集フォームには、カテゴリの選択（`<select>`）とタグの複数選択（チェックボックス）が含まれます。

<details>
<summary>resources/views/tasks/index.blade.php の全体（クリックで展開）</summary>

```blade
{{-- resources/views/tasks/index.blade.php --}}
@extends('layouts.app')
@section('title', 'タスク一覧')

@section('content')
<div class="flex items-center justify-between mb-6">
    <h1 class="text-2xl font-bold">タスク一覧</h1>
    <a href="{{ route('tasks.create') }}" class="rounded-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700">タスクを登録</a>
</div>

@if ($tasks->isEmpty())
    <p class="text-gray-500">タスクがまだありません。</p>
@else
    <div class="bg-white rounded-lg shadow overflow-hidden">
        <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
                <tr>
                    <th class="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">タイトル</th>
                    <th class="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">カテゴリ</th>
                    <th class="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">状態</th>
                    <th class="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">期限</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
                @foreach ($tasks as $task)
                    <tr class="hover:bg-gray-50">
                        <td class="px-4 py-3">
                            <a href="{{ route('tasks.show', $task) }}" class="text-indigo-600 hover:underline">{{ $task->title }}</a>
                        </td>
                        <td class="px-4 py-3 text-sm text-gray-700">{{ $task->category->name }}</td>
                        <td class="px-4 py-3 text-sm">
                            <span class="inline-block rounded bg-gray-100 px-2 py-1 text-xs text-gray-700">
                                {{ ['pending' => '未着手', 'in_progress' => '進行中', 'completed' => '完了'][$task->status] }}
                            </span>
                        </td>
                        <td class="px-4 py-3 text-sm text-gray-700">{{ $task->due_date?->format('Y/m/d') ?? '-' }}</td>
                    </tr>
                @endforeach
            </tbody>
        </table>
    </div>
    <div class="mt-4">
        {{ $tasks->links() }}
    </div>
@endif
@endsection
```

</details>

<details>
<summary>resources/views/tasks/create.blade.php の全体（クリックで展開）</summary>

```blade
{{-- resources/views/tasks/create.blade.php --}}
@extends('layouts.app')
@section('title', 'タスクを登録')

@section('content')
<div class="max-w-2xl mx-auto bg-white rounded-lg shadow p-6">
    <h1 class="text-2xl font-bold mb-6">タスクを登録</h1>

    <form method="POST" action="{{ route('tasks.store') }}" class="space-y-5">
        @csrf

        <div>
            <label for="title" class="block text-sm font-medium text-gray-700 mb-1">タイトル <span class="text-red-500">*</span></label>
            <input id="title" type="text" name="title" value="{{ old('title') }}"
                class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
            @error('title') <p class="mt-1 text-sm text-red-600">{{ $message }}</p> @enderror
        </div>

        <div>
            <label for="category_id" class="block text-sm font-medium text-gray-700 mb-1">カテゴリ <span class="text-red-500">*</span></label>
            <select id="category_id" name="category_id"
                class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                <option value="">選択してください</option>
                @foreach ($categories as $category)
                    <option value="{{ $category->id }}" @selected(old('category_id') == $category->id)>{{ $category->name }}</option>
                @endforeach
            </select>
            @error('category_id') <p class="mt-1 text-sm text-red-600">{{ $message }}</p> @enderror
        </div>

        <div>
            <label for="status" class="block text-sm font-medium text-gray-700 mb-1">状態 <span class="text-red-500">*</span></label>
            <select id="status" name="status"
                class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                <option value="pending" @selected(old('status') === 'pending')>未着手</option>
                <option value="in_progress" @selected(old('status') === 'in_progress')>進行中</option>
                <option value="completed" @selected(old('status') === 'completed')>完了</option>
            </select>
            @error('status') <p class="mt-1 text-sm text-red-600">{{ $message }}</p> @enderror
        </div>

        <div>
            <label for="due_date" class="block text-sm font-medium text-gray-700 mb-1">期限</label>
            <input id="due_date" type="date" name="due_date" value="{{ old('due_date') }}"
                class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
            @error('due_date') <p class="mt-1 text-sm text-red-600">{{ $message }}</p> @enderror
        </div>

        <div>
            <label for="description" class="block text-sm font-medium text-gray-700 mb-1">説明</label>
            <textarea id="description" name="description" rows="4"
                class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">{{ old('description') }}</textarea>
            @error('description') <p class="mt-1 text-sm text-red-600">{{ $message }}</p> @enderror
        </div>

        <div>
            <span class="block text-sm font-medium text-gray-700 mb-2">タグ</span>
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
                @foreach ($tags as $tag)
                    <label class="inline-flex items-center">
                        <input type="checkbox" name="tags[]" value="{{ $tag->id }}"
                            @checked(in_array($tag->id, old('tags', [])))
                            class="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500">
                        <span class="ml-2 text-sm text-gray-700">{{ $tag->name }}</span>
                    </label>
                @endforeach
            </div>
            @error('tags') <p class="mt-1 text-sm text-red-600">{{ $message }}</p> @enderror
        </div>

        <div class="flex justify-end gap-3">
            <a href="{{ route('tasks.index') }}" class="rounded-md border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50">キャンセル</a>
            <button type="submit" class="rounded-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700">登録する</button>
        </div>
    </form>
</div>
@endsection
```

</details>

<details>
<summary>resources/views/tasks/edit.blade.php の全体（クリックで展開）</summary>

```blade
{{-- resources/views/tasks/edit.blade.php --}}
@extends('layouts.app')
@section('title', 'タスクを編集')

@section('content')
<div class="max-w-2xl mx-auto bg-white rounded-lg shadow p-6">
    <h1 class="text-2xl font-bold mb-6">タスクを編集</h1>

    <form method="POST" action="{{ route('tasks.update', $task) }}" class="space-y-5">
        @csrf
        @method('PUT')

        <div>
            <label for="title" class="block text-sm font-medium text-gray-700 mb-1">タイトル <span class="text-red-500">*</span></label>
            <input id="title" type="text" name="title" value="{{ old('title', $task->title) }}"
                class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
            @error('title') <p class="mt-1 text-sm text-red-600">{{ $message }}</p> @enderror
        </div>

        <div>
            <label for="category_id" class="block text-sm font-medium text-gray-700 mb-1">カテゴリ <span class="text-red-500">*</span></label>
            <select id="category_id" name="category_id"
                class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                <option value="">選択してください</option>
                @foreach ($categories as $category)
                    <option value="{{ $category->id }}" @selected(old('category_id', $task->category_id) == $category->id)>{{ $category->name }}</option>
                @endforeach
            </select>
            @error('category_id') <p class="mt-1 text-sm text-red-600">{{ $message }}</p> @enderror
        </div>

        <div>
            <label for="status" class="block text-sm font-medium text-gray-700 mb-1">状態 <span class="text-red-500">*</span></label>
            <select id="status" name="status"
                class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                <option value="pending" @selected(old('status', $task->status) === 'pending')>未着手</option>
                <option value="in_progress" @selected(old('status', $task->status) === 'in_progress')>進行中</option>
                <option value="completed" @selected(old('status', $task->status) === 'completed')>完了</option>
            </select>
            @error('status') <p class="mt-1 text-sm text-red-600">{{ $message }}</p> @enderror
        </div>

        <div>
            <label for="due_date" class="block text-sm font-medium text-gray-700 mb-1">期限</label>
            <input id="due_date" type="date" name="due_date" value="{{ old('due_date', $task->due_date?->format('Y-m-d')) }}"
                class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
            @error('due_date') <p class="mt-1 text-sm text-red-600">{{ $message }}</p> @enderror
        </div>

        <div>
            <label for="description" class="block text-sm font-medium text-gray-700 mb-1">説明</label>
            <textarea id="description" name="description" rows="4"
                class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">{{ old('description', $task->description) }}</textarea>
            @error('description') <p class="mt-1 text-sm text-red-600">{{ $message }}</p> @enderror
        </div>

        <div>
            <span class="block text-sm font-medium text-gray-700 mb-2">タグ</span>
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
                @foreach ($tags as $tag)
                    <label class="inline-flex items-center">
                        <input type="checkbox" name="tags[]" value="{{ $tag->id }}"
                            @checked(in_array($tag->id, old('tags', $task->tags->pluck('id')->toArray())))
                            class="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500">
                        <span class="ml-2 text-sm text-gray-700">{{ $tag->name }}</span>
                    </label>
                @endforeach
            </div>
            @error('tags') <p class="mt-1 text-sm text-red-600">{{ $message }}</p> @enderror
        </div>

        <div class="flex justify-end gap-3">
            <a href="{{ route('tasks.show', $task) }}" class="rounded-md border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50">キャンセル</a>
            <button type="submit" class="rounded-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700">更新する</button>
        </div>
    </form>
</div>
@endsection
```

</details>

`resources/views/tasks/show.blade.php` には、お気に入りのトグルボタンと、編集・削除ボタンがあります。編集・削除ボタンは、いまは誰にでも表示されます。所有者だけに表示する制御（`@can`）は、10-1 で追加します。

<details>
<summary>resources/views/tasks/show.blade.php の全体（クリックで展開）</summary>

```blade
{{-- resources/views/tasks/show.blade.php --}}
@extends('layouts.app')
@section('title', $task->title)

@section('content')
<div class="max-w-2xl mx-auto">
    <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-start justify-between">
            <h1 class="text-2xl font-bold">{{ $task->title }}</h1>

            {{-- お気に入りトグル --}}
            <form action="{{ route('favorites.toggle', $task) }}" method="POST">
                @csrf
                @if (Auth::user()->favoriteTasks->contains($task->id))
                    <button type="submit" class="text-red-500 hover:text-red-700" title="お気に入りから外す">♥ お気に入り中</button>
                @else
                    <button type="submit" class="text-gray-400 hover:text-red-500" title="お気に入りに追加">♡ お気に入り</button>
                @endif
            </form>
        </div>

        <dl class="mt-4 space-y-2 text-sm">
            <div class="flex"><dt class="w-24 text-gray-500">カテゴリ</dt><dd>{{ $task->category->name }}</dd></div>
            <div class="flex"><dt class="w-24 text-gray-500">状態</dt><dd>{{ ['pending' => '未着手', 'in_progress' => '進行中', 'completed' => '完了'][$task->status] }}</dd></div>
            <div class="flex"><dt class="w-24 text-gray-500">期限</dt><dd>{{ $task->due_date?->format('Y/m/d') ?? '未設定' }}</dd></div>
            <div class="flex"><dt class="w-24 text-gray-500">登録者</dt><dd>{{ $task->user->name }}</dd></div>
            <div class="flex">
                <dt class="w-24 text-gray-500">タグ</dt>
                <dd class="flex flex-wrap gap-1">
                    @forelse ($task->tags as $tag)
                        <span class="rounded bg-gray-100 px-2 py-1 text-xs text-gray-700">{{ $tag->name }}</span>
                    @empty
                        <span class="text-gray-400">なし</span>
                    @endforelse
                </dd>
            </div>
        </dl>

        @if ($task->description)
            <div class="mt-4">
                <h2 class="mb-1 text-sm text-gray-500">説明</h2>
                <p class="whitespace-pre-line text-gray-800">{{ $task->description }}</p>
            </div>
        @endif

        {{-- 編集・削除（10-1 で @can を追加し、所有者だけに表示します） --}}
        <div class="mt-6 flex gap-3">
            <a href="{{ route('tasks.edit', $task) }}" class="rounded-md bg-yellow-500 px-4 py-2 text-white hover:bg-yellow-600">編集</a>
            <form action="{{ route('tasks.destroy', $task) }}" method="POST" onsubmit="return confirm('本当に削除しますか？')">
                @csrf
                @method('DELETE')
                <button type="submit" class="rounded-md bg-red-500 px-4 py-2 text-white hover:bg-red-600">削除</button>
            </form>
        </div>
    </div>

    <div class="mt-4">
        <a href="{{ route('tasks.index') }}" class="text-indigo-600 hover:underline">← 一覧に戻る</a>
    </div>
</div>
@endsection
```

</details>

**カテゴリの画面（一覧・追加・編集）**

<details>
<summary>resources/views/categories/index.blade.php の全体（クリックで展開）</summary>

```blade
{{-- resources/views/categories/index.blade.php --}}
@extends('layouts.app')
@section('title', 'カテゴリ')

@section('content')
<div class="flex items-center justify-between mb-6">
    <h1 class="text-2xl font-bold">カテゴリ</h1>
    <a href="{{ route('categories.create') }}" class="rounded-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700">カテゴリを追加</a>
</div>

@if ($categories->isEmpty())
    <p class="text-gray-500">カテゴリがまだありません。</p>
@else
    <div class="bg-white rounded-lg shadow overflow-hidden">
        <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
                <tr>
                    <th class="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">カテゴリ名</th>
                    <th class="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">タスク数</th>
                    <th class="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">操作</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
                @foreach ($categories as $category)
                    <tr>
                        <td class="px-4 py-3">{{ $category->name }}</td>
                        <td class="px-4 py-3 text-sm text-gray-700">{{ $category->tasks_count }} 件</td>
                        <td class="px-4 py-3 text-right text-sm">
                            <a href="{{ route('categories.edit', $category) }}" class="text-indigo-600 hover:underline">編集</a>
                            <form action="{{ route('categories.destroy', $category) }}" method="POST" class="ml-2 inline" onsubmit="return confirm('削除しますか？')">
                                @csrf
                                @method('DELETE')
                                <button type="submit" class="text-red-600 hover:underline">削除</button>
                            </form>
                        </td>
                    </tr>
                @endforeach
            </tbody>
        </table>
    </div>
@endif
@endsection
```

</details>

<details>
<summary>resources/views/categories/create.blade.php の全体（クリックで展開）</summary>

```blade
{{-- resources/views/categories/create.blade.php --}}
@extends('layouts.app')
@section('title', 'カテゴリを追加')

@section('content')
<div class="max-w-md mx-auto bg-white rounded-lg shadow p-6">
    <h1 class="text-xl font-bold mb-6">カテゴリを追加</h1>

    <form method="POST" action="{{ route('categories.store') }}" class="space-y-5">
        @csrf
        <div>
            <label for="name" class="block text-sm font-medium text-gray-700 mb-1">カテゴリ名 <span class="text-red-500">*</span></label>
            <input id="name" type="text" name="name" value="{{ old('name') }}"
                class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
            @error('name') <p class="mt-1 text-sm text-red-600">{{ $message }}</p> @enderror
        </div>
        <div class="flex justify-end gap-3">
            <a href="{{ route('categories.index') }}" class="rounded-md border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50">キャンセル</a>
            <button type="submit" class="rounded-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700">追加する</button>
        </div>
    </form>
</div>
@endsection
```

</details>

<details>
<summary>resources/views/categories/edit.blade.php の全体（クリックで展開）</summary>

```blade
{{-- resources/views/categories/edit.blade.php --}}
@extends('layouts.app')
@section('title', 'カテゴリを編集')

@section('content')
<div class="max-w-md mx-auto bg-white rounded-lg shadow p-6">
    <h1 class="text-xl font-bold mb-6">カテゴリを編集</h1>

    <form method="POST" action="{{ route('categories.update', $category) }}" class="space-y-5">
        @csrf
        @method('PUT')
        <div>
            <label for="name" class="block text-sm font-medium text-gray-700 mb-1">カテゴリ名 <span class="text-red-500">*</span></label>
            <input id="name" type="text" name="name" value="{{ old('name', $category->name) }}"
                class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
            @error('name') <p class="mt-1 text-sm text-red-600">{{ $message }}</p> @enderror
        </div>
        <div class="flex justify-end gap-3">
            <a href="{{ route('categories.index') }}" class="rounded-md border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50">キャンセル</a>
            <button type="submit" class="rounded-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700">更新する</button>
        </div>
    </form>
</div>
@endsection
```

</details>

**お気に入り・ランキングの画面**

`resources/views/favorites/index.blade.php` はお気に入りタスクの一覧、`resources/views/ranking/index.blade.php` はお気に入りの多い順のランキングです。ランキングの集計（`favorites_count`）は 10-2 で実装します。

<details>
<summary>resources/views/favorites/index.blade.php の全体（クリックで展開）</summary>

```blade
{{-- resources/views/favorites/index.blade.php --}}
@extends('layouts.app')
@section('title', 'お気に入り')

@section('content')
<h1 class="text-2xl font-bold mb-6">お気に入り</h1>

@if ($tasks->isEmpty())
    <p class="text-gray-500">お気に入りのタスクはありません。</p>
@else
    <div class="bg-white rounded-lg shadow overflow-hidden">
        <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
                <tr>
                    <th class="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">タイトル</th>
                    <th class="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">カテゴリ</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
                @foreach ($tasks as $task)
                    <tr class="hover:bg-gray-50">
                        <td class="px-4 py-3">
                            <a href="{{ route('tasks.show', $task) }}" class="text-indigo-600 hover:underline">{{ $task->title }}</a>
                        </td>
                        <td class="px-4 py-3 text-sm text-gray-700">{{ $task->category->name }}</td>
                    </tr>
                @endforeach
            </tbody>
        </table>
    </div>
    <div class="mt-4">
        {{ $tasks->links() }}
    </div>
@endif
@endsection
```

</details>

<details>
<summary>resources/views/ranking/index.blade.php の全体（クリックで展開）</summary>

```blade
{{-- resources/views/ranking/index.blade.php --}}
@extends('layouts.app')
@section('title', 'ランキング')

@section('content')
<h1 class="text-2xl font-bold mb-6">お気に入りランキング</h1>

@if ($rankedTasks->isEmpty())
    <p class="text-gray-500">まだお気に入りされたタスクがありません。</p>
@else
    <ol class="space-y-3">
        @foreach ($rankedTasks as $index => $task)
            <li class="flex items-center justify-between rounded-lg bg-white p-4 shadow">
                <div class="flex items-center gap-4">
                    <span class="w-8 text-center text-xl font-bold text-indigo-600">{{ $index + 1 }}</span>
                    <div>
                        <a href="{{ route('tasks.show', $task) }}" class="font-semibold text-indigo-600 hover:underline">{{ $task->title }}</a>
                        <p class="text-sm text-gray-500">{{ $task->category->name }}</p>
                    </div>
                </div>
                <span class="text-sm text-gray-700">♥ {{ $task->favorites_count }}</span>
            </li>
        @endforeach
    </ol>
@endif
@endsection
```

</details>

### 🏃 Step 8: 画面を表示して確認する

Tailwind と Blade をビルドするため、Vite の開発サーバーを起動します。これは起動したままにしておきます（別のターミナルで実行するか、バックグラウンドで動かしてください）。

```bash
# task-app ディレクトリで実行（起動したままにする）
sail npm run dev
```

ブラウザで `http://localhost` にアクセスします。Tailwind でスタイルの当たった、次のようなトップページが表示されれば成功です。

- 中央に「タスク管理アプリ」の見出し
- その下に「ログイン」「会員登録」のボタン（青色のスタイルが当たっている）

スタイルが当たっていれば、Tailwind + Vite のビルドが通っている証拠です。「ログイン」「会員登録」のボタンはまだ開けません（認証は 9-4 で導入します）。タスクやカテゴリの画面も、コントローラを作る 9-5 以降で開けるようになります。今は **トップページが表示できれば十分** です。

> ⚠️ **よくあるエラー**: スタイルが当たらず、文字だけが素のまま表示される
>
> **原因**: `sail npm run dev`（Vite 開発サーバー）が動いていない、または起動直後でまだビルドが完了していない。
>
> **対処法**: `sail npm run dev` を起動したままにしてから、ブラウザを再読み込みしてください。本番向けに 1 度だけビルドする場合は `sail npm run build` を使います。

---

## ✅ 完成チェックリスト

- [ ] `composer create-project laravel/laravel:^10.0 task-app` で Laravel 10 のプロジェクトを作成できた
- [ ] `sail:install --with=mysql` と phpMyAdmin の追記、`.env` の設定ができた
- [ ] `sail up -d`・`key:generate` で起動できた（`sail ps` で 3 つが `running`）
- [ ] `config/app.php` の `locale` を `ja` にし、`lang/ja/validation.php`・`lang/ja/auth.php` を配置した
- [ ] Tailwind CSS を導入し、`tailwind.config.js`・`postcss.config.js`・`app.css` を設定した
- [ ] `routes/web.php` と Blade アセット一式（13 ファイル）を配置した
- [ ] `sail npm run dev` を起動し、`http://localhost` でスタイルの当たったトップページが表示できた

---

## ✨ まとめ

- Sail で Laravel 10 のプロジェクトを新規作成し、phpMyAdmin・日本語ロケール（`locale=ja` と `lang/ja`）を設定した
- Tailwind CSS を導入し、設定ファイルと `app.css` を整え、Vite でビルドできるようにした
- `routes/web.php` に全ルートを定義し、Blade アセット一式を配置した。コントローラ未作成でもルート名は確定するので、画面のリンクは先に動く
- `sail npm run dev` でビルドし、トップページが表示されることを確認した。各画面は、これからバックエンドを実装するにつれて開けるようになる

---

次のセクションでは、9-1 で設計したテーブルとモデルを作ります。`users`・`categories`・`tasks`・`tags`・`task_tag`・`favorites` のマイグレーションを作成し、外部キー制約と ON DELETE CASCADE（タスク削除で `task_tag`・`favorites` も自動削除）を設定します。モデルには 1 対多・多対多のリレーションと `$fillable` / `$casts` を定義し、`migrate:fresh --seed` で初期データを投入できるよう、シーダーとファクトリも用意します。
