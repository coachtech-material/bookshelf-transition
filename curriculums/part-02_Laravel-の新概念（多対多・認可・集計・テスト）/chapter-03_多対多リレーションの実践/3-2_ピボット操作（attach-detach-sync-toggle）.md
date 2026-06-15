# 3-2 ピボット操作（attach / detach / sync / toggle）

📝 **前提知識**: このセクションは 3-1 多対多とピボットテーブル と 2-3 ハンズオン: Laravel Sail プロジェクトを立ち上げる の内容を前提としています。

## 🎯 このセクションで学ぶこと

- `attach` / `detach` / `sync` / `syncWithoutDetaching` / `toggle` の違いと使いどころを理解する
- お気に入りのようなトグル機能を `toggle` で実装する考え方を説明できる
- 各操作を、サンドボックスの Tinker で実際に動かして結果を確認する

このセクションでは、3-1 で定義した `belongsToMany` の関連を操作する 5 つのメソッドを学び、Tinker で 1 つずつ動かして違いを体に入れます。

---

## 導入: 「付け替える」「切り替える」をどう書くか

3-1 で、タスクとタグ、ユーザーとお気に入りの関連を定義しました。しかし定義しただけでは、組み合わせはまだ空のままです。実際のアプリでは、「タスクにタグを付ける」「編集画面でタグを選び直す」「お気に入りボタンを押して登録・解除を切り替える」といった操作が必要になります。

これらをピボットテーブルへの `INSERT` / `DELETE` として自分で書くこともできますが、Laravel は `belongsToMany` の関連に対して専用のメソッドを用意しています。どれも似た見た目ですが、「既にある組み合わせをどう扱うか」が異なります。ここを取り違えると、二重登録のエラーや、消えてほしくないデータが消える事故につながります。

### 🧠 先輩エンジニアの思考プロセス

> お気に入りボタンを最初に実装したとき、私は「今ついているか調べて、ついていたら消す、なければ足す」という分岐を自前で書いていました。`toggle` を知ってからは、その分岐がまるごと 1 行になりました。多対多の操作は、自分で `if` を書き始める前に「それ専用のメソッドがないか」を疑うと、コードがぐっと短く安全になります。

---

## attach と detach で足す・外す

もっとも基本的なのが `attach`（足す）と `detach`（外す）です。関連メソッドにカッコを付けて呼び、相手の ID を渡します。

```php
// タスクにタグを 1 つ付ける
$task->tags()->attach($tagId);

// 複数まとめて付ける
$task->tags()->attach([$tagId1, $tagId2]);

// タグを 1 つ外す
$task->tags()->detach($tagId);

// すべて外す（引数なし）
$task->tags()->detach();
```

`attach` はピボットテーブルに行を追加し、`detach` は行を削除します。`detach` を引数なしで呼ぶと、そのタスクに紐づくすべての組み合わせが外れます。

⚠️ **注意**: `attach` は重複チェックをしません。すでに付いている組み合わせをもう一度 `attach` すると、ピボットの複合主キーや一意制約（3-1 で設定したもの）に違反し、エラーになります。「すでにあるかもしれない」状況では、この後の `sync` や `toggle` を使います。

## sync で指定した状態にそろえる

`sync` は、「ピボットを、渡した ID の集合に **ぴったり一致させる**」操作です。渡した中にない組み合わせは外し、足りない組み合わせは足します。

```php
// タグを「この 2 つだけ」の状態にする
$task->tags()->sync([$tagId1, $tagId2]);
```

これは、編集画面でタグを選び直す場面にそのまま当てはまります。ユーザーがチェックを付け直して送信したタグ ID の配列を `sync` に渡せば、「選ばれたものだけが付いている」状態に一発でそろえられます。付け外しを自分で計算する必要はありません。

`sync` は、何を足して何を外したかを配列で返します。

```php
// => ["attached" => [...], "detached" => [...], "updated" => [...]]
```

💡 すべて外したいときは、空配列を渡して `$task->tags()->sync([])` とします。

