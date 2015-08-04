/**
 * Created by Ari on 8/3/15.
 */
var https = require('https');
var AdmZip = require('adm-zip');
var chalk = require('chalk');

module.exports = function getBoilerplate(repo, cb) {
  this._getData(this._makeUrl(repo), function(err, buffer){
    if (err) return cb(err);

    cb(undefined, this._unzip(buffer));
  }.bind(this));
};

module.exports._makeUrl = function makeUrl(repo) {
  return 'https://codeload.github.com/' + repo + '/zip/master';
};

module.exports._getData = function getData(url, cb) {
  // http://stackoverflow.com/questions/10359485/how-to-download-and-unzip-a-zip-file-in-memory-in-nodejs
  https.get(url, function(res) {
    var data = [], dataLen = 0;

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
};

module.exports._processZippedFilename = function processZippedFilename(filename) {
  var parts = filename.split('/');
  parts.shift();

  return parts.join('/');
};

// TODO: This would be a really great place to use ES6 yeild.
module.exports._unzip = function unzip(buffer) {
  var zip = new AdmZip(buffer);
  var zipEntries = zip.getEntries();

  var files = {};
  for (var i = 0; i < zipEntries.length; i++) {
    var entry = zipEntries[i];
    var name = this._processZippedFilename(entry.entryName);
    var text = zip.readAsText(entry);
    if (entry.isDirectory) continue;
    console.log(chalk.cyan('    unzip ') + name);
    files[name] = text;
  }

  return files;
};

module.exports = module.exports.bind(module.exports);
