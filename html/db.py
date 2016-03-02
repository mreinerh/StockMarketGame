import urllib2
import MySQLdb
import datetime
from yahoo_finance import Share

data = urllib2.urlopen('ftp://ftp.nasdaqtrader.com/symboldirectory/nasdaqlisted.txt')

namelist = []

db = MySQLdb.connect("localhost","root","godawgs","Stocks")

c = db.cursor()

date = datetime.datetime.now()

for line in data:

    try:
        share = line.split("|")[0]
        yahoo = Share(share)
        stockname = line.split("|")[1].split(" - ")[0]
        ticker = share
        price = str(yahoo.get_price())
        change = str(yahoo.get_change())
        print price + " " + stockname

        if stockname not in namelist:
            c.execute('''INSERT INTO HistoricalData (stockticker, price, dayending) values (%s, %s, %s)''', (ticker, price, str(date)))
            c.execute('''UPDATE NYSE SET price=%s, updatetimestamp=%s,delta=%s WHERE stockticker=%s''', (price, str(date),change, ticker))
            db.commit()

        namelist.append(stockname)

    except AttributeError:
        print ""
    except TypeError:
        print ""

db.commit()
db.close()
