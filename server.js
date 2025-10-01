require('dotenv').config();

const express = require('express');
const app = express();
const cors = require('cors');
const axios = require('axios');

const { MongoClient } = require('mongodb');
const url = process.env.MONGODB_URI;
const dbName = process.env.DB_NAME;

app.use(cors());
app.use(express.json());
app.use(express.static('frontend/dist/frontend/browser')); 
let globalPriceData = 0;

app.get('/wallet', async (req, res) => {
  try {
    const client = await MongoClient.connect(url);
    const db = client.db(dbName);

    let wallet = await db.collection('wallet').findOne({ type: 'wallet' });

    if (!wallet) {
      // Initialize wallet amount if it doesn't exist
      wallet = { type: 'wallet', amount: 25000.00 };
      await db.collection('wallet').insertOne(wallet);
    }

    res.status(200).json(wallet);
  } catch (error) {
    console.error("Error fetching wallet", error);
    res.status(500).send({ message: 'Error fetching wallet' });
  }
});

app.put('/wallet', async (req, res) => {
  const { amount } = req.body;
  try {
    const client = await MongoClient.connect(url);
    const db = client.db(dbName);

    await db.collection('wallet').updateOne({ type: 'wallet' }, { $set: { amount } }, { upsert: true });

    res.status(200).send({ message: 'Wallet updated' });
  } catch (error) {
    console.error("Error updating wallet", error);
    res.status(500).send({ message: 'Error updating wallet' });
  }
});

app.get('/portfolio/exists/:ticker', async (req, res) => {
  const { ticker } = req.params;
  try {
    const client = await MongoClient.connect(url);
    const db = client.db(dbName);
    const stockExists = await db.collection('portfolio').findOne({ ticker: ticker });
    // client.close();

    res.status(200).json({ exists: !!stockExists });
  } catch (error) {
    console.error("Error checking stock existence", error);
    res.status(500).send({ message: 'Error checking stock existence' });
  }
});

app.get('/portfolio/quantity/:ticker', async (req, res) => {
  const { ticker } = req.params;
  try {
    const client = await MongoClient.connect(url);
    const db = client.db(dbName);
    const stock = await db.collection('portfolio').findOne({ ticker: ticker });
    // client.close();
    
    if (stock) {
      res.status(200).json({ quantity: stock.quantity });
    } else {
      res.status(404).send({ message: 'Stock not found' });
    }
  } catch (error) {
    console.error("Error fetching stock quantity", error);
    res.status(500).send({ message: 'Error fetching stock quantity' });
  }
});

app.post('/portfolio/sell', async (req, res) => {
  const { ticker, quantity } = req.body;
  
  try {
    const client = await MongoClient.connect(url);
    const db = client.db('HW3');
    const portfolio = db.collection('portfolio');

    // Find the stock in the portfolio
    const stock = await portfolio.findOne({ ticker: ticker });


    if (!stock || stock.quantity < quantity) {
      return res.status(400).send({ message: 'Not enough stock to sell' });
    }

    // Update or remove the stock entry
    if (stock.quantity === quantity) {
      await portfolio.deleteOne({ ticker: ticker });
    } else {
      await portfolio.updateOne({ ticker: ticker }, { $inc: { quantity: -quantity } });
    }

    // client.close();
    res.status(200).send({ message: 'Stock sold successfully' });
  } catch (error) {
    console.error('Error selling stock:', error);
    res.status(500).send({ message: 'Error selling stock' });
  }
});

app.get('/portfolio', async (req, res) => {
  try {
    const client = await MongoClient.connect(url);
    const db = client.db(dbName);
    const portfolioItems = await db.collection('portfolio').find({}).toArray();
    res.status(200).json(portfolioItems);
  } catch (error) {
    console.error("Error fetching portfolio items", error);
    res.status(500).send({ message: 'Error fetching portfolio items' });
  }
});

app.post('/portfolio', async (req, res) => {
  const { ticker, name, price, quantity, total, averageCost } = req.body;

  if (!ticker || !name || !price || !quantity || !total || !averageCost) {
    return res.status(400).send({ message: 'Missing ticker, price, or quantity in request body' });
  }

  try {
    const client = await MongoClient.connect(url);
    const db = client.db(dbName);

    const collection = db.collection('portfolio');

    const existingEntry = await collection.findOne({ ticker: ticker });

    if (existingEntry) {
      const updatedQuantity = existingEntry.quantity + quantity;
      const updatedTotal = existingEntry.total + total;
      const updatedAverageCost = updatedTotal / updatedQuantity;

      await collection.updateOne({ ticker: ticker} ,{
        $set: {
          quantity: updatedQuantity,
          total: updatedTotal,
          averageCost: updatedAverageCost
        }
      });

      res.status(200).json({ message: "Portfolio updated successfully" });
    } else {

      await collection.insertOne({
        ticker,
        name,
        price,
        quantity,
        total,
        averageCost
      });

      res.status(201).json({ message: "New stock added to portfolio" });
    }
  } catch (error) {
    console.error("error updatoing port", error);
    res.status(500).json({ message: "Error updating portfolio" });
    }
});

