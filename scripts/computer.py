#!/bin/python

#debendency  pywapi psi pysensors 

import pywapi
import sys
import datetime
import random
import os, platform, subprocess, re
import urllib2
import multiprocessing
import psi
import numpy

if (len(sys.argv) != 1):
	print 'Usage : python.py computer.py'
	sys.exit(-1)


energy = []

def get_processor_name():
    command = "cat /proc/cpuinfo"
    all_info = subprocess.check_output(command, shell=True).strip()
    for line in all_info.split("\n"):
        if "model name" in line:
            return re.sub( ".*model name.*:", "", line,1)
    return ""

mobile = 0

#Processor
model = get_processor_name()
if (re.search( "intel", model,re.I)):

	model = re.sub( "\(r\)|\(tm\)|intel|[@][ ]?[0-9]+.[0-9]+[kmghz]+|cpu|\t", " ", model,0,re.I)
	print "Intel processor detected : " + model
	url = "http://www.intel.eu/content/www/eu/en/search.html?&allwords="+re.sub("[ ]+","+",model)
	content = urllib2.urlopen(url).read()
	m = re.search("(http://www.intel.com/support/processors/.*?)\"",content,re.I | re.M)

	if m:
		url2 =  m.group(1)
		print url2
		#Intel has mobile in the path for most mobile architecture. Quite convenient...
		mobile = not (re.search("mobile",url2) == None)
		if mobile:
			print "You processor is for mobile computer. Assuming laptop mode"
		content2 = urllib2.urlopen(url2).read()
		regex = "href=\"http://ark.intel.com/Product.aspx\?id=([0-9]+)" + re.sub("[ ]+",".*?",model)
		m2 = re.search(regex,content2,re.I | re.M)
		if m2:
			pid =  m2.group(1)
			content3 = urllib2.urlopen("http://ark.intel.com/products/"+pid+"/").read()
			m3 = re.search("([0-9]+) W",content3,re.I | re.M)
			if m3:
				 processor_energy = float(m3.group(1))
		else:
			processor_energy = 65
	else:
		processor_energy = 65
	print "Processour has a MAX TDP of %d Watt" % processor_energy
else:
	print "Processour unknow, assuming MAX TDP 65Watt"
	processor_energy = 65

#---Processor load
load = (os.getloadavg()[2])/multiprocessing.cpu_count()
print "Your system load is %.2f" % load
energy.append(processor_energy * (load/2 + 0.5))

#Motherboard
if (mobile):
	energy.append(10)
else:
	energy.append(25)

#Fans
nfan = 0
command = "cat /sys/class/thermal/cooling_device*/cur_state"
all_info = subprocess.check_output(command, shell=True).strip()
for line in all_info.split("\n"):
    if (float(line) >= 1):
	 nfan += 1;

if (mobile and nfan==0):
	nfan = 1

#The power fan of desktop is nearly never monitored
if (not mobile):
	nfan += 1
print "You appear to have %d fan." % nfan


#Calculating sum
somme = numpy.array(energy).sum()

#Average power conversion efficiency for desktop: 80%
somme = somme / 0.8

print somme
