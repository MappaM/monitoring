#!/bin/python

import pywapi
import sys

if (len(sys.argv) != 2):
	print 'Usage : python.py temperature.py [WEATHER_COM_ID]'
	sys.exit(-1)

temp = pywapi.get_weather_from_weather_com(sys.argv[1])
print temp['current_conditions']['temperature']

