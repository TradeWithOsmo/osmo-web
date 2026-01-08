const configurationData = {
  supported_resolutions: ['1', '5', '15', '30', '60', '240', '1D', '1W', '1M'],
  exchanges: [
    {
      value: '',
      name: 'All Exchanges',
      desc: ''
    }
  ],
  symbols_types: [
    {
      name: 'Crypto',
      value: 'crypto'
    }
  ],
  supports_marks: false,
  supports_timescale_marks: false,
  supports_time: true,
  currency_codes: ['USD', 'USDT']
};

export const onReady = (callback) => {
  console.log('[onReady]: Method call');
  setTimeout(() => callback(configurationData), 0);
};
