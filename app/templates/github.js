"use strict";
/**
 * Created by Ari on 8/3/15.
 */
var https = require('https');
var AdmZip = require('adm-zip');
var chalk = require('chalk');

module.exports = {
  getRepo: function getRepo(repo, cb) {
    if (!this.validateRepo(repo)) {
      return cb(new Error('Invalid Repository'));
    }

    this._getData(this._makeUrl(repo), function(err, buffer) {
      if (err) {
        return cb(err);
      }

      if (err === false) {
        return cb(new Error('Invalid Repository'));
      }

      cb(undefined, this._unzip(buffer));
    }.bind(this));
  },

  validateUser: function validateUser(user){
    return !!user.match(/^([A-z\-]{4,})$/i);
  },

  validateRepo: function validateRepo(repo){
    return !!repo.match(/^([A-z\-]{4,}\/[A-z\-]+)$/i);
  },

  _makeUrl: function _makeUrl(repo) {
    return 'https://codeload.github.com/' + repo + '/zip/master';
  },
  _getData: function _getData(url, cb) {
    // http://stackoverflow.com/questions/10359485/how-to-download-and-unzip-a-zip-file-in-memory-in-nodejs
    https.get(url, function(res) {
      var data = [], dataLen = 0;

      if (res.statusCode == 404) {
        return cb(false);
      }

      res.on('error', cb);
      res.on('data', function(chunk) {
        data.push(chunk);
        dataLen += chunk.length;
      });
      res.on('end', function() {
        var buf = new Buffer(dataLen);

        for (var i = 0, len = data.length, pos = 0; i < len; i++) {
          data[i].copy(buf, pos);
          pos += data[i].length;
        }
        cb(undefined, buf);
      });
    });
  },
  _processZippedFilename: function _processZippedFilename(filename) {
    var parts = filename.split('/');
    parts.shift();

    return parts.join('/');
  },
  // TODO: This would be a really great place to use ES6 yeild.
  _unzip: function unzip(buffer) {
    var zip = new AdmZip(buffer);
    var zipEntries = zip.getEntries();

    var files = {};
    for (var i = 0; i < zipEntries.length; i++) {
      var entry = zipEntries[i];
      var name = this._processZippedFilename(entry.entryName);
      var text = zip.readAsText(entry);
      if (entry.isDirectory) {
        continue;
      }
      console.log(chalk.cyan('    unzip ') + name);
      files[name] = text;
    }

    return files;
  },
  checkItemExists: function(url, cb) {
    https.get('https://github.com/' + url, function(res) {
      cb(undefined, res.statusCode !== 404);
    }).on('error', cb);
  }
};