app.get('/portfolio/ticker', async (req, res) => {
  try {
    const client = await MongoClient.connect(url);
    const db = client.db(dbName);
    const portfolioTickers = await db.collection('portfolio').distinct('ticker');
    res.status(200).json(portfolioTickers);

  } catch (error) {
    console.error("Error fetching portfolio tickers", error);
    res.status(500).send({ message: 'Error fetching portfolio tickers' });
  }
});

app.post('/portfolio/update', async (req, res) => {
  const { tickerPrices } = req.body;

  if (!tickerPrices) {
    return res.status(400).send({ message: 'Ticker prices data is required' });
  }
  try {
    const client = await MongoClient.connect(url);
    const db = client.db(dbName);
    const collection = db.collection('portfolio');

    // Update each ticker price in the database
    for (let i = 0; i < tickerPrices.length; i++) {
      const [ticker, price] = tickerPrices[i];
      
      await collection.updateOne(
        { ticker: ticker },
        { $set: { price: price } }
      );
    }

    res.status(200).json({ message: "Prices updated successfully" });
  } catch (error) {
    console.error("Error updating prices", error);
    res.status(500).json({ message: "Error updating prices" });
  }
});

app.post('/addwatchlist', async (req, res) => {
  const stock = req.body;
  try {
    const client = await MongoClient.connect(url);
    const db = client.db(dbName);

    const existingStock = await db.collection('watchlist').findOne({ ticker: stock.ticker });
    if (existingStock) {
      // client.close();
    }
    else {
      // If not, insert the new stock
      await db.collection('watchlist').insertOne(stock);
      res.status(200).send({ message: 'Stock added to watchlist' });
    }
    } catch (error) {
    console.error("Error adding stock", error);
    res.status(500).send({ message: 'Error adding stock' });
    } 
});

app.delete('/delwatchlist/:ticker', async (req, res) => {
  const { ticker } = req.params;
  try {
    const client = await MongoClient.connect(url);
    const db = client.db(dbName);

    await db.collection('watchlist').deleteOne({ ticker: ticker });
    // client.close();
    res.status(200).send({ message: 'Stock removed from watchlist' });
  } catch (error) {
    console.error("Error removing stock", error);
    res.status(500).send({ message: 'Error removing stock' });
  }
});

app.get('/getwatchlist', async (req, res) => {
  try {
    const client = await MongoClient.connect(url);
    const db = client.db(dbName);

    const stocks = await db.collection('watchlist').find({}).toArray();
    res.status(200).json(stocks);
  } catch (error) {
    console.error("Error fetching watchlist", error);
    res.status(500).send({ message: 'Error fetching watchlist' });
  }
});

app.get('/searchStock', async (req, res) => {
  const ticker = req.query.ticker;
  const apiUrl = `https://finnhub.io/api/v1/stock/profile2?symbol=${ticker}&token=${process.env.FINNHUB_API_KEY}`;
  try {
    const response = await axios.get(apiUrl);
    res.json(response.data)
  } catch (error) {
    res.status(500).send('Error occurred while fetching stock data');
  }
});

app.get('/searchPrice', async (req, res) => {
  const ticker = req.query.ticker;
  const apiUrl = `https://finnhub.io/api/v1/quote?symbol=${ticker}&token=${process.env.FINNHUB_API_KEY}`;
  try {
    const response = await axios.get(apiUrl);
    globalPriceData = response.data;
    res.json(response.data)
  } catch (error) {
    res.status(500).send('Error occurred while fetching stock data');
  }
});

app.get('/searchPeer', async (req, res) => {
  const ticker = req.query.ticker;
  const apiUrl = `https://finnhub.io/api/v1/stock/peers?symbol=${ticker}&token=${process.env.FINNHUB_API_KEY}`;
  try {
    const response = await axios.get(apiUrl);
    res.json(response.data)
  } catch (error) {
    res.status(500).send('Error occurred while fetching stock data');
  }
});

app.get('/searchNews', async (req, res) => {
  const ticker = req.query.ticker;
  const today  = new Date();
  const old = new Date();
  old.setDate(today.getDate()-30);

  const formatDate = (date) => {
    let month = '' + (date.getMonth() + 1),
        day = '' + date.getDate(),
        year = date.getFullYear();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;
    
    return [year, month, day].join('-');
  }

  const todayformat = formatDate(today);
  const oldformat = formatDate(old);


  const apiUrl = `https://finnhub.io/api/v1/company-news?symbol=${ticker}&from=${oldformat}&to=${todayformat}&token=${process.env.FINNHUB_API_KEY}`;
  try {
    const response = await axios.get(apiUrl);
    res.json(response.data)
  } catch (error) {
    res.status(500).send('Error occurred while fetching stock data');
  }
})

