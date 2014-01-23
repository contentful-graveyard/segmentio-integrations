
var facade = require('segmentio-facade')
  , extend = require('extend')
  , uid    = require('uid');


var firstId  = uid()
  , secondId = uid()
  , email    = 'testing-' + firstId + '@segment.io';


exports.track = function (options) {
  options = options || {};
  options = extend({
    userId     : firstId,
    event      : 'Baked a cake',
    properties : {
      layers  : ['chocolate', 'strawberry', 'fudge'],
      revenue : 19.95,
      numLayers : 10,
      fat : 0.02,
      bacon : '1',
      date : (new Date()).toISOString(),
      address : {
        state : 'CA',
        zip  : 94107,
        city : 'San Francisco'
      }
    },
    channel    : 'server',
    timestamp  : new Date(),
    options : {
      traits : {
        group   : { id: 'group-id' },
        email   : options.email || email,
        age     : 23,
        created : new Date(),
        bad     : null,
        alsoBad : undefined,
        address : {
          state : 'CA',
          zip  : 94107,
          city : 'San Francisco'
        }
      },
      ip : '4.184.68.0',
      userAgent: 'Mozilla/5.0 (compatible; MSIE 10.0; Windows NT 6.2; Trident/6.0)'
    }
  }, options);
  return new facade.Track(options);
};


exports.track.bare = function (options) {
  options = extend({
    userId  : 'aaa',
    event   : 'Bear tracks',
    channel : 'server'
  }, options);
  return new facade.Track(options);
};



/**
 * Use a particular user id
 */

exports.identify = function (options) {
  options = options || {};
  options = extend({
    userId : firstId,
    traits : {
      group       : { id: 'group-id' },
      fat         : 0.02,
      firstName   : 'John',
      'Last Name' : 'Doe',
      email       : options.email || email,
      company     : 'Segment.io',
      city        : 'San Francisco',
      state       : 'CA',
      phone       : '5555555555',
      websites    : [
        'http://calv.info',
        'http://ianstormtaylor.com',
        'http://ivolo.me',
        'http://rein.pk'
      ],
      bad     : null,
      alsoBad : undefined,
      met : (new Date()).toISOString(),
      created : new Date('1/12/2013'),
      userAgent: 'Mozilla/5.0 (compatible; MSIE 10.0; Windows NT 6.2; Trident/6.0)'
    },
    context : {
      ip : '12.212.12.49'
    },
    timestamp : new Date(),
    channel : 'server'
  }, options);
  return new facade.Identify(options);
};


exports.alias = function (options) {
  options = extend({
    from      : firstId,
    to        : secondId,
    channel   : 'server',
    timestamp : new Date()
  }, options);
  return new facade.Alias(options);
};
