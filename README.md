# Real World Website Boilerplate

静的ウェブサイトを制作するためのテンプレートです。

## Features

受託開発にありがちな面倒臭さを解消するために、以下のような機能があります。

### サブディレクトリ前提の開発用サーバー設定

`gulpfile.babel.js`の以下の部分を変更することで、開発用サーバーで開かれるページのパスも変更されます。

```javascript
const BASE_DIR = 'path/to/project'
```

ルートなら以下のようにします。

```javascript
const BASE_DIR = ''
```

加えて、HTMLテンプレートから、サブディレクトリを含めたルートパスを作成できるユーティリティー関数を利用できます。

### 共通ヘッダー等の置き場所

`vendor_assets/`というディレクトリ以下に、共通ヘッダーや共通CSSなどのファイルを配置すると、開発サーバーから参照することができます。ここに配置されたファイルは`dist/`以下には格納されません。

SSIを利用したい場合は、`gulpfile.babel.js`に以下のように書き加えます。

```javascript
const serve = done => {
  server.init({
    // 省略
    server: {
      // 省略
      middleware(req, res, next) {
        const exp = '.html'
        const baseDir = '.tmp'
        const {pathname} = require('url').parse(req.originalUrl || req.url)
        const filename = path.join(baseDir, pathname.endsWith('/') ? `${pathname}index${exp}` : pathname)

        if (filename.endsWith(exp) && fs.existsSync(filename)) {
          const regexp = /<!--[ ]*#([a-z]+)([ ]+([a-z]+)="(.+?)")*[ ]*-->/g

          res.end(fs.readFileSync(filename, 'utf8').replace(regexp, (_directive, directiveName, _, __, includeFilePath) => {
            if (directiveName === 'include') {
              return fs.readFileSync(path.join('vendor-assets', includeFilePath))
            } else {
              throw new Error('Not supported')
            }
          }))
        } else {
          next()
        }
      },
    },
    // 省略
  })
}
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

開発用にコンパイルされたファイルは`.tmp/`以下に、納品用のファイルは`dist/`以下に格納されます。`dist/`以下のファイルをGitのコマンドで差分を取れば、差分納品用のZIPが作成できます。

参考として以下のようなコマンドを利用できますが、多彩な納品形態に対応できないのでこのテンプレートの中にはその仕組みを含めていません。

```bash
git archive --format=zip --prefix=htdocs/ HEAD:dist `git diff --diff-filter=AMCR --name-only <prev-commit> HEAD | grep "^dist/path/to/project/" | sed -e "s/dist\/path\/to\/project\///"` > ~/Desktop/htdocs.zip
```

`npm start`と`npm run build`の違いは、ファイルの変更を監視して開発用サーバーを立ち上げるかだけで、生成されるファイルは同じです。`npm start`を実行せずにファイルの変更を行った場合は、`npm run build`を実行して`dist/`以下のファイルを更新してください。

参考：[ビルドの生成物をGitのリポジトリに含めたいときの問題点の改善例 - ライデンの新人ブログ](https://ryden-inc.github.io/rookies/posts/include-build-products-in-git-repository.html)

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
│               │   └── main.css
│               ├── index.html
│               └── js
│                   ├── main.js
│                   └── polyfill.js
├── gulpfile.babel.js
├── package.json
├── src
│   ├── css
│   │   ├── _base.scss
│   │   ├── _function.scss
│   │   ├── _var.scss
│   │   └── main.scss
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
│   │   ├── main.js
│   │   ├── utils.js
│   │   └── velocity-easings.js
│   └── static
├── vendor-assets
└── yarn.lock
```

## Recommended CSS design

[ECSS](http://ecss.io/)が現実的なCSS設計のパターンだと考えており、それを利用することを推奨します。

ファイルの配置としては、`src/css/namespace/Component.scss`という風にします。

参考：[最近の僕のCSSとの向き合い方 - yuhei blog](http://yuheiy.hatenablog.com/entry/2016/11/18/174037)

## Recommended JavaScript design

Browserifyでモジュールシステムをシンプルに利用するために、全てのページで一枚のJavaScriptを読み込んで実行するという形にしています。そのため、ページごとに実行するJavaScriptの処理を切り分けるために、このテンプレートでは[PageDispatcher](https://github.com/yuheiy/page-dispatcher)を利用しています。

`src/js/main.js`に、以下のように記述した上で、HTMLテンプレート側には以下のように記述します。

```javascript
dispatcher.on('home', () => {
  console.log('home')
})
```

```pug
body(data-page-type="home")
```

処理が巨大化してきた場合、以下のようにファイルを分割することができます。

`src/js/main.js`

```javascript
[
  'home',
  'about',
  'company',
].forEach(type => dispatcher.on(type, require(`./pages/${name}`).default))
```

`src/js/pages/home.js`

```javascript
import {$} from '../utils.js'

export default () => {
  // ここにページ固有の処理を書く
}
```

参考：[ページごとにJSの処理を分割するためのよさそうな方法 - ライデンの新人ブログ](https://ryden-inc.github.io/rookies/posts/page-dispatcher.html)

## License

MIT
