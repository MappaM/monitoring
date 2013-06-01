#!/bin/python
# Generate a random value around BASE_VALUE

import sys
import datetime
import random

def get_multiplier(hour):
    if (hour < 6):
        v = 0.5
    elif (hour < 10):
        v = (1.5 - (abs(8-hour) * 0.5)) * 0.8
    elif (hour < 14):
        v = (1.5 - (abs(12-hour) * 0.5))
    elif (hour < 18):
        v = (1.5  - (abs(16-hour) * 0.5)) * 0.9
    elif (hour < 22):
        v = (1.5  - (abs(20-hour) * 0.5)) * 0.8
    else:
        v = 0.5    
    
    v = max(0.5, v, (14 - (abs(14-hour)))/12)
    return v
        
def main():
    if (len(sys.argv) != 2):
        print 'Usage : python.py random.py BASE_VALUE'
        sys.exit(-1)
    
    startval = float(sys.argv[1])
    
    temps = datetime.datetime.now()
    hour = temps.hour
    mult = get_multiplier(hour)
    
    value = float(startval) * mult * (float(random.random()) + float(0.5))
    print value

if __name__ == "__main__":
    main()