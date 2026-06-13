# 8-3 ハンズオン: 公開タスク API を実装する

📝 **このハンズオンで使う機能**: API ルート設計・`apiResource`（7-1 で学習）、API Resource（7-2 で学習）、Postman での動作確認（7-3 で学習）、検索・絞り込み・ページネーション（8-1 で学習）、HTTP ステータスと JSON 例外（8-2 で学習）

## 🎯 このセクションで学ぶこと

- スターターキットをクローンし、Sail で公開 API 用のプロジェクトを起動する
- `Api\V1` 名前空間のコントローラと API ルートを実装する
- API Resource・API 用 FormRequest・検索/絞り込み/ページネーション・JSON 例外を組み合わせ、一覧・詳細・登録・更新・削除の公開 REST API を完成させる

このセクションでは、Chapter 7〜8 で学んだ内容を 1 つのスターターキット上で通して実装し、7-3 で用意した Postman で動作を確認します（ターミナル派向けに `curl` も併記します）。

---

## 導入

ここまでは、API のルート設計（7-1）・レスポンスの整形（7-2）・検索とページネーション（8-1）・エラー設計（8-2）を、それぞれ概念として学んできました。このハンズオンでは、それらを 1 つにまとめ、`Task`（タスク）と `User`（ユーザー）だけを持つシンプルなスターターキットに、公開タスク API を実装します。

スターターキットには、`Task` モデル・マイグレーション・シーダー（テストユーザー 1 名とサンプルタスク 5 件）までが用意されています。コントローラと API ルートは空なので、そこを自分で実装します。認証は扱わず、すべてのエンドポイントを公開 API として作ります。

### 🧠 先輩エンジニアの思考プロセス

> API を試すとき、`Accept: application/json` ヘッダーを設定し忘れて、バリデーション失敗のたびにリダイレクト（302）が返ってきて「なぜ 422 にならないのか」と悩んだことがあります。API は「JSON を期待している」とヘッダーで伝えて初めて、異常時も JSON で応えてくれます。Postman でも `curl` でも、動作確認のときは Accept ヘッダーを付ける、と手が覚えるまでは何度かはまりました。

---

## 📌 実装前の確認

このハンズオンは、これまで作ってきたプロジェクトとは独立した、新しいプロジェクトで進めます。次を確認してください。

- [ ] Docker Desktop が起動している
- [ ] 2-1 で設定した `sail` エイリアスが使える（未設定の場合は `./vendor/bin/sail` で読み替えてください）
- [ ] 他の Sail プロジェクト（2-3 のサンドボックスなど）が起動していない（起動中ならそのディレクトリで `sail down` する。ポート 80 が競合するため）
- [ ] `git` が使える
- [ ] 7-3 でインストールした Postman が使える（ターミナルの `curl` でも確認できます）

---

## 🏃 実践: 公開タスク API を実装する

### 🏃 Step 1: スターターキットをクローンして環境を起動する

作業用のディレクトリ（ホームディレクトリなど）で、スターターキットをクローンします。

```bash
# 任意の作業ディレクトリで実行
git clone https://github.com/coachtech-material/laravel-api-starter.git
cd laravel-api-starter
```

クローン直後は `vendor` ディレクトリがないため、まだ `sail` コマンドは使えません。最初の依存パッケージのインストールだけは、Docker イメージ越しに Composer を実行します。

```bash
# laravel-api-starter ディレクトリで実行（Mac / Linux）
docker run --rm \
    -u "$(id -u):$(id -g)" \
    -v "$(pwd):/var/www/html" \
    -w /var/www/html \
    laravelsail/php82-composer:latest \
    composer install --ignore-platform-reqs
```

💡 Windows（PowerShell）の場合は、行末の `\` を `` ` ``（バッククォート）に置き換え、`-u "$(id -u):$(id -g)"` の行を除いて実行してください（以降の OS 差も同様です）。

`vendor` ができたら、環境設定ファイルを作り、コンテナを起動して、アプリケーションキーを生成し、テーブルとテストデータを用意します。

