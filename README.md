# Real World Website Boilerplate

静的サイトを制作するためのテンプレートです。

## Features

- HTML制作環境
  - 参考：[静的サイト制作のための便利なHTML開発環境の作り方 - ライデンの新人ブログ](https://ryden-inc.github.io/rookies/posts/html-development-environment-for-a-static-site.html)

- CSS
  - 参考：[最近の僕のCSSとの向き合い方 - yuhei blog](http://yuheiy.hatenablog.com/entry/2016/11/18/174037)

- PageDispatcher
  - 参考：[ページごとにJSの処理を分割するためのよさそうな方法 - ライデンの新人ブログ](https://ryden-inc.github.io/rookies/posts/page-dispatcher.html)

- 納品ファイル管理

[納品](https://gist.github.com/yuheiy/e89c8a207af80769e175e17b9577e8ef)



// dist/ 以下を管理するパターンのあれなやつ

// dev と production で生成するファイルが違う、devはminifyしないでprodはするとか

// src/ 以下更新するたびにrun build叩くのだるい

// ignoreにしたいが、差分納品のとき困るので管理するパターンに変えた

// watchしていれば、.tmpにdev用のファイルが入り（これはignoreにする）、distにはprod buildしたファイルが入る

// run buildすれば、watchと同じ結果になる。これはwatchせずにdist以下も更新するときに使う



## Setup

### Install

```bash
yarn
```

### Edit config

gulpfile.babel.js

```javascript
const BASE_DIR = 'path/to/project'
```

ルートなら以下のようにする。

```javascript
const BASE_DIR = ''
```

## Stack

- Pug
- Sass
- Babel

## Directory structure

.tmp/
dist/

は直接編集しない
