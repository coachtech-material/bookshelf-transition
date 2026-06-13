# 2-3 ハンズオン: Laravel Sail プロジェクトを立ち上げる

📝 **このハンズオンで使う機能**: Laravel Sail（2-1 Laravel Sail で環境構築する で学習）

📝 **前提知識**: このセクションは 2-1 Laravel Sail で環境構築する と 2-2 Laravel 8 から 10 への変更点 の内容を前提としています。

## 🎯 このセクションで学ぶこと

- Sail で Laravel 10 のプロジェクトを新規作成し、phpMyAdmin と日本語ロケールを設定して起動する
- この先のセクションで Tinker を使うための、実験用サンドボックスを用意する

このセクションでは、2-1 と 2-2 で学んだことを実際に手を動かして確かめ、以降で繰り返し使う環境を組み立てます。

---

## 導入: Laravel 10 をゼロから立ち上げる

2-1 で Sail の役割を、2-2 で Laravel 10 の変更点を確認しました。このハンズオンでは、Laravel 10 のプロジェクトをゼロから作り、MySQL と phpMyAdmin を備えた状態で起動します。

ここで作る環境は、この先のセクションで自由に試すための練習用の環境です。本教材ではこれを「サンドボックス」（壊しても問題のない実験場）と呼びます。3-2 と 5-1 で、多対多の操作や集計クエリを Tinker で試すときに、この環境を繰り返し使います。

### 🧠 先輩エンジニアの思考プロセス

> 新しいプロジェクトで毎回引っかかるのが、「最初の一回だけ `sail` コマンドが使えない」問題です。`sail` は `vendor` ができてから使えるのに、その `composer` を動かす PHP が手元にない、というニワトリと卵の状況になりがちです。
>
> これを解くのが、PHP と Composer の入った Docker イメージを一時的に借りる方法です。長いコマンドに見えますが、やっているのは「PHP 入りの箱を一瞬だけ借りて、その中で作業する」だけ。手元に PHP がなくても Laravel 10 を起こせます。

---

## 📌 プロジェクト作成前の確認

作業を始める前に、次の状態を確認してください。

- [ ] Docker（Docker Desktop または Docker Engine）が起動している
- [ ] プロジェクトを置きたい作業ディレクトリを決めてある（このハンズオンではホームディレクトリ直下に作る前提で進めます）
- [ ] 2-1 で設定した `sail` エイリアスが使える（未設定の場合は `./vendor/bin/sail` で読み替えてください）
- [ ] インターネットに接続している（イメージとパッケージのダウンロードに必要）

> ⚠️ **注意**: Windows をお使いの場合は、以降のコマンドを **WSL2 のターミナル** で実行してください。`$(pwd)` や `$(id -u)` の記法は WSL2・macOS・Linux で動作します。macOS / Linux はそのまま実行できます。

---

## 🏃 実践: Laravel 10 + Sail の環境を立ち上げる

### 🏃 Step 1: Laravel 10 プロジェクトを作成する

まず、Laravel 10 のプロジェクトを作成します。ここで **バージョンを 10 に固定する** のが重要です。

Sail には `laravel.build` という手軽な作成方法もありますが、これは常に最新版の Laravel を取得します。この教材は Laravel 10 を前提とするため、バージョンを `^10.0` と明示できる `composer create-project` を使います。手元に PHP がなくても作れるよう、PHP と Composer の入った Docker イメージを一時的に借りて、その中で実行します。

作業ディレクトリ（例: ホームディレクトリ）で、次を実行します。

```bash
# プロジェクトを置きたいディレクトリで実行（例: cd ~ してから）
docker run --rm \
    -u "$(id -u):$(id -g)" \
    -v "$(pwd):/var/www/html" \
    -w /var/www/html \
    -e COMPOSER_CACHE_DIR=/tmp/composer_cache \
    laravelsail/php82-composer:latest \
    composer create-project laravel/laravel:^10.0 laravel-sandbox
```

💡 `laravelsail/php82-composer:latest` は、PHP 8.2 と Composer が入った公式イメージです。プロジェクトの作成にだけ使う一時的な箱なので、PHP のバージョンは 8.1 以上であれば構いません。`--rm` を付けているので、実行後にこのコンテナは自動で削除されます。

完了すると、作業ディレクトリの中に `laravel-sandbox` フォルダができます。以降の作業はこの中で行うので、移動します。

```bash
cd laravel-sandbox
```

### 🏃 Step 2: Laravel Sail を導入する

