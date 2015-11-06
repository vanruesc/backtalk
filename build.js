/**
 * Rollup build setup.
 */

var argv = require("minimist")(process.argv.slice(2));
var path = require("path");
var pkg = require("./package.json");
var jsExtension = /.js$/;

var rollup = require("rollup").rollup;
var cjs = require("rollup-plugin-commonjs");
var npm = require("rollup-plugin-npm");

/**
 * Returns the module's id without any scope or extension.
 *
 * @param {String} The name field of the module's package.
 * @return {String} The module's clean name.
 */

function packageName(pkgName) {

	return pkgName.replace(/^@.+\//, "").replace(jsExtension, "");

}

rollup({

	entry: argv.i ? argv.i : pkg["jsnext:main"].replace(jsExtension, "") + ".js",

	plugins: [

		npm({
			jsnext: true,
			main: true,
			skip: argv.e ? argv.e : null
		}),

		cjs({
			include: "node_modules/**",
			exclude: null,
			sourceMap: false
		})

	]

}).then(function(bundle) {

	// Create the bundle with the gathered information.
	var pkgName = packageName(pkg.name);

	bundle.write({
		dest: argv.o ? argv.o : path.join("build", pkgName + ".js"),
		format: argv.f ? argv.f : "iife",
		moduleName: argv.n ? argv.n : pkgName.toUpperCase()
	});

}, function(e) {

	console.error(e.stack);

});
