var gulp = require('gulp');
var browserify = require('browserify');
var source = require('vinyl-source-stream');
var tsify = require('tsify');
var fancy_log = require('fancy-log');
var fs = require('fs');
var path = require('path');
var minimist = require('minimist');
var { execSync } = require('child_process');
var watchify = require('watchify');

var args = minimist(process.argv.slice(2));

/* -----------------------------
   HELPERS
------------------------------ */

function ensureDir(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

function cleanDir(dir) {
    fs.rmSync(dir, { recursive: true, force: true });
}

/* -----------------------------
   SNAPSHOT EXTRACTION
------------------------------ */

function extractSnapshot(commit, outDir) {
    ensureDir(outDir);

    fancy_log("Extracting snapshot:", commit);

    execSync(`git archive ${commit} | tar -xf - -C "${outDir.replace(/\\/g, '/')}"`);
}

/* -----------------------------
   SAFE ASSET COPY
------------------------------ */

function copyAssets(src, dest, isSnapshot) {

    const assetsPath = isSnapshot
        ? path.join(src, "dist", "assets")
        : path.join(__dirname, "dist", "assets");

    const targetPath = path.join(dest, "assets");

    if (path.resolve(assetsPath) === path.resolve(targetPath)) {
        fancy_log("Skipping asset copy (source === destination)");
        return;
    }

    if (!fs.existsSync(assetsPath)) {
        fancy_log("No assets found at:", assetsPath);
        return;
    }

    fs.cpSync(assetsPath, targetPath, { recursive: true });
}

/* -----------------------------
   BUNDLER
------------------------------ */

function bundle(entryDir, outDir) {

    const entry = path.join(entryDir, 'src/main.ts');

    if (!fs.existsSync(entry)) {
        throw new Error("Missing entry: " + entry);
    }

    return browserify({
        basedir: entryDir,
        entries: [entry],
        debug: true
    })
    .plugin(tsify)
    .bundle()
    .on('error', fancy_log)
    .pipe(source('bundle.js'))
    .pipe(gulp.dest(outDir));
}

/* -----------------------------
   BUILD TASK
------------------------------ */

gulp.task('build', async function () {

    const benchmark = args.benchmark;
    const commit = args.commit;

    const isSnapshot = !!(benchmark && commit);

    const outDir = isSnapshot
        ? path.join(__dirname, 'dist', benchmark)
        : path.join(__dirname, 'dist');

    ensureDir(outDir);

    /* =========================================================
        BENCHMARK 1 → STATIC HTML ONLY (NO BUNDLE)
    ========================================================= */
    if (benchmark === "benchmark1") {

        const html = path.join(__dirname, 'src', 'benchmark1', 'index.html');

        if (!fs.existsSync(html)) {
            throw new Error("Missing benchmark1 HTML");
        }

        fs.copyFileSync(html, path.join(outDir, 'index.html'));

        fancy_log("benchmark1 built (NO BUNDLE)");
        return;
    }

    /* =========================================================
        NORMAL BUILD (FULL APP)
    ========================================================= */
    if (!isSnapshot) {

        await new Promise((resolve, reject) => {
            browserify({
                basedir: '.',
                entries: ['src/main.ts'],
                debug: true
            })
            .plugin(tsify)
            .bundle()
            .on('error', reject)
            .pipe(source('bundle.js'))
            .pipe(gulp.dest(outDir))
            .on('finish', resolve);
        });

        fs.copyFileSync(
            path.join(__dirname, 'src/index.html'),
            path.join(outDir, 'index.html')
        );

        copyAssets('.', outDir, false);

        fancy_log("Normal build → dist/");
        return;
    }

    /* =========================================================
       SNAPSHOT BUILD (benchmark2+)
    ========================================================= */

    const tmp = path.join(__dirname, '.tmp_snapshot');

    cleanDir(tmp);
    ensureDir(tmp);

    extractSnapshot(commit, tmp);

    const entry = path.join(tmp, 'src/main.ts');
    if (!fs.existsSync(entry)) {
        throw new Error("Snapshot missing src/main.ts");
    }

    const html = path.join(tmp, 'src/index.html');
    if (!fs.existsSync(html)) {
        throw new Error("Missing HTML in snapshot");
    }

    fs.copyFileSync(html, path.join(outDir, 'index.html'));

    copyAssets(tmp, outDir, true);

    await new Promise((resolve, reject) => {
        browserify({
            basedir: tmp,
            entries: [entry],
            debug: true
        })
        .plugin(tsify)
        .bundle()
        .on('error', reject)
        .pipe(source('bundle.js'))
        .pipe(gulp.dest(outDir))
        .on('finish', resolve);
    });

    cleanDir(tmp);

    fancy_log(`Snapshot built → ${benchmark} @ ${commit}`);
});

/* -----------------------------
   DEV TASK (WATCH MODE)
------------------------------ */

gulp.task('dev', function () {

    let bundler = browserify({
        basedir: '.',
        entries: ['src/main.ts'],
        debug: true,
        cache: {},
        packageCache: {}
    }).plugin(tsify);

    bundler = watchify(bundler);

    function rebundle() {
        return bundler
            .bundle()
            .on('error', fancy_log)
            .pipe(source('bundle.js'))
            .pipe(gulp.dest('dist'));
    }

    bundler.on('update', rebundle);
    bundler.on('log', fancy_log);

    return rebundle();
});