app.get('/searchTrends', async (req, res) => {
  const ticker = req.query.ticker;
  const apiUrl = `https://finnhub.io/api/v1/stock/recommendation?symbol=${ticker}&token=${process.env.FINNHUB_API_KEY}`;
  try {
    const response = await axios.get(apiUrl);
    res.json(response.data)
  } catch (error) {
    res.status(500).send('Error occurred while fetching stock data');
  }
})

app.get('/searchSent', async (req, res) => {
  const ticker = req.query.ticker;
  const apiUrl = `https://finnhub.io/api/v1/stock/insider-sentiment?symbol=${ticker}&from=2022-01-01&token=${process.env.FINNHUB_API_KEY}`;
  try {
    const response = await axios.get(apiUrl);
    res.json(response.data)
  } catch (error) {
    res.status(500).send('Error occurred while fetching stock data');
  }
})

app.get('/searchEarn', async (req, res) => {
  const ticker = req.query.ticker;
  const apiUrl = `https://finnhub.io/api/v1/stock/earnings?symbol=${ticker}&token=${process.env.FINNHUB_API_KEY}`;
  try {
    const response = await axios.get(apiUrl);
    res.json(response.data)
  } catch (error) {
    res.status(500).send('Error occurred while fetching stock data');
  }
})

app.get('/searchHist', async (req, res) => {
  const ticker = req.query.ticker;

  const today  = new Date();
  const old = new Date();
  old.setFullYear(today.getFullYear()-1); //1 year before current

  const formatDate = (date) => {
    let month = '' + (date.getMonth() + 1),
        day = '' + date.getDate(),
        year = date.getFullYear();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;
    
    return [year, month, day].join('-');
  }

  const oldy = formatDate(old);
  const tody = formatDate(today);

  const apiUrl = `https://api.polygon.io/v2/aggs/ticker/${ticker}/range/1/day/${oldy}/${tody}?adjusted=true&sort=asc&apiKey=${process.env.POLYGON_API_KEY}`;
  try {
    const response = await axios.get(apiUrl);
    res.json(response.data)
  } catch (error) {
    res.status(500).send('Error occurred while fetching stock data');
  }
});

app.get('/searchHour', async (req, res) => {
  const ticker = req.query.ticker;

  const Tepoch = globalPriceData.t;
  const currentT = new Date().getTime();
  const currentTepoch = Math.floor(currentT / 1000);
  const mc = (currentTepoch-Tepoch) > 300;

  const targetEpoch = mc ? Tepoch : currentTepoch;

  const ondb = targetEpoch - (24 * 60 * 60);

  const dateObj = new Date(ondb * 1000);
  const year = dateObj.getFullYear();
  const month = ('0' + (dateObj.getMonth() + 1)).slice(-2);
  const day = ('0' + dateObj.getDate()).slice(-2);
  const oldf = `${year}-${month}-${day}`; 

  const dateObj2 = new Date(Tepoch * 1000);
  const year1 = dateObj2.getFullYear();
  const month1 = ('0' + (dateObj2.getMonth() + 1)).slice(-2);
  const day1 = ('0' + dateObj2.getDate()).slice(-2);
  const Mdate = `${year1}-${month1}-${day1}`; 

  const dateObj3 = new Date(Tepoch * 1000);
  const year2 = dateObj3.getFullYear();
  const month2 = ('0' + (dateObj3.getMonth() + 1)).slice(-2);
  const day2 = ('0' + dateObj3.getDate()).slice(-2);
  const Cdate = `${year2}-${month2}-${day2}`; 

  let apiUrl;
  if (mc) {
    apiUrl = `https://api.polygon.io/v2/aggs/ticker/${ticker}/range/1/hour/${oldf}/${Mdate}?adjusted=true&sort=asc&apiKey=${process.env.POLYGON_API_KEY}`;
  }
  else {
    apiUrl = `https://api.polygon.io/v2/aggs/ticker/${ticker}/range/1/hour/${oldf}/${Cdate}?adjusted=true&sort=asc&apiKey=${process.env.POLYGON_API_KEY}`;
  }

  try {
    const response = await axios.get(apiUrl);
    res.json(response.data)
  } catch (error) {
    res.status(500).send('Error occurred while fetching stock data');
  }
});

app.get('/getautocomplete', async (req, res) => {
  const { term } = req.query;

  apiUrl = `https://finnhub.io/api/v1/search?q=${term}&token=${process.env.FINNHUB_API_KEY}`;

  const response = await axios.get(apiUrl);
  res.json(response.data)

}); 

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});