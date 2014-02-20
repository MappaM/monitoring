#!/bin/sh

if [ -e /bin/yum ]; then
        i="sudo yum install"
else
	i="sudo apt-get install"
fi

echo "Installing python-psutil"
$i python-psutil

echo "Installing python-pip"
$i python-pip

echo "Installing python-mysqldb"
$i python-mysqldb

echo "Installing yuglify"
$i yuglify

if [ -e /usr/bin/pip ]; then
        p="sudo pip install"
else
        p="sudo python-pip install"
fi

$p django==1.4.10
$p pytz
$p django-mathfilters
$p utils
$p wadofstuff-django-serializers
$p django-pipeline
$p django-extensions
