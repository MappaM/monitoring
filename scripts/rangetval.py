#!/bin/python
# Get a value from the server and adds a random value around base_value to it

import sys
import datetime
import random
import ranval

if (len(sys.argv) != 4):
	print 'Usage : python.py rangetval.py HOST HASH BASE_VALUE'
	sys.exit(-1)

import httplib
conn = httplib.HTTPConnection(sys.argv[1])
conn.request("GET", "/data/get/" + sys.argv[2])
r1 = conn.getresponse()
data1 = r1.read()
if (data1=='NODATA'):
	v = 0
else:
	v = data1

startval = float(sys.argv[3])

temps = datetime.datetime.now()
hour = temps.hour
mult = ranval.get_multiplier(hour)
value = float(v) + float(float(startval) * mult * (float(random.random()) + float(0.5)))
print value
