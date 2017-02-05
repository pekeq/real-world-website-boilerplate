# Real World Website Boilerplate

静的ウェブサイトを制作するためのテンプレートです。

## Features

受託開発にありがちな面倒臭さを解消するために、以下のような機能があります。

### サブディレクトリ前提の開発用サーバー設定

サブディレクトリのパスを設定することで、開発用サーバーで開かれるページのURLも変更することができます。加えて、HTMLテンプレートから、サブディレクトリを含めたルートパスを作成できるユーティリティー関数を利用できます。

設定方法に関しては、[サイトのサブディレクトリの設定](#サイトのサブディレクトリの設定)を参照してください。

### 共通ヘッダー等の置き場所

`vendor_assets/`というディレクトリ以下に、共通ヘッダーや共通CSSなどのファイルを配置すると、開発サーバーから参照することができます。ここに配置されたファイルは`dist/`以下には格納されません。

SSIを利用したい場合は、`gulpfile.babel.js`に以下のように書き加えます。

```javascript
const serve = done => {
  browserSync.init({
    // 省略
    rewriteRules: [
      {
        match: /<!--#include virtual="(.+?)" -->/g,
        fn(req, res, match, filename) {
          const includeFilePath = path.join('vendor-assets', filename)
          if (fs.existsSync(includeFilePath)) {
            return fs.readFileSync(includeFilePath)
          } else {
            return `<span style="color: red">\`${includeFilePath}\` could not be found</span>`
          }
        }
      }
    ],
    // 省略
  }, done)
}
```

加えて`html`というタスクで利用している、gulp-htmlminの設定の`removeComments`を無効にします。これが有効になっていると、SSIの宣言文を削除してしまうためです。

```javascript
.pipe(plugins.if(isRelease, plugins.htmlmin({

  // SSIの宣言文を削除してしまうので無効化する
  // removeComments: true,

  collapseWhitespace: true,
  collapseBooleanAttributes: true,
  removeAttributeQuotes: true,
  removeRedundantAttributes: true,
  removeEmptyAttributes: true,
  removeScriptTypeAttributes: true,
  removeStyleLinkTypeAttributes: true,
  removeOptionalTags: true,
})))
```

### HTML制作環境

全てのテンプレートファイル（`src/html/**/*.pug`）に、ファイルの配置に対応するページのデータとページのURLを提供します。

#### ページのデータ

ページに対応するテンプレートファイルと同名のJSONファイルを作成することで、そのページにのみ適応されるデータを作成することができます。`src/html/index.pug`にのみ提供するデータを作成したいときは、`src/html/index.json`というファイルを作成します。

`src/html/metadata.json`のみは例外で、全てのテンプレートファイルに適応されるデータです。

#### ページのURL

テンプレート側からページのURLを参照するために、以下の変数・データを提供しています。

##### currentPath

`src/html`から見た相対パスを提供する変数です。例えば、`src/html/subdir/page.pug`というファイルには、`/subdir/page.html`を提供します。`index.pug`というファイル名の場合のみ例外で、`/`という値を提供します。

##### urlFor(relativePath)

プロジェクトに設定されたサブディレクトリを含めたルートパスを返す関数です。`urlFor('css/main.css')`という風にすると、`/path/to/project/css/main.css`という値が返ります。`urlFor(currentPath)`とすることで、現在のページまでのルートパスが取得できます。

詳しくは`gulpfile.babel.js`の`html`というタスクを参照してください。

参考：[静的サイト制作のための便利なHTML開発環境の作り方 - ライデンの新人ブログ](https://ryden-inc.github.io/rookies/posts/html-development-environment-for-a-static-site.html)

### 納品ファイルの管理

開発用にコンパイルされたファイルは`.tmp/`以下に、納品用のファイルは`dist/`以下に格納されます。`dist/`以下のファイルをGitのコマンドで差分を取れば、差分納品用のZIPが作成できます。納品用のビルドは、コミットごとに自動的に実行されます。

### 差分Zipの作成

以下のようなコマンドで、`HEAD`と`<commit>`の差分Zipが`archive/htdocs.zip`として作成されます。

```bash
yarn archive -- --commit <commit>
```

`HEAD`以外のコミットとの差分を取りたい場合は以下のようにします。

```bash
yarn archive -- --commit <old-commit> --commit <new-commit>
```

この方法では不十分な場合は、以下のようなコマンドが参考になります。

#### 差分Zip生成コマンドの例

```bash
git archive --format=zip --prefix=htdocs/ HEAD:dist/path/to/project `git diff --diff-filter=AMCR --name-only <prev-commit> HEAD | grep "^dist/path/to/project/" | sed -e "s/dist\/path\/to\/project\///"` > ~/Desktop/htdocs.zip
```

#### 差分ファイルリスト出力コマンドの例

```bash
git diff --name-only --diff-filter=AMCR <prev-commit> | grep "^dist/path/to/project/" | sed -e "s/dist\/path\/to\/project\///" > ~/Desktop/filelist.txt
```

参考：[ビルドの生成物をGitのリポジトリに含めたいときの問題点の改善例 - ライデンの新人ブログ](https://ryden-inc.github.io/rookies/posts/include-build-products-in-git-repository.html)

## Setup

### 依存パッケージのインストール

```bash
yarn
```

### サイトのサブディレクトリの設定

`package.json`の`projectConfig.baseDir`に、サイトが公開されるサブディレクトリを設定します。

```json
"projectConfig": {
  "baseDir": "path/to/project"
},
```

ルートなら以下のようにします。

```json
"projectConfig": {
  "baseDir": ""
},
```

## Development

```
yarn start
```

上記のコマンドを実行することで、開発用サーバーが立ち上がり、ファイルの変更が監視されるようになります。

## Build

[pre-commit](https://github.com/observing/pre-commit)を利用したフックによって、**コミットごとに自動的に納品用のビルドが実行されます**。

## Directory structure

```
.
├── README.md
├── dist
│   └── path
│       └── to
│           └── project
│               ├── about.html
│               ├── css
│               │   └── app.css
│               ├── index.html
│               └── js
│                   └── app.js
├── gulpfile.babel.js
├── package.json
├── src
│   ├── css
│   │   ├── _base.scss
│   │   ├── _function.scss
│   │   ├── _var.scss
│   │   └── index.scss
│   ├── html
│   │   ├── about.json
│   │   ├── about.pug
│   │   ├── index.json
│   │   ├── index.pug
│   │   ├── metadata.json
│   │   └── partial
│   │       ├── global-header.pug
│   │       ├── head.pug
│   │       └── scripts.pug
│   ├── img
│   ├── js
│   │   ├── index.js
│   │   └── utils.js
│   └── static
├── vendor-assets
├── webpack.config.js
└── yarn.lock

