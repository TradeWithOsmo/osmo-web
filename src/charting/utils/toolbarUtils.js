// Custom toolbar functions for TradingView chart

export const addCustomButtons = (tvWidget) => {
  // Add Buy button
  const buyButton = tvWidget.createButton({
    options: {
      text: '🟢 BUY',
      style: 'success',
      onClick: () => {
        console.log('Buy clicked');
        // Add buy functionality
        showOrderLine(tvWidget, 'buy');
      }
    }
  });

  // Add Sell button
  const sellButton = tvWidget.createButton({
    options: {
      text: '🔴 SELL',
      style: 'danger',
      onClick: () => {
        console.log('Sell clicked');
        // Add sell functionality
        showOrderLine(tvWidget, 'sell');
      }
    }
  });

  // Add Order Line button
  const orderLineButton = tvWidget.createButton({
    options: {
      text: '📏 Order Line',
      onClick: () => {
        console.log('Order Line clicked');
        toggleOrderLines(tvWidget);
      }
    }
  });

  return { buyButton, sellButton, orderLineButton };
};

export const showOrderLine = (tvWidget, type) => {
  const chart = tvWidget.chart();
  const price = type === 'buy' ? 100 : 105; // Example prices
  
  // Create order line
  const orderLine = chart.createOrderLine({
    disableUndo: false,
  })
  .setText(type.toUpperCase() + ' Order')
  .setQuantity(1)
  .setPrice(price)
  .setLineColor(type === 'buy' ? '#00ff00' : '#ff0000')
  .setBodyTextColor(type === 'buy' ? '#00ff00' : '#ff0000')
  .setBodyBorderColor(type === 'buy' ? '#00ff00' : '#ff0000')
  .setQuantityBorderColor(type === 'buy' ? '#00ff00' : '#ff0000')
  .setQuantityTextColor(type === 'buy' ? '#00ff00' : '#ff0000');
  
  console.log(`${type} order line created at price ${price}`);
};

export const toggleOrderLines = (tvWidget) => {
  const chart = tvWidget.chart();
  // Toggle order lines visibility
  const orderLines = chart.getAllShapes().filter(shape => 
    shape.name === 'order_line'
  );
  
  orderLines.forEach(line => {
    line.setHidden(!line.isHidden());
  });
  
  console.log('Order lines toggled');
};

export const addCustomTimeframes = (tvWidget) => {
  // Custom timeframe buttons
  const timeframes = ['1m', '5m', '15m', '1H', '4H', '1D'];
  
  timeframes.forEach(timeframe => {
    tvWidget.createButton({
      options: {
        text: timeframe,
        onClick: () => {
          tvWidget.chart().setResolution(timeframe);
        }
      }
    });
  });
};

export const addIndicatorsButton = (tvWidget) => {
  // Button removed - indicators are added via AI/agent actions only
  return null;
};

export const addTradingButtons = (tvWidget) => {
  // Add Order Line button
  const orderLineButton = tvWidget.createButton({
    options: {
      text: '📏 Order Line',
      onClick: () => {
        console.log('Order Line clicked');
        toggleOrderLines(tvWidget);
      }
    }
  });

  // Add Buy button at the end
  const buyButton = tvWidget.createButton({
    options: {
      text: '🟢 BUY',
      onClick: () => {
        console.log('Buy clicked');
        showOrderLine(tvWidget, 'buy');
      }
    }
  });

  // Add Sell button at the end
  const sellButton = tvWidget.createButton({
    options: {
      text: '🔴 SELL',
      onClick: () => {
        console.log('Sell clicked');
        showOrderLine(tvWidget, 'sell');
      }
    }
  });

  return { orderLineButton, buyButton, sellButton };
};

export const customizeToolbar = (tvWidget) => {
  // No auto-added indicators - all indicators are added via user actions only
};