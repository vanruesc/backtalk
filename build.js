/**
 * A generic build setup that uses Rollup
 * with a custom resolveExternal() method.
 */

var fs = require("fs"),
	path = require("path"),
	rollup = require("rollup"),
	pkg = require("./package"),
	entryPoint = pkg["jsnext:main"],
	pkgName = pkg.name.replace(/^@.+\//, "").replace(/.js$/, "");

rollup.rollup({

	entry: entryPoint + ".js",

	resolveExternal: function(id) {

		var externalPath = path.join("./node_modules/", id),
			externalPkg = JSON.parse(fs.readFileSync(path.join(externalPath, "package.json"), "utf8")),
			externalResult = null;

		if(externalPkg["jsnext:main"] !== undefined) {

			if(externalPkg["jsnext:main"].slice(-3) !== ".js") { externalPkg["jsnext:main"] += ".js"; }
			externalResult = path.join(externalPath, externalPkg["jsnext:main"]);

		}

    return externalResult;

  }

}).then(function(bundle) {

	var result = bundle.generate({
		format: "iife",
		moduleName: "Backtalk"
	});

  fs.writeFileSync("build/" + pkgName + ".js", result.code);

}, function(e) {

	console.error(e.stack);

});