`laravel-sandbox` の中で、Sail をインストールし、MySQL を使う構成で `compose.yaml` を生成します。まだ `vendor/bin/sail` が使える状態ではないので、この 2 つのコマンドも Docker イメージ越しに実行します。

```bash
# laravel-sandbox ディレクトリで実行
docker run --rm \
    -u "$(id -u):$(id -g)" \
    -v "$(pwd):/var/www/html" \
    -w /var/www/html \
    -e COMPOSER_CACHE_DIR=/tmp/composer_cache \
    laravelsail/php82-composer:latest \
    composer require laravel/sail --dev
```

```bash
# laravel-sandbox ディレクトリで実行
docker run --rm \
    -u "$(id -u):$(id -g)" \
    -v "$(pwd):/var/www/html" \
    -w /var/www/html \
    laravelsail/php82-composer:latest \
    php artisan sail:install --with=mysql
```

`sail:install --with=mysql` は、`compose.yaml` をプロジェクト直下に生成し、`.env` のデータベース接続情報を Sail 用に書き換えます。`--with=mysql` を付けることで、対話的な選択を省いて MySQL を選べます。

### 🏃 Step 3: phpMyAdmin を追加し、`.env` を確認する

phpMyAdmin は Sail が標準で選べるサービスに含まれないため、生成された `compose.yaml` に手動で追記します。`services:` の下、`mysql` サービスのブロックの後ろに、次を加えてください（インデントは半角スペース 4 つ単位で、`mysql:` と同じ深さに `phpmyadmin:` を置きます）。

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
DB_DATABASE=laravel
DB_USERNAME=sail
DB_PASSWORD=password
```

🔑 `DB_HOST` は `localhost` や `127.0.0.1` ではなく、コンテナ名の `mysql` を指定します。アプリのコンテナから見ると、データベースは `mysql` という名前のコンテナとして存在するためです。

### 🏃 Step 4: コンテナを起動して初期化する

ここからは `vendor` が用意できているので、`sail` コマンドが使えます。コンテナをバックグラウンドで起動します。

```bash
# laravel-sandbox ディレクトリで実行
sail up -d
```

> ⚠️ **注意**: 初回の `sail up` は、コンテナのイメージを構築するため数分かかることがあります。途中で止まったように見えても、ダウンロードと構築が進んでいます。完了するまで待ってください。Apple Silicon の Mac でプラットフォームのエラーが出る場合は、`compose.yaml` の該当サービスに `platform: linux/amd64` を追記してから再実行します。

起動できたら、アプリケーションキーを生成し（プロジェクト作成時に設定済みのこともありますが、再実行して問題ありません）、マイグレーションを実行します。

```bash
sail artisan key:generate
sail artisan migrate
```

> ⚠️ **注意**: `sail up -d` の直後に `sail artisan migrate` を実行すると、MySQL の初期化が終わっておらず `SQLSTATE[HY000] [2002] Connection refused` が出ることがあります。その場合は `sail ps` で `mysql` が `running`（初回は数十秒かかります）になってから、実行し直してください。

`sail artisan migrate` を実行すると、Laravel 10 の初期テーブルが作成されます。出力は次のような形になります（テーブルの一覧は環境により多少異なります）。

```text
   INFO  Running migrations.

  2014_10_12_000000_create_users_table .................... DONE
  2014_10_12_100000_create_password_reset_tokens_table .... DONE
  2019_08_19_000000_create_failed_jobs_table .............. DONE
```

### 🏃 Step 5: 日本語ロケールを設定する

エラーメッセージなどを日本語で表示できるよう、ロケールを設定します。まず `config/app.php` のロケールを `ja` に変更します。

```php
// config/app.php （'locale' の値を 'ja' に変更する）
'locale' => 'ja',
```

次に、2-2 で確認したとおり、Laravel 10 の言語ファイルはプロジェクトルートの `lang/` に置きます。ここでは動作確認用に、`lang/ja/validation.php` を新規に作成します。まず、ディレクトリとファイルを作成します。

```bash
# laravel-sandbox ディレクトリで実行
mkdir -p lang/ja
touch lang/ja/validation.php
```

作成した `lang/ja/validation.php` を、次の内容で編集します。

```php
// lang/ja/validation.php
<?php

