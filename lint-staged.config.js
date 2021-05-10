function quoteFileNames(f) {
	return f.map((fn) => `'${fn.replace("'", "'\\''")}'`).join(" ");
}

module.exports = {
	"*.ts?(x)": (filenames) => {
		const quoted = quoteFileNames(filenames);

		return [
			`eslint --max-warnings=0 ${quoted}`,
			`prettier --write ${quoted}`,
			`tsc -p . --noEmit`,
			`jest --bail --findRelatedTests ${quoted}`,
		];
	},
	"*.js?(x)": "prettier --write",
};
