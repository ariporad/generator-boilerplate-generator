'use strict';
var fs = require('fs-extra');
var path = require('path');
var assert = require('yeoman-generator').assert;
var helpers = require('yeoman-generator').test;
var mockery = require('mockery');
var npm = require('npm');
var expect = require('chai').expect;

// acQ7sYt5dqe9s5UIW1dA
var configs = [
  {
    githubUser: 'ariporad',
    askNameAgain: false,
    repo: 'ariporad/generator-boilerplate-generator-test-boilerplate',
    name: 'generator-boilerplate-generator-test'
  },
  {
    userName: 'Ari Porad',
    userEmail: 'ari@porad.com',
    githubUser: 'ariporad',
    name: 'acQ7sYt5dqe9s5UIW1dA'
  }
];

function runGenerator(done) {
  var dir;
  helpers.run(path.join(__dirname, '../app'))
    .inTmpDir(function(d) {
                dir = d;
              })
    .withPrompts(configs[0])
    .on('end', function() {
          setupGeneratedGenerator(dir, done);
        });
}

function runGeneratedGenerator(p, done) {
  var dir;
  var generator =
        path.resolve(p, 'generator-acQ7sYt5dqe9s5UIW1dA/generators/app');
  helpers.run(generator)
    .inTmpDir(function(d) {
                dir = d;
              })
    .withPrompts(configs[1])
    .on('end', function() {
          done({ genDir: p, outDir: dir, generator: generator });
        });
}

function pkgToDepts(pkg) {
  var depts = [];
  var deptsObj = pkg.dependencies;

  for(var key in deptsObj) {
    depts.push(key + '@' + deptsObj[key]);
  }

  return depts;
}

function setupGeneratedGenerator(p, done) {
  var dir;
  var newDirName = 'generator-acQ7sYt5dqe9s5UIW1dA';
  var newDir = path.resolve(p, newDirName);
  var tmp = path.resolve(p, '..', newDirName);

  fs.emptyDirSync(tmp);
  fs.copySync(p, tmp, { clobber: true });
  fs.emptyDirSync(p);
  fs.copySync(tmp, newDir, { clobber: true });
  fs.removeSync(tmp);

  var pkg = JSON.parse(fs.readFileSync(path.resolve(newDir, 'package.json'), 'utf8'));

  npm.load({ quiet: true }, function(err, npm) {
    if (err) {
      done(err);
    }

    npm.commands.install(newDir, pkgToDepts(pkg), function(err){
      if (err) {
        return done(err);
      }

      runGeneratedGenerator(p, done);
    });
  });
}

describe('generator:app', function() {
  before(function() {
    mockery.enable({ warnOnUnregistered: false });
    mockery.registerMock('github', function() {
      return {
        user: {
          getFrom: function(data, cb) {
            cb(null, JSON.stringify({
              name: 'Ari Porad',
              email: 'ari@porad.com',
              html_url: 'https://github.com/ariporad'
            }));
          }
        }
      };
    });

    mockery.registerMock('npm-name', function(name, fn) {
      fn(null, true);
    });
  });

  after(function() {
    mockery.disable();
  });

  describe('default', function() {
    var genDir;
    var dir;
    var expectedDir = path.resolve(__dirname, 'output');

    before(function(done) {
      this.timeout(0);
      runGenerator(function(res) {
        console.log('Generated Dir: ' + res.genDir);
        console.log('Output Dir: ' + res.outDir);
        genDir = res.genDir;
        dir = res.outDir;
        done();
      });
    });

    it('creates files', function() {
      var actual = fs.readdirSync(dir);
      var expected = fs.readdirSync(expectedDir);
      expect(actual).to.eql(expected);
    });

    it('file content', function() {
      var actualFilenames = fs.readdirSync(dir);
      var expectedFilenames = fs.readdirSync(expectedDir);

      for (var i = 0; i < expectedFilenames.length; i++) {
        var actual = fs.readFileSync(dir + '/' + actualFilenames[i], 'utf8');
        var expected = fs.readFileSync(expectedDir + '/' + expectedFilenames[i], 'utf8');
        expect(actual.trim()).to.eql(expected.trim());
      }
    })
  });
});
