'use strict';
var yeoman = require('yeoman-generator');
var chalk = require('chalk');
var yosay = require('yosay');
var _ = require('underscore');
var _s = require('underscore.string');
var GitHub = require('../../github');

var repo = '<%= repo %>';
var emailRegex = /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i;

function rewrite(file, name) {
  return file
    .replace(/({{#\s*=?\s*name\s*#}})/i, name)
}

module.exports = yeoman.generators.Base.extend({
  prompting: function() {
    var done = this.async();

    // Have Yeoman greet the user.
    this.log(yosay(
      'Welcome to the ' + chalk.cyan('<%= repo %>') + ' generator!'
    ));

    var prompts = [
      {
        name: 'userName',
        message: 'If I may ask, what is your name',
        default: 'Octo Cat',
        validate: function(res) {
          return !!res.match(/^([A-Za-z]{3,} [A-Za-z]{3,})$/i) ||
                 'My apologies, but that doesn\'t appear to be a name.';
        }
      },
      {
        name: 'userEmail',
        message: 'Please excuse me, but may I please ask your name?',
        validate: function(res) {
          return !!res.match(emailRegex) ||
                 'My apologies, but that doesn\'t apear to be a valid email.';
        }
      },
      {
        name: 'githubUser',
        message: 'Would you mind telling me your username on GitHub?',
        default: 'octocat',
        validate: function(res) {
          if (!GitHub.validateUser(res)) {
            return 'My apologies, but that doesn\'t appear to be a valid GitHub username';
          }

          var done = this.async();
          GitHub.checkItemExists(res, function(err, exists) {
            if (err) {
              throw err;
            }
            done(exists ||
                 'My apologies, but that doesn\'t appear to be a user on GitHub');
          });
        }
      },
      {
        name: 'name',
        message: 'If I may ask, what name have you chosen for your new app?',
        default: 'My Awesome App'
      }
    ];

    this.prompt(prompts, function(props) {
      // To access props later use this.props.someOption;
      this.props = JSON.parse('<%= JSON.stringify(props) %>');
      for (var key in props) {
        if (props.hasOwnProperty(key)) {
          this.props[key] = props[key];
        }
      }
      this.props.githubUrl = [
        'https://github.com',
        this.props.githubUser,
        _s.slugify(this.props.name)
      ].join('/');
      done();
    }.bind(this));
  },

  writing: {
    everything: function() {
      var done = this.async();

      GitHub.getRepo(repo, function(err, files) {
        if (err) throw err;

        for (var path in files) {
          if (!files.hasOwnProperty(path)) continue;
          this.fs.write(path, rewrite(files[path], this.props.name));
        }

        done();
      }.bind(this));
    },

    packageJsonRename: function() {
      var pkg = this.fs.readJSON('package.json');
      pkg.name = _s.slugify(this.props.name);
      pkg.repository.url = pkg.homepage = this.props.githubUrl;
      pkg.bugs.url = this.props.githubUrl + '/issues';
      pkg.author = {
        name: this.props.userName,
        "email": this.props.userEmail,
        "url": this.props.githubUrl
      };

      this.fs.writeJSON('package.json', pkg);
    },

    install: function() {
      this.installDependencies();
    }
  }
});