```bash
# laravel-api-starter ディレクトリで実行
cp .env.example .env
sail up -d
sail artisan key:generate
sail artisan migrate:fresh --seed
```

`migrate:fresh --seed` で、テーブルを作り直し、テストユーザー（ID: 1）とサンプルタスク 5 件が入ります。ブラウザで `http://localhost` にアクセスし、Laravel の Welcome ページが出れば起動完了です。

### 🏃 Step 2: API Resource を作る

まず、レスポンスを整形する `TaskResource` を作ります。`make:resource` で生成します。

```bash
# laravel-api-starter ディレクトリで実行
sail artisan make:resource Api/V1/TaskResource
```

`app/Http/Resources/Api/V1/TaskResource.php` ができます。中身を次のように **まるごと書き換えます**。タスクのうち、外部に見せたいフィールドだけを並べ、内部のタイムスタンプ（`created_at` など）は出しません。

```php
// app/Http/Resources/Api/V1/TaskResource.php
<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Resources\Json\JsonResource;

class TaskResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'description' => $this->description,
            'status' => $this->status,
            'due_date' => $this->due_date?->format('Y-m-d'),
            'user_id' => $this->user_id,
        ];
    }
}
```

💡 `due_date` はモデルで日付としてキャストされているため、そのまま返すと時刻付きの長い形式になります。`?->format('Y-m-d')` で `2026-06-20` のような日付だけの形にそろえ、`null`（期限なし）のときは `null` を返します（`?->` は、値が `null` ならメソッドを呼ばずに `null` を返す書き方です）。

### 🏃 Step 3: API 用の FormRequest を作る

検索・登録・更新それぞれのバリデーションを、専用の FormRequest に分けます。3 つ生成します。

```bash
# laravel-api-starter ディレクトリで実行
sail artisan make:request Api/V1/IndexTaskRequest
sail artisan make:request Api/V1/StoreTaskRequest
sail artisan make:request Api/V1/UpdateTaskRequest
```

一覧用の `IndexTaskRequest` は、クエリパラメータ（キーワード・ステータス・ページ・件数）を検証します。`app/Http/Requests/Api/V1/IndexTaskRequest.php` を次のように書き換えます。

```php
// app/Http/Requests/Api/V1/IndexTaskRequest.php
<?php

namespace App\Http\Requests\Api\V1;

use Illuminate\Foundation\Http\FormRequest;

class IndexTaskRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'keyword' => ['nullable', 'string', 'max:255'],
            'status' => ['nullable', 'in:pending,in_progress,completed'],
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:1'],
        ];
    }

    public function messages(): array
    {
        return [
            'keyword.max' => 'キーワードは255文字以内で指定してください。',
            'status.in' => 'ステータスには pending、in_progress、completed のいずれかを指定してください。',
            'page.integer' => 'ページ番号は整数で指定してください。',
            'page.min' => 'ページ番号は1以上で指定してください。',
            'per_page.integer' => '1ページあたりの件数は整数で指定してください。',
            'per_page.min' => '1ページあたりの件数は1以上で指定してください。',
        ];
    }
}
```

登録用の `StoreTaskRequest` は、タスクの各項目を検証します。`authorize` は公開 API なので `true` にします。`app/Http/Requests/Api/V1/StoreTaskRequest.php` を次のように書き換えます。

<details>
<summary>StoreTaskRequest.php の全体（クリックで展開）</summary>

```php
// app/Http/Requests/Api/V1/StoreTaskRequest.php
<?php

namespace App\Http\Requests\Api\V1;

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
            'user_id' => ['required', 'integer', 'exists:users,id'],
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'status' => ['required', 'in:pending,in_progress,completed'],
            'due_date' => ['nullable', 'date'],
        ];
    }

    public function messages(): array
    {
        return [
            'user_id.required' => '担当者IDは必須です。',
            'user_id.integer' => '担当者IDは整数で指定してください。',
            'user_id.exists' => '指定された担当者は存在しません。',
            'title.required' => 'タスク名は必須です。',
            'title.string' => 'タスク名は文字列で入力してください。',
            'title.max' => 'タスク名は255文字以内で入力してください。',
            'description.string' => '説明は文字列で入力してください。',
            'status.required' => 'ステータスは必須です。',
            'status.in' => 'ステータスには pending、in_progress、completed のいずれかを指定してください。',
            'due_date.date' => '期限は有効な日付形式で入力してください。',
        ];
    }
}
```