## syncWithoutDetaching で消さずに足す

`sync` は「渡さなかったものを外す」のが特徴でした。これに対し `syncWithoutDetaching` は、**外す処理をしません**。足りないものだけを足し、既にあるものはそのまま残します。

```php
// 既存のタグは残したまま、足りないものだけ足す
$task->tags()->syncWithoutDetaching([$tagId1, $tagId2]);
```

`attach` と似ていますが、`attach` と違って **重複してもエラーになりません** （既にあるものは黙って無視されます）。「既存を保ったまま、安全に追加だけしたい」ときに向いています。

## toggle で有無を反転させる

`toggle` は、組み合わせの有無を **反転** させます。渡した ID が既に付いていれば外し、なければ付けます。

```php
// お気に入りを切り替える（登録されていれば解除、なければ登録）
$user->favoriteTasks()->toggle($taskId);
```

これが、お気に入りボタンや「いいね」ボタンの考え方そのものです。ボタンを押すたびに同じ 1 行を呼ぶだけで、登録と解除が交互に切り替わります。「今どちらの状態か」をコントローラ側で調べて分岐する必要はありません。状態の判定と反転を `toggle` が引き受けてくれるからです。

🔑 お気に入りやいいねのように「ON / OFF を 1 つのアクションで切り替える」機能は、`toggle` で実装するのが定石です。3-1 で `favorites` を一意制約付きのピボットにしたのは、こうした「重複させたくない切り替え」を `toggle` で安全に扱うためでもあります。

## 操作の早見表

5 つのメソッドを、「既にある組み合わせをどう扱うか」で整理します。

| メソッド | 動作 | 既にある組み合わせ | 主な用途 |
|---|---|---|---|
| `attach` | 足す | 重複でエラー | 追加だけ（重複しないと分かっている場合） |
| `detach` | 外す | （対象を外す） | 削除だけ |
| `sync` | 渡した集合にそろえる | 残す（集合外は外す） | 編集画面での選び直し |
| `syncWithoutDetaching` | 足りないものを足す | 残す（外さない） | 既存を保って追加 |
| `toggle` | あれば外す・なければ足す | 外す | お気に入り・いいねの切り替え |

---

## 📌 実践の前の確認

ここからは、2-3 で立ち上げたサンドボックス上で実際に動かします。次の状態を確認してください。

- [ ] 2-3 で作った `laravel-sandbox` が手元にある
- [ ] ターミナルで `laravel-sandbox` ディレクトリに移動している（`cd ~/laravel-sandbox` など）
- [ ] `sail up -d` でコンテナが起動している（`sail ps` で `running` を確認）

この実践では、サンドボックスに小さな「ユーザーとタグ」の多対多を作って試します。使い捨ての実験なので、最後に後片付けの手順まで行います。

---

## 🏃 実践: サンドボックスの Tinker でピボット操作を確かめる

### 🏃 Step 1: タグと中間テーブルのマイグレーションを用意する

まず `Tag` モデルとそのマイグレーションを作ります。`-m` を付けると、モデルと同時にマイグレーションも生成されます。

```bash
# laravel-sandbox ディレクトリで実行
sail artisan make:model Tag -m
```

生成された `tags` テーブルのマイグレーションを開き、内容を次のように **まるごと書き換えます** （`name` 列を加えるだけです）。

```php
<?php
// database/migrations/xxxx_xx_xx_xxxxxx_create_tags_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tags', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tags');
    }
};
```

次に、中間テーブル `tag_user` のマイグレーションを作ります。

```bash
# laravel-sandbox ディレクトリで実行
sail artisan make:migration create_tag_user_table
```

生成されたファイルを、3-1 で学んだ純粋なピボット（複合主キー）の形に **まるごと書き換えます**。

```php
<?php
// database/migrations/xxxx_xx_xx_xxxxxx_create_tag_user_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tag_user', function (Blueprint $table) {
            $table->foreignId('tag_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->primary(['tag_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tag_user');
    }
};
```

