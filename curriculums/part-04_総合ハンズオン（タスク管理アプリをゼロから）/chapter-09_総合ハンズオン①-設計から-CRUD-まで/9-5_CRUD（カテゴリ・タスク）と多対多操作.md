# 9-5 CRUD（カテゴリ・タスク）と多対多操作

📝 **このハンズオンで使う機能**: `sync` / `toggle`（3-2 ピボット操作（attach / detach / sync / toggle） で学習）、FormRequest（既習）

📝 **前提知識**: このセクションは 3-2 ピボット操作（attach / detach / sync / toggle） と 9-4 認証（Fortify） の内容を前提としています。

## 🎯 このセクションで学ぶこと

- カテゴリとタスクの CRUD を、リソースコントローラと FormRequest で実装する
- タスクへのタグ付けを `sync`、お気に入りの追加・解除を `toggle` で実装する
- 更新時の一意制約バリデーション（`Rule::unique()->ignore()`）と、カテゴリの削除ガードを実装する

このセクションでは、9-2 で配置した画面を、コントローラと FormRequest で動かします。これで、認証付きのタスク管理アプリが、ひととおり使える状態になります。

---

## 導入: 画面に命を吹き込む

ここまでで、画面（9-2）・テーブルとモデル（9-3）・認証（9-4）がそろいました。残るは、画面とデータをつなぐコントローラです。

カテゴリとタスクの CRUD を実装し、そのなかで 3-2 で学んだ多対多の操作を使います。タスクの作成・編集でのタグ付けは、選び直しにそのまま使える `sync`。お気に入りの登録・解除は、押すたびに反転する `toggle`。さらに、更新時の一意制約バリデーションと、タスクが紐づくカテゴリを守る削除ガードも入れます。

### 🧠 先輩エンジニアの思考プロセス

> CRUD でタグのような多対多が絡むと、つい「今ついているタグを調べて、付け外しを計算して…」と複雑に考えがちです。でも編集画面の送信は、`sync` に「選ばれた ID の配列」を渡すだけで済みます。3-2 で `sync` の動きを Tinker で確かめておくと、ここで迷いません。お気に入りも同じで、`toggle` 一発です。多対多の操作は、専用メソッドに任せるのが結局いちばん安全です。

---

## 📌 作業前の確認

- [ ] 9-4 まで終えた `task-app` ディレクトリにいる
- [ ] `sail up -d` と `sail npm run dev` が起動している
- [ ] 会員登録またはログインができる（9-4 の確認が済んでいる）

---

## 🏃 実践: CRUD と多対多操作を実装する

### 🏃 Step 1: コントローラと FormRequest を生成する

カテゴリ・タスク・お気に入りのコントローラと、カテゴリ・タスクの FormRequest を生成します。ルートは 9-2 で定義済みなので、ここではコントローラと FormRequest の中身を実装します。

```bash
# task-app ディレクトリで実行
sail artisan make:controller CategoryController --resource
sail artisan make:controller TaskController --resource
sail artisan make:controller FavoriteController
sail artisan make:request StoreCategoryRequest
sail artisan make:request UpdateCategoryRequest
sail artisan make:request StoreTaskRequest
sail artisan make:request UpdateTaskRequest
```

### 🏃 Step 2: カテゴリの FormRequest を実装する

`app/Http/Requests/StoreCategoryRequest.php` を **まるごと書き換えます**。カテゴリ名は必須・255 文字以内・一意です。`attributes()` で、エラーメッセージ中の項目名を「カテゴリ名」にします。

```php
// app/Http/Requests/StoreCategoryRequest.php
<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreCategoryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255', 'unique:categories,name'],
        ];
    }

    public function attributes(): array
    {
        return ['name' => 'カテゴリ名'];
    }
}
```

`app/Http/Requests/UpdateCategoryRequest.php` を **まるごと書き換えます**。更新では、自分自身のレコードを一意制約のチェックから除外する必要があります。これを `Rule::unique()->ignore()` で行います。

```php
// app/Http/Requests/UpdateCategoryRequest.php
<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateCategoryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255', Rule::unique('categories')->ignore($this->category)],
        ];
    }

    public function attributes(): array
    {
        return ['name' => 'カテゴリ名'];
    }
}
```

