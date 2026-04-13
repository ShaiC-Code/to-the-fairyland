var gulp = require('gulp');
var browserify = require('browserify');
var source = require('vinyl-source-stream');
var watchify = require('watchify');
var tsify = require('tsify');
var fancy_log = require('fancy-log');
var fs = require('fs');
var path = require('path');
var minimist = require('minimist');
var { execSync } = require('child_process');

var args = minimist(process.argv.slice(2));

/**
 * Switch working tree to a commit (for benchmark2+ only)
 */
function checkoutCommit(commit) {
    if (commit) {
        fancy_log("Checking out commit:", commit);
        execSync(`git checkout ${commit}`, { stdio: 'inherit' });
    }
}

/**
 * Restore main branch after build
 */
function restoreMain() {
    fancy_log("Restoring main branch...");
    execSync(`git checkout main`, { stdio: 'inherit' });
}

/**
 * Ensure directory exists
 */
function ensureDir(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

/**
 * Create bundler
 */
function createBundler(watch, entryFile) {
    let b = browserify({
        basedir: '.',
        debug: true,
        entries: [entryFile || 'src/main.ts'],
        cache: {},
        packageCache: {}
    }).plugin(tsify);

    if (watch) {
        b = watchify(b);
        b.on('update', () => bundle(b, 'dist'));
        b.on('log', fancy_log);
    }

    return b;
}

/**
 * Bundle output
 */
function bundle(bundler, outDir) {
    return bundler
        .bundle()
        .on('error', fancy_log)
        .pipe(source('bundle.js'))
        .pipe(gulp.dest(outDir));
}

/**
 * Copy HTML depending on benchmark type
 */
function copyHtml(targetDir, benchmark) {
    ensureDir(targetDir);

    // benchmark1 = static design doc (NO bundle, NO commit logic)
    if (benchmark === "benchmark1") {
        const srcHtml = path.join(__dirname, 'src', 'benchmark1', 'index.html');

        fs.copyFileSync(
            srcHtml,
            path.join(targetDir, 'index.html')
        );

        fancy_log("Copied benchmark1 design doc (no build)");
        return;
    }

    // all other cases use main template
    const srcHtml = path.join(__dirname, 'src', 'index.html');

    fs.copyFileSync(
        srcHtml,
        path.join(targetDir, 'index.html')
    );
}

/**
 * MAIN BUILD TASK
 */
gulp.task('build', function (done) {

    const benchmark = args.benchmark;
    const commit = args.commit;

    const outDir = benchmark
        ? path.join(__dirname, 'dist', benchmark)
        : path.join(__dirname, 'dist');

    try {

        // CASE 1: benchmark1 (design docs only)
        if (benchmark === "benchmark1") {
            copyHtml(outDir, benchmark);
            fancy_log("benchmark1 built (static only)");
            done();
            return;
        }

        // CASE 2: benchmark2+ or main app (needs build)

        checkoutCommit(commit);

        ensureDir(outDir);

        copyHtml(outDir, benchmark);

        const bundler = createBundler(false);
        bundle(bundler, outDir);

        fancy_log("Build complete →", outDir);

    } finally {
        if (commit) {
            restoreMain();
        }
    }

    done();
});

/**
 * DEV MODE
 */
gulp.task('dev', function () {
    const bundler = createBundler(true);
    return bundle(bundler, 'dist');
});

/**
 * DEFAULT
 */
gulp.task('default', gulp.series('build'));