#!/bin/python

import pywapi
import sys
import datetime
import random

if (len(sys.argv) != 3):
	print 'Usage : python.py getval.py HOST HASH'
	sys.exit(-1)

import httplib
conn = httplib.HTTPConnection(sys.argv[1])
conn.request("GET", "/data/get/" + sys.argv[2])
r1 = conn.getresponse()
data1 = r1.read()
if (data1=='NODATA'):
	print 0
else:
	print data1
