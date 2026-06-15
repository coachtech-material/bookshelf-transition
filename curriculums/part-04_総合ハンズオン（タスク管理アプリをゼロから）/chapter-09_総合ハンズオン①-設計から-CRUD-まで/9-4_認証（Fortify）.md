# 9-4 認証（Fortify）

📝 **このハンズオンで使う機能**: Laravel Fortify による認証（2026年2月以前の教材で既習）

📝 **前提知識**: このセクションは 9-3 マイグレーションとモデル（リレーション定義） の内容を前提としています。

## 🎯 このセクションで学ぶこと

- Laravel Fortify を導入し、Laravel 10 での設定の流れを確認する
- 9-2 で配置したログイン・会員登録の画面を、Fortify とつないで動かす
- `auth` ミドルウェアで保護したページが、未ログインだとログイン画面に誘導されることを確認する

このセクションでは、認証を実装します。Fortify 自体は 2026年2月以前の教材で扱っているため、ここでは Laravel 10 での導入手順と、9-2 の画面とのつなぎ込みに絞ります。

---

## 導入: 画面はある、つなぐ相手がいない

9-2 で、ログインと会員登録の画面（`auth/login.blade.php`・`auth/register.blade.php`）を配置しました。フォームの送信先は `route('login')` と `route('register')` です。しかし、その名前のルートも、登録・ログインの処理もまだありません。

この「処理側」をまとめて引き受けてくれるのが Laravel Fortify です。Fortify は、画面を持たず、登録・ログイン・ログアウトといった認証の **処理とルート** だけを提供します。こちらは、表示する画面を「この Blade を使う」と教えるだけで済みます。9-2 で用意した画面と、Fortify の処理をつなぎます。

### 🧠 先輩エンジニアの思考プロセス

> Fortify は「画面を持たない認証」なので、最初は戸惑いました。ログインのフォームは自分で用意して、その表示先を `Fortify::loginView()` で教える。送信後の検証・ログイン・リダイレクトは Fortify がやってくれる。役割が「画面はこちら、処理は Fortify」とはっきり分かれていると分かってからは、どこをいじればいいか迷わなくなりました。

---

## 📌 作業前の確認

- [ ] 9-3 まで終えた `task-app` ディレクトリにいる
- [ ] `sail up -d` でコンテナが起動している
- [ ] `sail npm run dev` を起動している（画面のスタイル確認のため）

---

## 🏃 実践: Fortify で認証を実装する

### 🏃 Step 1: Fortify をインストールする

Composer で Fortify を入れ、初期化コマンドを実行します。

```bash
# task-app ディレクトリで実行
sail composer require laravel/fortify
sail artisan fortify:install
```

`fortify:install` は、設定ファイル（`config/fortify.php`）・サービスプロバイダ（`app/Providers/FortifyServiceProvider.php`）・登録などの処理クラス（`app/Actions/Fortify/` 配下）・認証用のマイグレーションを用意します。

### 🏃 Step 2: FortifyServiceProvider を登録する

`fortify:install` が生成した `FortifyServiceProvider` を、アプリに登録します。Laravel 11 以降は自動登録されますが、**Laravel 10 では `config/app.php` に手で追加** します。`config/app.php` を開き、`providers` の配列にあるアプリ用プロバイダの並びに、`App\Providers\FortifyServiceProvider::class` を加えます。

```php
// config/app.php （providers 配列のアプリ用プロバイダに追加する）
'providers' => ServiceProvider::defaultProviders()->merge([
    /*
     * Application Service Providers...
     */
    App\Providers\AppServiceProvider::class,
    App\Providers\AuthServiceProvider::class,
    // App\Providers\BroadcastServiceProvider::class,
    App\Providers\EventServiceProvider::class,
    App\Providers\RouteServiceProvider::class,
    App\Providers\FortifyServiceProvider::class,
])->toArray(),
```

📝 すでに `App\Providers\FortifyServiceProvider::class` が並びに入っている場合は、そのままで構いません（重複して追加しないでください）。

### 🏃 Step 3: 使う機能と表示する画面を設定する

このアプリで使う認証機能を絞ります。`config/fortify.php` を開き、`features` の配列を **登録機能だけ** に書き換えます（ログインとログアウトは機能の指定がなくても有効です）。

```php
// config/fortify.php （'features' の配列を書き換える）
'features' => [
    Features::registration(),
],
```

💡 `config/fortify.php` の先頭で `use Laravel\Fortify\Features;` は読み込み済みです。パスワードリセットや 2 要素認証など、今回使わない機能は外しておくと、対応する画面のないルートが増えずに済みます。同じファイルの `'views' => true,` はそのままにします（これが有効だと、Fortify がログイン・会員登録の表示用ルートを用意します）。

次に、表示する画面を Fortify に教えます。`app/Providers/FortifyServiceProvider.php` を開き、`boot()` メソッドの中に次の 2 行を追加します（`Fortify` はこのファイルの冒頭で読み込み済みです。`createUsersUsing` などの既存の行はそのまま残します）。

```php
// app/Providers/FortifyServiceProvider.php （boot() メソッドの中に追加する）
Fortify::loginView(fn () => view('auth.login'));
Fortify::registerView(fn () => view('auth.register'));
```

これで、`/login`・`/register` にアクセスしたとき、9-2 で配置した `auth/login.blade.php`・`auth/register.blade.php` が表示され、フォームの送信は Fortify が処理します。

