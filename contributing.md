# Contributing

PRs are welcome! Please make sure to update the tests and that it passes JSHint.

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