</details>

更新用の `UpdateTaskRequest` は、ここでは登録用と同じ内容にします（更新のときだけ違う検証を足したくなったら、このクラスに書けるよう、アクションごとに分けておきます）。`app/Http/Requests/Api/V1/UpdateTaskRequest.php` を次のように書き換えます。

<details>
<summary>UpdateTaskRequest.php の全体（クリックで展開）</summary>

```php
// app/Http/Requests/Api/V1/UpdateTaskRequest.php
<?php

namespace App\Http\Requests\Api\V1;

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
            'user_id' => ['required', 'integer', 'exists:users,id'],
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'status' => ['required', 'in:pending,in_progress,completed'],
            'due_date' => ['nullable', 'date'],
        ];
    }

    public function messages(): array
    {
        return [
            'user_id.required' => '担当者IDは必須です。',
            'user_id.integer' => '担当者IDは整数で指定してください。',
            'user_id.exists' => '指定された担当者は存在しません。',
            'title.required' => 'タスク名は必須です。',
            'title.string' => 'タスク名は文字列で入力してください。',
            'title.max' => 'タスク名は255文字以内で入力してください。',
            'description.string' => '説明は文字列で入力してください。',
            'status.required' => 'ステータスは必須です。',
            'status.in' => 'ステータスには pending、in_progress、completed のいずれかを指定してください。',
            'due_date.date' => '期限は有効な日付形式で入力してください。',
        ];
    }
}
```

</details>

### 🏃 Step 4: API コントローラを実装する

`Api\V1` 名前空間のコントローラを、`--api` オプション付きで生成します。`create` / `edit` を持たない、5 アクションのコントローラができます。

```bash
# laravel-api-starter ディレクトリで実行
sail artisan make:controller Api/V1/TaskController --api --model=Task
```

`app/Http/Controllers/Api/V1/TaskController.php` を次のように **まるごと書き換えます**。一覧（検索・絞り込み・ページネーション）・詳細・登録（201）・更新・削除（204）を実装します。

<details>
<summary>TaskController.php の全体（クリックで展開）</summary>

```php
// app/Http/Controllers/Api/V1/TaskController.php
<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\IndexTaskRequest;
use App\Http\Requests\Api\V1\StoreTaskRequest;
use App\Http\Requests\Api\V1\UpdateTaskRequest;
use App\Http\Resources\Api\V1\TaskResource;
use App\Models\Task;

class TaskController extends Controller
{
    public function index(IndexTaskRequest $request)
    {
        $query = Task::query();

        if ($request->filled('keyword')) {
            $keyword = $request->input('keyword');
            $query->where(function ($q) use ($keyword) {
                $q->where('title', 'like', "%{$keyword}%")
                    ->orWhere('description', 'like', "%{$keyword}%");
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        $perPage = (int) $request->input('per_page', 20);
        $perPage = min($perPage, 100);

        $tasks = $query->latest()->paginate($perPage);

        return TaskResource::collection($tasks);
    }

    public function show(Task $task)
    {
        return new TaskResource($task);
    }

    public function store(StoreTaskRequest $request)
    {
        $task = Task::create($request->validated());

        return (new TaskResource($task))
            ->response()
            ->setStatusCode(201);
    }

    public function update(UpdateTaskRequest $request, Task $task)
    {
        $task->update($request->validated());

        return new TaskResource($task);
    }

    public function destroy(Task $task)
    {
        $task->delete();

        return response()->json(null, 204);
    }
}
```

</details>