🔑 `Rule::unique('categories')->ignore($this->category)` の `$this->category` は、ルートのパラメータ（編集対象のカテゴリ）です。これがないと、「名前を変えずに保存する」だけで「その名前は既に使われている（＝自分自身）」と弾かれてしまいます。`ignore` で自分を除外することで、自分の名前はそのまま保存でき、他のカテゴリと重複する名前だけを弾けます。

### 🏃 Step 3: CategoryController を実装する

`app/Http/Controllers/CategoryController.php` を **まるごと書き換えます**。一覧では `withCount('tasks')` で各カテゴリのタスク件数を添えます（5-1 で学んだ集計です）。削除では、タスクが紐づくカテゴリを守る **削除ガード** を入れます。

```php
// app/Http/Controllers/CategoryController.php
<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreCategoryRequest;
use App\Http\Requests\UpdateCategoryRequest;
use App\Models\Category;
use Illuminate\Http\RedirectResponse;
use Illuminate\View\View;

class CategoryController extends Controller
{
    public function index(): View
    {
        $categories = Category::withCount('tasks')->orderBy('name')->get();

        return view('categories.index', compact('categories'));
    }

    public function create(): View
    {
        return view('categories.create');
    }

    public function store(StoreCategoryRequest $request): RedirectResponse
    {
        Category::create($request->validated());

        return redirect()->route('categories.index')->with('success', 'カテゴリを作成しました。');
    }

    public function edit(Category $category): View
    {
        return view('categories.edit', compact('category'));
    }

    public function update(UpdateCategoryRequest $request, Category $category): RedirectResponse
    {
        $category->update($request->validated());

        return redirect()->route('categories.index')->with('success', 'カテゴリを更新しました。');
    }

    public function destroy(Category $category): RedirectResponse
    {
        if ($category->tasks()->exists()) {
            return redirect()->route('categories.index')->with('error', 'このカテゴリにはタスクが紐づいているため削除できません。');
        }

        $category->delete();

        return redirect()->route('categories.index')->with('success', 'カテゴリを削除しました。');
    }
}
```

🔑 削除ガードの `$category->tasks()->exists()` は、「このカテゴリに紐づくタスクが 1 件でもあるか」を、データベースに問い合わせて確かめます。あれば削除せず、`error` のフラッシュメッセージとともに一覧に戻します。9-3 で `category_id` の外部キーを既定の動作（削除を許さない）にしたので、仮にこのガードをすり抜けてもデータベースが最後の砦になりますが、ユーザーには分かりやすい日本語メッセージで止めるのが親切です。

📝 9-2 で配置した `categories/index.blade.php` は `$category->tasks_count` を表示します。この値が、`withCount('tasks')` で添えられた件数です。

### 🏃 Step 4: タスクの FormRequest を実装する

`app/Http/Requests/StoreTaskRequest.php` を **まるごと書き換えます**。`status` は 3 値のいずれか（`in`）、`category_id` は存在するカテゴリ（`exists`）、`tags` は任意の配列で各要素が存在するタグ（`tags.*` に `exists`）です。

```php
// app/Http/Requests/StoreTaskRequest.php
<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreTaskRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'status' => ['required', 'in:pending,in_progress,completed'],
            'due_date' => ['nullable', 'date'],
            'category_id' => ['required', 'integer', 'exists:categories,id'],
            'tags' => ['nullable', 'array'],
            'tags.*' => ['integer', 'exists:tags,id'],
        ];
    }
}
```

`app/Http/Requests/UpdateTaskRequest.php` を **まるごと書き換えます**。更新でも検証内容は同じです（アクションごとに違う検証を足したくなったとき、それぞれのクラスに書けるよう分けておきます）。

```php
// app/Http/Requests/UpdateTaskRequest.php
<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateTaskRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'status' => ['required', 'in:pending,in_progress,completed'],
            'due_date' => ['nullable', 'date'],
            'category_id' => ['required', 'integer', 'exists:categories,id'],
            'tags' => ['nullable', 'array'],
            'tags.*' => ['integer', 'exists:tags,id'],
        ];
    }
}
```

