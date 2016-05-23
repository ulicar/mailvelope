/**
 * Mailvelope - secure email with OpenPGP encryption for Webmail
 * Copyright (C) 2012-2015 Mailvelope GmbH
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License version 3
 * as published by the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

'use strict';

var mvelo = mvelo || null;
var options = options || null;

options.registerL10nMessages([
  "key_gen_never",
  "alert_header_success",
  "key_gen_success",
  "key_gen_error"
]);

var mveloApp = angular.module('mveloApp');
mveloApp.controller('KeyGenerateCtrl', KeyGenerateCtrl); // attach ctrl to App module
mveloApp.controller('KeyGenAdvCtrl', KeyGenAdvCtrl); // attach ctrl to App module

/**
 * Angular controller for the Key Generate UI.
 */
function KeyGenerateCtrl() {
  this.advShown = false;
  $('#genKeyAdvSection').hide();
  this.pwd = $('#genKeyPwd');
  this.repwd = $('#genKeyRePwd');
  this.empty = this.pwd.next();
  this.nequ = this.repwd.next();
  this.match = this.nequ.next();
  this.submit = $('#genKeySubmit');
}

/**
 * Event listener to show / hide the advanced section
 */
KeyGenerateCtrl.prototype.onKeyAdvanced = function() {
  if (this.advShown) {
    $('#genKeyAdvSection').slideUp();
    $('#genKeyAdv').removeClass('key-advanced-open');
    $('#genKeyAdv').addClass('key-advanced-closed');
    this.advShown = false;
  } else {
    $('#genKeyAdvSection').slideDown();
    $('#genKeyAdv').removeClass('key-advanced-closed');
    $('#genKeyAdv').addClass('key-advanced-open');
    this.advShown = true;
  }
  return false;
};

/**
 * Evaluate the password and repeat password field and display feedback
 */
KeyGenerateCtrl.prototype.onKeyPwdChange = function() {
  var mask = (this.repwd.val().length > 0) << 1 | (this.pwd.val().length > 0);
  switch (mask) {
    case 0:
      // both empty
      this.empty.removeClass('hide');
      this.nequ.addClass('hide');
      this.match.addClass('hide');
      this.submit.prop('disabled', true);
      break;
    case 1:
    case 2:
      // re-enter or enter empty
      this.empty.addClass('hide');
      this.nequ.removeClass('hide');
      this.match.addClass('hide');
      this.submit.prop('disabled', true);
      break;
    case 3:
      // both filled
      this.empty.addClass('hide');
      if (this.repwd.val() === this.pwd.val()) {
        this.nequ.addClass('hide');
        this.match.removeClass('hide');
        this.submit.prop('disabled', false);
      } else {
        this.nequ.removeClass('hide');
        this.match.addClass('hide');
        this.submit.prop('disabled', true);
      }
      break;
  }
};

/**
 * Event handler for key generate button
 */
KeyGenerateCtrl.prototype.onGenerateKey = function() {
  var that = this;
  this.validateEmail().then(function(validEmail) {
    if (!validEmail) {
      return;
    }
    $('body').addClass('busy');
    $('#genKeyWait').one('show.bs.modal', that.generateKey);
    $('#genKeyWait').modal({backdrop: 'static', keyboard: false});
    $('#genKeyWait').modal('show');
  });
  return false;
};

/**
 * Validate email address
 * @return {Promise<boolean>} result of email validation
 */
KeyGenerateCtrl.prototype.validateEmail = function() {
  var email = $('#genKeyEmail');
  // validate email
  return options.pgpModel('validateEmail', [email.val()])
  .then(function(valid) {
    if (valid) {
      email.closest('.form-group').removeClass('has-error');
      email.next().addClass('hide');
      return true;
    } else {
      email.closest('.form-group').addClass('has-error');
      email.next().removeClass('hide');
    }
  });
};

/**
 * Retrieve key parameter from UI and generate key
 */
KeyGenerateCtrl.prototype.generateKey = function() {
  var parameters = {};
  parameters.algorithm = $('#genKeyAlgo').val();
  parameters.numBits = $('#genKeySize').val();
  parameters.userIds = [{
    fullName: $('#genKeyName').val(),
    email: $('#genKeyEmail').val()
  }];
  parameters.passphrase = $('#genKeyPwd').val();
  options.keyring('generateKey', [parameters])
  .then(function(result) {
    $('#genAlert').showAlert(options.l10n.alert_header_success, options.l10n.key_gen_success, 'success');
    $('#generateKey').find('input, select').prop('disabled', true);
    $('#genKeySubmit, #genKeyClear').prop('disabled', true);
    $('#genKeyAnother').removeClass('hide');
    // refresh grid
    options.event.triggerHandler('keygrid-reload');
  })
  .catch(function(error) {
    //console.log('generateKey() options.keyring(generateKey)', error);
    $('#genAlert').showAlert(options.l10n.key_gen_error, error.message || '', 'danger');
  })
  .then(function() {
    $('body').removeClass('busy');
    $('#genKeyWait').modal('hide');
  });
};

/**
 * Reset user input
 */
KeyGenerateCtrl.prototype.onClear = function() {
  $('#generateKey').find('input').val('');
  $('#genKeyAlgo').val('RSA/RSA');
  $('#genKeySize').val('4096');
  // TODO: uncheck checkbox, disable date picker
  $('#genKeyEmail').closest('.control-group').removeClass('error')
                   .end().next().addClass('hide');
  $('#genAlert').hide();
  this.onKeyPwdChange();
  return false;
};

/**
 * Reset UI to generate another key
 */
KeyGenerateCtrl.prototype.onAnother = function() {
  $('#generateKey').find('input').val('');
  $('#genAlert').hide();
  $('#generateKey').find('input, select').prop('disabled', false);
  $('#genKeySubmit, #genKeyClear').prop('disabled', false);
  $('#genKeyAnother').addClass('hide');
  // disable currently unavailable options
  $('#genKeyAlgo').prop('disabled', true);
  return false;
};

/**
 * Angular controller for the Key Generate Advanced UI.
 */
function KeyGenAdvCtrl($scope) {
}
