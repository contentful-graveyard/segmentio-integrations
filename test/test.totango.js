'use strict';

var auth         = require('./auth')
  , facade       = require('segmentio-facade')
  , helpers      = require('./helpers')
  , integrations = require('..')
  , should       = require('should');


var totango = new integrations['Totango']()
  , settings = auth['Totango'];


describe('Mixpanel', function () {

  describe('.enabled()', function () {
    it('should only be enabled for server side messages', function () {
      totango.enabled(new facade.Track({ channel : 'server' })).should.be.ok;
      totango.enabled(new facade.Track({ channel : 'client' })).should.not.be.ok;
      totango.enabled(new facade.Track({})).should.not.be.ok;
    });
  });


  describe('.validate()', function () {
    it('should not validate settings without a token', function () {
      var identify = helpers.identify();
      totango.validate(identify, {}).should.be.instanceOf(Error);
    });

    it('should validate proper identify calls', function () {
      var identify = helpers.identify();
      should.not.exist(totango.validate(identify, { serviceId : 'SP-1234-56' }));
    });
  });


  describe('.track()', function () {
    it('should be able to track correctly', function (done) {
      totango.track(helpers.track(), settings, done);
    });

    it('should be able to track a bare call', function (done) {
      totango.track(helpers.track.bare(), settings, done);
    });

    it('should be able to track ill-formed traits', function (done) {
      totango.track(helpers.track.bare({
        context : {
          traits : 'aaa'
        }
      }), settings, done);
    });
  });


  describe('.identify()', function () {
    var identify = helpers.identify();
    it('should be able to identify correctly', function (done) {
      totango.identify(identify, settings, done);
    });
  });
});
