#!/bin/python

import serial

def main():
    ser = serial.Serial('/dev/ttyUSB0',9600,timeout=1)
    ser.flushInput()
    ser.write('T')
    s = ser.readline()
    print s

if __name__ == "__main__":
    main()
