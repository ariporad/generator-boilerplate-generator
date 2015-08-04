# generator-boilerplate-generator [![Build Status](https://secure.travis-ci.org/ariporad/generator-boilerplate-generator.svg?branch=master)](https://travis-ci.org/ariporad/generator-boilerplate-generator)

> Generate a Yeoman generator based off a boilerplate repository

Maintainer: [Ari Porad](https://github.com/ariporad)

![Yo dawg, I heard you like generators?](http://i.imgur.com/2gqiift.jpg)


## Getting started

- Install: `npm install -g generator-boilerplate-generator`
- Run: `yo boilerplate-generator`

The principal behind this is that when making a complex generator that generates a whole application, it's preferable to
have the boilerplate in a sepeate repository, and have the generator download it whenever it's needed.

So, run this generator with `yo boilerplate-generator`, give it your GitHub username and the boilerplate repo, and it
will generate a generator which when run will download the repo, and customize it.

By default, then generator will replace every instance of `{{# name #}}` with the name of that the user had chosen for
their generated app. The package.json will also be updated.

Of course, you can edit the generated generator, to add more options or do whatever.

## Contributing

PR's are welcome, please make sure you update the tests, and make sure it passes JSHint.

## License

[MIT](http://ariporad.mit-license.org). © [Ari Porad <github@ariporad.com>](mailto:github@ariporad.com).
