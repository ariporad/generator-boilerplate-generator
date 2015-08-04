'use strict';
var yeoman = require('yeoman-generator');
var chalk = require('chalk');
var yosay = require('yosay');
var _ = require('underscore');
var _s = require('underscore.string');
var getBoilerplate = require('../../getBoilerplate');

var repo = '<%= repo %>';

function rename(file, name){
  file
    .replace(/({{#\s*name\s*#}})/i, name)
}

module.exports = yeoman.generators.Base.extend({
  prompting: function () {
    var done = this.async();

    // Have Yeoman greet the user.
    this.log(yosay(
      'Welcome to the ' + chalk.cyan('<%= repo %>') + ' generator!'
    ));

    var prompts = [{
      name: 'name',
      message: 'If I may ask, what name have you chosen for your new app?',
      default: 'My Awesome App'
    }];

    this.prompt(prompts, function (props) {
      // To access props later use this.props.someOption;
      this.props = JSON.parse('<%= JSON.stringify(props) %>');
      for (var key in props) {
        if (props.hasOwnProperty(key)) {
          this.props[key] = props[key];
        }
      }
      done();
    }.bind(this));
  },

  writing: {
    everything: function() {
      var done = this.async();

      getBoilerplate(repo, function(err, files){
        if (err) throw err;

        for (var path in files) {
          if(!files.hasOwnProperty(path)) continue;
          this.fs.write(path, rename(files[path], this.props.name));
        }

        done();
      }.bind(this));
    },

    packageJsonRename: function() {
      var pkg = this.fs.readJSON('package.json');
      pkg.name = _s.slugify(this.props.name);
      this.fs.writeJSON('package.json', pkg);
    },

    install: function() {
      this.installDependencies();
    }
  }
});
