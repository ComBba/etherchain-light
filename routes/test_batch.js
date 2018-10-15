var express = require('express');
var router = express.Router();
var async = require('async');
var Web3 = require('web3');

router.get('/', function (req, res, next) {

  var config = req.app.get('config');
  var web3 = new Web3();
  web3.setProvider(config.provider);


  async.waterfall([
    function (callback) {
      var batch = web3.createBatch();
      batch.add(web3.eth.getCode.request("0xe3ec5ebd3e822c972d802a0ee4e0ec080b8237ba"));
      batch.add(web3.eth.getCode.request("0x2930822031420731f09dce572554a8b8c1eaa09b"));
      batch.add(web3.eth.getCode.request("0x0146b9dcd9fb2abc1b5b136c28d20d0037526961"));
      callback(null, batch);
    },
    function (batchAdded, callback) {
      batchAdded.requestManager.sendBatch(batchAdded.requests, function (err, results) {
        if (err) {
          console.log(err);
          return;
        }
        callback(null, batchAdded.requests, results);
      });
    }
  ], function (err, requests, balances) {
    if (err) {
      console.log("Error " + err);
    }
    console.dir(requests); // uncomment it to print out
    /*
     [ { method: 'eth_getCode',
         params: [ '0xe3ec5ebd3e822c972d802a0ee4e0ec080b8237ba', 'latest' ],
         callback: undefined,
         format: [Function: bound ] },
       { method: 'eth_getCode',
         params: [ '0x2930822031420731f09dce572554a8b8c1eaa09b', 'latest' ],
         callback: undefined,
         format: [Function: bound ] },
       { method: 'eth_getCode',
         params: [ '0x0146b9dcd9fb2abc1b5b136c28d20d0037526961', 'latest' ],
         callback: undefined,
         format: [Function: bound ] } ]
     [ { jsonrpc: '2.0', result: '0x', id: 5098 },
       { jsonrpc: '2.0', result: '0x', id: 5099 },
       { jsonrpc: '2.0',
         result:
         '0x6060604052600436106100da5763ffffffff7c010000000000000000000000000000000000000000000000000000000060003504166306fdde0381146100df578063095ea7b31461016957806318160ddd1461019f57806323b872dd146101c4578063313ce567146101ec57806342966c681461021557806370a082311461022b57806379c650681461024a57806379cc67901461026e5780638da5cb5b1461029057806395d89b41146102bf578063a9059cbb146102d2578063cae9ca51146102f4578063dd62ed3e14610359578063f2fde38b1461037e575b600080fd5b34156100ea57600080fd5b6100f261039d565b60405160208082528190810183818151815260200191508051906020019080838360005b8381101561012e578082015183820152602001610116565b50505050905090810190601f16801561015b5780820380516001836020036101000a031916815260200191505b509250505060405180910390f35b341561017457600080fd5b61018b600160a060020a036004351660243561043b565b604051901515815260200160405180910390f35b34156101aa57600080fd5b6101b261046b565b60405190815260200160405180910390f35b34156101cf57600080fd5b61018b600160a060020a0360043581169060243516604435610471565b34156101f757600080fd5b6101ff6104e8565b60405160ff909116815260200160405180910390f35b341561022057600080fd5b61018b6004356104f1565b341561023657600080fd5b6101b2600160a060020a036004351661057c565b341561025557600080fd5b61026c600160a060020a036004351660243561058e565b005b341561027957600080fd5b61018b600160a060020a0360043516602435610654565b341561029b57600080fd5b6102a3610730565b604051600160a060020a03909116815260200160405180910390f35b34156102ca57600080fd5b6100f261073f565b34156102dd57600080fd5b61026c600160a060020a03600435166024356107aa565b34156102ff57600080fd5b61018b60048035600160a060020a03169060248035919060649060443590810190830135806020601f820181900481020160405190810160405281815292919060208401838380828437509496506107b995505050505050565b341561036457600080fd5b6101b2600160a060020a03600435811690602435166108e7565b341561038957600080fd5b61026c600160a060020a0360043516610904565b60018054600181600116156101000203166002900480601f0160208091040260200160405190810160405280929190818152602001828054600181600116156101000203166002900480156104335780601f1061040857610100808354040283529160200191610433565b820191906000526020600020905b81548152906001019060200180831161041657829003601f168201915b505050505081565b600160a060020a033381166000908152600660209081526040808320938616835292905220819055600192915050565b60045481565b600160a060020a038084166000908152600660209081526040808320339094168352929052908120548211156104a657600080fd5b600160a060020a03808516600090815260066020908152604080832033909416835292905220805483900390556104de84848461094e565b5060019392505050565b60035460ff1681565b600160a060020a0333166000908152600560205260408120548290101561051757600080fd5b600160a060020a03331660008181526005602052604090819020805485900390556004805485900390557fcc16f5dbb4873280815c1ee09dbd06736cffcc184412cf7a71a0fdb75d397ca59084905190815260200160405180910390a2506001919050565b60056020526000908152604090205481565b60005433600160a060020a039081169116146105a957600080fd5b600160a060020a03808316600090815260056020526040808220805485019055600480548501905530909216917fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef9084905190815260200160405180910390a381600160a060020a031630600160a060020a03167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef8360405190815260200160405180910390a35050565b600160a060020a0382166000908152600560205260408120548290101561067a57600080fd5b600160a060020a03808416600090815260066020908152604080832033909416835292905220548211156106ad57600080fd5b600160a060020a038084166000818152600560209081526040808320805488900390556006825280832033909516835293905282902080548590039055600480548590039055907fcc16f5dbb4873280815c1ee09dbd06736cffcc184412cf7a71a0fdb75d397ca59084905190815260200160405180910390a250600192915050565b600054600160a060020a031681565b60028054600181600116156101000203166002900480601f0160208091040260200160405190810160405280929190818152602001828054600181600116156101000203166002900480156104335780601f1061040857610100808354040283529160200191610433565b6107b533838361094e565b5050565b6000836107c6818561043b565b156108df5780600160a060020a0316638f4ffcb1338630876040518563ffffffff167c01000000000000000000000000000000000000000000000000000000000281526004018085600160a060020a0316600160a060020a0316815260200184815260200183600160a060020a0316600160a060020a0316815260200180602001828103825283818151815260200191508051906020019080838360005b8381101561087c578082015183820152602001610864565b50505050905090810190601f1680156108a95780820380516001836020036101000a031916815260200191505b5095505050505050600060405180830381600087803b15156108ca57600080fd5b5af115156108d757600080fd5b505050600191505b509392505050565b600660209081526000928352604080842090915290825290205481565b60005433600160a060020a0390811691161461091f57600080fd5b6000805473ffffffffffffffffffffffffffffffffffffffff1916600160a060020a0392909216919091179055565b6000600160a060020a038316151561096557600080fd5b600160a060020a0384166000908152600560205260409020548290101561098b57600080fd5b600160a060020a038316600090815260056020526040902054828101116109b157600080fd5b50600160a060020a0380831660008181526005602052604080822080549488168084528284208054888103909155938590528154870190915591909301927fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef9085905190815260200160405180910390a3600160a060020a03808416600090815260056020526040808220549287168252902054018114610a4e57fe5b505050505600a165627a7a72305820b9499601ecebea0e18fd633ac89894bb85eb8a9e3730335be46384e0e72d6c010029',
         id: 5100 } ]
    */
    console.dir(balances); // uncomment it to print out
    res.render('test_batch', {
      balances: balances
    });
  });
});

module.exports = router;