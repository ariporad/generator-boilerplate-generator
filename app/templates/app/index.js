'use strict';
var yeoman = require('yeoman-generator');
var chalk = require('chalk');
var yosay = require('yosay');

module.exports = yeoman.generators.Base.extend({
  prompting: function () {
    var done = this.async();

    // Have Yeoman greet the user.
    this.log(yosay(
      'Welcome to the ' + chalk.cyan('<%= repo %>') + ' generator!'
    ));

    var prompts = [{
      name: 'name',
      message: 'If I may ask, what name have you chosen for your new app?'
    }];

    this.prompt(prompts, function (props) {
      // To access props later use this.props.someOption;
      this.props = props;
      done();
    }.bind(this));
  },

  writing: {
    everything: function() {
      this.fs.copy(
        this.templatePath('**/*'),
        this.destinationPath()
      );
    },

    install: function() {
      this.installDependencies();
    }
  }
});
