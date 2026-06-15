# 10-1 認可（Policy）

📝 **このハンズオンで使う機能**: Policy・`authorize()`・`@can`（4-2 Policy の作成・登録・適用 で学習）

📝 **前提知識**: このセクションは 4-2 Policy の作成・登録・適用 と 9-5 CRUD（カテゴリ・タスク）と多対多操作 の内容を前提としています。

Chapter 10 では、9 章で作ったタスク管理アプリに、認可・集計・公開 API・自動テストを積み上げ、完成度の高い状態に仕上げます。

| セクション | テーマ | 種類 |
|---|---|---|
| 10-1 認可（Policy） | 所有者だけが編集・削除できるようにする | ハンズオン |
| 10-2 集計機能 | カテゴリ別タスク数・人気タグ・ランキング | ハンズオン |
| 10-3 公開 API | 公開 REST API を実装する | ハンズオン |
| 10-4 自動テスト | Feature / Unit テストとカバレッジ | ハンズオン |
| 10-5 仕上げ（Pint・README・Issue 駆動の振り返り・最終チェック） | 仕上げと最終確認 | ハンズオン |
| 10-6 まとめ：身につけた力と次のステップ | 教材全体の振り返り | 概念 |

📖 **この Chapter の進め方**: 10-1 で所有者ベースの認可、10-2 で集計とランキングを実装します。10-3 で公開 API を加え、10-4 で全体の自動テストを書いてカバレッジを確認します。最後に 10-5 で仕上げを行い、10-6 で教材全体を振り返ります。

## 🎯 このセクションで学ぶこと

- `TaskPolicy` を作成し、`AuthServiceProvider` に登録する
- コントローラの `authorize()` で、所有者だけがタスクを編集・削除できるようにする
- `@can` で、編集・削除ボタンを所有者にだけ表示する

このセクションでは、9-5 で残した「誰でも他人のタスクを編集・削除できてしまう」穴を、Policy で塞ぎます。

---

## 導入: 今のままでは、他人のタスクを触れてしまう

9-5 で、タスクの CRUD は動くようになりました。しかし `edit` / `update` / `destroy` には所有者チェックがないため、ログインしていれば誰でも、他人のタスクの編集 URL を開いて更新・削除できてしまいます。詳細画面の編集・削除ボタンも、登録者でない人にも表示されています。

ここを塞ぐのが認可です。4 章で学んだ Policy を使い、「編集・削除してよいのは、そのタスクを登録した本人だけ」という制御を加えます。4-3 のハンズオンと同じ手順を、このアプリの `Task` に対して行います。

### 🧠 先輩エンジニアの思考プロセス

> 認可は「ボタンを消したから大丈夫」では不十分です。ボタンを消すのは見た目の制御で、URL を直接叩かれたら処理は通ってしまう。だから私は必ず、画面の `@can`（ボタンを出し分ける）と、コントローラの `authorize`（処理を止める）の両方を入れます。そして仕上げに、他人のタスクの編集 URL を直打ちして 403 になることを自分の目で確かめます。

---

## 📌 作業前の確認

- [ ] 9-5 まで終えた `task-app` ディレクトリにいる
- [ ] `sail up -d` と `sail npm run dev` が起動している
- [ ] 9-3 のシーダーのユーザー（`yamada@example.com` など、パスワード `password`）でログインできる

---

## 🏃 実践: 所有者だけが編集・削除できるようにする

### 🏃 Step 1: TaskPolicy を作る

`Task` モデルに紐づく Policy を生成します。

```bash
# task-app ディレクトリで実行
sail artisan make:policy TaskPolicy --model=Task
```

`app/Policies/TaskPolicy.php` が生成されます。`viewAny` / `view` / `create` などのメソッドが空の状態で並んでいるので、内容を次のように **まるごと書き換えます**。今回使うのは、所有者チェックを行う `update` と `delete` の 2 つです。

