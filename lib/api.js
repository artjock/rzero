var http = require('http');
var https = require('https');
var util = require('./util');

var proto = module.exports = {

    body: function(body) {
        this._data = body;
        return this;
    },

    type: function(res, req) {
        if (res) {
            this._typeRes = res;
        }
        if (req) {
            this._typeReq = req;
        }
        return this;
    },

    prms: function() {
        var args = arguments;
        var query = {};

        if (args.length === 2) {
            query[ args[0] ] = args[1];
        } else {
            query = args[0];
        }

        util.extend(this._query, query);
        return this;
    },

    head: function() {
        var that = this;
        var args = arguments;
        var opts = this._opts;
        var headers = {};

        if (args.length === 2) {
            headers[ args[0] ] = args[1];
        } else {
            headers = args[0];
        }

        util.each(headers, function(name, value) {
            value = headers[name];
            name = name.toLowerCase();

            opts.headers[name] = value;

            that._head(name, value);

        });

        return this;
    },

    timeout: function(ms) {
        this._timeout = ms;

        return this;
    },

    bind: function(name, callback) {
        this['_on' + name] = callback;

        return this;
    },

    done: function(callback) {
        var timeout;
        this._callback = callback || function() {};

        if (this._error) { return this._done(); }

        var that = this;
        var body = this._body();
        var options = this._options();
        var _http = http;
        if (options.port === 443) {
            _http = https;
        }

        this._req = _http.request(options, function(res) {
            var data = '';

            that._res = res;

            res.on('data', function (chunk) { data += chunk; });
            res.on('end', function() {
                var ontext = that._ontext;
                if (timeout) { clearTimeout(timeout); }
                that._text = typeof ontext === 'function' ? ontext(data) : data;
                that._done();
            });
        });

        if (this._timeout) {
            timeout = setTimeout(function() {
                that._req.abort();
                that._error = new Error('Request timeout for ' + options.host + '/' + options.path);
                that._done();
            }, this._timeout);
        }

        this._req.on('error', function(err) { that._error = err; that._done(); });

        if (body) { this._req.write(body, 'utf8'); }

        this._req.end();
    }
};

// aliases
proto.query = proto.params = proto.param = proto.prms;
proto.headers = proto.header = proto.head;
proto.time = proto.timeout;