📝 エラーメッセージは、9-2 で配置した `lang/ja/validation.php` の `attributes`（`title` → タイトル、`status` → 状態 など）が効くので、「タイトルは必須です。」「選択されたカテゴリは存在しません。」のように日本語で表示されます。FormRequest 側に `messages()` を書かなくても、項目名を日本語にできます。

### 🏃 Step 5: TaskController を実装する

`app/Http/Controllers/TaskController.php` を **まるごと書き換えます**。作成・更新では、タグ付けを `sync` で行います。タスクの所有者は、作成時に `$request->user()->tasks()->create(...)` で自動的にログインユーザーになります。

<details>
<summary>app/Http/Controllers/TaskController.php の全体（クリックで展開）</summary>

```php
// app/Http/Controllers/TaskController.php
<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreTaskRequest;
use App\Http\Requests\UpdateTaskRequest;
use App\Models\Category;
use App\Models\Tag;
use App\Models\Task;
use Illuminate\Http\RedirectResponse;
use Illuminate\View\View;

class TaskController extends Controller
{
    public function index(): View
    {
        $tasks = Task::with(['category', 'tags'])->latest()->paginate(10);

        return view('tasks.index', compact('tasks'));
    }

    public function create(): View
    {
        $categories = Category::orderBy('name')->get();
        $tags = Tag::orderBy('name')->get();

        return view('tasks.create', compact('categories', 'tags'));
    }

    public function store(StoreTaskRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        $task = $request->user()->tasks()->create([
            'category_id' => $validated['category_id'],
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'status' => $validated['status'],
            'due_date' => $validated['due_date'] ?? null,
        ]);

        $task->tags()->sync($validated['tags'] ?? []);

        return redirect()->route('tasks.show', $task)->with('success', 'タスクを登録しました。');
    }

    public function show(Task $task): View
    {
        $task->load(['category', 'tags', 'user']);

        return view('tasks.show', compact('task'));
    }

    public function edit(Task $task): View
    {
        $categories = Category::orderBy('name')->get();
        $tags = Tag::orderBy('name')->get();

        return view('tasks.edit', compact('task', 'categories', 'tags'));
    }

    public function update(UpdateTaskRequest $request, Task $task): RedirectResponse
    {
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
        $task->delete();

        return redirect()->route('tasks.index')->with('success', 'タスクを削除しました。');
    }
}
```

</details>

🔑 タグ付けの `$task->tags()->sync($validated['tags'] ?? [])` が、3-2 で学んだ `sync` です。フォームから送られたタグ ID の配列を渡すと、「選ばれたタグだけが付いている」状態にそろえます。編集でチェックを外したタグは外れ、付けたタグは足されます。タグが 1 つも選ばれていないときは `$validated['tags']` が無いので、`?? []` で空配列を渡し、すべてのタグを外します。

📝 `show` では `load(['category', 'tags', 'user'])` で関連を読み込みます。ルートモデルバインディングで受け取った `$task` は取得済みなので、5-2 で学んだとおり `with` ではなく `load` を使います。`tasks/show.blade.php` がカテゴリ・タグ・登録者を表示するため、ここで読み込んでおきます。

⚠️ **注意**: いまの `edit` / `update` / `destroy` には、所有者かどうかのチェック（認可）がありません。そのため、**ログインしていれば誰でも、他人のタスクを編集・削除できてしまいます**。これは次の 10-1 で Policy を使って塞ぎます。ここではまず CRUD が動くことを優先します。

### 🏃 Step 6: FavoriteController を実装する

`app/Http/Controllers/FavoriteController.php` を **まるごと書き換えます**。お気に入りの登録・解除は `toggle`、お気に入り一覧は、ログインユーザーの `favoriteTasks` を取得します。

```php
// app/Http/Controllers/FavoriteController.php
<?php

namespace App\Http\Controllers;

use App\Models\Task;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\View\View;

class FavoriteController extends Controller
{
    public function toggle(Task $task): RedirectResponse
    {
        Auth::user()->favoriteTasks()->toggle($task->id);

        return back();
    }

    public function index(): View
    {
        $tasks = Auth::user()->favoriteTasks()->with('category')->paginate(10);

        return view('favorites.index', compact('tasks'));
    }
}
```

