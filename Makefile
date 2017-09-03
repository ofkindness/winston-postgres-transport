deps:
	npm i -g mocha
	npm i
lint:
	node_modules/.bin/eslint .
test:
	make lint
	make cover
init:
cover:
	npm test
