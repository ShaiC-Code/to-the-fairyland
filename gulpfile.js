var gulp = require('gulp');
var browserify = require('browserify');
var source = require('vinyl-source-stream');
var watchify = require('watchify');
var tsify = require('tsify');
var fancy_log = require('fancy-log');
var fs = require('fs');
var path = require('path');

function createBundler(watch) {
    let b = browserify({
        basedir: '.',
        debug: true,
        entries: ['src/main.ts'],
        cache: {},
        packageCache: {}
    }).plugin(tsify);

    if (watch) {
        b = watchify(b);
        b.on('update', () => bundle(b));
        b.on('log', fancy_log);
    }

    return b;
}

function bundle(bundler) {
    return bundler
        .bundle()
        .on('error', fancy_log)
        .pipe(source('bundle.js'))
        .pipe(gulp.dest('dist'));
}

gulp.task('copy-html', function (done) {
    const src = path.join(__dirname, 'src', 'index.html');
    const dest = path.join(__dirname, 'dist', 'index.html');
    
    if (!fs.existsSync(path.join(__dirname, 'dist'))) {
        fs.mkdirSync(path.join(__dirname, 'dist'));
    }
    
    fs.copyFileSync(src, dest);
    done();
});

gulp.task('build', function () {
    const bundler = createBundler(false);
    return bundle(bundler);
});

gulp.task('dev', function () {
    const bundler = createBundler(true);
    return bundle(bundler);
});

gulp.task('default', gulp.series('copy-html', 'build'));