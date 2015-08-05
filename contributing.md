# Contributing

PRs are welcome! Please make sure to update the tests and that it passes JSHint.

---
## Commit messages and releases
Please make sure that you follow the [Angular.js commit message guidelines](https://github.com/angular/angular.js/blob/master/CONTRIBUTING.md#-git-commit-guidelines).
[Here's a script that can be used as a git hook to validate your commit messages. I recommend it.](https://raw.githubusercontent.com/angular/angular.js/master/validate-commit-msg.js)

Releases are automaticaly done with [semantic-release](https://github.com/semantic-release/semantic-release)

---
## Tests
This project uses one other repositories for testing: [/ariporad/generator-boilerplate-generator-test-boilerplate](/ariporad/generator-boilerplate-generator-test-boilerplate)
(A boilerplate project). For testing, it generates a generator with that repo, and runs it, and compares the output
to a target output in test/output.

For testing, a randomly generated name is used (generated once, not each time).

The test setup is a little convoluted, because of the way yeoman works, if the generated generator is /xyz/abc,
we have to move the /xyz/generator-<name>, empty /xyz/abc, then move /xyz/generator-<name> to /xyz/abc/generator-<name>.
Then we can run the generated generator. This is beacuse yeoman uses the name of the folder to figure out the name of
the generator.