14 directories, 23 files
```

## Recommended CSS design

[ECSS](http://ecss.io/)が現実的なCSS設計のパターンだと考えており、それを利用することを推奨します。

ファイルの配置としては、`src/css/components/namespace/Component.scss`という風にします。

参考：[最近の僕のCSSとの向き合い方 - yuhei blog](http://yuheiy.hatenablog.com/entry/2016/11/18/174037)

## Recommended JavaScript design

Webpackでモジュールシステムをシンプルに利用するために、全てのページで一枚のJavaScriptを読み込んで実行するという形にしています。そのため、ページごとに実行するJavaScriptの処理を切り分けるために、このテンプレートでは[PageDispatcher](https://github.com/yuheiy/page-dispatcher)を利用しています。

`src/js/main.js`には以下のように記述します。

```javascript
dispatcher.on('home', () => {
  console.log('home')
})
```

HTMLテンプレート側には以下のように記述します。

```pug
body(data-page-type="home")
```

処理が巨大化してきた場合、以下のようにファイルを分割することができます。それぞれのファイルは、読み込んだだけでは副作用を起こさないようにします。

`src/js/main.js`

```javascript
// 静的に`require`しないとwebpackで依存関係を解決できない
dispatcher.on('home', require('./pages/home').default)
dispatcher.on('about', require('./pages/about').default)
dispatcher.on('products', require('./pages/products').default)
dispatcher.on('products/foods', require('./pages/products/foods').default)
dispatcher.on('products/drink', require('./pages/products/drink').default)
```

`src/js/pages/home.js`

```javascript
import {$} from '../utils.js'

export default () => {
  // ここにページ固有の処理を書く
}
```

参考：[ページごとにJSの処理を分割するためのよさそうな方法 - ライデンの新人ブログ](https://ryden-inc.github.io/rookies/posts/page-dispatcher.html)

## Recipes

### UMD対応してないスクリプトの読み込み

`webpack.config.js`の`entry.app`にパッケージ名を追加してください。

### 圧縮に時間のかかる画像のスキップ

`src/static/img`に画像ファイルを配置すると、圧縮されずに単にコピーされます。圧縮後の画像ファイルをキャッシュして、毎回のビルド時間を短縮できます。

## Deploy to staging

`dist/`及び`vendor_assets/`以下のファイルをサーバーへコピーすることで反映できます。

## License

MIT