`index` では、`filled` でパラメータがあるときだけ条件を足し、`per_page` をデフォルト 20・上限 100 でクランプしてからページネーションします。`store` は作成後に 201、`destroy` は本文なしの 204 を返します。`show` / `update` / `destroy` は、引数の `Task $task` に暗黙のルートモデルバインディングで該当タスクが入ります。

### 🏃 Step 5: API ルートを定義する

`routes/api.php` を開き、内容を次のように **まるごと書き換えます**。`/v1` プレフィックスでバージョンを分け、`apiResource` で 5 つのルートをまとめて定義します。

```php
// routes/api.php
<?php

use App\Http\Controllers\Api\V1\TaskController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    Route::apiResource('tasks', TaskController::class);
});
```

定義されたルートは `route:list` で確認できます。

```bash
# laravel-api-starter ディレクトリで実行
sail artisan route:list --path=api
```

`api/v1/tasks` に対する 5 つのルート（GET 一覧・POST 作成・GET 詳細・PUT/PATCH 更新・DELETE 削除）が並んでいれば成功です。

### 🏃 Step 6: 見つからないときの JSON 例外を設定する

存在しない ID にアクセスしたとき、JSON の 404 を返すようにします。`app/Exceptions/Handler.php` を開き、内容を次のように **まるごと書き換えます** （`ModelNotFoundException` の `use` 文と `render` メソッドを追加しています）。

```php
// app/Exceptions/Handler.php
<?php

namespace App\Exceptions;

use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Foundation\Exceptions\Handler as ExceptionHandler;
use Throwable;

class Handler extends ExceptionHandler
{
    /**
     * The list of the inputs that are never flashed to the session on validation exceptions.
     *
     * @var array<int, string>
     */
    protected $dontFlash = [
        'current_password',
        'password',
        'password_confirmation',
    ];

    /**
     * Register the exception handling callbacks for the application.
     */
    public function register(): void
    {
        $this->reportable(function (Throwable $e) {
            //
        });
    }

    public function render($request, Throwable $e)
    {
        if ($request->is('api/*') && $e instanceof ModelNotFoundException) {
            return response()->json([
                'error' => 'タスクが見つかりませんでした。',
            ], 404);
        }

        return parent::render($request, $e);
    }
}
```

### 🏃 Step 7: Postman で動作を確認する

7-3 で用意した Postman で、実装した API にリクエストを送って確認します。7-3 で作った環境変数 `base_url` を `http://localhost` に設定しておくと、URL を `{{base_url}}/api/v1/tasks` のように書けます。各リクエストには `Headers` タブで `Accept` に `application/json` を設定します（これがないと、バリデーション失敗時に JSON ではなくリダイレクトが返ることがあります）。`POST` / `PUT` では `Body` タブで `raw` を選び `JSON` 形式にして本文を入力します。

確認するリクエストは次のとおりです。

| 操作 | メソッド | URL（`{{base_url}}` ＝ `http://localhost`） | ボディ | 期待 |
|---|---|---|---|---|
| 一覧 | GET | `{{base_url}}/api/v1/tasks` | なし | 200 |
| 詳細 | GET | `{{base_url}}/api/v1/tasks/1` | なし | 200 |
| 検索 | GET | `{{base_url}}/api/v1/tasks?keyword=メール` | なし | 200（1 件） |
| 絞り込み | GET | `{{base_url}}/api/v1/tasks?status=completed` | なし | 200（1 件） |
| 登録 | POST | `{{base_url}}/api/v1/tasks` | タスクの内容 | 201 |
| 更新 | PUT | `{{base_url}}/api/v1/tasks/1` | タスクの内容 | 200 |
| 削除 | DELETE | `{{base_url}}/api/v1/tasks/5` | なし | 204 |
| 不正な入力 | POST | `{{base_url}}/api/v1/tasks` | 不正な内容 | 422 |
| 存在しない ID | GET | `{{base_url}}/api/v1/tasks/99999` | なし | 404 |
| 上限クランプ | GET | `{{base_url}}/api/v1/tasks?per_page=1000` | なし | `meta.per_page` が 100 |

