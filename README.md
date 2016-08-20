# Real World Website Boilerplate

Fight against the dirty real worlds.

## Install

```bash
$ npm install
```

## Development

```bash
$ npm start
```

## Production Build

```bash
$ npm run build
```

## Stack

- Pug
- Sass
- PostCSS
  - autoprefixer
  - csso
  - flexbugs-fixes
- Browserify
- Babel
  - es2015
- [page-dispatcher](https://github.com/yuheiy/page-dispatcher)
- core-js
- Velocity
- ScrollMagic
- Imagemin
- BrowserSync

## Configuration

### Served directory

Edit project served directory in `package.json`.

```json
"config": {
  "serve_dir": "path/to/serve-directory"
},
```

### Global name space for JavaScript

Edit global name space in `src/{pc,sp}/js/main.js`.

```javascript
window.ProjectNameSpace = {
  // do stuff...
}
```

Edit HTML templates.

```jade
script(src= `${root.pc}bundle.js`)
script.
  window.ProjectNameSpace.run('home');
```

## CSS design

Designing CSS with simply rule.

Use BEM with prefix per pages. Selector name is like this.

```scss
.home-block__element
```

Prefix is a uniq key per pages. All of classes has prefix.

Inspired by [ECSS](http://ecss.io/).

## Directory Layout

```
.
├── src/                            # All of source code
│   ├── pc/                         # Source for PC
│   │   ├── assets/                 # Copy to dist/project-root/
│   │   ├── css/                    # Styles for PC
│   │   │   ├── _core.scss          # Foundation styles
│   │   │   ├── home/               # Styles used in home
│   │   │   │   └── _block.scss     # Block in home
│   │   │   └── style.scss          # Import all of SCSS files
│   │   ├── html/                   # HTML templates for PC
│   │   │   ├── index.pug           # Compile to /index.html
│   │   │   └── partial/            # Partials used in HTML templates
│   │   │       ├── home/           # Partials used in home
│   │   │       └── redirect.pug    # Redirect /project-root/page to /project-root/sp/page
│   │   ├── img/                    # Images for PC
│   │   │   └── home/               # Images used in home
│   │   └── js/                     # Scripts for PC
│   │       └── main.js             # Browserify entry point
│   ├── sp/                         # Source for PC
│   │   ├── assets/                 # Copy to dist/project-root/sp/
│   │   ├── css/                    # Styles for SP
│   │   │   ├── _core.scss
│   │   │   ├── home/
│   │   │   │   └── _block.scss
│   │   │   └── style.scss
│   │   ├── html/                   # HTML templates for SP
│   │   │   ├── index.pug           # Compile to sp/index.html
│   │   │   └── partial/
│   │   │       └── home/
│   │   ├── img/                    # Images for SP
│   │   │   └── home/
│   │   └── js/                     # Scripts for SP
│   │       └── main.js
│   ├── shared/                     # Put shared source
│   │   └── js/                     # Scripts can be used from require('shared-js')
│   │       ├── utils.js            # Utilify functions
│   │       └── velocity-easings.js # Expand easings of velocity
│   └── website.json                # Variables can be used by all of HTML templates
├── assets/                         # Copy to dist/
├── scripts/                        # Used by npm-scripts
│   ├── html.js                     # Render HTML templates
│   └── imagemin.js                 # Minify images
├── dist/                           # Asset all of files to this directory
│   └── path/
│       └── to/
│           └── serve-directory/    # Project served directory for PC
│               ├── img/
│               │   └── home/
│               ├── index.html
│               ├── style.css
│               ├── bundle.js
│               └── sp/             # Project served directory for SP
│                   ├── img/
│                   │   └── home/
│                   ├── index.html
│                   ├── style.css
│                   └── bundle.js
├── bs.config.js                    # Config for development server
├── package.json                    # Config for the project
└── postcss.config.js               # Config for PostCSS
```

## Recommend Modules

- [sanitize.css](https://github.com/jonathantneal/sanitize.css) - css foundation
