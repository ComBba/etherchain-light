var express = require('express');
var router = express.Router();

var async = require('async');
var Web3 = require('web3');

const configConstant = require('../config/configConstant');
var Redis = require('ioredis');
var redis = new Redis(configConstant.redisConnectString);

var RLP = require('rlp');
const cacheRedisKey = 'explorerBlocks:cache:';

/* modified baToJSON() routine from rlp */
function baToString(ba) {
  if (Buffer.isBuffer(ba)) {
    return ba.toString('ascii');
  } else if (ba instanceof Array) {
    var array = [];
    for (var i = 0; i < ba.length; i++) {
      array.push(baToString(ba[i]));
    }
    return array.join('/');
  } else {
    return ba;
  }
}

var hex2ascii = function (hexIn) {
  var hex = hexIn.toString();
  var str = '';
  try {
    var ba = RLP.decode(hex);
    var test = ba[1].toString('ascii');
    if (test == 'geth' || test == 'Parity') {
      // FIXME
      ba[0] = ba[0].toString('hex');
    }
    str = baToString(ba);
  } catch (e) {
    for (var i = 0; i < hex.length; i += 2) {
      str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
    }
  }
  return str;
};

router.get('/:block', function (req, res, next) {
  return redis.get(cacheRedisKey.concat(req.params.block), (err, cacheBlock) => {
    // If that key exists in Redis store
    if (cacheBlock) {
      res.render('block', {
        block: JSON.parse(cacheBlock)
      });
    } else { // Key does not exist in Redis store
      var config = req.app.get('config');
      var web3 = new Web3();
      web3.setProvider(config.selectParity());

      var tokenExporter = req.app.get('tokenExporter');

      async.waterfall([
        function (callback) {
          web3.eth.getBlock(req.params.block, true, function (err, result) {
            //console.log("[BlockInfo][001]\tweb3.eth.getBlock\t", new Date().toLocaleString());
            callback(err, result);
          });
        },
        function (result, callback) {
          if (!result) {
            return callback({
              name: "BlockNotFoundError",
              message: "Block not found!"
            }, null, null);
          }
          web3.trace.block(result.number, function (err, traces) {
            //console.log("[BlockInfo][002]\tweb3.trace.block\t", new Date().toLocaleString());
            callback(err, result, traces);
          });
        },
        function (block, traces, callback) {
          //redis.hset('ExportToken:tokenByBlockNumber', log.blockNumber, tokenAddress);
          redis.hget('ExportToken:tokenByBlockNumber', block.number, function (err, replies) {
            //console.log("[BlockInfo][003]\tredis.hgetall\t", new Date().toLocaleString());
            callback(null, block, traces, replies);
          });

        },
        function (block, traces, replies, callback) {
          var tokenList = JSON.parse(replies);
          if (tokenList && tokenList.length > 0) {
            var tokenEvents = [];
            async.eachSeries(tokenList, function (account, tokenListeachCallback) {
              //TokenDB Start
              tokenExporter[account].contract.allEvents({
                fromBlock: block.number,
                toBlock: block.number
              }).get(function (err, events) {
                if (err) {
                  console.log("Error receiving historical events: ", err);
                } else if (events.length >= 1) {
                  tokenEvents.push(events);
                }
                tokenListeachCallback();
              });
            }, function (err) {
              //console.log("[BlockInfo][005]\ttokenListeachCallback\t", new Date().toLocaleString());
              callback(err, tokenEvents, block, traces);
            });
          } else {
            //console.log("[BlockInfo][005]\tno contract\t", new Date().toLocaleString());
            callback(null, null, block, traces);
          }
        }
      ], function (err, tokenEvents, block, traces) {
        if (err) {
          console.log("Error ", err);
          return next(err);
        }

        if (block && block.transactions) {
          //console.log("[BlockInfo][006]\tblock.transactions.forEach\t", new Date().toLocaleString());
          block.transactions.forEach(function (tx) {
            tx.traces = [];
            tx.failed = false;
            if (traces != null) {
              traces.forEach(function (trace) {
                if (tx.hash === trace.transactionHash) {
                  if (tokenEvents) {
                    tokenEvents.forEach(function (event) {
                      if (trace.transactionHash === event.transactionHash) {
                        if (event.event === "Transfer" || event.event === "Approval") {
                          if (event.args && event.args._value && trace.transactionPosition == event.transactionIndex) {
                            trace._value = "0x".concat(event.args._value.toNumber().toString(16));
                            trace._from = event.args._from;
                            trace._to = event.args._to;
                            trace._event = event.event;
                            trace._decimals = tokenExporter[trace.action.to] ? (tokenExporter[trace.action.to].token_decimals ? tokenExporter[trace.action.to].token_decimals : 0) : 0;
                            trace._symbol = tokenExporter[trace.action.to] ? (tokenExporter[trace.action.to].token_symbol ? tokenExporter[trace.action.to].token_symbol : 'n/a') : 'n/a';
                            trace._name = tokenExporter[trace.action.to] ? (tokenExporter[trace.action.to].token_name ? tokenExporter[trace.action.to].token_name : '') : '';
                            trace.isinTransfer = true;
                          }
                        }
                      }
                    });
                  }
                  tx.traces.push(trace);
                  if (trace.error) {
                    tx.failed = true;
                    tx.error = trace.error;
                  }
                }
              });
            }
          });
        }
        if (block && block.extraData) {
          //console.log("[BlockInfo][007]\tblock.extraDataToAscii\t", new Date().toLocaleString());
          block.extraDataToAscii = hex2ascii(block.extraData);
        }

        if (!block || !block.number) {
          return next({
            name: "BlockNotFoundError",
            message: "Block not found!"
          });
        } else {
          //console.dir(block);
          //console.log("[BlockInfo][008]\tres.render\t", new Date().toLocaleString());
          redis.set(cacheRedisKey.concat(block.number), JSON.stringify(block))
          redis.set(cacheRedisKey.concat(block.hash), JSON.stringify(block))
          res.render('block', {
            block: block
          });
        }
      });
    }
  });
});

router.get('/uncle/:hash/:number', function (req, res, next) {

  var config = req.app.get('config');
  var web3 = new Web3();
  web3.setProvider(config.selectParity());

  async.waterfall([
    function (callback) {
      web3.eth.getUncle(req.params.hash, req.params.number, true, function (err, result) {
        callback(err, result);
      });
    },
    function (result, callback) {
      if (!result) {
        return next({
          name: "UncleNotFoundError",
          message: "Uncle not found!"
        });
      }
      callback(null, result);
    }
  ], function (err, uncle) {
    if (err) {
      console.log("Error ", err);
      return next(err);
    } else {
      res.render('uncle', {
        uncle: uncle,
        blockHash: req.params.hash
      });
    }
  });

});

module.exports = router;