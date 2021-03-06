start:
	npm run babel-node -- src/bin/page-loader.js
install:
	npm install
publish:
	npm publish
lint:
	npm run eslint .
test:
	npm test
test-watch:
	npm test --watchAll
debug-test:
	DEBUG=page-loader:* npm test
debug-run:
	DEBUG=page-loader:* npm run babel-node src/bin/page-loader.js --output /var/tmp http://alpha-design.kz
