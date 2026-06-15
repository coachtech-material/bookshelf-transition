# 2-2 Laravel 8 から 10 への変更点

📝 **前提知識**: このセクションは 2-1 Laravel Sail で環境構築する の内容を前提としています。

## 🎯 このセクションで学ぶこと

- Laravel 10 が PHP 8.1 以上を前提とすること、そこで目にする `match`・enum・`readonly` といった PHP 8 の構文を読めるようにする
- `make:migration` が生成する無名マイグレーションクラス（`return new class extends Migration`）を理解する
- `lang/` のプロジェクトルートへの移動と、生成コードに付くようになったネイティブ型宣言を押さえる

このセクションでは、2026年2月以前の教材（Laravel 8）と、これから前提とする Laravel 10 の主な違いを確認し、既習の知識を安全に使い直せるようにします。

💡 このセクションのコードは、Laravel 10 での書き方の違いを理解するための例です。ここで手を動かす必要はありません。実際に Laravel 10 のプロジェクトを動かすのは、次の 2-3 のハンズオンと Part 4 の総合ハンズオンです。

---

## 導入: 「同じはずなのに通らない」小さな違い

Laravel 8 で身につけた書き方の多くは、Laravel 10 でもそのまま通用します。ルーティングもコントローラも Eloquent も、考え方は変わりません。だからこそ、ときどき現れる小さな違いが厄介です。「前と同じように書いたのに、生成されたファイルの形が違う」「ドキュメントのコードが手元の書き方と微妙にずれている」。こうした違いは、知らないと原因がつかめず、時間を取られがちです。

変更点はそれほど多くありません。ここで主なものを先回りして押さえておけば、この先で戸惑わずに済みます。

### 🧠 先輩エンジニアの思考プロセス

> バージョンアップで一番こわいのは、大きな新機能より「いつもの書き方が、いつのまにか変わっていた」ことです。私も Laravel 8 から移ったとき、新しいマイグレーションにクラス名がなく `return new class` で始まっていて、面食らいました。
>
> でも調べてみれば意図的な改善で、理由が分かれば納得できるものばかり。違いは数えるほどです。だからこそ、最初にまとめて目を通しておく価値があります。

![Laravel 8 と 10 の対比図: マイグレーション（名前付きクラス→無名クラス）、lang/ の位置（resources 内→ルート直下）、生成コードの型宣言（なし→void）という小さな違いを左右で見比べる間違い探し風の図](../../../assets/diagrams/output/2-2-laravel8-to-10-diffs.jpg)

---

## PHP 8.1 以上が前提になった

Laravel 10 は、動作に **PHP 8.1 以上** を必要とします。Laravel 8 はより古い PHP でも動きましたが、Laravel 10 では 8.1 が下限です。

これにともない、Laravel 本体やドキュメント、そして他の人が書いたコードの中で、PHP 8 で加わった構文を目にする機会が増えます。自分でゼロから書けなくても、読めれば十分です。代表的なものを 3 つ挙げます。

`match` 式は、値に応じて結果を返す `switch` の簡潔版です。

```php
// 値に応じて表示用ラベルを返す
$label = match ($status) {
    'open'  => '未着手',
    'doing' => '進行中',
    'done'  => '完了',
};
```

enum（列挙型）は、決まった選択肢を型として表現します。

```php
// 取りうる状態を列挙型で定義する
enum Status: string
{
    case Open = 'open';
    case Doing = 'doing';
    case Done = 'done';
}
```

`readonly`（読み取り専用プロパティ）は、一度設定したら変更できないプロパティです。1-2 で見たコンストラクタでのプロパティ宣言と組み合わせて使われます。

```php
// 作成後は変更できない値
class Point
{
    public function __construct(
        public readonly int $x,
        public readonly int $y,
    ) {
    }
}
```

🔑 これらは「Laravel 10 で必ず使う」ものではなく、「読めると安心」なものです。コードの中で見かけたときに意味が取れれば、学習の妨げになりません。

## マイグレーションが無名クラスになった

