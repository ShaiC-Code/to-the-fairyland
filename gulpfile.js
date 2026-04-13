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

/* -----------------------------
   GIT HELPERS
------------------------------ */

function getCurrentBranch() {
    try {
        return execSync('git rev-parse --abbrev-ref HEAD')
            .toString()
            .trim();
    } catch (e) {
        return null; // detached HEAD case (CI)
    }
}

function checkoutCommit(commit) {
    if (commit) {
        fancy_log("Checking out commit:", commit);
        execSync(`git checkout ${commit}`, { stdio: 'inherit' });
    }
}

function restoreBranch(branch) {
    if (branch) {
        fancy_log("Restoring branch:", branch);
        execSync(`git checkout ${branch}`, { stdio: 'inherit' });
    }
}

/* -----------------------------
   BUILD HELPERS
------------------------------ */

function ensureDir(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

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

function bundle(bundler, outDir) {
    return bundler
        .bundle()
        .on('error', fancy_log)
        .pipe(source('bundle.js'))
        .pipe(gulp.dest(outDir));
}

/* -----------------------------
   HTML COPY LOGIC
------------------------------ */

function copyHtml(targetDir, benchmark) {
    ensureDir(targetDir);

    // benchmark1 = static design doc
    if (benchmark === "benchmark1") {
        const srcHtml = path.join(__dirname, 'src', 'benchmark1', 'index.html');

        fs.copyFileSync(
            srcHtml,
            path.join(targetDir, 'index.html')
        );

        fancy_log("benchmark1 copied (static)");
        return;
    }

    // all others
    const srcHtml = path.join(__dirname, 'src', 'index.html');

    fs.copyFileSync(
        srcHtml,
        path.join(targetDir, 'index.html')
    );
}

/* -----------------------------
   MAIN BUILD TASK
------------------------------ */

gulp.task('build', function (done) {

    const benchmark = args.benchmark;
    const commit = args.commit;

    const outDir = benchmark
        ? path.join(__dirname, 'dist', benchmark)
        : path.join(__dirname, 'dist');

    let originalBranch = null;

    try {

        // Get current branch
        originalBranch = getCurrentBranch();

        // CASE 1: static benchmark
        if (benchmark === "benchmark1") {
            copyHtml(outDir, benchmark);
            fancy_log("benchmark1 built (no bundle)");
            done();
            return;
        }

        // CASE 2: snapshot builds (benchmark2+ / main app)
        if (commit) {
            checkoutCommit(commit);
        }

        ensureDir(outDir);

        copyHtml(outDir, benchmark);

        const bundler = createBundler(false);
        bundle(bundler, outDir);

        fancy_log("Build complete →", outDir);

    } catch (err) {
        fancy_log("Build failed:", err);
        throw err;

    } finally {
        // Restore original branch
        if (originalBranch) {
            restoreBranch(originalBranch);
        }
    }

    done();
});

/* -----------------------------
   DEV TASK
------------------------------ */

gulp.task('dev', function () {
    const bundler = createBundler(true);
    return bundle(bundler, 'dist');
});

/* -----------------------------
   DEFAULT
------------------------------ */

gulp.task('default', gulp.series('build'));