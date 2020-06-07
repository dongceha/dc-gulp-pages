#!/use/bin/env node

process.argv.push('--cwd')
process.argv.push(process.cwd())
process.argv.push('--gulpfile')
process.argv.push(require.resolve('..')) // 找到 对应的路径，然后会找到 根目录下的 package.json 里面的 main 字段

require('gulp/bin/gulp')