以下では、主なレスポンスと、同じ確認をターミナルで行う場合の `curl`（読みやすくするため `jq` に通したもの）を示します。Postman では上の表のとおり設定して `Send` してください。

まず、一覧を取得します。

```bash
curl -s -H "Accept: application/json" http://localhost/api/v1/tasks | jq
```

`data` にタスクが並び、`links` と `meta` が付いた JSON が返ります（`meta` は紙面の都合で一部を抜粋しています）。

```json
{
  "data": [
    {
      "id": 1,
      "title": "企画書を作成する",
      "description": "来週のミーティングに向けて企画書を作成する",
      "status": "pending",
      "due_date": "2026-06-20",
      "user_id": 1
    }
  ],
  "links": {
    "first": "http://localhost/api/v1/tasks?page=1",
    "last": "http://localhost/api/v1/tasks?page=1",
    "prev": null,
    "next": null
  },
  "meta": {
    "current_page": 1,
    "last_page": 1,
    "per_page": 20,
    "total": 5
  }
}
```

💡 `due_date` の日付は、シーダーが「今日から何日後」という形でデータを作るため、`migrate:fresh --seed` を実行した日によって変わります。上の値は一例です。

次に、詳細・キーワード検索・ステータス絞り込みを確認します。キーワード検索はタイトルと説明の部分一致、ステータス絞り込みは完全一致です。

```bash
# 詳細（id=1）
curl -s -H "Accept: application/json" http://localhost/api/v1/tasks/1 | jq

# キーワード検索（「メール」を含むタスク）
curl -s -H "Accept: application/json" "http://localhost/api/v1/tasks?keyword=メール" | jq

# ステータス絞り込み（完了したタスク）
curl -s -H "Accept: application/json" "http://localhost/api/v1/tasks?status=completed" | jq
```

登録（POST）を確認します。Postman では `Body` タブに JSON を入力します（`curl` では `Content-Type: application/json` を付けます）。成功すると **201** が返ります。

```bash
curl -s -w '\n%{http_code}\n' \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -X POST http://localhost/api/v1/tasks \
  -d '{"user_id":1,"title":"API設計のレビュー","description":"v1 のレスポンス形を確認する","status":"pending","due_date":"2026-07-01"}' \
  | jq
```

`-w '\n%{http_code}\n'` は、最後に HTTP ステータスコードを表示するオプションです。次のような本文（作成されたタスク）と、`201` が返ります。

```json
{
  "data": {
    "id": 6,
    "title": "API設計のレビュー",
    "description": "v1 のレスポンス形を確認する",
    "status": "pending",
    "due_date": "2026-07-01",
    "user_id": 1
  }
}
```

わざと不正な入力（タスク名なし・不正なステータス）を送ると、**422** とバリデーションエラーが JSON で返ります。

```bash
curl -s -w '\n%{http_code}\n' \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -X POST http://localhost/api/v1/tasks \
  -d '{"user_id":1,"status":"done"}' \
  | jq
```

```json
{
  "message": "タスク名は必須です。 (and 1 more error)",
  "errors": {
    "title": ["タスク名は必須です。"],
    "status": ["ステータスには pending、in_progress、completed のいずれかを指定してください。"]
  }
}
```

更新（PUT）と削除（DELETE）も確認します。削除は本文のない **204** が返ります。Postman ではレスポンス欄が空になり、ステータスに `204 No Content` が表示されます。`curl` でステータスを見るには `-i`（レスポンスヘッダーを表示）を使います。

```bash
# 更新（id=1）→ 200
curl -s -H "Accept: application/json" -H "Content-Type: application/json" \
  -X PUT http://localhost/api/v1/tasks/1 \
  -d '{"user_id":1,"title":"企画書を作成する（改訂）","status":"in_progress"}' | jq

# 削除（id=5）→ 204 No Content（本文なし）
curl -s -i -H "Accept: application/json" -X DELETE http://localhost/api/v1/tasks/5 | head -n 1
```

