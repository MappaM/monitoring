#!/bin/python

import pywapi
import sys
import datetime
import random

if (len(sys.argv) != 2):
	print 'Usage : python.py random.py BASE_VALUE'
	sys.exit(-1)

startval = float(sys.argv[1])

temps = datetime.datetime.now()
hour = temps.hour
mult = float((8 - min(abs(7-hour),abs(13-hour),abs(19-hour))) / float(4))
value = float(startval) * mult * (float(random.random()) + float(0.5))
print value