```php
<?php
// app/Policies/TaskPolicy.php

namespace App\Policies;

use App\Models\Task;
use App\Models\User;

class TaskPolicy
{
    public function update(User $user, Task $task): bool
    {
        return $user->id === $task->user_id;
    }

    public function delete(User $user, Task $task): bool
    {
        return $user->id === $task->user_id;
    }
}
```

判定は「タスクの `user_id` が、操作しようとしているユーザーの `id` と一致するか」です。一致すれば `true`（許可）、しなければ `false`（拒否）です。

### 🏃 Step 2: AuthServiceProvider に登録する

`Task` と `TaskPolicy` の対応を登録します。`app/Providers/AuthServiceProvider.php` を開き、内容を次のように **まるごと書き換えます** （`use` を 2 つ加え、`$policies` 配列に対応を登録しています）。

```php
<?php
// app/Providers/AuthServiceProvider.php

namespace App\Providers;

use App\Models\Task;
use App\Policies\TaskPolicy;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;

class AuthServiceProvider extends ServiceProvider
{
    /**
     * The model to policy mappings for the application.
     *
     * @var array<class-string, class-string>
     */
    protected $policies = [
        Task::class => TaskPolicy::class,
    ];

    /**
     * Register any authentication / authorization services.
     */
    public function boot(): void
    {
        //
    }
}
```

### 🏃 Step 3: コントローラに authorize を追加する

`app/Http/Controllers/TaskController.php` の `edit` / `update` / `destroy` の各メソッドの先頭に、`authorize` の呼び出しを 1 行ずつ加えます。`edit` と `update` は更新の認可（`update`）、`destroy` は削除の認可（`delete`）です。3 つのメソッドは次のようになります（加えた行以外はそのままです）。

```php
// app/Http/Controllers/TaskController.php （edit / update / destroy に authorize を追加）
    public function edit(Task $task): View
    {
        $this->authorize('update', $task);

        $categories = Category::orderBy('name')->get();
        $tags = Tag::orderBy('name')->get();

        return view('tasks.edit', compact('task', 'categories', 'tags'));
    }

    public function update(UpdateTaskRequest $request, Task $task): RedirectResponse
    {
        $this->authorize('update', $task);

        $validated = $request->validated();

        $task->update([
            'category_id' => $validated['category_id'],
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'status' => $validated['status'],
            'due_date' => $validated['due_date'] ?? null,
        ]);

        $task->tags()->sync($validated['tags'] ?? []);

        return redirect()->route('tasks.show', $task)->with('success', 'タスクを更新しました。');
    }

    public function destroy(Task $task): RedirectResponse
    {
        $this->authorize('delete', $task);

        $task->delete();

        return redirect()->route('tasks.index')->with('success', 'タスクを削除しました。');
    }
```

これで、他人のタスクの編集・更新・削除を試みると、`authorize` が 403（Forbidden）を返すようになります。

📝 `$this->authorize()` が使えるのは、`app/Http/Controllers/Controller.php` が `AuthorizesRequests` トレイトを使っているためです（Laravel 標準で組み込まれています）。

### 🏃 Step 4: ビューに @can を追加する

詳細画面の編集・削除ボタンを、所有者にだけ表示します。`resources/views/tasks/show.blade.php` を開くと、9-2 で配置した編集・削除ボタンのブロックがあります。

```blade
{{-- resources/views/tasks/show.blade.php の編集・削除ボタン（現在） --}}
        <div class="mt-6 flex gap-3">
            <a href="{{ route('tasks.edit', $task) }}" class="rounded-md bg-yellow-500 px-4 py-2 text-white hover:bg-yellow-600">編集</a>
            <form action="{{ route('tasks.destroy', $task) }}" method="POST" onsubmit="return confirm('本当に削除しますか？')">
                @csrf
                @method('DELETE')
                <button type="submit" class="rounded-md bg-red-500 px-4 py-2 text-white hover:bg-red-600">削除</button>
            </form>
        </div>
```

