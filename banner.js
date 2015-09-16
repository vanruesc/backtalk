/**
 * Banner.
 */

var prependFile = require("prepend-file"),
	pkg = require("./package"),
	pkgName = pkg.name.replace(/^@.+\//, ""),
	date = (new Date()).toDateString(),
	banner;

function prepend(files) {

	prependFile(files.pop(), banner, function(error) {

		if(error !== null) {

			console.error(error);

		} else if(files.length > 0) {

			prepend(files);

		}

	});

}

banner = "/**\n * " + pkgName + " v" + pkg.version + " build " + date.slice(4) + "\n" +
	" * " + pkg.homepage + "\n" +
	" * Copyright " + date.slice(-4) + " " + pkg.author.name + ", " + pkg.license + "\n */\n";

prepend([
	"build/" + pkgName + ".js",
	"build/" + pkgName + ".min.js"
]);
