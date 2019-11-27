const configConstant = {
  //basic
  logFormat: "[:status][:date[clf]][:remote-addr] :url :referrer :user-agent",

  //path
  dbPath: '/home/barahime/.local/share/io.parity.ethersocial/chains/ethersocial/db/dc73f323b4681272/archive',
  ipcPath: "/home/barahime/.local/share/io.parity.ethersocial/jsonrpc.ipc",

  //network
  arrParity: ['http://115.68.5.49:7545', 'http://parity1.esn.today:80', 'http://parity2.esn.today:80'],
  localRPCaddress: 'http://127.0.0.1:17545',
  gethNetworkPortString: "50505",

  //database
  redisClientMode: false, //true: all services are off (redis read only), false: all services are on (redis store)
  redisConnectString: {
    port: 17379, // Redis port
    host: '127.0.0.1', // Redis host
    family: 4, // 4 (IPv4) or 6 (IPv6)
    password: 'dol671k', //auth
    db: 0
  },

  //service
  accountBalanceServiceInterval: 1 * 30 * 1000, // ms
  blockStoreServiceInterval: 1 * 5 * 1000, // ms
  peerCollectorServiceInterval: 5 * 60 * 1000, // ms
  hashrateCollectorServiceInterval: 1 * 60 * 60 * 1000, // ms
  PriceServiceInterval: 1 * 60 * 1000, // ms

  //view
  jsload_defer: false,
  jsload_async: false,

};

module.exports = configConstant;
