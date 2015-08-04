'use strict';
var path = require('path');
var url = require('url');
var https = require('https');
var AdmZip = require('adm-zip');
var generators = require('yeoman-generator');
var chalk = require('chalk');
var yosay = require('yosay');
var npmName = require('npm-name');
var superb = require('superb');
var _ = require('lodash');
var _s = require('underscore.string');

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

var getRepoZip = function(repo, cb) {
  // http://stackoverflow.com/questions/10359485/how-to-download-and-unzip-a-zip-file-in-memory-in-nodejs
  var file_url = 'https://codeload.github.com/' + repo + '/zip/master';

  https.get(file_url, function(res) {
    var data = [], dataLen = 0;

    res.on('error', console.error);
    res.on('data', function(chunk) {

      data.push(chunk);
      dataLen += chunk.length;

    }).on('end', function() {
      var buf = new Buffer(dataLen);

      for (var i = 0, len = data.length, pos = 0; i < len; i++) {
        data[i].copy(buf, pos);
        pos += data[i].length;
      }
      cb(buf);
    });
  });
};

function processZippedFilename(filename) {
  var parts = filename.split('/');
  parts.shift();

  return parts.join('/');
}

// TODO: This would be a really great place to use ES6 yeild.
function unzip(buffer, cb) {
  var zip = new AdmZip(buffer);
  var zipEntries = zip.getEntries();

  var files = {};
  for (var i = 0; i < zipEntries.length; i++) {
    var entry = zipEntries[i];
    var name = processZippedFilename(entry.entryName);
    var text = zip.readAsText(entry);
    if (entry.isDirectory) continue;
    console.log(chalk.cyan('    unzip ') + name);
    files[name] = text;
  }

  return files;
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

    this.option('flat', {
      type: Boolean,
      required: false,
      defaults: false,
      desc: 'When specified, generators will be created at the top level of the project.'
    });
  },

  initializing: function() {
    this.pkg = require('../package.json');
    this.currentYear = (new Date()).getFullYear();
    this.config.set('structure', this.options.flat ? 'flat' : 'nested');
    this.generatorsPrefix = this.options.flat ? '' : 'generators/';
    this.appGeneratorDir = this.options.flat ? 'app' : 'generators';
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
          default: 'someuser'
        },
        {
          name: 'repo',
          message: 'If you don\'t mind, what repository are you making a ' +
                   'generator for',
          default: function(props) {
            return props.githubUser + '/boilerplate'
          },
          validate: function(res) {
            return !!res.match(/^([A-z\-]{4,}\/[A-z\-]+)$/i) ||
                   'My apologies, but that doesn\'t appear to be a repository';
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
                   'My apologies, but that doesn\'t appear to be a valid npm ' +
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
              if (!available) {
                done(true);
              }

              done(false);
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
    enforceFolderName: function() {
      if (this.props.name !==
          _.last(this.destinationRoot().split(path.sep))) {
        this.destinationRoot(this.props.name);
      }

      this.config.save();
    },

    userInfo: function() {
      var done = this.async();
      console.log(this.props);
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
      console.log(this.props);
      for (var key in this.props) {
        this[key] = this.props[key];
      }
    },

    getGitRepo: function() {
      var done = this.async();
      getRepoZip(this.props.repo, function(buf) {
        var files = unzip(buf);

        for (var path in files) {
          this.fs.write(path, files[path]);
        }

        this.files = files;

        done();
      }.bind(this));
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
      this.fs.copyTpl(
        this.templatePath('app/index.js'),
        this.destinationPath(this.generatorsPrefix, 'app/index.js'),
        {
          superb: superb(),
          generatorName: _s.classify(this.generatorName)
        }
      );
    },
  },

  tests: function() {
    this.fs.copyTpl(
      this.templatePath('test-app.js'),
      this.destinationPath('test/test-app.js'),
      {
        prefix: this.generatorsPrefix,
        generatorName: this.generatorName
      }
    );
  },

  install: function() {
    this.installDependencies({ bower: false });
  },
});
