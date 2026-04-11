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
    if (!fs.existsSync(path.join(__dirname, 'dist'))) {
        fs.mkdirSync(path.join(__dirname, 'dist'));
    }

    fs.copyFileSync(
        path.join(__dirname, 'src', 'index.html'),
        path.join(__dirname, 'dist', 'index.html')
    );

    ['benchmark1', 'benchmark2', 'benchmark3'].forEach(function(benchmark) {
        const destDir = path.join(__dirname, 'dist', benchmark);
        if (!fs.existsSync(destDir)) {
            fs.mkdirSync(destDir);
        }
        fs.copyFileSync(
            path.join(__dirname, 'src', benchmark, 'index.html'),
            path.join(destDir, 'index.html')
        );
        fs.copyFileSync(
            path.join(__dirname, 'src', benchmark, 'benchmark.js'),
            path.join(destDir, 'benchmark.js')
        );
    });

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