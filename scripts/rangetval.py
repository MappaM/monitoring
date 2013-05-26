#!/bin/python

import pywapi
import sys
import datetime
import random

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
mult = float((8 - min(abs(7-hour),abs(13-hour),abs(19-hour))) / float(4))
value = float(v) + float(float(startval) * mult * (float(random.random()) + float(0.5)))
print value
