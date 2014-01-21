#!/bin/python

import serial
import sys

def main():
    ser = serial.Serial('/dev/ttyUSB0',9600,timeout=1)
    ser.flush()
    ser.write(sys.argv[1][0])
    ser.write(chr(int(sys.argv[2])))

if __name__ == "__main__":
    main()
