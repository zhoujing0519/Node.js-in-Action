var Currency = require('./constructor_currency'),
	canadianDollar = 0.91,
	currency = new Currency(canadianDollar);

console.log('50 Canadian dollars equals this amount of US dollars: ' + currency.canadianToUS(50));
console.log('30 US dollars equals this amount of Canadian dollars: ' + currency.USToCanadian(30));

