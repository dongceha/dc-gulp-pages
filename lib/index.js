const { src, dest, parallel, series, watch } = require('gulp')

const del = require('del')
const browserSync = require('browser-sync')

// 自动加载 plugin 
const loadPlugins = require('gulp-load-plugins')

const plugins = loadPlugins()
const bs = browserSync.create()
const cwd = process.cwd() // 当前 命令行 的 工作目录

let config = {
    // default config
  build:{
    src:'src',
    dist:'dist',
    temp:'temp',
    public:'public',
    paths:{
      styles:'assets/styles/*.scss',
      scripts:'assets/scripts/*.js',
      pages:'*.html',
      images:'assets/images/**',
      fonts:'assets/fonts/**'
    }
  }
}

try {
  const loadConfig = require(`${cwd}/pages.config.js`)
  config = Object.assign({}, config, loadConfig)
} catch (error) { }

// 清空文件
const clean = () => {
  return del([config.build.dist,config.build.temp])
}

const style = () =>{
  return src(config.build.paths.styles,{base:config.build.src,cwd:config.build.src})
  .pipe(plugins.sass({outputStyle:'expanded'}))
  .pipe(dest(config.build.temp))
  .pipe(bs.reload({stream:true})) 
}

const script = () =>{
  return src(config.build.paths.scripts,{base:config.build.src,cwd:config.build.src})
  .pipe(plugins.babel({presets:[require('@babel/preset-env')]}))
  .pipe(dest(config.build.temp))
  .pipe(bs.reload({stream:true}))
}

// 页面模板编译
const page = () =>{
  return src(config.build.paths.pages,{base:config.build.src,cwd:config.build.src})
  .pipe(plugins.swig({data:config.data}))
  .pipe(dest(config.build.temp))
  .pipe(bs.reload({stream:true}))
}
//  图片转换
const images = () =>{
  return src(config.build.paths.images,{base:config.build.src,cwd:config.build.src})
  // .pipe(plugins.imagemin())
  .pipe(dest(config.build.dist))
}
// 字体文件转换
const fonts = () =>{
  return src(config.build.paths.fonts,{base:config.build.src,cwd:config.build.src})
  // .pipe(plugins.imagemin())
  .pipe(dest(config.build.dist))
}
// 其他文件
const extra = () =>{
  return src('**',{base:config.build.public,cwd:config.build.public})
  .pipe(dest(config.build.dist))
}
// 搭建开发服务器
const server = () =>{
  watch(config.build.paths.styles,{cwd:config.build.src},style)
  watch(config.build.paths.scripts,{cwd:config.build.src},script)
  watch(config.build.paths.pages,{cwd:config.build.src},page)
  // 不对着两种 文件进行编译，但是进行 监听
  watch([
      config.build.paths.images,
      config.build.paths.fonts
  ],{cwd:config.build.src},bs.reload)
  watch('**',{cwd:config.build.public},bs.reload)
  bs.init({
      notify:false,
      port:2000,
      // open:false,
      // files:'dist/**',
      server:{
          baseDir:[config.build.temp,config.build.src,config.build.public],
          routes:{
              '/node_modules':'node_modules'
          }
      }
  })
}

/**
 * <!-- build:css assets/styles/vendor.css -->
 * <link rel="stylesheet" href="/node_modules/bootstrap/dist/css/bootstrap.css">
 * <!-- endbuild --> 
 */
/** 对所有的 文件打包到 一个 vender 里面
 * <!-- build:js assets/scripts/vendor.js -->
  <script src="/node_modules/jquery/dist/jquery.js"></script>
  <script src="/node_modules/popper.js/dist/umd/popper.js"></script>
  <script src="/node_modules/bootstrap/dist/js/bootstrap.js"></script>
  <!-- endbuild -->
 */
// 通过注释，执行 useref 
// 所以需要构建注释，也就是说，先执行 compile 再去执行这个 
// useref文件引用处理,temp临时目录
const useref = () => {
  return src(config.build.paths.pages,{base:config.build.temp,cwd:config.build.temp})
  .pipe(plugins.useref({searchPath:[config.build.temp,'.']}))
  // html css js
  .pipe(plugins.if(/\.js$/,plugins.uglify()))
  .pipe(plugins.if(/\.css$/,plugins.cleanCss()))
  .pipe(plugins.if(/\.html$/,plugins.htmlmin({
      collapseWhitespace:true,
      minifyCSS:true,
      minifyJS:true
  })))
  .pipe(dest(config.build.dist))
}

const compile = parallel(style, script, page)

// 上线之前执行的任务
const build = series(
  clean, 
  parallel(
      series(compile, useref), 
      images, 
      fonts, 
      extra
  )
)
// 在启动 服务器的时候，不进行压缩
const develop = series(compile, server)

module.exports = {
  clean,
  build,
  develop
}