削除では、先頭行に `HTTP/1.1 204 No Content` が表示されれば成功です。

最後に、存在しない ID で 404 の JSON を確認します。

```bash
curl -s -w '\n%{http_code}\n' -H "Accept: application/json" \
  http://localhost/api/v1/tasks/99999 | jq
```

```json
{
  "error": "タスクが見つかりませんでした。"
}
```

`per_page` の上限クランプも確認しておきます。`per_page=1000` のような大きすぎる値を送っても、`meta.per_page` は 100 に丸められます。

```bash
curl -s -H "Accept: application/json" "http://localhost/api/v1/tasks?per_page=1000" | jq '.meta.per_page'
# => 100
```

### 🏃 Step 8: 後片付けをする

動作確認が終わったら、コンテナを停止します。

```bash
# laravel-api-starter ディレクトリで実行
sail down
```

このプロジェクトは独立しているので、今後使わないなら、停止したあとディレクトリごと削除して構いません。また、この先サンドボックス（2-3）や他の Sail プロジェクトを使うときは、ポート競合を避けるため、こちらを `sail down` で止めてから起動してください。

---

## ✅ 完成チェックリスト

- [ ] スターターキットをクローンし、`sail up` と `migrate:fresh --seed` まで通り、Welcome ページが表示できた
- [ ] `routes/api.php` で `/v1` プレフィックス＋`apiResource` を定義し、`route:list` で 5 ルートを確認できた
- [ ] `TaskResource` でレスポンスを整形し、`due_date` を `Y-m-d` 形式で返せた
- [ ] `IndexTaskRequest` / `StoreTaskRequest` / `UpdateTaskRequest` でバリデーションを分けて実装できた
- [ ] 一覧でキーワード検索・ステータス絞り込み・ページネーション（`per_page` の上限クランプ）が動いた
- [ ] 登録で 201、削除で 204 が返った
- [ ] 不正な入力で 422 とバリデーションエラーの JSON が返った
- [ ] 存在しない ID で `{"error": "タスクが見つかりませんでした。"}` と 404 が返った
- [ ] Postman（または `curl`）で各リクエストを送り、レスポンスとステータスを確認できた
- [ ] 動作確認のあと `sail down` で後片付けをした

---

## ✨ まとめ

- スターターキットをクローンし、Composer の依存解決から `sail up`・`migrate:fresh --seed` まで通して、公開 API 用のプロジェクトを起動した
- `routes/api.php` に `/v1` プレフィックスと `apiResource` でルートを定義し、`Api\V1` 名前空間のコントローラを `--api` で実装した
- `TaskResource` でレスポンスを整形し、`IndexTaskRequest` 系で入力を検証し、一覧に検索・絞り込み・ページネーション（上限クランプ）を備えた
- 登録は 201、削除は 204、見つからないときは `Handler` の `render` で JSON の 404、バリデーション失敗は 422 と、ステータスと例外を設計どおりに返した

---

このハンズオンで、Chapter 8 の検索・絞り込み・ページネーション（8-1）と、HTTP ステータス・JSON 例外（8-2）を、実際に動く API として組み上げました。あわせて Part 3 では、REST API のルート設計（7-1）・API Resource によるレスポンス整形（7-2）・Postman での疎通確認（7-3）・検索とページネーション（8-1）・エラー設計（8-2）を学び、最後にこのハンズオンで一覧・詳細・登録・更新・削除の公開 REST API を完成させました。これで、これまで未経験だった公開 API を、設計から実装まで一通り扱えるようになりました。

次の Part 4 では、総合ハンズオンに取り組みます。タスク管理アプリをゼロから Sail で構築し、Part 1〜3 で学んだ技術（多対多リレーション・Policy 認可・集計・公開 API・自動テスト）をすべて 1 つのアプリに統合します。最初の 9-1 では、あいまいさを含む要件を読み解き、ER 図・テーブル定義・画面/API・バリデーションを設計するところから始めます。
