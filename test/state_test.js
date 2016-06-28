/**
 * Copyright (c) Microsoft Corporation
 *  All Rights Reserved
 *  MIT License
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this
 * software and associated documentation files (the "Software"), to deal in the Software
 * without restriction, including without limitation the rights to use, copy, modify,
 * merge, publish, distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to the following
 * conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS
 * OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT
 * OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

/* global __dirname */
/* global process */

'use strict';

var request = require('supertest');
var express = require('express');
var cookieParser = require('../node_modules/cookie-parser');
var expressSession = require('../node_modules/express-session');
var bodyParser = require('../node_modules/body-parser');
var passport = require('../node_modules/passport');
var OIDCStrategy = require('../lib/index').OIDCStrategy;

var options = {
    callbackURL: '/returnURL',
    clientID: 'my_client_id',
    clientSecret: 'my_client_secret',
    identityMetadata: 'www.example.com/metadataURL',
    skipUserProfile: true,
    responseType: 'form_post',
    responseMode: 'id_token',
    validateIssuer: true,
    passReqToCallback: false,
};

var testStrategy = new OIDCStrategy(options, function(profile, done) { done(null, 'user')});

OIDCStrategy.prototype.setOptions = function(options, metadata, cachekey, next) { return next();};
OIDCStrategy.prototype.configure = function(identifier, done) {
  var options = {           
    clientID: options.clientID,
    clientSecret: options.clientSecret,
    authorizationURL: 'www.example.com/authorizationURL',
    tokenURL: 'www.example.com/tokenURL'
  };
  done(null, options);
};

passport.use(testStrategy);

var app = express();


  app.use(cookieParser());
  app.use(expressSession({ secret: 'keyboard cat', resave: true, saveUninitialized: false }));
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(passport.initialize());
  app.use(passport.session());

app.get('/login', passport.authenticate('azuread-openidconnect', {state: 'my_state'}));

exports.state_test = {
  'check state': (test) => {
    test.expect(1);
    // tests here
    var resp = undefined;
    request(app).get('/login').end(function(err, res) {
      if (err) throw err;
      console.log(res);
      resp = res;
    });

    //console.log(resp);

    test.ok(resp.query.state === 'my_state', 'should have same state');

    test.done();
  },
};
