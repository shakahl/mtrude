"use strict";

var fs = require('fs');
var mtrude = require('mtrude');
var ChunkStream = mtrude.rtmp.ChunkStream;
var MessageStream = mtrude.rtmp.MessageStream;
var AMF = mtrude.rtmp.AMF;

var mockSocket = require('./fixtures').mockSocket;

function fix(assert) {
  for (var key in assert) assert.ok[key] = assert[key];
  return assert.ok;
}


module.exports = {
  'test with incoming file': function(exit, assert) {
    assert = fix(assert);

    var end = false;
    var messageIndex = 0;

    var ms = new MessageStream(new ChunkStream(mockSocket('incoming1')));
    ms.on('error', function(err) {
      assert(false, 'error emitted: ' + err);
    });
    ms.on('warn', function(message) { console.log('WARN', message); });
    ms.on('message', function(message) {
      assert.equal(message.csid, [3][messageIndex]);
      assert.equal(message.msid, 0);
      assert.equal(message.typeid, [20][messageIndex]);
      assert.equal(message.data.length, [235][messageIndex]);

      if (messageIndex == 0) {
        var invokeParameters = AMF.deserializeZ(message.data);
        assert.equal(invokeParameters.length, 3);
        assert.equal(invokeParameters[0], 'connect');
        assert.equal(invokeParameters[1], 1);
        assert.equal(Object.keys(invokeParameters[2]).join(':'), ''
          + 'app:flashVer:swfUrl:tcUrl:fpad:capabilities:audioCodecs'
          + ':videoCodecs:videoFunction:pageUrl:objectEncoding');
      }

      messageIndex++;
    });
    ms.on('end', function(graceful) {
      assert(graceful, 'not a graceful end');
      assert.equal(messageIndex, 1, messageIndex + ' == 1');
      end = true;
    });
    exit(function() {
      assert(end, 'end has not been emitted');
    });
  },
}

