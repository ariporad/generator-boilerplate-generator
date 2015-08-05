'use strict';
var url = require('url');
var generators = require('yeoman-generator');
var chalk = require('chalk');
var yosay = require('yosay');
var npmName = require('npm-name');
var _ = require('lodash');
var _s = require('underscore.string');
var GitHub = require('./templates/github');

var proxy = process.env.http_proxy ||
            process.env.HTTP_PROXY ||
            process.env.https_proxy ||
            process.env.HTTPS_PROXY ||
            null;

var githubOptions = {
  version: '3.0.0'
};

if (proxy) {
  var proxyUrl = url.parse(proxy);

  githubOptions.proxy = {
    host: proxyUrl.hostname,
    port: proxyUrl.port
  };
}

var GitHubApi = require('github');
var github = new GitHubApi(githubOptions);

if (process.env.GITHUB_TOKEN) {
  github.authenticate({
    type: 'oauth',
    token: process.env.GITHUB_TOKEN
  });
}

var extractGeneratorName = function(appname) {
  var match = appname.match(/^generator-(.+)/);

  if (match && match.length === 2) {
    return match[1].toLowerCase();
  }

  return appname;
};

var emptyGithubRes = {
  name: '',
  email: '',
  html_url: ''
};

var githubUserInfo = function(name, cb, log) {
  github.user.getFrom({
    user: name
  }, function(err, res) {
    if (err) {
      log.error('Cannot fetch your github profile. Make sure you\'ve typed it correctly.');
      res = emptyGithubRes;
    }

    cb(JSON.parse(JSON.stringify(res)));
  });
};

module.exports = generators.Base.extend({
  constructor: function() {
    generators.Base.apply(this, arguments);
  },

  initializing: function() {
    this.pkg = require('../package.json');
    this.currentYear = (new Date()).getFullYear();
  },

  prompting: {
    repo: function() {
      var done = this.async();

      this.log(yosay('Create your own ' +
                     chalk.red('Yeoman') +
                     ' generator from a boilerplate repo!'));

      var prompts = [
        {
          name: 'githubUser',
          message: 'Would you mind telling me your username on GitHub?',
          default: 'octocat',
          validate: function (res) {
            if (!GitHub.validateUser(res)) {
              return 'My apologies, but that doesn\'t appear to be a valid GitHub username';
            }

            var done = this.async();
            GitHub.checkItemExists(res, function(err, exists){
              if (err) {
                throw err;
              }
              done(exists || 'My apologies, but that doesn\'t appear to be a user on GitHub');
            });
          }
        },
        {
          name: 'repo',
          message: 'If you don\'t mind, what repository are you making a ' +
                   'generator for',
          default: function(props) {
            return props.githubUser + '/boilerplate';
          },
          validate: function(res) {
            if(!GitHub.validateRepo(res)) {
              return 'My apologies, but that doesn\'t appear to be a repository';
            }

            var done = this.async();

            GitHub.checkItemExists(res, function(err, exists){
              if (err) {
                throw err;
              }
              done(exists || 'My apologies, but that doesn\'t appear to be a repository on GitHub');
            });
          }
        }
      ];

      this.prompt(prompts, function(props) {
        this.props = props;
        done();
      }.bind(this));
    },

    name: function() {
      var done = this.async();

      var prompts = [
        {
          name: 'name',
          message: 'If I may, what do you plan to name your ' +
                   chalk.bold('fabulous') + ' generator?',
          default: function(props) {
            return 'generator-' + _s.slugify(this.props.repo.split('/')[1]);
          }.bind(this),
          validate: function(res) {
            return !!res.match(/^((?:generator\-)?[A-z][A-z\-]{0,201}[A-z])$/i) ||
                   'My apologies, but that doesn\'t appear to be a valid ' +
                   'package name.';
          }
        },
        {
          type: 'confirm',
          name: 'askNameAgain',
          message: 'The name above already exists on npm, choose another?',
          default: true,
          when: function(props) {
            var done = this.async();
            var name = props.name;

            npmName(name, function(err, available) {
              done(!available);
            });
          }
        }
      ];

      this.prompt(prompts, function(props) {
        if (props.askNameAgain) {
          return this.prompting.name.call(this);
        }

        if (props.name.indexOf('generator-') == -1) {
          props.name = 'generator-' + props.name;
        }

        props.generatorName = extractGeneratorName(props.name);
        props.name = _s.slugify(props.name);

        this.props = _.extend(this.props, props);

        done();
      }.bind(this));
    }
  },

  configuring: {
    userInfo: function() {
      var done = this.async();
      githubUserInfo(this.props.githubUser, function(res) {
        this.props.realname = res.name;
        this.props.email = res.email;
        this.props.githubUrl = res.html_url;
        done();
      }.bind(this), this.log);
    }
  },

  writing: {
    setup: function() {
      for (var key in this.props) {
        this[key] = this.props[key];
      }
    },

    projectfiles: function() {
      this.template('_package.json', 'package.json');
      this.template('editorconfig', '.editorconfig');
      this.template('jshintrc', '.jshintrc');
      this.template('_travis.yml', '.travis.yml');
      this.template('README.md');
    },

    gitfiles: function() {
      this.copy('gitattributes', '.gitattributes');
      this.copy('gitignore', '.gitignore');
    },

    app: function() {
      this.fs.copyTpl(this.templatePath('app/index.js'),
                      this.destinationPath('generators/app/index.js'), this);

      this.fs.copyTpl(this.templatePath('github.js'),
                      this.destinationPath('github.js'), this);
    },

    tests: function() {
      this.fs.copyTpl(this.templatePath('test-app.js'),
                      this.destinationPath('test/test-app.js'), this);
    },
  },

  install: function() {
    this.installDependencies({ bower: false });
  },

  info: function() {
    this.log(yosay('Each time you use your generator, it will fetch ' +
                   chalk.cyan(this.props.repo) +
                   ', and update the name and version in package.json.'));

    this.log(yosay('It will also replace every instance of' +
                   chalk.bgWhite('\n{{# name #}}') + '\n or \n' +
                   chalk.bgWhite('{{# slug #}}\n') +
                   'with the name (or slug, respectively), of the generated app.'));
  }
});
