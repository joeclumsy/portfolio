'use strict';

$(document).ready(function() {  
  if (!isChrome()) return;

  getСurrencies();
  fillСurrencies();

  createTmpScript();
  createTableStocks();
  updateTableStocks();

  setInterval(updateTableStocks, STOCK_UPDATE_INTERVAL * 1000);
});

// Браузер
function isChrome() {
  if (navigator.userAgent.search(/Chrome/) != -1) return true;

  $('<p/>', {  
    text: NOT_CHROME
  }).appendTo('body');

  return false;
}

// Котировки валют
function fillСurrencies() {
  var str = currencies[0].name + ': ' + currencies[0].price + 
            '\u00A0\u00A0' +
            currencies[1].name + ': ' + currencies[1].price;

  $('<p/>', {  
    text: str
  }).appendTo('body');  
}

// Шаблон акций
function createTmpScript() {
  var tableValue = ' \
    <tr> \
      <td><a href=${moex}>${tikr}</a></td> \
      <td><a href=${site}>${company}</a></td> \
      <td${state}>${price}</td> \
      <td>${target}</td> \
      <td>${discount}%</td> \
      <td>${lot}</td> \
      <td>${type}</td> \
    </tr>';  

  $('<script/>', {  
    id: 'valueScript', 
    type: 'text/x-jquery-tmpl',
    text: tableValue    
  }).appendTo('body');  
}

// Таблица акции
function createTableStocks() {  
  var tableStocks = $('<table/>', {
    class:'tableStocks',
    id: 'Stocks'
  }).append(
    $('<thead/>'),
    $('<tbody/>', {
      id: 'tbodyStocks'
    })
  );

  var titleCell = $('<tr/>');
  $.each(tableTitle, function(i, data) {
    titleCell.append(
      $('<th/>', {
        text: data[0],
        width: data[1]
      })
    );
  });
  $('thead', tableStocks).append(titleCell);

  $('body').append(tableStocks);

  $('#Stocks').tablesorter({
    cancelSelection: true,
    cssAsc: 'headerSortUp',
    cssDesc: 'headerSortDown',
    cssHeader: 'header',
    widgets: ['saveSort']
    // ,sortReset      : true,
    //   sortRestart    : true
    //,debug: true
  });  
  $('#Stocks').trigger('saveSortReset');// ??
  $('#Stocks').trigger("sortReset");// ??
}

// Обновление акций
function updateTableStocks() {
  var quotes = getQuotes();
  if (!quotes) return;

  shares = setShares(shares, quotes);

  $('#tbodyStocks').empty();
  $('#valueScript').tmpl(shares).appendTo('tbody');
  $('#Stocks').trigger('update');  
}

// Курсы валют с Micex
function getСurrencies() {
  var responseData = getExtData(MICEX_EXCHANGE_RATES);
  if (!responseData) return;

  var metaData = responseData.cbrf.data;

  currencies[0].price = metaData[0][3];
  currencies[1].price = metaData[0][6];
 
  return currencies;
}

// Котировки акций с Micex
function getQuotes() {
  var quotes = {};

  var responseData = getExtData(MICEX_STOCK_PRICES);
  if (!responseData) return;

  var secData = responseData.securities.data;
  var marketData = responseData.marketdata.data;

  for (var i = 0; i < secData.length; i++) {
    quotes[secData[i][0]] = {    
      lot: secData[i][4],
      price: marketData[i][12], 
      moex: MOEX_STOCK_URL + secData[i][0],
      type: secData[i][25] == 1 ? 'обыч' : 'прив'};
  }

  return quotes;
}

// Данные по акциям
function setShares(shares, quotes) {
  shares.forEach(function(item, i, arr) {
    item.lot = quotes[item.tikr].lot;
    item.price = quotes[item.tikr].price;
    item.discount = Math.round(item.price * 100 / item.target * 100) / 100;
    item.moex = quotes[item.tikr].moex;
    item.type = quotes[item.tikr].type;
    item.state = item.discount < DISCOUNT_MARKER ? ' class=buy' : '';
  });

  return shares;
}

// Данные из вне
function getExtData(requestURL) {
  var request = new XMLHttpRequest();

  request.open('GET', requestURL, false);
  try {
    request.send();
  }
  catch(e) {
    return;
  }

  if (!request.responseText) return;  
  return JSON.parse(request.responseText);
}