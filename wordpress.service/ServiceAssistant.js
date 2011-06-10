if (typeof require == 'undefined') {
  require = IMPORTS.require;
};

var sys = require('sys');
var fs = require('fs');
var http = require('http');
var url = require('url');

ServiceAssistant = function() {};

ServiceAssistant.prototype.setup = function() {
  console.log("---->Service Assistant Executed");
};