💡 今回のピボット名は `tag_user` です。これは `Tag` と `User` をアルファベット順に並べた **規約どおりの名前** なので、後でリレーションを定義するときにテーブル名を省略できます（3-1 で見た規約のケースです）。

### 🏃 Step 2: マイグレーションを実行する

```bash
# laravel-sandbox ディレクトリで実行
sail artisan migrate
```

`tags` と `tag_user` の 2 つが追加されます。出力は次のような形になります。

```text
   INFO  Running migrations.

  xxxx_xx_xx_xxxxxx_create_tags_table ........................ DONE
  xxxx_xx_xx_xxxxxx_create_tag_user_table .................... DONE
```

### 🏃 Step 3: User と Tag にリレーションを定義する

`Tag` モデル（`app/Models/Tag.php`）を次の内容にします。`Tag::create(['name' => ...])` で作れるよう `$fillable` を加え、`users()` の関連も定義します。

```php
// app/Models/Tag.php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Tag extends Model
{
    use HasFactory;

    protected $fillable = ['name'];

    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class);
    }
}
```

次に `User` モデル（`app/Models/User.php`）に `tags()` の関連を加えます。サンドボックスの `User` は標準のままなので、内容を次のように **まるごと書き換えます** （`BelongsToMany` の取り込みと `tags()` メソッドを加えています）。

```php
<?php
// app/Models/User.php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
    ];

    public function tags(): BelongsToMany
    {
        return $this->belongsToMany(Tag::class);
    }
}
```

`tag_user` は規約どおりの名前なので、`belongsToMany(Tag::class)` のようにテーブル名を省略できます。

### 🏃 Step 4: Tinker で attach / detach を試す

Tinker を起動します。

```bash
# laravel-sandbox ディレクトリで実行
sail artisan tinker
```

まず、実験用のユーザー 1 人とタグ 3 つを作ります。`User` はファクトリで、`Tag` は `create` で作ります（順に ID は 1・2・3 になります）。Tinker の表示では日本語がバイト列になることがあるため、タグ名には **英語のラベル** を使います。

```php
$user = \App\Models\User::factory()->create();
$work = \App\Models\Tag::create(['name' => 'work']);
$urgent = \App\Models\Tag::create(['name' => 'urgent']);
$home = \App\Models\Tag::create(['name' => 'home']);
```

`attach` で 2 つのタグを付け、結果を確認します。タグ名は `echo` で出力します。

```php
$user->tags()->attach([$work->id, $urgent->id]);
// => null

echo $user->tags()->pluck('name')->implode(', '), "\n";
// work, urgent
```

⚠️ タグの並び順は、`orderBy` を付けない限り保証されません。以下の出力は見やすいよう ID 順で示しています。手元で順番が前後しても問題ありません。

🔑 ここで使っているのは `$user->tags()`（カッコあり）です。カッコありは毎回データベースに問い合わせるため、操作直後の最新の状態を確認できます。カッコなしの `$user->tags` は一度読み込んだ結果を保持するので、操作後は最新でないことがあります。

`detach` で `urgent` を外します。`detach` は外した行数を返します。

```php
$user->tags()->detach($urgent->id);
// => 1

echo $user->tags()->pluck('name')->implode(', '), "\n";
// work
```

### 🏃 Step 5: sync / syncWithoutDetaching を試す

`sync` で `urgent` と `home` だけの状態にそろえます。今は `work` だけが付いているので、`urgent`・`home` が足され、`work` が外れます。返り値で、何が足され何が外れたかを確認できます。

```php
$user->tags()->sync([$urgent->id, $home->id]);
// => ["attached" => [2, 3], "detached" => [1], "updated" => []]

echo $user->tags()->pluck('name')->implode(', '), "\n";
// urgent, home
```

次に `syncWithoutDetaching` で `work` を足します。`sync` と違い、今ある `urgent`・`home` は外れません。足りない `work` だけが足されます。

```php
$user->tags()->syncWithoutDetaching([$work->id]);
// => ["attached" => [1], "detached" => [], "updated" => []]

$user->tags()->count();
// => 3
```