最後に、認証後のリダイレクト先を設定します。Fortify は、ログインや会員登録のあと、`config/fortify.php` の `home` で指定した URL に遷移します。初期値は `/home` で、このアプリに `/home` というルートはないため、そのままだと登録・ログイン後に **404** になります。

遷移先は `app/Providers/RouteServiceProvider.php` の `HOME` 定数で一元管理し、`config/fortify.php` の `home` はその定数を参照する形にします。こうすれば、遷移先を変えるときに `HOME` の 1 か所を直すだけで済みます。まず `HOME` をトップページ（`/`）に変更します。

```php
// app/Providers/RouteServiceProvider.php （HOME 定数を '/' に変更する）
public const HOME = '/';
```

次に `config/fortify.php` の `home` を、この定数を参照するように書き換えます（初期値は `'/home'` という文字列が直接書かれています）。

```php
// config/fortify.php （'home' を RouteServiceProvider::HOME の参照に変更する）
'home' => \App\Providers\RouteServiceProvider::HOME,
```

🔑 認証後の遷移先は 2 か所で使われます。ログイン・会員登録の直後は `config/fortify.php` の `home`、ログイン済みのユーザーがログイン画面などゲスト用ページに来たときは `RouteServiceProvider::HOME` です。`home` を `HOME` 定数の参照にしておけば、設定が二重にならず、`HOME` を `/` にするだけで両方の遷移先がトップページにそろいます。トップページは、ログイン済みのときに名前・「タスク一覧へ」・ログアウトを表示します。

### 🏃 Step 4: マイグレーションを実行する

`fortify:install` が追加した認証用のマイグレーション（2 要素認証用の列を `users` テーブルに足すもの）を適用します。9-3 で作ったテーブルは保ったまま、追加分だけを実行します。

```bash
# task-app ディレクトリで実行
sail artisan migrate
```

💡 設定を変更したので、反映されないときは `sail artisan config:clear` と `sail artisan route:clear` を実行してから確認してください。

### 🏃 Step 5: 動作を確認する

`sail npm run dev` を起動したまま、ブラウザで確認します。

まず **会員登録** を試します。`http://localhost/register` を開き、名前・メールアドレス・パスワード（と確認）を入力して登録します。登録に成功すると、ログイン状態でトップページ（`/`）に戻ります。トップページに「（あなたの名前）さん、ログイン中です」と表示され、「タスク一覧へ」と「ログアウト」のボタンが出れば成功です。

次に **ログアウトとログイン** を試します。トップページの「ログアウト」を押すと、未ログインの状態（「ログイン」「会員登録」のボタンが表示される状態）に戻ります。続けて、9-3 のシーダーで作ったユーザーでログインしてみます。`http://localhost/login` で次を入力します。

- メールアドレス: `yamada@example.com`
- パスワード: `password`

ログインに成功すると、再びログイン状態でトップページに戻ります。わざと間違ったパスワードでログインすると、「ログイン情報が登録されていません。」という日本語のエラー（9-2 で配置した `lang/ja/auth.php` の文言）が表示されます。

💡 会員登録すると、その時点でログイン状態になります。ログイン済みのままログイン・会員登録ページ（`/login`・`/register`）を開こうとすると、これらはゲスト用のページのため、自動でトップページに戻されます（リダイレクト先を `/` にしたので、ここで `/home` の 404 は出ません）。別のユーザーでログインを試したいときは、いったんトップページの「ログアウト」でログアウトするか、ブラウザのシークレットウィンドウ（プライベートウィンドウ）で開いて、まっさらなセッションで確認してください。

最後に **認証による保護** を確認します。ログアウトした状態で、保護されたページのアドレス（例: `http://localhost/tasks`）を直接開いてみます。`routes/web.php` で `auth` ミドルウェアをかけているため、ログイン画面（`/login`）に誘導されれば成功です。

💡 ログイン後にタスク一覧（`/tasks`）などを開くと、まだエラーになります。これらの画面のコントローラは、次の 9-5 で実装するためです。このセクションでは「登録・ログイン・ログアウトができ、未ログインだと保護ページがログイン画面に誘導される」ところまで確認できれば十分です。

---

## ✅ 完成チェックリスト

- [ ] `composer require laravel/fortify` と `fortify:install` を実行できた
- [ ] `config/app.php` に `FortifyServiceProvider` を登録できた
- [ ] `config/fortify.php` の `features` を登録機能だけにし、`FortifyServiceProvider` に `loginView` / `registerView` を設定できた
- [ ] `sail artisan migrate` で認証用のマイグレーションを適用できた
- [ ] 会員登録・ログイン・ログアウトがブラウザで動いた
- [ ] 間違ったパスワードで日本語のエラーが表示された
- [ ] 未ログインで保護ページを開くと、ログイン画面に誘導された

---

## ✨ まとめ

- Fortify は「画面を持たない認証」。画面は自分で用意し、`Fortify::loginView()` / `registerView()` で表示先を教える
- Laravel 10 では、`FortifyServiceProvider` を `config/app.php` に手で登録する（Laravel 11 以降は自動）
- `config/fortify.php` の `features` で使う機能を絞れる。今回は登録機能だけを有効にした
- `auth` ミドルウェアで保護したページは、未ログインだとログイン画面に誘導される

---

次のセクションでは、いよいよ CRUD を実装します。カテゴリとタスクのリソースコントローラを FormRequest 込みで作り、9-2 で配置した画面を動かします。タスクへのタグ付けは `sync`（純粋ピボット）で実装します。あわせて、更新時の一意制約バリデーション（`Rule::unique()->ignore()`）と、タスクが紐づくカテゴリの削除を拒否する削除ガードも実装します。