🔑 `Auth::user()->favoriteTasks()->toggle($task->id)` が、3-2 で学んだ `toggle` です。詳細画面のお気に入りボタンを押すたびに、登録と解除が交互に切り替わります。「今お気に入りかどうか」を調べて分岐する必要はありません。`return back()` で、押した画面（詳細画面）に戻します。

📝 `tasks/show.blade.php` のお気に入りボタンは、`Auth::user()->favoriteTasks->contains($task->id)` で「すでにお気に入りか」を判定し、ハートの表示（♥ / ♡）を出し分けています。

### 🏃 Step 7: 動作を確認する

`sail up -d` と `sail npm run dev` を起動した状態で、ログインしてブラウザで確認します。

まず **カテゴリ** を確認します（9-3 のシーダーで 5 件入っています）。

1. ナビの「カテゴリ」を開く。各カテゴリにタスク件数が表示される（`withCount`）。
2. 「カテゴリを追加」から新しいカテゴリを作る。一覧に追加され、成功メッセージが出る。
3. タスクが紐づくカテゴリ（例: 仕事）の「削除」を押す。「このカテゴリにはタスクが紐づいているため削除できません。」と出て、削除されない（削除ガード）。

次に **タスクとタグ付け** を確認します。

1. ナビの「タスク一覧」を開く。9-3 のシーダーのタスクが、カテゴリ・状態・期限つきで並ぶ。
2. 「タスクを登録」から、タイトル・カテゴリ・状態・期限・タグ（複数選択）を入力して登録する。詳細画面に遷移し、選んだタグが表示される（`sync`）。
3. 詳細画面の「編集」からタグを選び直して更新する。詳細画面のタグが、選び直した内容に変わる（`sync`）。

最後に **お気に入り** を確認します。

1. タスクの詳細画面で、お気に入りボタン（♡）を押す。表示が「♥ お気に入り中」に変わる（`toggle`）。
2. もう一度押すと、♡ に戻る（`toggle`）。
3. ナビの「お気に入り」を開くと、お気に入り中のタスクが一覧に出る。

わざとタイトルを空にして登録すると、「タイトルは必須です。」と日本語のエラーが出て、入力した内容（カテゴリやタグの選択）が保持されることも確認しておきましょう。

---

## ✅ 完成チェックリスト

- [ ] カテゴリの CRUD が動き、一覧にタスク件数（`withCount`）が表示された
- [ ] タスクが紐づくカテゴリを削除しようとすると、削除ガードで止まった
- [ ] タスクの CRUD が動き、作成時に所有者（ログインユーザー）が設定された
- [ ] タグ付けが `sync` で動いた（作成・編集で選んだタグだけが付く）
- [ ] お気に入りの登録・解除が `toggle` で動き、お気に入り一覧に反映された
- [ ] 不正な入力で日本語のバリデーションエラーが表示され、入力内容が保持された

---

## ✨ まとめ

- カテゴリとタスクの CRUD を、リソースコントローラと FormRequest で実装した
- タグ付けは `sync`（選ばれた ID の配列にそろえる）、お気に入りは `toggle`（押すたびに反転）で実装した
- 更新時の一意制約は `Rule::unique()->ignore()` で自分を除外し、カテゴリは削除ガードで守った
- タスクの作成では `$request->user()->tasks()->create(...)` で所有者を自動設定した。ただし編集・削除の認可はまだなく、誰でも他人のタスクを操作できる状態になっている

---

この Chapter では、タスク管理アプリをゼロから組み立てました。9-1 で要件を読み解いて ER 図とテーブルを設計し、9-2 で Sail と画面アセットを用意し、9-3 でマイグレーションとモデル、9-4 で認証、9-5 で CRUD と多対多操作（タグ付けの `sync`・お気に入りの `toggle`）を実装しました。これで、認証付きのタスク管理アプリが、ひととおり動く状態になりました。

次の Chapter では、ここに認可・集計・公開 API・自動テストを積み上げ、提出できる品質に仕上げます。最初の 10-1 では、9-5 で残した「誰でも他人のタスクを編集・削除できてしまう」穴を塞ぎます。`TaskPolicy` を実装して所有者だけが編集・削除でき、非所有者には 403 を返し、`@can` で編集・削除ボタンを所有者にだけ表示する制御を加えます。
