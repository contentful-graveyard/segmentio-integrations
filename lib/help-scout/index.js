
var debug       = require('debug')('segmentio:integrations:help-scout')
  , Integration = require('segmentio-integration')
  , errors      = Integration.errors
  , extend      = require('extend')
  , is          = require('is')
  , request     = require('request-retry')({ retries : 2 })
  , util        = require('util');


module.exports = HelpScout;


function HelpScout () {
  this.name    = 'Help Scout';
  this.baseUrl = 'https://api.helpscout.net/v1/';
}


util.inherits(HelpScout, Integration);


HelpScout.prototype.enabled = function (message, settings) {
  return Integration.enabled.apply(this, arguments);
};


HelpScout.prototype.validate = function (message, settings) {
  var err = this._missingSetting(settings, 'apiKey');
  if (err) return err;

  if (message.action() === 'identify' && !message.email()) {
    return new errors.Validation('HelpScout identify requires email field.');
  }
};


/**
 * Identifies a user in HelpScout. We first have to check whether a user
 * already exists for this email. If they don't, create them, otherwise
 * update them. TODO: fix race conditions with a shared lock.
 *
 * http://developer.helpscout.net/customers/create/
 * http://developer.helpscout.net/customers/update/
 */

HelpScout.prototype.identify = function (identify, settings, callback) {
  var email = identify.email()
    , self  = this;

  debug('making identify request', email);
  this._getUser({ email : email }, settings, function (err, user) {
    if (err) return callback(err);

    if (!user) self._createUser(identify, settings, callback);
    else self._updateUser(user.id, identify, settings, callback);
  });
};


/**
 * Get a user from the API, filtered by particular fields
 * @param  {Object}   filter   an object to match fields on
 * @param  {Object}   settings
 * @param  {Function} callback (err, user)
 */

HelpScout.prototype._getUser = function (filter, settings, callback) {

  var req = {
    url     : this.baseUrl + 'customers.json',
    headers : this._headers(settings),
    qs      : filter,
    json    : true
  };

  debug('getting user from the api', filter);
  request.get(req, this._handleResponse(function (err, body) {
    if (err) return callback(err);

    var customer = body.items ? body.items[0] : null;
    callback(err, customer);
  }));
};


/**
 * Updates the user in HelpScout with the new identify
 * @param  {String}   id        the HelpScout id
 * @param  {Facade}   identify
 * @param  {Object}   settings
 * @param  {Function} callback  (err, user)
 */

HelpScout.prototype._updateUser = function (id, identify, settings, callback) {
  var traits = formatTraits(identify);

  var req = {
    url     : this.baseUrl + util.format('customers/%s.json', id),
    headers : this._headers(settings),
    json    : traits,
    qs      : { reload : true }
  };

  debug('updating an existing user', identify.email());
  request.put(req, this._handleResponse(callback));
};


/**
 * Creates a user in HelpScout
 */

HelpScout.prototype._createUser = function (identify, settings, callback) {

  var traits = formatTraits(identify);

  var req = {
    url     : this.baseUrl + 'customers.json',
    headers : this._headers(settings),
    json    : traits,
    qs      : { reload : true }
  };

  debug('creating a new user', identify.email());
  request.post(req, this._handleResponse(callback));
};


/**
 * Add the proper headers
 */

HelpScout.prototype._headers = function (settings) {

  var auth = 'Basic ' + new Buffer(settings.apiKey + ':X').toString('base64');
  return { 'Authorization' : auth };
};


/**
 * Add the HelpScout traits
 * http://developer.helpscout.net/customers/update/
 *
 * @param  {Facade.Identify} identify
 */

function formatTraits (identify) {
  var organization = identify.proxy('traits.organization') ||
                     identify.proxy('traits.company');

  var traits = {
    gender       : identify.proxy('traits.gender'),
    age          : identify.proxy('traits.age'),
    location     : identify.proxy('traits.location'),
    photoUrl     : identify.proxy('traits.avatar') || identify.proxy('traits.photoUrl'),
    firstName    : identify.firstName(),
    lastName     : identify.lastName(),
    emails       : [{ value : identify.email() }],
    organization : organization,
    jobTitle     : identify.proxy('traits.jobTitle'),
    background   : identify.description(),
    address      : formatAddress(identify),
    websites     : formatMultiple(identify, 'website', 'websites'),
    phones       : formatPhones(identify)
  };

  return traits;
}


/**
 * Look in the traits for the singular and plural field for an event
 *
 * @param {Identify} identify
 * @param {String}   singular  the singular string
 * @param {String}   plural
 */

function formatMultiple (identify, singular, plural) {
  singular = identify.proxy('traits.' + singular);
  plural   = identify.proxy('traits.' + plural);

  if (singular) return [formatData(singular)];
  if (plural && is.array(plural)) return plural.map(formatData);
}


/**
 * Add location data to each item in the phones array
 */

function formatPhones (identify) {
  var phones = formatMultiple(identify, 'phone', 'phones');
  if (!phones) return;
  if (!is.array(phones)) phones = [phones];

  phones.forEach(function (phone) {
    if (!phone.location) phone.location = 'mobile';
  });

  return phones;
}


/**
 * Formats an address for helpscout
 */

function formatAddress (identify) {
  var address = identify.proxy('traits.address')
    , proxy   = 'traits';

  // Decide whether to reach into just traits or traits.address
  if (is.object(address)) proxy = 'traits.address';

  var zip     = identify.proxy(proxy + '.zip') || identify.proxy(proxy + '.postalCode')
    , city    = identify.proxy(proxy + '.city')
    , country = identify.proxy(proxy + '.country')
    , state   = identify.proxy(proxy + '.state')
    , street  = identify.proxy(proxy + '.street');

  if (!zip || !city || !country || !state || !street) return;

  var output = {
    city       : city,
    state      : state,
    postalCode : zip,
    country    : country,
    lines      : [street]
  };

  return output;
}

/**
 * Formats an array field for HelpScout
 * http://developer.helpscout.net/customers/update/
 */

function formatData (data) {
  return {
    value : data
  };
}