最もよく目にする違いがこれです。Laravel 8 では、マイグレーションはクラス名を持つ普通のクラスでした。

```php
// database/migrations/xxxx_create_tasks_table.php （Laravel 8 の形）
class CreateTasksTable extends Migration
{
    public function up()
    {
        Schema::create('tasks', function (Blueprint $table) {
            $table->id();
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('tasks');
    }
}
```

Laravel 10 では、`make:migration` が生成するのは **無名クラス** （名前のないクラス）になりました。`return new class extends Migration` で始まり、末尾にセミコロンが付きます。

```php
// database/migrations/xxxx_create_tasks_table.php （Laravel 10 の形）
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tasks', function (Blueprint $table) {
            $table->id();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tasks');
    }
};
```

📝 これは Laravel 9 から標準になった形です。クラス名をなくしたのは、マイグレーションが増えたときの **クラス名の衝突を避ける** ためです。たとえば一度作ったテーブルにカラムを足すマイグレーションを何度も作ると、似た名前のクラスが衝突しがちでした。無名クラスならその心配がありません。中身（`up()` と `down()` の書き方）は Laravel 8 と変わらないので、外側の形が変わっただけだと捉えてください。

## `lang/` がプロジェクトルートへ移動した

言語ファイルの置き場所も変わりました。Laravel 8 では `resources/lang/` にありましたが、Laravel 10 では **プロジェクトルートの `lang/`** に移動しています。

```text
Laravel 8:  resources/lang/ja/validation.php
Laravel 10: lang/ja/validation.php
```

加えて、Laravel 10 の新規プロジェクトには `lang/` ディレクトリが最初から含まれていません。英語の言語ファイルが必要な場合は `sail artisan lang:publish` で取り出せますが、日本語化のように自分で用意する場合は、ルート直下に `lang/ja/` を作ってファイルを置きます。日本語ロケールの具体的な設定は、次のハンズオンで行います。

## 生成されるコードに型が付くようになった

Laravel 10 では、Artisan が生成するクラスのメソッドに、引数と戻り値の **ネイティブな型宣言** が付くようになりました。1-2 で学んだ型宣言が、フレームワーク側の生成コードにも行き渡ったということです。

たとえばシーダーの `run` メソッドは、Laravel 8 では型がありませんでしたが、Laravel 10 では戻り値の型 `: void` が付きます。

```php
// database/seeders/DatabaseSeeder.php （Laravel 10）
public function run(): void
{
    // ...
}
```

先ほどのマイグレーションの `up(): void` / `down(): void` も同じです。型が付くことで、そのメソッドが何を受け取り何を返すのかが、コードを読むだけで分かりやすくなりました。

💡 キャストの書き方には注意してください。Laravel 10 では、モデルのキャストは `protected $casts = [...]` という **プロパティ** で定義します。新しいドキュメントやサンプルでは `casts()` という **メソッド** で書く例を見かけますが、これは Laravel 11 以降の書き方です。Laravel 10 では `$casts` プロパティを使ってください。

---

## ✨ まとめ

- Laravel 10 は PHP 8.1 以上が前提。`match`・enum・`readonly` といった PHP 8 の構文は、読めれば十分
- `make:migration` が生成するマイグレーションは無名クラス（`return new class extends Migration`）。クラス名の衝突を避けるための変更で、`up()` / `down()` の中身は従来どおり
- 言語ファイルは `resources/lang/` からプロジェクトルートの `lang/` へ移動し、新規プロジェクトには既定で含まれない
- 生成されるコードのメソッドにネイティブな型宣言が付くようになった
- キャストは Laravel 10 では `$casts` プロパティで定義する（`casts()` メソッドは Laravel 11 以降）

---

次のセクションでは、ここまでの内容を実際に手を動かして確かめます。Sail で Laravel 10 のプロジェクトを新規作成し、phpMyAdmin と日本語ロケールを設定して起動します。ここで立ち上げる環境は、この先の混合セクションで Tinker を使って多対多の操作や集計クエリを試すための、実験用サンドボックスになります。