return [
    'required' => ':attributeを入力してください。',
    'string'   => ':attributeは文字列で入力してください。',
    'max'      => [
        'string' => ':attributeは:max文字以内で入力してください。',
    ],
];
```

💡 ここでは「ロケール設定が効くこと」を確認できる最小限に留めます。フォームごとの項目名の日本語化を含む本格的な言語ファイルの作り込みは、Part 4 の総合ハンズオンで扱います。

### 🏃 Step 6: Tinker で動作を確認する

最後に、環境が正しく整ったかを Tinker で確認します。Tinker はコードを 1 行ずつ試せる対話シェルです。

```bash
sail artisan tinker
```

起動したら、次の 3 つを順に入力します。コメントは、それぞれの期待される出力です。

```php
app()->getLocale();
// => "ja"

echo __('validation.required', ['attribute' => 'タイトル']);
// タイトルを入力してください。

\App\Models\User::count();
// => 0
```

1 つめでロケールが `ja` になっていること、2 つめで日本語の言語ファイルが読み込まれていること、3 つめで `users` テーブルへの問い合わせ（＝データベース接続）が成功していることを確認できます。まだデータを入れていないので、件数は `0` です。確認できたら、`exit` と入力して Tinker を終了します。

💡 2 つめで `echo` を付けているのは、Tinker（PsySH）が戻り値をそのまま表示するとき、日本語などのマルチバイト文字を `<E3><82><BF>` のようなバイト列で表示することがあるためです。これは表示上の見え方だけで、文字列の値そのものは正しい日本語です。`echo` で出力すると、ターミナルにそのまま日本語で表示されます。

> ⚠️ **よくあるエラー**: `app()->getLocale()` が `"en"` のままになる場合
>
> ```text
> => "en"
> ```
>
> **原因**: 設定がキャッシュされたまま読み込まれていることがあります。
>
> **対処法**: 一度 Tinker を `exit` で抜け、`sail artisan config:clear` を実行してから、再度 `sail artisan tinker` で確認してください。

---

## ✅ 完成チェックリスト

次がすべて満たされていれば、サンドボックスの完成です。

- [ ] `sail ps` を実行すると、`laravel.test`・`mysql`・`phpmyadmin` の 3 つが `running` 状態である
- [ ] ブラウザで `http://localhost` にアクセスすると、Laravel のウェルカムページが表示される
- [ ] ブラウザで `http://localhost:8080` にアクセスすると、phpMyAdmin の画面が表示され（自動でログインされます）、`laravel` データベースに `users` などのテーブルが見える
- [ ] `sail artisan tinker` で `app()->getLocale()` が `"ja"`、`__('validation.required', ['attribute' => 'タイトル'])` が日本語、`\App\Models\User::count()` が `0` を返す

💡 このサンドボックス（`laravel-sandbox`）は、この先の 3-2 と 5-1 で Tinker を使って実験するときに再利用します。Tinker で作る小さなモデルなどは試したら消して構いませんが、**環境そのものは削除せず** に残しておいてください。普段は `sail stop` で停止し、使うときに `sail up -d` で起動すれば、データはそのまま保たれます。

---

## ✨ まとめ

- `composer create-project laravel/laravel:^10.0` でバージョンを固定し、Docker イメージ越しに Laravel 10 プロジェクトを作成した
- `sail:install --with=mysql` で `compose.yaml` を生成し、phpMyAdmin を手動で追記、`.env` の接続情報を確認した
- `sail up -d`・`key:generate`・`migrate` で起動・初期化し、`config/app.php` と `lang/ja` で日本語ロケールを設定した
- Tinker でロケール・言語ファイル・データベース接続を確認し、以降で再利用するサンドボックスが整った

---

この Chapter では、開発環境を Laravel Sail に移し、`sail` コマンドでコンテナを操作する流れをつかみ、Laravel 8 から 10 への変更点を押さえたうえで、実際に Laravel 10 のプロジェクトを立ち上げました。これで Part 1 を通じて、学習の地図（1-1）、Laravel のクラスを読み解く PHP OOP（1-2）、そして Sail と Laravel 10 という開発環境（Chapter 2）という、この先の土台がすべて整いました。

次の Part 2 では、いよいよ Laravel の新しい概念に踏み込みます。最初の Chapter では、多対多リレーションの仕組みと、2 つのパターンのピボットテーブルを設計し、`belongsToMany` で関連を定義して、`attach` / `sync` / `toggle` で操作できるようになります。続けて、Policy による所有者ベースの認可、関連レコードの集計と N+1 の使い分け、そして PHPUnit による自動テストへと進みます。ここで作ったサンドボックスは、多対多の操作（3-2）と集計クエリ（5-1）を Tinker で試すときに、さっそく登場します。
