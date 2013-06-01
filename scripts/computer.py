#!/bin/python
# Return the approximated consumption of a computer where the interface is running on
#python dependency  : pywapi psutil 
#program dependency hdparm 

import sys
import os, subprocess, re
import urllib2
import multiprocessing
import numpy
from math import log,exp
import psutil


if (len(sys.argv) != 1):
	print 'Usage : python.py computer.py'
	sys.exit(-1)

verbose = False
energy = []

def get_processor_name():
	command = "cat /proc/cpuinfo"
	all_info = subprocess.check_output(command, shell=True).strip()
	for line in all_info.split("\n"):
		if "model name" in line:
			return re.sub( ".*model name.*:", "", line,1)
	return ""


#Laptop or desktop? If laptop, there's a lid...
mobile =  os.path.exists("/proc/acpi/button/lid/") or "Celeron" in get_processor_name()
if (mobile):
	if verbose:
		print "You appear to be on a laptop"

#Processor load
load = (psutil.cpu_percent()/100)
loadexp = (load * load)
if verbose:
	print "Your system load is %.2f" % load

#Hard drives
all_info = subprocess.check_output("ls /dev/sd[a-z]", shell=True).strip()
for drive in all_info.split("\n"):
	try:
		dev_info = subprocess.check_output("hdparm -I " + drive, shell=True).strip()
		ssd = False
		for hi in dev_info.split("\n"):
			if "Solid State Device" in hi:
				ssd = True
		if ssd:
			if verbose:
				print "SSD Detected. Assuming 0.8Watt"
			energy.append(0.8)
		else:
			if mobile:	
				if verbose:		
					print "HDD Detected. Assuming 2Watt"
				p = 2
			else:
				if verbose:
					print "HDD Detected. Assuming 6Watt"
				p = 6
			energy.append(p * (load/2 + 0.5))
	except subprocess.CalledProcessError:
		#An error could appear if it's not really a disk, like a usb stick or cdrom, we count 0.5W for these
		energy.append(0.5)



#Motherboard and memory
memory_slots = subprocess.check_output("dmidecode  -t 17 | grep Size", shell=True).strip()
nslot = 0
for slot in memory_slots.split("\n"):
	nslot += 1
	mem = re.search("([0-9]+)",slot,re.I)
	if (mem):
		memcons = (float(mem.group(0)) / 1024) * (1 if (mobile) else 2)
		energy.append(memcons)
		if verbose:
			print "Memory of %d detected. Assuming %fWatt" % (int(mem.group(1)), memcons)

if (mobile):
	energy.append(8)
elif nslot <= 2:
	energy.append(20)
else:
	energy.append(30)
	
	
#Screen
mon = 0
try:
	screen = subprocess.check_output('xset -q dpms | grep "Monitor is"', shell=True).strip()
	if "On" in screen:
		if (mobile):
			mon = 3
		else:
			mon = 8		
		if verbose:
			print "Monitor is On. Assuling %dWatt" % mon
except: #Cannot access xset if no display, assuming on...
	if (mobile):
		mon = 3
	else:
		mon = 8
	if verbose:
			print "Monitor is probably On. Assuming %dWatt" % mon
energy.append(mon)
			
#Graphic card
card = subprocess.check_output("lspci | grep -i vga", shell=True).strip()