`detached` が空配列のままであることに注目してください。これが「消さずに足す」の意味です。

### 🏃 Step 6: toggle を試す

最後に `toggle` を試します。まず `sync([])` でいったんすべて外し、まっさらにします。

```php
$user->tags()->sync([]);
// => ["attached" => [], "detached" => [1, 2, 3], "updated" => []]

$user->tags()->count();
// => 0
```

同じ `toggle($work->id)` を 2 回呼んでみます。1 回目は「なかったので付ける」、2 回目は「あったので外す」になります。

```php
$user->tags()->toggle($work->id);
// => ["attached" => [1], "detached" => []]

$user->tags()->count();
// => 1

$user->tags()->toggle($work->id);
// => ["attached" => [], "detached" => [1]]

$user->tags()->count();
// => 0
```

同じ 1 行で、登録と解除が交互に切り替わりました。これが、お気に入りやいいねのボタンを `toggle` 1 つで実装できる理由です。確認できたら `exit` で Tinker を終了します。

### 🏃 Step 7: 後片付けをする

この実験は使い捨てです。サンドボックスを次のセクションのためにきれいに戻します。まず、追加したテーブルを取り消します。

```bash
# laravel-sandbox ディレクトリで実行
sail artisan migrate:rollback
```

`migrate:rollback` は直前の `migrate` で追加した分（`tag_user` と `tags`）だけを取り消します。外部キーの関係上、`tag_user` → `tags` の順で削除されます。

続けて、追加したファイルを削除し、`User` モデルへの追記を元に戻します。

```bash
# laravel-sandbox ディレクトリで実行
rm app/Models/Tag.php
rm database/migrations/*_create_tags_table.php
rm database/migrations/*_create_tag_user_table.php
```

最後に `app/Models/User.php` を開き、Step 3 で追加した `use Illuminate\Database\Eloquent\Relations\BelongsToMany;` の行と `tags()` メソッドを削除します。これでサンドボックスは 2-3 直後の状態に戻ります。

---

## ✅ 完成チェックリスト

- [ ] `tags` テーブルと `tag_user` ピボットを作り、`migrate` できた
- [ ] `User::tags()` と `Tag::users()` を `belongsToMany` で定義できた
- [ ] Tinker で `attach` / `detach` を実行し、タグの増減を確認できた
- [ ] `sync` と `syncWithoutDetaching` の違い（外す／外さない）を返り値で確認できた
- [ ] `toggle` を 2 回呼んで、登録と解除が切り替わることを確認できた
- [ ] 後片付け（`migrate:rollback` とファイル削除、`User` の追記の取り消し）を行った

---

## ✨ まとめ

- `attach` は足す・`detach` は外す。`attach` は重複でエラーになるため「既にあるかもしれない」場面では使わない
- `sync` は渡した集合にそろえる（集合外は外す）。編集画面での選び直しに向く
- `syncWithoutDetaching` は外さずに足りないものだけ足す。重複してもエラーにならない
- `toggle` は有無を反転させる。お気に入りやいいねの ON / OFF 切り替えはこれ 1 つで実装できる
- `$relation()`（カッコあり）は毎回 DB に問い合わせるため、操作直後の確認に使える

---

この Chapter では、多対多リレーションを扱いました。1 対多では表せない関係を中間テーブル（ピボットテーブル）で表し、純粋なピボットと一意制約を持つピボットの 2 パターンを設計し、`belongsToMany` で関連を定義して、`attach` / `detach` / `sync` / `syncWithoutDetaching` / `toggle` で操作できるようになりました。

次の Chapter では、認可に進みます。これまで使ってきた auth ミドルウェア（ログインしていなければ弾く）は「ログインしているか」しか見ません。しかし実際のアプリでは、「ログインしている誰もが、他人のタスクを編集・削除できてよいわけではない」という制御が必要です。次のセクションではまず、認証（誰か）と認可（何をしてよいか）の違いを整理し、auth ミドルウェアとの違いを押さえたうえで、Gate による単純な認可を説明できるようになります。
