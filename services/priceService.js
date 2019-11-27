const async = require('async');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
const configConstant = require('../config/configConstant');
var BigNumber = require('bignumber.js');
var getJSON = require('get-json');
var request = require('request');
var Redis = require("redis"),
	redis = Redis.createClient(configConstant.redisConnectString);
redis.on("error", function (err) {
	console.log("Error " + err);
});

var prices = function () {
	async.forever(
		function (next) {
			console.log("[▷▷▷ Start ▷▷▷][PricesService]", printDateTime());

			var data = {};
			async.waterfall([
				function (callback) {
					redis.hgetall('bitz:'.concat('ticker'), function (err, result) {
						return callback(err, result);
					});
				},
				function (ticker, callback) {
					if (ticker && Object.size(ticker) > 0) {
						data.ticker = ticker;
					}
					var now = new Date();
					if (!ticker || Object.size(ticker) < 1 || (ticker && ticker.time * 1000 < now - (1000 * 60))) {
						data.bitzTimeoutTicker = true;
						getJSON('https://apiv2.bitz.com/Market/ticker?symbol=esn_btc', function (error, response) {
							return callback(error, response);
						});
					} else {
						return callback(null, null);
					}
				},
				function (ticker, callback) {
					if (data.bitzTimeoutTicker && ticker != null && ticker.status == 200) {
						data.ticker = ticker.data;
						data.ticker.time = ticker.time;
					}
					redis.hgetall('bitz:'.concat('coinrate'), function (err, result) {
						return callback(err, result);
					});
				},
				function (coinrate, callback) {
					if (coinrate && Object.size(coinrate) > 0) {
						data.coinrate = coinrate;
					}
					var now = new Date();
					if (!coinrate || Object.size(coinrate) < 1 || (coinrate && coinrate.time * 1000 < now - (1000 * 60))) {
						data.bitzTimeoutCoinrate = true;
						getJSON('https://apiv2.bitz.com/Market/coinRate?coins=esn', function (error, response) {
							return callback(error, response);
						});
					} else {
						return callback(null, null);
					}
				},
				function (coinrate, callback) {
					if (coinrate) {
						if (data.bitzTimeoutCoinrate && coinrate.status == 200) {
							data.coinrate = coinrate.data.esn;
							data.coinrate.time = coinrate.time;
						}

						var ret = new BigNumber(data.coinrate.btc);
						data.coinrate.btc = ret.toFormat(8);
						ret = new BigNumber(data.coinrate.usd);
						data.coinrate.usd = ret.toFormat(6);
						ret = new BigNumber(data.coinrate.krw);
						data.coinrate.krw = ret.toFormat(2);

						redis.hmset('bitz:'.concat('ticker'), data.ticker);
						redis.hmset('bitz:'.concat('coinrate'), data.coinrate);
					}
					callback(null);
				}
			], function (err) {
				if (err) {
					console.log("Error ", err);
				}
				console.log("[□□□□ End □□□□][PriceService]", printDateTime());

				setTimeout(function () {
					next();
				}, configConstant.PriceServiceInterval);
			});
		},
		function (err) {
			console.log('!!!! PriceService STOP !!!!', err);
		}
	);
};

module.exports = prices;

function addZeros(num, digit) {
	var zero = '';
	num = num.toString();
	if (num.length < digit) {
		for (i = 0; i < digit - num.length; i++) {
			zero += '0';
		}
	}
	return zero + num.toString();
}

function printDateTime() {
	var currentDate = new Date();
	var calendar = currentDate.getFullYear() + "-" + addZeros((currentDate.getMonth() + 1).toString(), 2) + "-" + addZeros(currentDate.getDate().toString(), 2);
	var currentHours = addZeros(currentDate.getHours(), 2);
	var currentMinute = addZeros(currentDate.getMinutes(), 2);
	var currentSeconds = addZeros(currentDate.getSeconds(), 2);
	return calendar + " " + currentHours + ":" + currentMinute + ":" + currentSeconds;
}

function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}