if "nvidia" in card.lower():
	card = re.search( ".*:([a-z0-9 \[\]]+)", card, re.I ).group(1)

	newcard = re.search("([0-9]{3,4})(M)?",card,re.I)
	mobilegpu = newcard.group(2)

	#Searching the max consumption according to the gamme
	if mobilegpu:
		gpumin = 5 #Max consumptin of a low-gam mobile GPU
		gpumax = 60 #Max consumption of better mobile GPU
	else:
		gpumin = 15 #Idem for desktops GPUs. Remember it is the max consumption of the GPU
		gpumax = 200

	model = int(newcard.group(1))
	#The old series of gpu have 4 number
	if (model>1000):
		gpumax = gpumax * 0.7 #Old GPU use less power
		model = model/10
	rangeingamme = (model % 100) / 10.0 #Number from 0 to 10 representing the level in gam
	
	#Max consumption is exponential with the gamme
	gpu = gpumin + ((1-(log(11-rangeingamme)/log(11))) * (gpumax-gpumin))

	if verbose:
		print "Your gpu is of gamme %d of its series, its series starts from %d W to %d W, we assume that its max consumption is %d W" % (rangeingamme,gpumin,gpumax,gpu)

	gpuload = 0.1
	
	gc = gpu * (0.2 + gpuload * 0.8)
	if verbose:
		print "Your gpu has a load of %f, assuming %f Watts " % (gpuload,gc)
else:
	#Vendor could not be found or internal chipset, assuming internal chipset (not much consumption)
	gc = 1.5 if (mobile) else 3
	if verbose:
		print "Vendor of graphic card could not be found or internal chipset, assuming %d Watt" % gc
	
energy.append(gc)

#Fans
nfan = 0
command = "cat /sys/class/thermal/cooling_device*/cur_state"
all_info = subprocess.check_output(command, shell=True).strip()
for line in all_info.split("\n"):
	if (float(line) >= 1):
		nfan += 1;

if (mobile and nfan==0):
	nfan = 1

#---The power fan of desktop is nearly never monitored
if (not mobile):
	nfan += 1
if verbose:
	print "You appear to have %d fan." % nfan

energy.append(nfan * 1.5)

#Processor
model = get_processor_name()
processor_energy = -1
while (processor_energy == -1): #Intel sometimes return a 500 error. We just have to retry 5 to 10 times...
	try:
		if (re.search( "intel", model, re.I)):		
			modelstripped = re.sub( "\(r\)|\(tm\)|intel|[@][ ]?[0-9]+.[0-9]+[kmghz]+|cpu|celeron|\t", " ", model,0,re.I).strip()
			if verbose:
				print "Intel processor detected : " + modelstripped
			url = "http://ark.intel.com/search?q="+re.sub("[ ]+","+",modelstripped)
		
			content = urllib2.urlopen(url).read()
			
			tdp = re.search("([0-9]+) W",content,re.I | re.M)
			if tdp:
				processor_energy = float(tdp.group(1))
				if verbose:
					print "Processor MAX TDP found on intel.com : %f" % processor_energy
			else:
				regex = "href=\"/products/([0-9]+)/.*?" + re.sub("[ ]+",".*?",modelstripped)

#				print regex
				m2 = re.search(regex,content,re.I | re.M | re.S)
				if m2:
					pid =  m2.group(1)
					content3 = urllib2.urlopen("http://ark.intel.com/products/"+pid+"/").read()
					m3 = re.search("([0-9]+) W",content3,re.I | re.M)
					if m3:
						processor_energy = float(m3.group(1))
						if verbose:
							print "Processor MAX TDP found on intel.com : %f" % processor_energy
				else:
					if verbose:
						print "Processor model could not be find on intel.com, assuming MAX TDP 65Watt"
					processor_energy = 65

		else:
			if verbose:
				print "Processor manufacturer unknow, assuming MAX TDP 65Watt"
			processor_energy = 65
	except urllib2.HTTPError:
		processor_energy = -1;	

#TDP to real consumption conversion
if (mobile):
	processor_energy = processor_energy * 0.55
else:
	processor_energy = processor_energy * 0.75

#If mobile, the consumption of the CPU is exponential with the load
if mobile:
	energy.append(processor_energy * (loadexp*0.9 + 0.1))
else:
	energy.append(processor_energy * (load*0.9 + 0.1))

#Calculating sum

somme = numpy.array(energy).sum()


#Average power conversion efficiency
if mobile:
	somme = somme / 0.9 + 0.5
else:
	somme = somme / 0.8 + 3


print somme / 1000
