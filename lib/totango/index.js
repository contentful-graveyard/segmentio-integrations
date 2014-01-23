'use strict';

var debug       = require('debug')('segmentio:integrations:totango')
  , extend      = require('extend')
  , Integration = require('segmentio-integration')
  , is          = require('is')
  , request     = require('request-retry')({ retries : 2 })
  , util        = require('util');


module.exports = Totango;


function Totango () {
  this.name    = 'Totango';
  this.baseUrl = 'http://sdr.totango.com/pixel.gif/';
}


util.inherits(Totango, Integration);


Totango.prototype.enabled = function (message) {
  return Integration.enabled.apply(this, arguments) &&
         message.channel() === 'server';
};


Totango.prototype.validate = function (message, settings) {
  return this._missingSetting(settings, 'serviceId');
};


/**
 * Identify the Totango user.
 * http://help.totango.com/installing-totango/quick-start-http-api-server-side-integration/
 */

Totango.prototype.identify = function (identify, settings, callback) {
  var payload = {
    sdr_s   : settings.serviceId,
    sdr_o   : identify.proxy('traits.group.id'),
    sdr_i   : identify.userId() || identify.sessionId(),
    sdr_u   : identify.username(),
    sdr_odn : identify.name(),
    sdr_m   : settings.module,

    'sdr_o.Create Date': formatDate(identify.created())
  };

  var req = {
    url : this.baseUrl,
    qs  : payload
  };

  debug('making identify request %o', payload);
  request.get(req, this._handleResponse(callback));
};


/**
 * Track a Mixpanel event
 * https://mixpanel.com/help/reference/http#tracking-events
 */

Totango.prototype.track = function (track, settings, callback) {
  var payload = {
    sdr_s : settings.serviceId,
    sdr_o : track.identify().proxy('traits.group.id'),
    sdr_i : track.userId() || track.sessionId(),
    sdr_u : track.username(),
    sdr_m : settings.module,
    sdr_a : track.event()
  };

  extend(payload, accountAttributes(track));

  var req = {
    url : this.baseUrl,
    qs  : payload
  };

  debug('making track request %o', payload);
  request.get(req, this._handleResponse(callback));
};


/**
 * Returns user's account properties object.
 */

function accountAttributes(track) {
  var identify = track.identify()
    , traits   = identify.traits();

  if (!is.object(traits)) return {};

  var attrs = {};

  attrs['sdr_o.Bacon Involved'] = 'chunky';
  attrs['sdr_o.Random Number'] = Math.random();

  Object.keys(traits).forEach(function (trait) {
    var val = traits[trait];
    attrs['sdr_o.' + trait] = val;
  });

  return attrs;
}


/**
 * Formats a date for Totango's API, takes the first part of the iso string
 */

function formatDate(date) {
  date = new Date(date);
  if (isNaN(date.getTime())) return;
  return date.toISOString().slice(0,19);
}