この部分を、`@can` で囲んだ次の形に **置き換えます**。編集ボタンは `update`、削除ボタンは `delete` の認可で囲みます。

```blade
{{-- resources/views/tasks/show.blade.php の編集・削除ボタン（置き換え後） --}}
        <div class="mt-6 flex gap-3">
            @can('update', $task)
                <a href="{{ route('tasks.edit', $task) }}" class="rounded-md bg-yellow-500 px-4 py-2 text-white hover:bg-yellow-600">編集</a>
            @endcan
            @can('delete', $task)
                <form action="{{ route('tasks.destroy', $task) }}" method="POST" onsubmit="return confirm('本当に削除しますか？')">
                    @csrf
                    @method('DELETE')
                    <button type="submit" class="rounded-md bg-red-500 px-4 py-2 text-white hover:bg-red-600">削除</button>
                </form>
            @endcan
        </div>
```

どちらも `TaskPolicy` の判定を使うので、所有者にだけボタンが表示されます。

### 🏃 Step 5: 認可が効くことを検証する

`yamada@example.com` / `password` でログインします。9-3 のシーダーは、先頭から順にタスクを作るので、山田太郎のタスク（ID 1〜3）、鈴木花子のタスク（ID 4〜6）、田中一郎のタスク（ID 7〜9）の順です。

まず、表示の制御を確認します。

- 自分（山田太郎）が登録したタスクの詳細画面には、編集・削除ボタンが表示される
- 他のユーザー（鈴木花子など）が登録したタスクの詳細画面には、編集・削除ボタンが表示されない（詳細画面の「登録者」で誰のタスクか分かります）

次に、処理の制御を、URL の直打ちで確認します。山田太郎でログインしたまま、鈴木花子のタスク（例: ID 4）の編集 URL に直接アクセスします。

```text
http://localhost/tasks/4/edit
```

ボタンを消していても、`authorize` が働いて **403 Forbidden** が返れば成功です（ID は環境により異なることがあります。詳細画面の URL で確認してください）。これで、画面（`@can`）と処理（`authorize`）の両方で、所有者だけが編集・削除できる状態になりました。

💡 自分のタスク（ID 1〜3 のいずれか）では、編集 URL から編集フォームが開き、更新・削除も問題なくできることも確認しておきましょう。

---

## ✅ 完成チェックリスト

- [ ] `make:policy TaskPolicy --model=Task` で Policy を生成し、`update` / `delete` に所有者チェックを書けた
- [ ] `AuthServiceProvider` の `$policies` に `Task => TaskPolicy` を登録できた
- [ ] `TaskController` の `edit` / `update` / `destroy` に `authorize` を追加できた
- [ ] `tasks/show.blade.php` の編集・削除ボタンを `@can` で囲めた
- [ ] 他人のタスクにはボタンが出ず、編集 URL の直打ちで 403 が返ることを確認できた
- [ ] 自分のタスクは編集・削除できることを確認できた

---

## ✨ まとめ

- `make:policy --model` で Policy を生成し、`update` / `delete` に所有者チェック（`$user->id === $task->user_id`）を書いた
- `AuthServiceProvider` の `$policies` に登録し、コントローラで `authorize()`、ビューで `@can` を適用した
- ボタンを隠す `@can`（表示の制御）と、403 を返す `authorize()`（処理の制御）は、両方そろって安全になる。URL 直打ちでの 403 まで確認した

---

次のセクションでは、集計機能を実装します。よく使われているタグのランキングを `withCount` + `orderByDesc` で作り、タスクの詳細画面には所属カテゴリのタスク数を `loadCount` で表示します。一覧では `with` / `withCount`、詳細では `load` / `loadCount` を使い分けて N+1 を避けます。9-5 でカテゴリ一覧に使った `withCount('tasks')`（カテゴリ別タスク数）も、同じ集計の仲間として整理します。
